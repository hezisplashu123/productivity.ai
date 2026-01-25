import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🧠 IDENTITY PROTOCOLS
 * Defines how the AI speaks based on user persona.
 */
const IDENTITY_FRAMEWORK: Record<string, string> = {
  'student': "CONTEXT: User is a STUDENT. Focus: Grades, comprehension, deadlines. TONE: Academic Coach.",
  'professional': "CONTEXT: User is a PROFESSIONAL. Focus: Efficiency, stakeholders, clear deliverables. TONE: Project Manager.",
  'entrepreneur': "CONTEXT: User is an ENTREPRENEUR. Focus: ROI, speed, sales, delegation. TONE: Business Partner.",
  'maker': "CONTEXT: User is a MAKER/CREATIVE. Focus: Deep work, flow state, shipping. TONE: Senior Tech Lead / Creative Director.",
  'personal': "CONTEXT: User is doing LIFE ADMIN. Focus: Reducing friction, sanity, getting it over with. TONE: Supportive but efficient."
};

/**
 * 🎯 CORE DRIVER PROTOCOLS (The "North Star")
 * This determines HOW the AI optimizes the plan.
 */
const DRIVER_PROTOCOLS: Record<string, string> = {
  'velocity': "OPTIMIZATION GOAL: SPEED. Prioritize finishing fast. Cut non-essential steps. Use 'Sprint' logic. Identify shortcuts.",
  'mastery': "OPTIMIZATION GOAL: QUALITY. Prioritize depth. Add steps for review, refinement, and testing. Ensure the output is excellent, not just done.",
  'survival': "OPTIMIZATION GOAL: MOMENTUM. The user is burnt out. Break tasks into tiny, non-threatening micro-steps. Lower the bar for 'success' to just getting started.",
  'impact': "OPTIMIZATION GOAL: LEVERAGE. Focus on the 20% of work that gives 80% of results. Deprioritize admin/setup. Focus on the high-value output."
};

/**
 * 🛡️ VILLAIN DEFENSE PROTOCOLS
 * Specific constraints based on the user's primary productivity killer.
 */
const VILLAIN_PROTOCOLS: Record<string, string> = {
  'doomscrolling': "DEFENSE: 'Digital Blinders'. Explicitly forbid opening new tabs or checking feeds. Focus purely on the active window.",
  'multitasking': "DEFENSE: 'The Monotask'. The plan must be strictly sequential. Explicitly forbid 'switching' context. One thing at a time.",
  'side_quests': "DEFENSE: 'Tunnel Vision'. Explicitly forbid cleaning, organizing, or 'pre-work'. Start the ugly work immediately.",
  'rotting': "DEFENSE: 'Micro-Activation'. The first task must be laughably easy (2 mins) to break the paralysis."
};

/**
 * 🧠 STEP 1: THE CLARIFIER
 */
