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

// 🎯 STRICT CATEGORY DEFINITIONS
// This guarantees the AI understands the exact format and mechanic of the category it is in.
export type CategoryConfig = { 
  title: string; 
  dbCategories: string[]; 
  rules: string; 
  formatRequirement: string;
  fallback: string; 
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  // === FRIENDS ===
  'friends-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Keep it extremely lighthearted, fun, low-stakes, and easy to answer. These are warm-up questions.',
    formatRequirement: 'Must be short and snappy. Never ask deep, philosophical, or heavy emotional questions here.',
    fallback: 'What is the pettiest hill you are willing to die on?'
  },
  'friends-most-likely': {
    title: "Who's Most Likely",
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'This is a group voting party game. The group must vote on which person in the room best fits the description.',
    formatRequirement: 'EVERY SINGLE PROMPT MUST START EXACTLY WITH THE WORDS: "Who is most likely to " followed by a specific, funny, or chaotic action.',
    fallback: 'Who is most likely to accidentally join a cult because they liked the free snacks?'
  },
  'friends-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Focus entirely on crazy hypothetical scenarios, superpowers, or strange choices.',
    formatRequirement: 'EVERY SINGLE PROMPT MUST START WITH: "What if", "Imagine", or "You have to".',
    fallback: 'You can pause time for exactly 24 hours. What do you do?'
  },
  'friends-nostalgia': {
    title: 'Nostalgia',
    dbCategories: ['Nostalgia'],
    rules: 'Focus ENTIRELY on childhood memories, school days, past eras, and old trends.',
    formatRequirement: 'Must specifically ask about a past memory, childhood experience, or nostalgia.',
    fallback: 'What was your absolute favorite TV show when you were 12 years old?'
  },
  'friends-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability', 'Relationships'],
    rules: 'Deeply psychological, vulnerable, and existential. Ask about fears, identity, profound beliefs, or emotional truths.',
    formatRequirement: 'Must be a thought-provoking, deep open-ended question.',
    fallback: 'What part of your personality do you fake the most for the sake of other people?'
  },
  'friends-spicy': {
    title: 'Spicy Takes',
    dbCategories: ['Funny'],
    rules: 'Edgy, playful, and debate-worthy. Focus on hot takes, unpopular opinions, or socially unacceptable thoughts.',
    formatRequirement: 'Must provoke a fun debate or reveal a controversial/funny opinion.',
    fallback: 'What socially acceptable behavior should be completely banned?'
  },
  
  // === LOVERS ===
  'lovers-warm-up': {
    title: 'Warm Up',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Lighthearted, romantic, fun, and easy to answer. Warm-up questions about each other.',
    formatRequirement: 'Must be a direct, lighthearted question directed at the partner.',
    fallback: 'What is a weird habit of mine that you secretly find endearing?'
  },
  'lovers-our-story': {
    title: 'Our Story',
    dbCategories: ['Nostalgia', 'Relationships'],
    rules: 'Focus ENTIRELY on early relationship days, first impressions, how you met, and memories together.',
    formatRequirement: 'Must explicitly ask about the past history of the relationship.',
    fallback: 'What is a small, random moment from early in our relationship that you still think about?'
  },
  'lovers-us-talk': {
    title: 'The "Us" Talk',
    dbCategories: ['Relationships'],
    rules: 'Focus on love, trust, connection, teamwork, and relationship dynamics.',
    formatRequirement: 'Must focus on the couple as a team ("us", "we").',
    fallback: 'What makes you feel the most loved by me?'
  },
  'lovers-deep-talk': {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Deeply psychological and vulnerable. Ask about fears, dreams, and meaning within the context of life or love.',
    formatRequirement: 'Must be a deep, emotionally revealing question.',
    fallback: 'What is an insecurity you have that I can help soothe?'
  },
  'lovers-spicy': {
    title: 'Spicy Takes',
    dbCategories: ['Funny', 'Relationships'],
    rules: 'Playful heat, physical or emotional attraction, and romantic tension.',
    formatRequirement: 'Must be slightly provocative, flirty, or focus on physical/emotional attraction.',
    fallback: 'What is a completely non-physical trait that gets you?'
  },
  'lovers-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Alternate reality scenarios involving both partners.',
    formatRequirement: 'EVERY PROMPT MUST START WITH: "What if we", "If we had to", or "Imagine we".',
    fallback: 'If we had to drop everything and open a business together tomorrow, what would it be?'
  },

  // === FAMILY ===
  'family-icebreakers': {
    title: 'Icebreakers',
    dbCategories: ['Funny', 'Scenarios'],
    rules: 'Lighthearted, fun family-oriented questions. Keep it easy and low-stakes.',
    formatRequirement: 'Short, easy question everyone at the family table can answer.',
    fallback: 'If our family was a TV sitcom, what would the title be?'
  },
  'family-growing-up': {
    title: 'Growing Up',
    dbCategories: ['Nostalgia'],
    rules: 'Focus ENTIRELY on childhood memories, house rules, and growing up in the family.',
    formatRequirement: 'Must reference growing up, childhood rules, or family history.',
    fallback: 'What was the strictest rule in the house growing up?'
  },
  'family-dynamics': {
    title: 'Family Dynamics',
    dbCategories: ["Who's Most Likely", "Funny"],
    rules: 'A group voting game where the family votes on who fits the description best.',
    formatRequirement: 'EVERY SINGLE PROMPT MUST START EXACTLY WITH: "Who in the family is most likely to " or "Who is most likely to ".',
    fallback: 'Who is most likely to give completely unsolicited advice?'
  },
  'family-life-lessons': {
    title: 'Life Lessons',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Focus on wisdom, aging, regrets, personal growth, and passing down life advice.',
    formatRequirement: 'Must ask about a life lesson, regret, advice, or aging.',
    fallback: 'What is the hardest lesson you\'ve had to learn the hard way?'
  },
  'family-what-ifs': {
    title: 'What Ifs',
    dbCategories: ['Scenarios'],
    rules: 'Hypothetical family scenarios (e.g. winning the lottery, surviving together).',
    formatRequirement: 'EVERY PROMPT MUST START WITH: "What if our family", "If we", or "Imagine".',
    fallback: 'If money was no object, what kind of family compound would we build?'
  },
  'family-generational': {
    title: 'Generational',
    dbCategories: ['Nostalgia', 'Relationships'],
    rules: 'Focus on differences between generations, changing times, and bridging the age gap.',
    formatRequirement: 'Must contrast the past vs present, or younger vs older generations.',
    fallback: 'What is one thing you think the younger generation actually got right?'
  }
};

