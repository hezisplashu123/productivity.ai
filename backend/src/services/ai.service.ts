import OpenAI from 'openai';
import { Prisma } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DEFAULT_VIBE_WEIGHTS: Record<string, number> = {
  Existential: 0.5,
  Nostalgia: 0.5,
  Scenarios: 0.5,
  Relationships: 0.5,
  Funny: 0.5,
  Vulnerability: 0.5,
};

const WEIGHT_DELTA_CALIBRATION = 0.25; 
const WEIGHT_DELTA_STABILIZED = 0.08;  
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 1.0;

export type QuestionPromptCandidate = {
  id: string;
  text: string;
  category: string;
  gamemode: string;
  mechanics: string[];
  tone: string;
};

export type PromptPlayRecord = {
  answered: boolean;
  prompt: { text: string; category: string; mechanics: string[]; tone: string };
};

function clampWeight(value: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));
}

export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const merged = { ...DEFAULT_VIBE_WEIGHTS, ...weights };
  const entries = Object.entries(merged);
  const sum = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
  return Object.fromEntries(entries.map(([k, v]) => [k, clampWeight(v / sum)]));
}

export function parseVibeWeights(raw: Prisma.JsonValue | null): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_VIBE_WEIGHTS };
  }
  return normalizeWeights(raw as Record<string, number>);
}

export function applySwipeFeedback(
  weights: Record<string, number>,
  category: string,
  mechanics: string[],
  tone: string,
  answered: boolean,
  historyLength: number
): Record<string, number> {
  const next = { ...parseVibeWeights(weights) };
  const deltaAmount = historyLength <= 10 ? WEIGHT_DELTA_CALIBRATION : WEIGHT_DELTA_STABILIZED;
  const delta = answered ? deltaAmount : -deltaAmount;
  const keys = new Set([category, tone, ...mechanics]);

  keys.forEach((key) => {
    if (!key) return;
    const current = next[key] ?? 0.5;
    next[key] = clampWeight(current + delta);
  });

  return normalizeWeights(next);
}

export function applySeedWeights(seed: Record<string, number>): Record<string, number> {
  return normalizeWeights({ ...DEFAULT_VIBE_WEIGHTS, ...seed });
}

export type CategoryConfig = { 
  title: string; 
  dbCategories: string[]; 
  rules: string; 
  formatRequirement: string;
  bannedConcepts: string;
  fallback: string; 
};

