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

export async function generatePersonalizedPrompts(
  weights: Record<string, number>,
  recentHistory: PromptPlayRecord[],
  traitProfile: string | null,
  gamemode: string,
  count: number = 5
): Promise<{ updatedProfile: string; prompts: { text: string; category: string; tags: string[] }[] } | null> {
  
  // Tag Engagement Analysis Algorithm
  const tagStats: Record<string, { seen: number; answered: number }> = {};
  recentHistory.forEach(play => {
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

  // Identify what's working and what isn't
  const lovedTags = tagRates.filter(t => t.rate >= 0.5).sort((a,b) => b.rate - a.rate).map(t => t.tag).slice(0, 4);
  const hatedTags = tagRates.filter(t => t.rate < 0.5).sort((a,b) => a.rate - b.rate).map(t => t.tag).slice(0, 3);

  // Look strictly at the last 3 swipes for immediate context buffering
  const last3 = recentHistory.slice(-3).map(h => 
    `${h.swipedLeft ? 'ANSWERED (Liked)' : 'SKIPPED (Disliked)'}: "${h.prompt.text}" [Tags: ${h.prompt.tags.join(', ')}]`
  );

  const systemPrompt = `
You are the AI Game Master for a deep conversation card game. 
Your goal is to build a psychological profile of the user and generate a highly targeted batch of questions.

GAME CONTEXT: The user is playing the game right now with their ${gamemode.toUpperCase()} (e.g. Friends, Romantic Partner, or Family).
IMPORTANT: ALL generated questions MUST be perfectly tailored to this group dynamic. Do not suggest romantic/spicy prompts for a family game.

CURRENT TRAIT PROFILE: ${traitProfile || 'New User, no data yet.'}

IMMEDIATE HISTORY (Last 3 Swipes):
${last3.length > 0 ? last3.join('\n') : 'No recent swipes yet.'}

TAG ANALYSIS:
- High Engagement Tags (Focus on these): ${lovedTags.length > 0 ? lovedTags.join(', ') : 'None yet'}
- Low Engagement Tags (Avoid these): ${hatedTags.length > 0 ? hatedTags.join(', ') : 'None yet'}

TASK:
1. Update the Trait Profile (under 2 sentences) based on their tag engagement and recent choices.
2. Generate EXACTLY ${count} new, highly personalized, open-ended questions (under 200 chars).
3. Interleave the questions: Focus heavily on the "High Engagement Tags" but mix in slight variations so it doesn't get repetitive.
4. Make them sound human, provocative, and conversational. Do not sound like a robot.

OUTPUT JSON FORMAT:
{
  "updatedTraitProfile": "...",
  "prompts": [
    { "text": "...", "category": "Deep Talk", "tags": ["tag1", "tag2"] },
    { "text": "...", "category": "Deep Talk", "tags": ["tag3", "tag4"] }
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
    
    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) return null;
    
    return {
      updatedProfile: parsed.updatedTraitProfile || traitProfile || '',
      prompts: parsed.prompts.map((p: any) => ({
        text: String(p.text),
        category: String(p.category || 'Deep Talk'),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      })).slice(0, count), // ensure exactly the count requested
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
  count: number;
}): Promise<{
  prompts: QuestionPromptCandidate[];
  updatedTraitProfile: string;
}> {
  const weights = parseVibeWeights(input.vibeWeights);
  const playedIds = new Set(input.playedPromptIds);
  let results: QuestionPromptCandidate[] = [];

  // Phase 1: Only use DB presets if this is their VERY first time playing (history < 3)
  const availableDbPrompts = input.dbPrompts.filter(p => !playedIds.has(p.id));
  
  if (input.history.length < 3 && availableDbPrompts.length > 0) {
    const ranked = availableDbPrompts
      .map(p => {
        let score = weights[p.category] ?? 0.3;
        p.tags.forEach(tag => score += (weights[tag] ?? 0) * 0.35);
        return { p, score: score + Math.random() * 0.1 };
      })
      .sort((a, b) => b.score - a.score);

    const amountToTake = Math.min(input.count, ranked.length);
    for (let i = 0; i < amountToTake; i++) {
      results.push(ranked[i].p);
    }
  }

  // Phase 2: AI Generation (Always happens in batches once they have swipe history)
  let newTraitProfile = input.traitProfile || '';
  if (results.length < input.count) {
    const needed = input.count - results.length;
    const generated = await generatePersonalizedPrompts(
      weights, 
      input.history, 
      input.traitProfile, 
      input.gamemode, 
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

  // Fallback if AI fails completely
  if (results.length === 0) {
    results.push({
      id: `fallback-${Date.now()}`,
      text: 'If you could change one decision from your past, knowing it would change where you are today, would you do it?',
      category: 'Existential',
      tags: ['reflection'],
    });
  }

  return { prompts: results, updatedTraitProfile: newTraitProfile };
}