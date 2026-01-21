import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🧠 IDENTITY PROTOCOLS
 */
const IDENTITY_FRAMEWORK: Record<string, string> = {
  'student': "CONTEXT: User is a STUDENT. Critical variables: Exam date, specific subject module, existing notes vs. starting from scratch. TONE: Academic Coach.",
  'developer': "CONTEXT: User is a DEVELOPER. Critical variables: New feature vs. bug fix, local env setup status, specific library/framework constraints. TONE: Senior Tech Lead.",
  'creative': "CONTEXT: User is a CREATIVE. Critical variables: Ideation phase vs. execution phase, rough draft vs. final polish, specific software tool. TONE: Creative Director.",
  'founder': "CONTEXT: User is a FOUNDER. Critical variables: Strategic planning vs. urgent execution, delegation potential, ROI of the task. TONE: Board Member.",
  'professional': "CONTEXT: User is a PROFESSIONAL. Critical variables: Hard deadline, stakeholder requirements, specific document/email format. TONE: Project Manager."
};

/**
 * 🧠 ACTION PROTOCOLS
 */
const GRANULARITY_INSTRUCTIONS: Record<string, string> = {
  'architect': "STRATEGY: 'The Blueprint'. The first task MUST be a detailed bullet-point list. Do not let them start 'working' until the plan is set.",
  'firefighter': "STRATEGY: 'Triage Mode'. Ignore structure. Point them to the single most painful/urgent sub-task immediately.",
  'sprinter': "STRATEGY: 'Interval Training'. Tasks must be 20 minutes MAX. High intensity, clear finish line.",
  'deep_worker': "STRATEGY: 'Monk Mode'. Group all prep work into Task 1. Task 2 is a long, uninterrupted execution block."
};

// UPDATED: Removed phone/battery references
const EXTERNAL_DEFENSE: Record<string, string> = {
  'doomscrolling': "DEFENSE: 'Digital Blinders'. Explicitly forbid opening new tabs or checking social media. Focus purely on the active window.",
  'side_quests': "DEFENSE: 'Tunnel Vision'. Explicitly forbid specific side-tasks (e.g., 'Do not check email', 'Do not clean the desk').",
  'rotting': "DEFENSE: 'Micro-Step'. The first task must be an extremely low-effort cognitive action (e.g., 'Read one paragraph').",
  'yap_fatigue': "DEFENSE: 'Hermit Protocol'. Instruct user to ignore all incoming messages.",
};

const INTERNAL_DEFENSE: Record<string, string> = {
  'perfectionism': "MINDSET: 'Trash Draft'. Command them to write a 'bad' version first. Forbid editing.",
  'overwhelm': "MINDSET: 'One Brick'. The tasks should only reveal the immediate next step, not the whole project.",
  'procrastination': "MINDSET: 'Activation Energy'. Frame the task as 'Just setting up', not 'Doing the work'.",
  'boredom': "MINDSET: 'Time Attack'. Assign aggressive time limits to tasks to create artificial urgency."
};

/** 
 * 🧠 STEP 1: THE CLARIFIER
 */
export const generateClarifyingQuestion = async (goal: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];
  
  const systemPrompt = `
    You are an elite Project Manager and Interrogator.
    ${identityPrompt}
    
    The user has a goal: "${goal}".
    
    Your job is to find the "Execution Gap"—the missing piece of information needed to build a specific plan.
    
    CRITICAL RULES:
    1. DO NOT ask about "When", "Deadlines", "Timelines", or "How much time you have". The app handles scheduling automatically.
    2. DO ask about SCOPE (e.g., "Are you starting from scratch?", "What is the specific topic?").
    3. DO ask about TOOLS/STATE (e.g., "Do you have the environment set up?", "Is this for a specific client?").
    4. Keep it short (max 15 words). One question only.
    
    OUTPUT JSON:
    { "question": "..." }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: goal }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7, 
    });
    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.question || "What is the specific outcome you need to achieve?";
  } catch (error) {
    return "What is the immediate next physical step you need to take?";
  }
};

/**
 * 🧠 STEP 1.5: THE CLASSIFIER
 */
export const analyzeGoalType = async (goal: string) => {
  const systemPrompt = `
    Analyze this goal: "${goal}".
    
    Is this a "PROJECT" (finite set of tasks done in 1-3 sessions, e.g., "Build a website", "Write an essay")
    OR a "JOURNEY" (repetitive/cumulative effort over days/weeks, e.g., "Lose 10lbs", "Learn Spanish", "Study for SATs", "Gym Routine")?
    
    OUTPUT JSON:
    { 
      "type": "project" | "journey",
      "reason": "Short explanation of why",
      "suggested_duration_days": 30
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content || '{"type": "project"}');
  } catch (error) {
    return { type: 'project' };
  }
};

/** 
 * 🧠 STEP 2: THE STRATEGIST
 */