export const generateClarifyingQuestion = async (goal: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];
  
  const systemPrompt = `
    You are an elite Chief of Staff.
    ${identityPrompt}
    
    The user has a goal: "${goal}".
    
    Your job: Identify the "Execution Blindspot".
    
    RULES:
    1. **VOLUME CHECK:** If the goal implies a VOLUME of work (e.g., "homework", "emails", "chores"), ask about QUANTITY.
    2. **AMBIGUITY CHECK:** If the goal is VAGUE (e.g., "Work on project", "Study"), ask for the TARGET/DELIVERABLE.

    3. Keep it under 15 words. Direct and tactical. One question only.
    
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
export const analyzeGoalType = async (goal: string, clarification: string = "") => {
  const systemPrompt = `
    Analyze this user's intent.
    
    INITIAL GOAL: "${goal}"
    CLARIFICATION ANSWER: "${clarification}"
    
    Determine if this is a "PROJECT" (Single Work Session) or a "JOURNEY" (Long-term/Multi-day).

    CRITICAL RULES:
    1. If the Initial Goal looks long-term (e.g., "Write a book"), BUT the Clarification limits the scope (e.g., "Just outline Chapter 1 today"), YOU MUST CLASSIFY AS "PROJECT".
    2. "PROJECT" = Can be done in one sitting (15m - 4 hours).
    3. "JOURNEY" = Requires a schedule spanning multiple days (e.g., "Study for 2 weeks", "Lose 10lbs").
    
    OUTPUT JSON:
    { 
      "type": "project" | "journey",
      "reason": "Explain why based on the clarification."
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
 * 🧠 STEP 2: THE STRATEGIST (Short Term / Single Session)
 */
export const generateActionPlan = async (goal: string, userProfile: any, clarification: string = "", dailyMinutes: number = 0) => {
  const onboarding = userProfile.onboardingData || {};
  
  // 1. Get Personalization Variables
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];
  const driverPrompt = DRIVER_PROTOCOLS[onboarding.coreDriver] || DRIVER_PROTOCOLS['velocity'];
  const villainPrompt = VILLAIN_PROTOCOLS[onboarding.frictionVillain] || "Minimize distractions.";

  const SHORT_TERM_PROTOCOLS = `
    ANALYZE THE GOAL AND APPLY THE CORRECT PROTOCOL:

    🌊 **TYPE A: THE GRIND (Volume/Repetition)**
    - *Task 1 [Triage]:* Scan/Flag. (5m)
    - *Task 2 [Velocity]:* Easy items first.
    - *Task 3 [The Slog]:* Hard items.
    - *Task 4 [Polish]:* Review.

    🎨 **TYPE B: THE BLANK PAGE (Creation/Writing/Coding)**
    - *Task 1 [Structure]:* Outline/Pseudo-code. (10m)
    - *Task 2 [The Vomit Draft]:* Ugly first pass.
    - *Task 3 [Refine]:* Edit/Debug.

    ❓ **TYPE C: THE BLACK BOX (Ambiguity/Complex Problems)**
    - *Task 1 [Research Spike]:* Info gathering.
    - *Task 2 [The Prototype]:* Smallest working version.
    - *Task 3 [Expansion]:* Add features.

    🧠 **TYPE D: THE DOWNLOAD (Learning/Study)**
    - *Task 1 [Scope]:* Define concepts.
    - *Task 2 [Active Recall]:* Test yourself.
    - *Task 3 [Gap Fill]:* Read specific sections.
    
    📄 **TYPE E: LIFE ADMIN (Bureaucracy)**
    - *Task 1 [Gather]:* Find docs/passwords.
    - *Task 2 [Blitz]:* Execute forms.
  `;

  // TIME BUDGET LOGIC
  let timeConstraintPrompt = "";
  if (dailyMinutes > 0) {
    timeConstraintPrompt = `
    CRITICAL CONSTRAINT: STRICT TIME BUDGET
    - The user has committed exactly ${dailyMinutes} minutes.
    - The sum of task durations MUST equal ${dailyMinutes}.
    `;
  } else {
    timeConstraintPrompt = `
    - Target total duration: 45-90 minutes.
    `;
  }

  const systemPrompt = `
    You are the user's specialized Chief of Staff.
    
    USER PROFILE:
    - ${identityPrompt}
    - ${driverPrompt}
    - ${villainPrompt}
    
    GOAL: "${goal}"
    CONTEXT/CLARIFICATION: "${clarification}"

    MISSION:
    Create a "High-Resolution" Execution Plan for a SINGLE WORK SESSION.
    
    ${SHORT_TERM_PROTOCOLS}

    CRITICAL RULES:
    1. **APPLY THE DRIVER:** If 'Velocity', skip review steps. If 'Mastery', double the review time.
    2. **COUNTER THE VILLAIN:** Include defense mechanisms in descriptions.
    3. **MICRO-SCRIPTS:** Tell them EXACTLY what to do.
    4. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max (e.g. 'Project Alpha', 'Draft Essay').
    ${timeConstraintPrompt}

    OUTPUT FORMAT (JSON):
    {
      "short_title": "MAX 2 WORD Mission Name",
      "tasks": [ 
        { 
          "title": "Action Verb + Object", 
          "duration": 15, 
          "description": "Tactical instruction aligned with the Optimization Goal." 
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
    // FORCE 2 WORD LIMIT
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
 * 🧠 STEP 2 (VARIANT): THE COACH (Long Term / Journey Mode)
 */
export const generateDailyPlan = async (
  goal: string, 
  userProfile: any, 
  dayNumber: number, 
  totalDays: number,
  dailyMinutes: number = 45
) => {
  const onboarding = userProfile.onboardingData || {};
  
  const driverPrompt = DRIVER_PROTOCOLS[onboarding.coreDriver] || DRIVER_PROTOCOLS['velocity'];
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || "";
  const villainPrompt = VILLAIN_PROTOCOLS[onboarding.frictionVillain] || "";
  
  const JOURNEY_PROTOCOLS = `
    DETERMINE THE JOURNEY TYPE AND PHASE:
    📈 **TYPE A: THE COMPOUND (Skill)** - Progressive Overload.
    🏃 **TYPE B: THE MARATHON (Volume)** - Non-Negotiable Minimum.
    🏗️ **TYPE C: THE BUILD (Project)** - Modular Sprints.
    📅 **TYPE D: THE EVENT (Deadline)** - Simulation & Taper.
  `;

  const systemPrompt = `
    You are an expert Long-Term Performance Coach.
    ${identityPrompt}
    ${driverPrompt}
    ${villainPrompt}
    
    MAIN GOAL: "${goal}"
    CURRENT PROGRESS: Day ${dayNumber} of ${totalDays}.
    TIME BUDGET FOR TODAY: ${dailyMinutes} minutes.
    
    MISSION:
    Generate a tactical plan for TODAY (Day ${dayNumber}) that fits exactly within ${dailyMinutes} minutes.
    
    ${JOURNEY_PROTOCOLS}

    RULES:
    1. **PHASE AWARENESS:** Day 1 = Setup. Middle = Grind. End = Review.
    2. **STRICT TIME LIMIT:** Sum must equal ${dailyMinutes}.
    3. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max (e.g. 'Day 1', 'Leg Day', 'Draft Mode').
    
    OUTPUT JSON:
    {
      "short_title": "MAX 2 WORD Theme",
      "tasks": [ 
        { 
          "title": "Specific Exercise/Task", 
          "duration": 15, 
          "description": "Instruction + Motivational Context." 
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
    
    // FORCE 2 WORD LIMIT
    const shortTitle = result.short_title ? result.short_title.split(' ').slice(0, 2).join(' ') : `Day ${dayNumber}`;

    return { 
      shortTitle: shortTitle, 
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
  const driverPrompt = DRIVER_PROTOCOLS[onboarding.coreDriver] || DRIVER_PROTOCOLS['velocity'];

  const systemPrompt = `
    You are a pragmatic Chief of Staff.
    ${identityPrompt}
    ${driverPrompt}
    
    ORIGINAL TASK: "${task.title}"
    USER OBSTACLE: "${feedback}"
    
    MISSION:
    Rewrite this task to bypass the obstacle.
    
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