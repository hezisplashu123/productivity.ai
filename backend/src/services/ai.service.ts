import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🧠 IDENTITY PROTOCOLS
 */
const IDENTITY_FRAMEWORK: Record<string, string> = {
  'student': "CONTEXT: User is a STUDENT. Focus: Grades, comprehension, deadlines. TONE: Academic Coach.",
  'professional': "CONTEXT: User is a PROFESSIONAL. Focus: Efficiency, stakeholders, clear deliverables. TONE: Project Manager.",
  'entrepreneur': "CONTEXT: User is an ENTREPRENEUR. Focus: ROI, speed, sales, delegation. TONE: Business Partner.",
  'maker': "CONTEXT: User is a MAKER/CREATIVE. Focus: Deep work, flow state, shipping. TONE: Senior Tech Lead / Creative Director.",
  'personal': "CONTEXT: User is doing LIFE ADMIN. Focus: Reducing friction, sanity, getting it over with. TONE: Supportive but efficient."
};

/**
 * 🎯 CORE DRIVER PROTOCOLS
 */
const DRIVER_PROTOCOLS: Record<string, string> = {
  'velocity': "OPTIMIZATION GOAL: SPEED. Prioritize finishing fast. Cut non-essential steps. Use 'Sprint' logic. Identify shortcuts.",
  'mastery': "OPTIMIZATION GOAL: QUALITY. Prioritize depth. Add steps for review, refinement, and testing. Ensure the output is excellent, not just done.",
  'survival': "OPTIMIZATION GOAL: MOMENTUM. The user is burnt out. Break tasks into tiny, non-threatening micro-steps. Lower the bar for 'success' to just getting started.",
  'impact': "OPTIMIZATION GOAL: LEVERAGE. Focus on the 20% of work that gives 80% of results. Deprioritize admin/setup. Focus on the high-value output."
};

/**
 * 🛡️ VILLAIN DEFENSE PROTOCOLS
 */
const VILLAIN_PROTOCOLS: Record<string, string> = {
  'doomscrolling': "DEFENSE: 'Digital Blinders'. Explicitly forbid opening new tabs or checking feeds. Focus purely on the active window.",
  'multitasking': "DEFENSE: 'The Monotask'. The plan must be strictly sequential. Explicitly forbid 'switching' context. One thing at a time.",
  'side_quests': "DEFENSE: 'Tunnel Vision'. Explicitly forbid cleaning, organizing, or 'pre-work'. Start the ugly work immediately.",
  'rotting': "DEFENSE: 'Micro-Activation'. The first task must be laughably easy (2 mins) to break the paralysis."
};

/**
 * 🧠 STEP 1: THE CLARIFIER (Balanced Depth)
 */
