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
  count: number = 2
): Promise<{ updatedProfile: string; prompts: { text: string; category: string; tags: string[] }[] } | null> {
  
  const liked = recentHistory.filter((h) => h.swipedLeft).map((h) => h.prompt.text).slice(-4);
  const skipped = recentHistory.filter((h) => !h.swipedLeft).map((h) => h.prompt.text).slice(-4);

  const systemPrompt = `
You are the AI Game Master for a deep conversation card game. 
Your goal is to build a psychological profile of the user based on their swipes, and generate highly targeted questions.

CURRENT TRAIT PROFILE: ${traitProfile || 'New User, no data yet.'}
RECENT QUESTIONS THEY LIKED: ${liked.join(' | ') || 'None'}
RECENT QUESTIONS THEY SKIPPED: ${skipped.join(' | ') || 'None'}

TASK:
1. Update the Trait Profile. Based on their likes/skips, deduce their psychological preferences (e.g., "Avoids small talk, deeply nostalgic, prefers ethical dilemmas"). Keep it under 2 sentences.
2. Generate ${count} new, highly personalized, open-ended questions (under 200 chars) that perfectly target this updated profile. Do not make them sound like robot prompts. Make them human, warm, and provocative.

OUTPUT JSON FORMAT:
{
  "updatedTraitProfile": "...",
  "prompts": [
    { "text": "...", "category": "Existential", "tags": ["tag1", "tag2"] }
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
      })),
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
  count: number;
}): Promise<{
  prompts: QuestionPromptCandidate[];
  updatedTraitProfile: string;
}> {
  const weights = parseVibeWeights(input.vibeWeights);
  const playedIds = new Set(input.playedPromptIds);
  let results: QuestionPromptCandidate[] = [];

  // Phase 1: Try to use Presets (DB Prompts) first (Max 3 times per category usually)
  const availableDbPrompts = input.dbPrompts.filter(p => !playedIds.has(p.id));
  
  if (input.history.length < 3 && availableDbPrompts.length > 0) {
    // Score and pick top from DB
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

  // Phase 2: AI Generation (if DB prompts are exhausted or we are past the preset phase)
  let newTraitProfile = input.traitProfile || '';
  if (results.length < input.count) {
    const needed = input.count - results.length;
    const generated = await generatePersonalizedPrompts(weights, input.history, input.traitProfile, needed);
    
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