const GLOBAL_AI_RULES = `
CRITICAL TONE CONSTRAINTS:
1. NO HURTFUL OR DEPRESSING SHIT: The game must feel fun, chill, and highly social. NEVER ask questions that would genuinely hurt someone's feelings, cause an existential crisis, or make them feel bad about themselves.
2. NO "THERAPY-SPEAK" OR INTERROGATIONS: Ban words like: boundary, journey, unpack, toxic trait, inner child, validate, navigate. Do not sound like a therapist.
3. NO "ASK-REDDIT" ABSTRACTS: Do not ask generic internet questions like "What is a societal scam?" Focus entirely on interpersonal relationships, friends, and human behavior.
4. The tone must be conversational and chill. Speak like a witty 20-something having drinks with close friends.
5. NO INTROS OR OUTROS: Do not preface the question with conversational filler ("Give me the deets", "Spill the tea", "Forget the awkwardness", "Let's get into it", "Okay so", etc). Do not add a closing remark after the question. Output ONLY the question itself, in the requested tone. The tone comes from word choice within the question, not from a wrapper phrase around it.

STYLE GUIDE & QUESTION RULES:
- Anchor every question to one concrete instance or scene, not a general theme.
- If it's a hypothetical, attach a real trade-off or cost to the premise — no consequence-free daydream questions.
- "Most Likely" style questions need a specific, visualizable scenario, not an abstract trait.
- Never use loaded/judgmental words like "controversial." State the topic plainly.
- Prefer exact-moment framing ("the exact moment," "the first time you...") over general-feeling framing wherever it fits naturally.
- For relationship/family questions, address the other person(s) directly ("you," "me," "us," "our family") rather than writing in the abstract.
- Confessions should stay low-stakes and harmless (petty, embarrassing, funny) — never invite anything that could genuinely hurt someone if answered honestly.
- Give a light structural frame (a word limit, a named object like "the title" or "the act") instead of leaving the question fully open-ended.
- Cut intensifiers and filler ("completely," "absolutely," "highly specific") unless they're load-bearing.
- Describe the goal/scenario, not the specific mechanism or method — don't box the answer into one narrow verb.
- Apply the "instant answer" test: if a person would need to mentally scan a huge list before answering, narrow the question further.
- Never write a question that's fully answerable with just "yes" or "no" — always require naming a specific instance.
- For Friends and Family questions ONLY: phrase every question so whoever reads it aloud could also answer it themselves. Never use imperative commands like "Tell me about a time..." and never assume an exclusive shared past between one narrator and one respondent, like "What did we do..." Use plain interrogative phrasing ("What's...", "Who's...", "When...") aimed at "you" the individual, not "we" as a narrator-and-respondent pair. This rule does NOT apply to Lovers mode — there, direct partner-to-partner address ("tell me," "you," "us") is intentional and correct.
- Vocabulary: use "cringe" as the adjective, never "cringeworthy." Always prefer the word a person would actually say out loud over a more formal synonym.

OUTPUT REQUIREMENTS:
For each question you generate, you must also output:
- "mechanics": 1-3 tags from this exact list — specific_instance, real_stakes, social_ranking, exact_moment, direct_address, low_risk_confession, vulnerability, humor_forward, escapist_hypothetical, nostalgia_recall, forced_choice
- "tone": exactly one of — playful, chaotic, heartfelt, spicy, wholesome, vulnerable

Return a JSON object with a "prompts" array, where each object matches this shape:
{ "text": "...", "mechanics": ["..."], "tone": "..." }
`;

function getPlayerCountRules(playerCount: number): string {
  if (playerCount <= 3) {
    return "TIER 1 (2-3 Players): Make it personal but uplifting. Ask questions that encourage opening up about funny secrets, lighthearted reflections, and strong opinions.";
  } else if (playerCount <= 6) {
    return "TIER 2 (4-6 Players): Focus on group dynamics, funny call-outs, and shared lore. Use 'Who is most likely to...' prompts. The questions should provoke fun, energetic debates.";
  } else {
    return "TIER 3 (7+ Players): CRITICAL: Do NOT ask long-winded or storytelling questions. Generate rapid-fire, highly polarizing hot takes, chaotic hypotheticals, or 'Raise your hand if...' questions that spark immediate, loud reactions.";
  }
}