export const generateClarifyingQuestion = async (goal: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};
  const identityPrompt = IDENTITY_FRAMEWORK[onboarding.identity] || IDENTITY_FRAMEWORK['professional'];
  
  const systemPrompt = `
    You are an elite Chief of Staff.
    ${identityPrompt}
    
    The user has a goal: "${goal}".
    
    Your job: Dig deeper. The goal is vague, and I need you to identify the specific variables required to build a tactical plan.
    
    STRATEGY:
    1. **Identify Missing Variables:** Does the goal lack a specific Topic, a Deliverable, a Constraint, or a Method?
    2. **Ask up to 2 Distinct Points:** You can combine two questions to triangulate their intent (e.g., "What is the topic AND what is the format?").
    3. **Be Conversational but Tactical:** Don't sound like a robot. Speak like a coach.

    EXAMPLES:
    - Input: "Study"
    - Output: "What specific subject or exam are we prepping for? Also, are we reviewing notes or doing active practice problems?"
    
    - Input: "Work on project"
    - Output: "What is the single most important feature you need to ship today? Is this a solo coding session or does it involve writing/planning?"
    
    - Input: "Clean house"
    - Output: "Let's focus. Which room is the biggest disaster right now? Do we need to do a deep clean or just a rapid visual tidy-up?"

    CONSTRAINTS: 
    - Aim for exactly 2 sentences. 
    - Use 3 sentences ONLY if the input is extremely ambiguous and needs context.
    - Focus on "What" and "How".
    
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
    return result.question || "What is the specific outcome you need to achieve today, and what is the first step?";
  } catch (error) {
    return "To build the perfect plan, what is the specific immediate outcome you are aiming for?";
  }
};

/**
 * 🧠 STEP 1.5: THE CLASSIFIER
 */
export const analyzeGoalType = async (goal: string, previousQuestion: string, userAnswer: string) => {
  const systemPrompt = `
    Analyze the user's intent based on the FULL CONVERSATION CONTEXT:
    
    1. INITIAL GOAL: "${goal}"
    2. AI QUESTION ASKED: "${previousQuestion}"
    3. USER ANSWER: "${userAnswer}"
    
    TASK: 
    1. Classify as "PROJECT" (Single Session) or "JOURNEY" (Multi-Day/Long Term).
    2. If JOURNEY, estimate the typical time in DAYS.
    3. If JOURNEY, recommend a sustainable DAILY TIME COMMITMENT (in minutes).

    LOGIC ENGINE:
    - Look at the relationship between Question and Answer.
    - If Question was "When is this due?" and Answer is "Tomorrow" -> PROJECT.
    - If Question was "How many chapters?" and Answer is "50 chapters" -> JOURNEY.
    - If Question was "What is the outcome?" and Answer is "Learn Python" -> JOURNEY.
    - If Question was "What specific task?" and Answer is "Write the intro" -> PROJECT.

    CRITICAL OVERRIDE RULES:
    1. **TEMPORAL MARKERS:** "Today", "tonight", "now", "this morning" -> PROJECT.
    2. **SCALE MARKERS:** "Learn a language", "Build an app", "Get fit", "Write a book" -> JOURNEY.
    3. **SPECIFICITY:** "Do lesson 1" -> PROJECT. "Finish the course" -> JOURNEY.
    
    OUTPUT JSON:
    { 
      "type": "project" | "journey",
      "reason": "Explain why based on the Q&A context.",
      "estimatedDays": 30, // Default 30. Only for Journey.
      "recommendedDailyMinutes": 45 // Default 45. Only for Journey.
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
  const driverPrompt = DRIVER_PROTOCOLS[onboarding.coreDriver] || DRIVER_PROTOCOLS['velocity'];
  const villainPrompt = VILLAIN_PROTOCOLS[onboarding.frictionVillain] || "Minimize distractions.";

  const SHORT_TERM_PROTOCOLS = `
    ANALYZE THE GOAL AND APPLY THE CORRECT PROTOCOL:
    🌊 **TYPE A: THE GRIND (Volume)** - Triage -> Velocity -> Slog -> Polish.
    🎨 **TYPE B: THE BLANK PAGE (Creation)** - Structure -> Vomit Draft -> Refine.
    ❓ **TYPE C: THE BLACK BOX (Ambiguity)** - Research Spike -> Prototype -> Expand.
    🧠 **TYPE D: THE DOWNLOAD (Study)** - Scope -> Active Recall -> Gap Fill.
    📄 **TYPE E: LIFE ADMIN** - Gather -> Blitz.
    🏋️ **TYPE F: PHYSICAL** - Warmup -> Compound -> Accessory -> Cooldown.
  `;

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
    4. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max (e.g. 'Project Alpha', 'Draft Essay', 'Chest Day').
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
 * 🧠 STEP 2 (VARIANT): THE COACH
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
    1. **STRICT CONTEXT:** All tasks MUST contribute directly to the MAIN GOAL: "${goal}". Do NOT generate generic tasks or tasks for unrelated goals.
    2. **PHASE AWARENESS:** Day 1 = Setup. Middle = Grind. End = Review.
    3. **STRICT TIME LIMIT:** Sum must equal ${dailyMinutes}.
    4. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max (e.g. 'Day ${dayNumber}', 'Leg Day', 'Draft Mode').
    
    OUTPUT JSON:
    {
      "short_title": "MAX 2 WORD Theme",
      "tasks": [ 
        { 
          "title": "Specific Exercise/Task", 
          "duration": 15, 
          "description": "Instruction + Motivational Context relating to ${goal}." 
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