export const generateActionPlan = async (goal: string, userProfile: any, clarification: string = "", dailyMinutes: number = 0) => {
  const onboarding = userProfile.onboardingData || {};
  
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];
  const breakdownRule = GRANULARITY_INSTRUCTIONS[onboarding.workArchetype] || "Standard breakdown.";
  const externalRule = EXTERNAL_DEFENSE[onboarding.frictionVillain] || "Minimize noise.";
  const internalRule = INTERNAL_DEFENSE[onboarding.mentalBlock] || "Just execute.";

  // TIME BUDGET LOGIC
  let timeConstraintPrompt = "";
  if (dailyMinutes > 0) {
    timeConstraintPrompt = `
    CRITICAL CONSTRAINT: STRICT TIME BUDGET
    - The user has explicitly committed exactly ${dailyMinutes} minutes for this session.
    - The sum of all task durations MUST be exactly ${dailyMinutes} minutes.
    - Start immediately with the first real step of the work.
    - If ${dailyMinutes} > 45, allow for deep work blocks.
    `;
  } else {
    timeConstraintPrompt = `
    - FIRST TASK IS MOMENTUM: Duration 2-5 mins (Cognitive Setup, e.g., "Outline the document", "Locate the file").
    - Subsequent tasks should fill about 45-60 mins total.
    `;
  }

  const systemPrompt = `
    You are the user's specialized Chief of Staff.
    
    USER PROFILE:
    - ${identityPrompt}
    - Strategy: ${breakdownRule}
    - Enemy: ${externalRule}
    - Mindset: ${internalRule}
    
    GOAL: "${goal}"
    CONTEXT/CLARIFICATION: "${clarification}"

    MISSION:
    Create a "High-Resolution" Execution Plan.
    
    RULES:
    1. THE PHONE IS THE TOOL: The user is holding their phone. It is their timer.
    2. MICRO-SCRIPTS: Give exact instructions.
    3. NO VAGUE VERBS: Ban words like "Plan", "Think", "Prepare". Use "Draft", "Compile", "Sketch".
    4. BANNED TASKS (STRICT):
       - DO NOT generate tasks for "Check battery", "Turn on DND", "Put phone away", "Drink water", "Open Laptop", or "Sit down".
       - These are trivial and annoying. Assume the user is ready to work.
       - Start directly with the actual task (e.g., instead of "Open Word", say "Type the first heading").
    ${timeConstraintPrompt}

    OUTPUT FORMAT (JSON):
    {
      "short_title": "2-Word Mission Name (e.g. 'Project Alpha')",
      "tasks": [ 
        { 
          "title": "Action Verb + Object", 
          "duration": 25, 
          "description": "2 sentences. 1: The physical action. 2: A defense against their specific villain." 
        } 
      ]
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "gpt-4o-mini", 
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received");

    const result = JSON.parse(content);
    const trimmedTitle = result.short_title ? result.short_title.split(' ').slice(0, 2).join(' ') : "Mission Alpha";

    return { 
      shortTitle: trimmedTitle, 
      tasks: result.tasks || [] 
    };

  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return null; 
  }
};

/**
 * 🧠 STEP 2 (VARIANT): THE COACH (Daily Generator)
 */
export const generateDailyPlan = async (
  goal: string, 
  userProfile: any, 
  dayNumber: number, 
  totalDays: number,
  dailyMinutes: number = 45 // Default if not provided
) => {
  const onboarding = userProfile.onboardingData || {};
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || "";
  
  const systemPrompt = `
    You are an expert Coach & Chief of Staff.
    ${identityPrompt}
    
    MAIN GOAL: "${goal}"
    CURRENT PROGRESS: Day ${dayNumber} of ${totalDays}.
    TIME BUDGET FOR TODAY: ${dailyMinutes} minutes.
    
    MISSION:
    Generate a tactical plan for TODAY (Day ${dayNumber}) that fits exactly within ${dailyMinutes} minutes.
    
    RULES:
    1. STRICT TIME LIMIT: The sum of all task durations MUST equal exactly ${dailyMinutes} minutes.
    2. NO TRIVIAL TASKS: Do not include "setup", "put phone away", or "hydration" tasks.
    3. PROGRESSION:
       - Day 1: Setup & Foundational Reps.
       - Middle Days: Deep Work / Heavy Lifting.
       - Final Days: Review & Final Polish.
    4. MICRO-SCRIPTS: Instructions must be specific physical actions.
    
    OUTPUT JSON:
    {
      "short_title": "Day ${dayNumber} Theme",
      "tasks": [ 
        { 
          "title": "Specific Exercise/Task", 
          "duration": 15, 
          "description": "Specific instruction for this session." 
        } 
      ]
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return { 
      shortTitle: result.short_title || `Day ${dayNumber}`, 
      tasks: result.tasks || [] 
    };
  } catch (error) {
    return null;
  }
};

/** 
 * 🧠 STEP 3: THE FIXER
 */
export const refineSingleTask = async (task: any, feedback: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];

  const systemPrompt = `
    You are a pragmatic Chief of Staff.
    ${identityPrompt}
    
    ORIGINAL TASK: "${task.title}"
    USER OBSTACLE: "${feedback}"
    
    MISSION:
    Rewrite this task to bypass the obstacle.
    - If they lack energy -> Simplify to the absolute bare minimum (e.g., "Just read 1 page").
    - If they lack time -> Compress to a sprint.
    - If they lack equipment -> Find a workaround.
    
    Keep the tone encouraging but directive.

    OUTPUT JSON:
    { "title": "New Task Name", "duration": 15, "description": "Specific tactical instructions..." }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) return task;

    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Task Refinement Error:", error);
    return task;
  }
};