export function getCategoryConfig(categoryId: string): CategoryConfig {
  if (CATEGORY_MAP[categoryId]) return CATEGORY_MAP[categoryId];
  return {
    title: 'Deep Talk',
    dbCategories: ['Existential', 'Vulnerability'],
    rules: 'Deeply psychological and vulnerable questions.',
    formatRequirement: 'Must be a thought-provoking, deep open-ended question.',
    fallback: 'What part of your personality do you fake the most?'
  };
}

export async function generatePersonalizedPrompts(
  weights: Record<string, number>,
  categoryHistory: PromptPlayRecord[],
  traitProfile: string | null,
  gamemode: string,
  config: CategoryConfig,
  count: number = 5
): Promise<{ updatedProfile: string; prompts: { text: string; category: string; tags: string[] }[] } | null> {
  
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

  // The prompt is now completely dominated by FORMAT requirements so it doesn't drift.
  const systemPrompt = `
You are an expert party game designer creating cards for a game called Hezi.

GAME CONTEXT: The user is playing with their ${gamemode.toUpperCase()}.
CURRENT DECK/CATEGORY: "${config.title}"

CRITICAL GAME MECHANICS (YOU MUST FOLLOW THESE OR THE APP WILL BREAK):
=========================================
RULES: ${config.rules}
FORMAT REQUIREMENT: ${config.formatRequirement}
=========================================

PLAYER PROFILE (Use this to tailor the humor/topics, but DO NOT break the format rules above):
- Profile: ${traitProfile || 'New User, no data yet.'}
- They like these topics: ${lovedTags.length > 0 ? lovedTags.join(', ') : 'None yet'}
- They avoid these topics: ${hatedTags.length > 0 ? hatedTags.join(', ') : 'None yet'}
- Recent cards they saw:
${last3.length > 0 ? last3.join('\n') : 'No recent swipes in this category yet.'}

TASK:
1. Update the Trait Profile (1-2 sentences) based on their likes/dislikes.
2. Generate EXACTLY ${count} new questions. 
3. EVERY SINGLE QUESTION MUST PERFECTLY MATCH THE "FORMAT REQUIREMENT". If the format requires starting with "Who is most likely to", you MUST start every card with exactly those words. Do not ask deep open-ended questions unless the category specifically calls for it.

OUTPUT JSON FORMAT:
{
  "updatedTraitProfile": "...",
  "prompts": [
    { "text": "...", "tags": ["tag1", "tag2"] }
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });
    
    let content = completion.choices[0].message.content || '{}';
    // Clean up any markdown blocks if the LLM hallucinated them despite JSON mode
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) return null;
    
    return {
      updatedProfile: parsed.updatedTraitProfile || traitProfile || '',
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
  traitProfile: string | null;
  history: PromptPlayRecord[];
  dbPrompts: QuestionPromptCandidate[];
  playedPromptIds: string[];
  gamemode: string;
  categoryId: string;
  count: number;
}): Promise<{
  prompts: QuestionPromptCandidate[];
  updatedTraitProfile: string;
  config: CategoryConfig;
}> {
  const weights = parseVibeWeights(input.vibeWeights);
  const playedIds = new Set(input.playedPromptIds);
  let results: QuestionPromptCandidate[] = [];

  const config = getCategoryConfig(input.categoryId);

  const availableDbPrompts = input.dbPrompts.filter(p => 
    !playedIds.has(p.id) && 
    config.dbCategories.includes(p.category)
  );
  
  // We include both the strict title AND the underlying seed categories 
  // so the AI learns from the preset cards properly.
  const categoryHistory = input.history.filter(h => 
    h.prompt.category === config.title || config.dbCategories.includes(h.prompt.category)
  );

  if (categoryHistory.length < 3 && availableDbPrompts.length > 0) {
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

  let newTraitProfile = input.traitProfile || '';
  if (results.length < input.count) {
    const needed = input.count - results.length;
    
    const generated = await generatePersonalizedPrompts(
      weights, 
      categoryHistory, 
      input.traitProfile, 
      input.gamemode, 
      config,
      needed
    );
    
    if (generated) {
      newTraitProfile = generated.updatedProfile;
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
    results.push({
      id: `fallback-${Date.now()}`,
      text: config.fallback,
      category: config.title,
      tags: ['fallback'],
    });
  }

  return { prompts: results, updatedTraitProfile: newTraitProfile, config };
}