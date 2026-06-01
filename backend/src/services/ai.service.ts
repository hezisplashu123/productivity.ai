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
const HARD_BOOST = 1.0;
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 1.0;

export type QuestionPromptCandidate = {
  id: string;
  text: string;
  category: string;
  tags: string[];
};

export type SessionPlayRecord = {
  swipedLeft: boolean;
  prompt: { category: string; tags: string[] };
};

function clampWeight(value: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));
}

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
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
    const current = next[key] ?? DEFAULT_VIBE_WEIGHTS[key] ?? 0.5;
    next[key] = clampWeight(current + delta);
  });

  return normalizeWeights(next);
}

export function applyCategoryBoost(
  weights: Record<string, number>,
  category: string
): Record<string, number> {
  const next = { ...parseVibeWeights(weights) };
  next[category] = clampWeight((next[category] ?? 0.5) + HARD_BOOST);
  return normalizeWeights(next);
}

function pickWeightedCategory(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [category, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return category;
  }
  return entries[0]?.[0] ?? 'Existential';
}

function scorePrompt(
  prompt: QuestionPromptCandidate,
  weights: Record<string, number>,
  playedIds: Set<string>
): number {
  if (playedIds.has(prompt.id)) return -1;
  let score = weights[prompt.category] ?? 0.3;
  prompt.tags.forEach((tag) => {
    score += (weights[tag] ?? 0) * 0.35;
  });
  return score + Math.random() * 0.08;
}

export async function selectNextPromptFromDb(
  prompts: QuestionPromptCandidate[],
  weights: Record<string, number>,
  playedIds: Set<string>
): Promise<QuestionPromptCandidate | null> {
  const ranked = prompts
    .map((p) => ({ p, score: scorePrompt(p, weights, playedIds) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.p ?? null;
}

export async function generatePivotPrompt(
  weights: Record<string, number>,
  recentHistory: SessionPlayRecord[]
): Promise<{ text: string; category: string; tags: string[] } | null> {
  const targetCategory = pickWeightedCategory(
    Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, Math.max(MIN_WEIGHT, 1 - v)])
    )
  );

  const liked = recentHistory
    .filter((h) => h.swipedLeft)
    .map((h) => h.prompt.category)
    .slice(-5);
  const skipped = recentHistory
    .filter((h) => !h.swipedLeft)
    .map((h) => h.prompt.category)
    .slice(-5);

  const systemPrompt = `
You are the Room Vibe Tuning Engine for a group conversation card game.
Generate ONE deep, open-ended question that sparks flowing dialogue.

TARGET CATEGORY (pivot toward): "${targetCategory}"
RECENTLY LIKED CATEGORIES: ${liked.join(', ') || 'none'}
RECENTLY SKIPPED CATEGORIES: ${skipped.join(', ') || 'none'}

Rules:
- Avoid yes/no questions.
- Keep it under 220 characters.
- Tone: warm, curious, party-game friendly (Imposter / Wavelength energy).
- Do NOT repeat generic icebreakers.

OUTPUT JSON:
{ "text": "...", "category": "${targetCategory}", "tags": ["tag1","tag2"] }
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });
    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    if (!parsed.text) return null;
    return {
      text: String(parsed.text),
      category: String(parsed.category || targetCategory),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [targetCategory],
    };
  } catch (error) {
    console.error('Pivot prompt generation failed:', error);
    return null;
  }
}

export async function getNextPromptForSession(input: {
  vibeWeights: Prisma.JsonValue | null;
  history: SessionPlayRecord[];
  dbPrompts: QuestionPromptCandidate[];
  playedPromptIds: string[];
}): Promise<{
  prompt: QuestionPromptCandidate;
  source: 'database' | 'generated';
  vibeWeights: Record<string, number>;
}> {
  const weights = parseVibeWeights(input.vibeWeights);
  const playedIds = new Set(input.playedPromptIds);

  const recentPlays = input.history.slice(-3);
  const recentSkips = recentPlays.filter((h) => !h.swipedLeft).length;
  const shouldPivot = recentSkips >= 2;

  if (shouldPivot) {
    const generated = await generatePivotPrompt(weights, input.history);
    if (generated) {
      return {
        prompt: {
          id: `generated-${Date.now()}`,
          text: generated.text,
          category: generated.category,
          tags: generated.tags,
        },
        source: 'generated',
        vibeWeights: weights,
      };
    }
  }

  const fromDb = await selectNextPromptFromDb(
    input.dbPrompts,
    weights,
    playedIds
  );

  if (fromDb) {
    return { prompt: fromDb, source: 'database', vibeWeights: weights };
  }

  const generated = await generatePivotPrompt(weights, input.history);
  if (generated) {
    return {
      prompt: {
        id: `generated-${Date.now()}`,
        text: generated.text,
        category: generated.category,
        tags: generated.tags,
      },
      source: 'generated',
      vibeWeights: weights,
    };
  }

  return {
    prompt: {
      id: 'fallback',
      text: 'What is something you believed five years ago that you no longer believe?',
      category: 'Existential',
      tags: ['reflection', 'growth'],
    },
    source: 'generated',
    vibeWeights: weights,
  };
}
