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
 * 🧠 STEP 1: THE CLARIFIER
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

    *** CRITICAL NEGATIVE CONSTRAINTS (READ CAREFULLY) ***
    - **NEVER ASK ABOUT TIME OR SCHEDULE:** Do NOT ask "When do you want to finish?", "What is your deadline?", "How many hours a week?", or "How much time per day?".
    - **REASON:** The app handles scheduling, deadlines, and daily time limits in a separate UI step immediately after this conversation. Asking now is redundant and annoying.
    - **FOCUS ONLY ON SCOPE:** Only ask about the *content*, *specific outcome*, *tools*, or *methodology* of the goal.

    EXAMPLES:
    - Input: "Study"
    - BAD Output: "When is your exam and how long do you want to study?" (Violates Negative Constraint)
    - GOOD Output: "What specific subject or exam are we prepping for? Also, are we reviewing notes or doing active practice problems?"
    
    - Input: "Learn Spanish"
    - BAD Output: "How many minutes a day do you want to practice?" (Violates Negative Constraint)
    - GOOD Output: "Are you starting from absolute zero or do you have some basics? And are we using an app, a textbook, or conversation practice?"
    
    - Input: "Clean house"
    - GOOD Output: "Let's focus. Which room is the biggest disaster right now? Do we need to do a deep clean or just a rapid visual tidy-up?"

    CONSTRAINTS: 
    - Aim for exactly 2 sentences. 
    - Use 3 sentences ONLY if the input is extremely ambiguous and needs context.
    - Focus on "What" and "How", NEVER "When".
    
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
 * 🧠 STEP 1.5: THE CLASSIFIER (Adaptive Complexity)
 */