// TODO (Maintenance): This file contains cultural/generational relationship dynamics tailored for ~2026.
// Slang and social norms decay rapidly. Revisit and refresh this CATEGORY_MAP roughly every 6 months 
// to ensure the AI's prompts stay relevant and don't sound out-of-touch.
const CATEGORY_MAP: Record<string, CategoryConfig> = {
  // FRIENDS
  'friends-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Focus hot takes on modern social etiquette: group chats, dating apps, texting norms, and the unwritten rules of friend-group logistics — not just abstract dating opinions.',
    formatRequirement: 'Ask for a highly specific hot take or a relatable social scenario.',
    bannedConcepts: 'Do not ask about favorite colors, foods, abstract societal issues, or boring pet peeves.',
    fallback: 'What is a highly specific, harmless thing someone can do on a first date that guarantees you will ghost them?'
  },
  'friends-most-likely': {
    title: "Most Likely",
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'Playfully call out the group\'s chaotic or funny traits. Explicitly include staying in an undefined situation way too long, avoiding an overdue money conversation with a friend, or overanalyzing texts with the group chat.',
    formatRequirement: 'EVERY prompt MUST begin exactly with: "Who is most likely to..." or "Who would..."',
    bannedConcepts: 'No generic "survive a zombie apocalypse" or genuinely mean-spirited questions.',
    fallback: 'Who is most likely to defend their partner\'s terrible behavior just because they are too scared to be single?'
  },
  'friends-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Create fun, high-stakes, morally grey, or absurd situations.',
    formatRequirement: 'Put the group or the individual in a wild scenario that requires a difficult choice. Include scenarios that force a choice between a friendship and money/fairness.',
    bannedConcepts: 'No boring "what superpower would you have" questions.',
    fallback: 'You find a briefcase with $100,000, but keeping it means your best friend gets fired from their job. Are you taking the money?'
  },
  'friends-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia'],
    rules: 'Focus on wild nights out, core memories, and funny past drama with friends.',
    formatRequirement: 'Ask about a memorable moment, inside joke, or era from the past. Explicitly include questions about how a digital-first friend group first formed/met (e.g. gaming, shared online communities).',
    bannedConcepts: 'CRITICAL: DO NOT ask about middle school cringe, teenage angst, or childhood trauma. Keep it fun and friend-oriented.',
    fallback: 'What was the absolute wildest night out you’ve ever had where almost nothing went according to plan?'
  },
  'friends-confessions': {
    title: 'Confessions',
    dbCategories: ['Vulnerability', 'Funny'],
    rules: 'Lighthearted secrets, petty revenge, and funny truths. Petty avoidance behaviors around shared costs/payback (e.g., muting a chat, stalling Venmo, pretending not to see reminders) are fair game.',
    formatRequirement: 'Ask the user to admit a funny secret or a petty/harmless action they took.',
    bannedConcepts: 'CRITICAL: Do not ask about deep manipulative behavior, depressing guilt, or actual terrible traits.',
    fallback: 'Whose life do you casually keep tabs on just because it makes you feel better about your own?'
  },
  'friends-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability', 'Relationships'],
    rules: 'Reflective, uplifting, and honest conversation. Frame around the normalization of "friendship breakups", choosing quality over quantity in friendships, or how what a friendship "needs to survive" has changed. Frame as growth/clarity, not loss/grief.',
    formatRequirement: 'Ask a thought-provoking, open-ended question about personal growth or relationship dynamics.',
    bannedConcepts: 'CRITICAL: NO DEPRESSING SHIT. Do not ask about painful truths, faking personalities, or existential dread.',
    fallback: 'What is a belief you held strongly a few years ago that you have quietly abandoned?'
  },

  // LOVERS
  'lovers-warm-up': {
    title: 'Warm Up',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Light, teasing observations about the partner. Focus on texting-era quirks (double-texting anxiety, read-receipt behavior, response-time habits).',
    formatRequirement: 'Focus on weird, highly specific habits or immediate desires.',
    bannedConcepts: 'No heavy relationship history or trauma yet.',
    fallback: 'What is a weird, highly specific habit of mine that you secretly love?'
  },
  'lovers-spicy': {
    title: 'Spicy',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Physical tension, innocent turn-ons, and butterflies.',
    formatRequirement: 'Must be provocative and flirty, but strictly avoid explicit/NSFW language. Include the "soft launch" / "hard launch" concept as a valid topic alongside physical tension.',
    bannedConcepts: 'Do not be overtly explicit, vulgar, or crude.',
    fallback: 'What is a completely non-physical thing I do that turns you on?'
  },
  'lovers-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: '"Us against the world" alternate realities. Explicitly play off the couple NOT being one of the situationships/undefined-relationship stories everyone else has (aspirational, not comparative/smug).',
    formatRequirement: 'Put the couple in a movie-like scenario. Must frame the couple as a team.',
    bannedConcepts: 'Do not ask questions that pit the couple against each other.',
    fallback: 'If we had to fake our deaths and move to another country, what would our new jobs be?'
  },
  'lovers-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia', 'Relationships'],
    rules: 'The talking phase, first impressions, and the origin story.',
    formatRequirement: 'Ask for exact, cinematic memories from the very beginning of the relationship. Explicitly allow questions about the "talking stage" / soft-launch period as its own distinct, memorable phase.',
    bannedConcepts: 'Do not ask about past relationships with other people.',
    fallback: 'What was your exact first thought the very first time you saw me?'
  },
  'lovers-connection': {
    title: 'Connection',
    dbCategories: ['Relationships'],
    rules: 'Teamwork, feeling loved, and balancing each other out. Include how the couple handles disagreement or an awkward conversation neither wants to have, framed positively as a strength.',
    formatRequirement: 'Focus on the unseen ways the couple supports each other.',
    bannedConcepts: 'Avoid generic "what do you love about me" phrasing. Be highly specific.',
    fallback: 'In what highly specific way do you think we balance each other out perfectly?'
  },
  'lovers-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Vulnerability, future fears, and the reality of long-term love. Include how the couple thinks about traditional milestones differently than they assumed they would growing up (finance-driven delays).',
    formatRequirement: 'Ask about unspoken fears or how their definition of love has evolved.',
    bannedConcepts: 'No cliché "where do you see us in 5 years" questions.',
    fallback: 'What is a fear you have about our future that you rarely say out loud?'
  },

  // FAMILY
  'family-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Safe, funny, universal questions everyone at the table gets. Living at home longer into the mid-20s can be asked about lightly as a shared present-day reality.',
    formatRequirement: 'Relate it to shared household culture or food.',
    bannedConcepts: 'Nothing offensive, sexual, or politically divisive.',
    fallback: 'If our family was a reality TV show, what would the title be?'
  },
  'family-most-likely': {
    title: 'Most Likely',
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'Gentle teasing about family roles and grudges. Explicitly include family-group-chat-specific behaviors (e.g., unprompted life updates, forwarding warning articles).',
    formatRequirement: 'Must start exactly with "Who is most likely to...".',
    bannedConcepts: 'Do not be overly mean; keep it focused on lighthearted family stereotypes.',
    fallback: 'Who is most likely to bring up a 10-year-old argument at Thanksgiving dinner?'
  },
  'family-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Absurd situations involving the whole family unit. Scenarios where multiple adult generations share one household are highly relatable.',
    formatRequirement: 'Put the entire family in a hypothetical scenario together.',
    bannedConcepts: 'Avoid dividing the family into sides.',
    fallback: 'If money was no object, what kind of ridiculous family compound would we build?'
  },
  'family-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia'],
    rules: 'Weird house rules and disastrous family memories.',
    formatRequirement: 'Ask about a specific rule, event, or vacation from the past.',
    bannedConcepts: 'Avoid trauma or deeply sad memories.',
    fallback: 'Which family vacation was an absolute disaster at the time, but hilarious now?'
  },
  'family-perspectives': {
    title: 'Perspectives',
    dbCategories: ['Nostalgia', 'Relationships'],
    rules: 'Bridging the generational gap.',
    formatRequirement: 'Contrast the past vs. the present, or younger vs. older generations. Explicitly include the generational gap on AI\'s role in daily life alongside slang.',
    bannedConcepts: 'Do not prompt actual political arguments.',
    fallback: 'What is a slang word or trend from today that makes absolutely zero sense to you?'
  },
  'family-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Wisdom, regrets, and honest life reflections. Include the gap between the age parents hit major life milestones vs. the age kids hit them now due to economics (frame as comparing eras and adapting).',
    formatRequirement: 'Ask about life lessons learned the hard way.',
    bannedConcepts: 'Avoid making parents feel guilty; focus on shared wisdom.',
    fallback: 'What is a life lesson you had to learn the hard way so I wouldn\'t have to?'
  }
};

