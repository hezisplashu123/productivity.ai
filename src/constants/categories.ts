export type ConversationCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  seedWeights: Record<string, number>;
};

export const CONVERSATION_CATEGORIES: ConversationCategory[] = [
  {
    id: 'deep-talk',
    title: 'Deep Talk',
    subtitle: 'Meaning, identity, and the questions that linger',
    icon: '🌌',
    seedWeights: {
      Existential: 0.95,
      Vulnerability: 0.85,
      Relationships: 0.5,
    },
  },
  {
    id: 'icebreakers',
    title: 'Icebreakers',
    subtitle: 'Low-stakes sparks to warm up the room',
    icon: '✨',
    seedWeights: {
      Funny: 0.9,
      Scenarios: 0.6,
      Nostalgia: 0.4,
    },
  },
  {
    id: 'what-ifs',
    title: 'What Ifs',
    subtitle: 'Hypotheticals that reveal how people think',
    icon: '🎲',
    seedWeights: {
      Scenarios: 0.95,
      Funny: 0.5,
      Existential: 0.35,
    },
  },
  {
    id: 'relationships',
    title: 'Relationships',
    subtitle: 'Trust, chemistry, and the stories between people',
    icon: '💬',
    seedWeights: {
      Relationships: 0.95,
      Vulnerability: 0.7,
      Nostalgia: 0.45,
    },
  },
  {
    id: 'nostalgia',
    title: 'Nostalgia',
    subtitle: 'Memory lanes, old selves, and shared eras',
    icon: '📼',
    seedWeights: {
      Nostalgia: 0.95,
      Relationships: 0.5,
      Funny: 0.35,
    },
  },
  {
    id: 'spicy',
    title: 'Spicy Takes',
    subtitle: 'Playful heat without killing the vibe',
    icon: '🔥',
    seedWeights: {
      Funny: 0.85,
      Scenarios: 0.7,
      Relationships: 0.55,
    },
  },
];

export function getCategoryById(id: string): ConversationCategory | undefined {
  return CONVERSATION_CATEGORIES.find((c) => c.id === id);
}
