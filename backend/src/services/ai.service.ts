import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🧠 ACTION PROTOCOLS
 * Maps psychographics to EXECUTION instructions.
 */

const GRANULARITY_INSTRUCTIONS: Record<string, string> = {
  'architect': "STRUCTURE: Logical sequence. Start with foundations, then move to components.",
  'firefighter': "STRUCTURE: Triage. Identify the single most high-impact blocker and attack it first.",
  'sprinter': "STRUCTURE: High-Intensity Intervals. Tasks must be completeable in 20-30 mins max.",
  'deep_worker': "STRUCTURE: Deep Dive. Group related sub-tasks into one large cohesive block.",
  'multitasker': "STRUCTURE: Quick Wins. Break the goal into standalone units.",
  'collaborator': "STRUCTURE: Output-Oriented. Focus on producing shareable artifacts/drafts."
};

const EXTERNAL_DEFENSE: Record<string, string> = {
  'doomscrolling': "CONSTRAINT: 'Dopamine Detox'. Instruct user to place phone in another room.",
  'side_quests': "CONSTRAINT: 'Tunnel Vision'. Explicitly forbid any chores or secondary tasks.",
  'rotting': "CONSTRAINT: 'Activation Energy'. The first task must be a tiny physical movement.",
  'rabbit_hole': "CONSTRAINT: 'Time Boxing'. Set a strict timer for any information gathering.",
  'yap_fatigue': "CONSTRAINT: 'Low Verbal Load'. Tasks should be solitary and require no talking."
};

const INTERNAL_DEFENSE: Record<string, string> = {
  'perfectionism': "MODE: 'Trash Draft'. Command a 'bad version' first. Forbid editing.",
  'overwhelm': "MODE: 'First Brick'. Focus strictly on the immediate next physical action.",
  'procrastination': "MODE: '5-Minute Commitment'. Lower the barrier to entry significantly.",
  'imposter': "MODE: 'Evidence Based'. Frame task as gathering info rather than producing work.",
  'boredom': "MODE: 'Speedrun'. Add a time-trial or challenge element."
};

/** 
 * 🧠 STEP 1: THE CLARIFIER 
 * Identifies ambiguity and asks ONE high-impact question.
 */
export const generateClarifyingQuestion = async (goal: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};
  const archetype = onboarding.workArchetype || 'general';
  
  const systemPrompt = `
    You are an elite productivity strategist. 
    Identify the BIGGEST missing variable in this goal: "${goal}".
    Ask ONE short question (max 12 words) to help narrow the scope.
    Do not be polite. Just ask the question.
    
    OUTPUT JSON:
    { "question": "..." }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: goal }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });
    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.question || "What is the specific target for this mission?";
  } catch (error) {
    return "What is the one thing you must finish to call this a success?";
  }
};

/** 
 * 🧠 STEP 2: THE STRATEGIST
 * Generates the prescriptive 3-5 step plan.
 */
export const generateActionPlan = async (goal: string, userProfile: any, clarification: string = "") => {
  const onboarding = userProfile.onboardingData || {};
  const breakdownRule = GRANULARITY_INSTRUCTIONS[onboarding.workArchetype] || "Standard breakdown.";
  const externalRule = EXTERNAL_DEFENSE[onboarding.frictionVillain] || "Minimize noise.";
  const internalRule = INTERNAL_DEFENSE[onboarding.mentalBlock] || "Just execute.";

  const systemPrompt = `
    You are an elite Chief of Staff and Subject Matter Expert. 
    You do not suggest; you COMMAND.

    USER CONTEXT:
    - Breakdown Strategy: ${breakdownRule}
    - Environment Defense: ${externalRule}
    - Mindset Strategy: ${internalRule}
    - Peak Energy Window: ${onboarding.focusWindow}

    GOAL: "${goal}"
    USER ADDED CONTEXT: "${clarification}"

    YOUR MISSION:
    1. Generate a "short_title" for the dashboard.
       CONSTRAINTS: EXACTLY 1 OR 2 WORDS MAX. (e.g., "Launch Store", "Physics Prep").
    2. Break this into 3-5 concrete execution tasks. 
    
    STRICT RULES:
    - NO META-WORK: Never tell user to "Plan", "Schedule", or "Research how to". YOU do the planning.
    - BE PRESCRIPTIVE: Give specific exercises, code structures, or steps. 
    - SUBJECT EXPERTISE: Tell them WHAT to do specifically (e.g., "Find 3 suppliers with >90% rating" not "Research").
    - VERB-FIRST TITLES: Start every title with a strong action verb (Draft, Build, Solve).
    - TACTICAL DESCRIPTIONS: Explain HOW to execute using the Mindset/Defense rules.

    OUTPUT JSON FORMAT:
    {
      "short_title": "MaxTwo Words",
      "tasks": [ { "title": "Specific Action Step", "duration": 25, "description": "Tactical instruction..." } ]
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
    const trimmedTitle = result.short_title ? result.short_title.split(' ').slice(0, 2).join(' ') : "Mission";

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
 * 🧠 STEP 3: THE FIXER
 * Regenerates a single task based on user feedback.
 */
export const refineSingleTask = async (task: any, feedback: string, userProfile: any) => {
  const onboarding = userProfile.onboardingData || {};

  const systemPrompt = `
    You are an elite Chief of Staff. The user is reporting a problem with a task you assigned.
    
    ORIGINAL TASK: "${task.title}"
    USER PROBLEM: "${feedback}"
    
    YOUR MISSION:
    Replace this task with a new one that solves the user's problem while still moving them toward their goal.
    - If they lack equipment, find an alternative.
    - If they are overwhelmed, simplify it or break it down.
    - Be prescriptive. Don't ask them to decide. Command them on the better alternative.

    OUTPUT JSON:
    { "title": "New Task Name", "duration": 20, "description": "Specific tactical instructions..." }
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