export function getCategoryConfig(categoryId: string): CategoryConfig {
  if (CATEGORY_MAP[categoryId]) return CATEGORY_MAP[categoryId];
  return CATEGORY_MAP['friends-deep-talk'];
}

export async function generatePersonalizedPrompts(
  weights: Record<string, number>,
  categoryHistory: PromptPlayRecord[],
  gamemode: string,
  config: CategoryConfig,
  playerCount: number,
  ageRange: string | null,
  count: number = 5
): Promise<{ prompts: { text: string; category: string; mechanics: string[]; tone: string }[] } | null> {
  
  const tagStats: Record<string, { seen: number; answered: number }> = {};
  categoryHistory.forEach((play, index) => {
    const weight = categoryHistory.length <= 1 ? 1 : 0.2 + (0.8 * (index / (categoryHistory.length - 1)));
    const keys = [play.prompt.tone, ...play.prompt.mechanics];
    keys.forEach(tag => {
      if (!tagStats[tag]) tagStats[tag] = { seen: 0, answered: 0 };
      tagStats[tag].seen += weight;
      if (play.answered) tagStats[tag].answered += weight; 
    });
  });

  const tagRates = Object.entries(tagStats).map(([tag, stats]) => ({
    tag,
    rate: stats.answered / stats.seen,
    seen: stats.seen
  }));

  const lovedTags = tagRates.filter(t => t.rate >= 0.5).sort((a,b) => b.rate - a.rate).map(t => t.tag).slice(0, 4);
  const hatedTags = tagRates.filter(t => t.rate < 0.5).sort((a,b) => a.rate - b.rate).map(t => t.tag).slice(0, 3);

  const answeredPrompts = categoryHistory.filter(h => h.answered);
  const topExamples = answeredPrompts.slice(-5).map(h => 
    `{ "text": "${h.prompt.text}", "mechanics": ${JSON.stringify(h.prompt.mechanics)}, "tone": "${h.prompt.tone}" }`
  );

  const systemPrompt = `
You are an expert party game designer creating cards for a chill, social conversation game called Realtalk.

GAME CONTEXT: The user is playing with their ${gamemode.toUpperCase()}.
CURRENT DECK/CATEGORY: "${config.title}"
NUMBER OF PLAYERS: ${playerCount}
USER AGE RANGE: ${ageRange || 'Unknown'} (TAILOR THE LIFE STAGE AND REFERENCES TO THIS AGE BRACKET)

${GLOBAL_AI_RULES}

GROUP SIZE INSTRUCTIONS (CRITICAL):
${getPlayerCountRules(playerCount)}

CATEGORY INSTRUCTIONS (CRITICAL):
- Core Focus: ${config.rules}
- Format Requirement: ${config.formatRequirement}
- Banned Concepts: ${config.bannedConcepts}

PLAYER TASTES (Tailor the topics using these, but DO NOT break the format rules above):
- Mechanics/Tones they lean into: ${lovedTags.length > 0 ? lovedTags.join(', ') : 'None yet'}
- Mechanics/Tones they avoid: ${hatedTags.length > 0 ? hatedTags.join(', ') : 'None yet'}

FEW-SHOT EXAMPLES (The user highly engaged with these recent questions, generate new ones with a similar style/mechanic structure):
${topExamples.length > 0 ? topExamples.join('\n') : 'No recent answered questions in this category yet.'}

TASK: Generate EXACTLY ${count} new questions. 
EVERY SINGLE QUESTION MUST PERFECTLY MATCH THE "FORMAT REQUIREMENT", "GROUP SIZE INSTRUCTIONS", AND FIT THEIR "AGE RANGE".
CRITICAL: Exactly 1 out of the ${count} questions MUST target a topic they haven't rated yet to encourage exploration.

OUTPUT JSON FORMAT:
{
  "prompts": [
    { "text": "...", "tags": ["tag1", "tag2"] }
  ]
}
`;

  console.log("\n\n========================================");
  console.log(`🤖 CALLING OPENAI AI FOR: ${config.title}`);
  console.log(`👥 PLAYERS: ${playerCount} | 🎂 AGE: ${ageRange || 'Unknown'}`);
  console.log(`🛠️ FORMAT REQUIREMENT: ${config.formatRequirement}`);
  console.log("========================================\n");

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });
    
    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) return null;
    
    // Server-side backstop for filler phrases
    const FILLER_DENYLIST = [
      "give me the deets",
      "spill the tea",
      "forget the awkwardness",
      "let's get into it",
      "okay so",
      "let's get deep",
      "time to spill",
      "get ready",
      "here's a deep one",
      "be honest"
    ];

    let validPrompts = parsed.prompts.map((p: any) => ({
      text: String(p.text).trim(),
      category: config.title, 
      mechanics: Array.isArray(p.mechanics) ? p.mechanics.map(String) : [],
      tone: String(p.tone),
    }));

    const originalCount = validPrompts.length;
    validPrompts = validPrompts.filter((p: any) => {
      const lowerText = p.text.toLowerCase();
      for (const filler of FILLER_DENYLIST) {
        if (lowerText.startsWith(filler)) {
          console.warn(`🛑 REJECTED AI PROMPT (Matched filler: "${filler}"): ${p.text}`);
          return false;
        }
      }
      return true;
    });

    if (validPrompts.length < originalCount) {
      console.warn(`⚠️ Dropped ${originalCount - validPrompts.length} prompts due to filler words.`);
    }

    console.log("✅ AI GENERATED THESE QUESTIONS:");
    validPrompts.forEach((p: any, idx: number) => {
      console.log(`  ${idx + 1}. ${p.text}`);
    });
    console.log("========================================\n");

    return {
      prompts: validPrompts.slice(0, count), 
    };
  } catch (error) {
    console.error('Personalized prompt generation failed:', error);
    return null;
  }
}