export const analyzeGoalType = async (goal: string, previousQuestion: string, userAnswer: string) => {
  const systemPrompt = `
    Analyze the user's intent based on the FULL CONVERSATION CONTEXT:
    
    1. INITIAL GOAL: "${goal}"
    2. AI QUESTION ASKED: "${previousQuestion}"
    3. USER ANSWER: "${userAnswer}"
    
    TASK: 
    1. Classify as "PROJECT" (Single Session) or "JOURNEY" (Multi-Day/Long Term).
    2. If JOURNEY, estimate the typical time in DAYS based on complexity.
    3. If JOURNEY, recommend a sustainable DAILY TIME COMMITMENT (in minutes).

    *** ADAPTIVE COMPLEXITY MATRIX ***
    - **Simple Habit** (e.g., "Drink water", "Read more"): ~21-30 Days, 15-30 mins/day.
    - **Medium Project/Skill** (e.g., "Finish book draft", "Learn basic SQL"): ~30-45 Days, 45-60 mins/day.
    - **Major Lifestyle/Mastery** (e.g., "Get six pack", "Learn fluent Spanish", "Launch startup"): ~60-90+ Days, 60-90 mins/day.
    
    LOGIC ENGINE:
    - "Today", "tonight", "now" -> PROJECT.
    - "Learn X", "Build X", "Become X" -> JOURNEY.
    - If user implies a deadline in the answer, use that to calculate days (e.g., "Exam in 2 weeks" -> 14 days).

    OUTPUT JSON:
    { 
      "type": "project" | "journey",
      "reason": "Explain why based on the Q&A context.",
      "estimatedDays": number, // Intelligent estimate based on complexity
      "recommendedDailyMinutes": number // Sustainable recommendation
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
 * 🧠 STEP 2: THE STRATEGIST (Proactive Resource Suggestions)
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
  `;

  let timeConstraintPrompt = "";
  if (dailyMinutes > 0) {
    timeConstraintPrompt = `
    CRITICAL CONSTRAINT: STRICT TIME BUDGET
    - The user has committed exactly ${dailyMinutes} minutes.
    - The sum of task durations MUST equal ${dailyMinutes}.
    `;
  } else {
    timeConstraintPrompt = `- Target total duration: 45-90 minutes.`;
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
    1. **ACTION BIAS:** Tasks must be tangible execution steps (e.g. "Draft the email", "Code the function") NOT meta-work (e.g. "Write down goals", "Decide what to do"). Assume the "Planning" phase is OVER.
    2. **AVOID SINGLE TASKS:** Unless the duration is under 15 minutes, break the workflow into at least 2 steps (e.g. Draft -> Edit, or Research -> Implement).
    3. **APPLY THE DRIVER:** If 'Velocity', skip review steps. If 'Mastery', double the review time.
    4. **COUNTER THE VILLAIN:** Include defense mechanisms in descriptions.
    
    5. **AGGRESSIVE HYPERLINKING (SEARCH QUERIES):** 
       - If a task involves finding, watching, researching, or buying something, you MUST generate a search URL.
       - Do NOT wait for a specific URL. Construct it yourself.
       - **YouTube:** https://www.youtube.com/results?search_query=YOUR+SEARCH+TERMS
       - **Google:** https://www.google.com/search?q=YOUR+SEARCH+TERMS
       - **Amazon:** https://www.amazon.com/s?k=YOUR+SEARCH+TERMS
       - **Example:** Task "Find a piano tutorial" -> link: { "url": "https://www.youtube.com/results?search_query=beginner+piano+tutorial", "label": "YouTube: Beginner Tutorial" }
       - **Example:** Task "Research best microphones" -> link: { "url": "https://www.google.com/search?q=best+budget+microphones+2024", "label": "Google: Best Mics" }

    6. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max.
    ${timeConstraintPrompt}

    OUTPUT FORMAT (JSON):
    {
      "short_title": "MAX 2 WORD Mission Name",
      "tasks": [ 
        { 
          "title": "Action Verb + Object", 
          "duration": 15, 
          "description": "Tactical instruction.",
          "link": { "url": "https://...", "label": "Source: [Title]" } // OPTIONAL but HIGH PRIORITY for research tasks
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
 * 🧠 STEP 2 (VARIANT): THE COACH (Progressive Difficulty)
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
  
  // Calculate Phase
  const progress = dayNumber / totalDays;
  let phaseInstruction = "";
  
  if (progress < 0.2) {
    phaseInstruction = "PHASE: WARMUP. Keep tasks relatively easy and foundational. Focus on building the habit and reducing friction.";
  } else if (progress >= 0.2 && progress < 0.8) {
    phaseInstruction = "PHASE: THE GRIND (High Intensity). Apply Progressive Overload. tasks should be challenging and high-volume. Push the user.";
  } else {
    phaseInstruction = "PHASE: FINAL POLISH/TAPER. Focus on synthesizing results, reviewing work, and finishing strong.";
  }

  const systemPrompt = `
    You are an expert Long-Term Performance Coach.
    ${identityPrompt}
    ${driverPrompt}
    ${villainPrompt}
    
    MAIN GOAL: "${goal}"
    CURRENT PROGRESS: Day ${dayNumber} of ${totalDays}.
    TIME BUDGET FOR TODAY: ${dailyMinutes} minutes.
    
    ${phaseInstruction}

    RULES:
    1. **ACTION BIAS:** Focus on OUTPUT. Avoid "Review goals" or "Plan the day". Give them the actual work.
    2. **STRICT CONTEXT:** All tasks MUST contribute directly to the MAIN GOAL.
    3. **PROGRESSIVE DIFFICULTY:** Adjust the complexity of tasks based on the current PHASE.
    
    4. **AGGRESSIVE HYPERLINKING (SEARCH QUERIES):** 
       - If a task involves learning, finding, or watching, GENERATE A SEARCH URL.
       - **YouTube:** https://www.youtube.com/results?search_query=...
       - **Google:** https://www.google.com/search?q=...
       - Example: "Watch tutorial" -> link: { "url": "https://www.youtube.com/results?search_query=advanced+react+tutorial", "label": "YouTube: React Tutorial" }

    5. **STRICT TIME LIMIT:** Sum must equal ${dailyMinutes}.
    6. **SHORT TITLE:** The 'short_title' must be STRICTLY 2 words max.
    
    OUTPUT JSON:
    {
      "short_title": "MAX 2 WORD Theme",
      "tasks": [ 
        { 
          "title": "Specific Exercise/Task", 
          "duration": 15, 
          "description": "Instruction + Motivation.",
          "link": { "url": "https://...", "label": "Source: [Title]" } // OPTIONAL
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