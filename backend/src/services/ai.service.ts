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

const WEIGHT_DELTA = 0.12;
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 1.0;

export type QuestionPromptCandidate = {
  id: string;
  text: string;
  category: string;
  tags: string[];
};

export type PromptPlayRecord = {
  swipedLeft: boolean;
  prompt: { text: string; category: string; tags: string[] };
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
  tags: string[],
  swipedLeft: boolean
): Record<string, number> {
  const next = { ...parseVibeWeights(weights) };
  const delta = swipedLeft ? WEIGHT_DELTA : -WEIGHT_DELTA;
  const keys = new Set([category, ...tags]);

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

// ==========================================
// AI PROMPT ENGINEERING RULES
// ==========================================

const GLOBAL_AI_RULES = `
CRITICAL TONE CONSTRAINTS:
1. NEVER use "Therapy-Speak". Ban words like: boundary, journey, unpack, toxic trait, inner child, validate, navigate, realm, tapestry, or profound.
2. NEVER use "Reddit-Speak". Do not ask generic internet questions like "What is a socially acceptable scam?" or "What is a common misconception?"
3. The tone must be conversational, slightly edgy, highly specific, and deeply human. Speak like a witty 20-something having drinks with close friends.
`;

function getPlayerCountRules(playerCount: number): string {
  if (playerCount <= 3) {
    return "TIER 1 (2-3 Players): Make it deeply personal. Ask questions that encourage long-form storytelling, deep vulnerability, and highly specific personal confessions. It is safe to ask questions that take a few minutes to answer.";
  } else if (playerCount <= 6) {
    return "TIER 2 (4-6 Players): Focus on group dynamics, calling each other out, and shared lore. Use 'Who in this room...' prompts. The questions should provoke funny debates but keep answers relatively concise to keep the game moving.";
  } else {
    return "TIER 3 (7+ Players): CRITICAL: Do NOT ask long-winded, deep, or storytelling questions; the game will stall. Generate rapid-fire, highly polarizing hot takes, chaotic hypotheticals, or 'Raise your hand if...' questions that spark immediate, loud reactions.";
  }
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  // FRIENDS
  'friends-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Spark immediate, loud, polarizing debates. Keep it cynical, witty, and slightly toxic.',
    formatRequirement: 'Ask for a highly specific hot take or polarizing opinion.',
    bannedConcepts: 'Do not ask about favorite colors, foods, or mild pet peeves. Avoid generic AskReddit questions.',
    fallback: 'What is a massive "red flag" in a person that you actually find highly attractive?'
  },
  'friends-most-likely': {
    title: "Most Likely",
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'Expose the group\'s chaotic or toxic traits and playfully roast each other.',
    formatRequirement: 'EVERY prompt MUST begin exactly with: "Who is most likely to..."',
    bannedConcepts: 'No generic "survive a zombie apocalypse" or "win the lottery" questions. Make it about unhinged, specific human behavior.',
    fallback: 'Who is most likely to seamlessly lie their way into a VIP section and leave the rest of us outside?'
  },
  'friends-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Create high-stakes, morally grey, or absurd situations that test loyalty or ethics.',
    formatRequirement: 'Put the group or the individual in a wild scenario that requires a difficult choice.',
    bannedConcepts: 'No boring "what superpower would you have" questions.',
    fallback: 'If you had a button that gave you $1 million but permanently ruined the life of someone you went to high school with, how many times do you press it?'
  },
  'friends-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia'],
    rules: 'Focus on cringe eras, teenage toxicity, and past mistakes.',
    formatRequirement: 'Must reference middle school, high school, or early internet days.',
    bannedConcepts: 'Do not ask about nice, sweet childhood memories like favorite cartoons. Keep it focused on the "cringe."',
    fallback: 'What is the most undeniably toxic thing you did in your first real relationship?'
  },
  'friends-confessions': {
    title: 'Confessions',
    dbCategories: ['Vulnerability', 'Funny'],
    rules: 'Expose hypocrisy, petty judgments, and mild selfishness. Make the user call themselves out.',
    formatRequirement: 'Ask the user to admit a terrible trait or an unspoken truth about how they view others.',
    bannedConcepts: 'No deep trauma or depressing secrets. Keep it focused on social hypocrisy.',
    fallback: 'What is a terrible trait you have that you secretly judge other people for having?'
  },
  'friends-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability', 'Relationships'],
    rules: 'Heavy, philosophical, and cutting through the BS. Ask about painful truths, deep flaws, or raw existential reality.',
    formatRequirement: 'Ask a thought-provoking, deep open-ended question that makes them hesitate before answering.',
    bannedConcepts: 'NO THERAPY SPEAK. Do not use words like "journey," "unpack," "healing," or "profound."',
    fallback: 'Are you actually a good person, or are you just terrified of people being mad at you?'
  },

  // LOVERS
  'lovers-warm-up': {
    title: 'Warm Up',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Light, teasing observations about the partner.',
    formatRequirement: 'Focus on weird, highly specific habits or immediate desires.',
    bannedConcepts: 'No heavy relationship history or trauma yet.',
    fallback: 'What is a weird, highly specific habit of mine that you secretly love?'
  },
  'lovers-spicy': {
    title: 'Spicy',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Physical tension, innocent turn-ons, and butterflies.',
    formatRequirement: 'Must be provocative and flirty, but strictly avoid explicit/NSFW language.',
    bannedConcepts: 'Do not be overtly explicit, vulgar, or crude.',
    fallback: 'What is a completely non-physical thing I do that turns you on?'
  },
  'lovers-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: '"Us against the world" alternate realities.',
    formatRequirement: 'Put the couple in a movie-like scenario. Must frame the couple as a team.',
    bannedConcepts: 'Do not ask questions that pit the couple against each other.',
    fallback: 'If we had to fake our deaths and move to another country, what would our new jobs be?'
  },
  'lovers-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia', 'Relationships'],
    rules: 'The talking phase, first impressions, and the origin story.',
    formatRequirement: 'Ask for exact, cinematic memories from the very beginning of the relationship.',
    bannedConcepts: 'Do not ask about past relationships with other people.',
    fallback: 'What was your exact first thought the very first time you saw me?'
  },
  'lovers-connection': {
    title: 'Connection',
    dbCategories: ['Relationships'],
    rules: 'Teamwork, feeling loved, and balancing each other out.',
    formatRequirement: 'Focus on the unseen ways the couple supports each other.',
    bannedConcepts: 'Avoid generic "what do you love about me" phrasing. Be highly specific.',
    fallback: 'In what highly specific way do you think we balance each other out perfectly?'
  },
  'lovers-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Vulnerability, future fears, and the reality of long-term love.',
    formatRequirement: 'Ask about unspoken fears or how their definition of love has evolved.',
    bannedConcepts: 'No cliché "where do you see us in 5 years" questions.',
    fallback: 'What is a fear you have about our future that you rarely say out loud?'
  },

  // FAMILY
  'family-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Safe, funny, universal questions everyone at the table gets.',
    formatRequirement: 'Relate it to shared household culture or food.',
    bannedConcepts: 'Nothing offensive, sexual, or politically divisive.',
    fallback: 'If our family was a reality TV show, what would the title be?'
  },
  'family-most-likely': {
    title: 'Most Likely',
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'Gentle teasing about family roles and grudges.',
    formatRequirement: 'Must start exactly with "Who is most likely to...".',
    bannedConcepts: 'Do not be overly mean; keep it focused on lighthearted family stereotypes.',
    fallback: 'Who is most likely to bring up a 10-year-old argument at Thanksgiving dinner?'
  },
  'family-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Absurd situations involving the whole family unit.',
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
    formatRequirement: 'Contrast the past vs. the present, or younger vs. older generations.',
    bannedConcepts: 'Do not prompt actual political arguments.',
    fallback: 'What is a slang word or trend from today that makes absolutely zero sense to you?'
  },
  'family-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Wisdom, regrets, and honest life reflections.',
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
  count: number = 5
): Promise<{ prompts: { text: string; category: string; tags: string[] }[] } | null> {
  
  const tagStats: Record<string, { seen: number; answered: number }> = {};
  categoryHistory.forEach(play => {
    play.prompt.tags.forEach(tag => {
      if (!tagStats[tag]) tagStats[tag] = { seen: 0, answered: 0 };
      tagStats[tag].seen += 1;
      if (play.swipedLeft) tagStats[tag].answered += 1;
    });
  });

  const tagRates = Object.entries(tagStats).map(([tag, stats]) => ({
    tag,
    rate: stats.answered / stats.seen,
    seen: stats.seen
  }));

  const lovedTags = tagRates.filter(t => t.rate >= 0.5).sort((a,b) => b.rate - a.rate).map(t => t.tag).slice(0, 4);
  const hatedTags = tagRates.filter(t => t.rate < 0.5).sort((a,b) => a.rate - b.rate).map(t => t.tag).slice(0, 3);

  const last3 = categoryHistory.slice(-3).map(h => 
    `${h.swipedLeft ? 'ANSWERED' : 'SKIPPED'}: "${h.prompt.text}"`
  );

  const systemPrompt = `
You are an expert party game designer creating cards for an edgy, deep conversation game called Hezi.

GAME CONTEXT: The user is playing with their ${gamemode.toUpperCase()}.
CURRENT DECK/CATEGORY: "${config.title}"
NUMBER OF PLAYERS: ${playerCount}

${GLOBAL_AI_RULES}

GROUP SIZE INSTRUCTIONS (CRITICAL):
${getPlayerCountRules(playerCount)}

CATEGORY INSTRUCTIONS (CRITICAL):
- Core Focus: ${config.rules}
- Format Requirement: ${config.formatRequirement}
- Banned Concepts: ${config.bannedConcepts}

PLAYER TASTES (Tailor the topics using these, but DO NOT break the format rules above):
- Topics they like: ${lovedTags.length > 0 ? lovedTags.join(', ') : 'None yet'}
- Topics they avoid: ${hatedTags.length > 0 ? hatedTags.join(', ') : 'None yet'}
- Recent cards they saw:
${last3.length > 0 ? last3.join('\n') : 'No recent swipes in this category yet.'}

TASK: Generate EXACTLY ${count} new questions. 
EVERY SINGLE QUESTION MUST PERFECTLY MATCH THE "FORMAT REQUIREMENT" AND "GROUP SIZE INSTRUCTIONS".

OUTPUT JSON FORMAT:
{
  "prompts": [
    { "text": "...", "tags": ["tag1", "tag2"] }
  ]
}
`;

  console.log("\n\n========================================");
  console.log(`🤖 CALLING OPENAI AI FOR: ${config.title}`);
  console.log(`👥 PLAYERS: ${playerCount}`);
  console.log(`🛠️ FORMAT REQUIREMENT: ${config.formatRequirement}`);
  console.log("========================================\n");

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });
    
    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) return null;
    
    console.log("✅ AI GENERATED THESE QUESTIONS:");
    parsed.prompts.forEach((p: any, idx: number) => {
      console.log(`  ${idx + 1}. ${p.text}`);
    });
    console.log("========================================\n");

    return {
      prompts: parsed.prompts.map((p: any) => ({
        text: String(p.text),
        category: config.title, 
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      })).slice(0, count), 
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

  const availableDbPrompts = input.dbPrompts.filter(p => 
    !playedIds.has(p.id) && 
    config.dbCategories.includes(p.category)
  );
  
  const categoryHistory = input.history.filter(h => 
    h.prompt.category === config.title || config.dbCategories.includes(h.prompt.category)
  );

  if (categoryHistory.length < 3 && availableDbPrompts.length > 0) {
    console.log(`🎲 Using PRESET database prompts...`);
    const ranked = availableDbPrompts
      .map(p => {
        let score = weights[p.category] ?? 0.3;
        p.tags.forEach(tag => score += (weights[tag] ?? 0) * 0.35);
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
      needed
    );
    
    if (generated) {
      generated.prompts.forEach((gp, idx) => {
        results.push({
          id: `generated-${Date.now()}-${idx}`,
          text: gp.text,
          category: gp.category,
          tags: gp.tags,
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
      tags: ['fallback'],
    });
  }

  return { prompts: results, config };
}