export async function getNextPromptsForProfile(input: {
  vibeWeights: Prisma.JsonValue | null;
  history: PromptPlayRecord[];
  dbPrompts: QuestionPromptCandidate[];
  playedPromptIds: string[];
  gamemode: string;
  categoryId: string;
  count: number;
  playerCount: number;
  ageRange: string | null;
}): Promise<{
  prompts: QuestionPromptCandidate[];
  config: CategoryConfig;
}> {
  
  console.log(`\n\n📥 [REQUEST RECEIVED] Generating deck cards...`);
  console.log(`🎮 Gamemode requested: ${input.gamemode}`);
  console.log(`📂 Category requested: ${input.categoryId}`);

  const weights = parseVibeWeights(input.vibeWeights);
  const playedIds = new Set(input.playedPromptIds);
  let results: QuestionPromptCandidate[] = [];

  const config = getCategoryConfig(input.categoryId);

  // BUG FIX: Filter heavily by gamemode to prevent cross-contamination
  const availableDbPrompts = input.dbPrompts.filter(p => 
    !playedIds.has(p.id) && 
    p.gamemode === input.gamemode &&
    (p.category === config.title || config.dbCategories.includes(p.category))
  );
  
  const categoryHistory = input.history.filter(h => 
    h.prompt.category === config.title || config.dbCategories.includes(h.prompt.category)
  );

  if (categoryHistory.length < 5 && availableDbPrompts.length > 0) {
    console.log(`🎲 Using PRESET database prompts for calibration...`);
    const ranked = availableDbPrompts
      .map(p => {
        let score = weights[p.category] ?? 0.3;
        [p.tone, ...p.mechanics].forEach(tag => score += (weights[tag] ?? 0) * 0.35);
        return { p, score: score + Math.random() * 0.1 }; 
      })
      .sort((a, b) => b.score - a.score);

    const amountToTake = Math.min(input.count, ranked.length);
    for (let i = 0; i < amountToTake; i++) {
      results.push({
        ...ranked[i].p,
        category: config.title 
      });
    }
  }

  if (results.length < input.count) {
    const needed = input.count - results.length;
    console.log(`⚡ Need ${needed} more prompts. Sending to AI generator...`);
    
    const generated = await generatePersonalizedPrompts(
      weights, 
      categoryHistory, 
      input.gamemode, 
      config,
      input.playerCount,
      input.ageRange,
      needed
    );
    
    if (generated) {
      generated.prompts.forEach((gp, idx) => {
        results.push({
          id: `generated-${Date.now()}-${idx}`,
          text: gp.text,
          category: gp.category,
          gamemode: input.gamemode,
          mechanics: gp.mechanics,
          tone: gp.tone,
        });
      });
    }
  }

  if (results.length === 0) {
    console.log(`⚠️ AI FAILED. Using fallback prompt.`);
    results.push({
      id: `fallback-${Date.now()}`,
      text: config.fallback,
      category: config.title,
      gamemode: input.gamemode,
      mechanics: ['fallback'],
      tone: 'fallback',
    });
  }

  return { prompts: results, config };
}