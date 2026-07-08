export interface ConversationCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  intensity?: number;
  seedWeights: Record<string, number>;
}

export const VIBE_CATEGORIES: Record<string, ConversationCategory[]> = {
  friendship: [
    { id: 'friends-icebreakers', title: 'Icebreakers', subtitle: 'Hot takes and instant debates', icon: '✨', intensity: 2, seedWeights: { Funny: 0.9, Scenarios: 0.6 } },
    { id: 'friends-most-likely', title: "Most Likely", subtitle: 'Point fingers and roast each other', icon: '🎯', intensity: 5, seedWeights: { Funny: 0.85, Relationships: 0.7 } },
    { id: 'friends-what-ifs', title: 'What Ifs', subtitle: 'Absurd choices and moral chaos', icon: '🎲', intensity: 8, seedWeights: { Scenarios: 0.95, Funny: 0.5 } },
    { id: 'friends-nostalgia', title: 'Nostalgia', subtitle: 'Cringe eras and teenage toxicity', icon: '📼', intensity: 11, seedWeights: { Nostalgia: 0.95, Relationships: 0.5 } },
    { id: 'friends-confessions', title: 'Confessions', subtitle: 'Call yourself out on your BS', icon: '🔥', intensity: 15, seedWeights: { Vulnerability: 0.85, Funny: 0.7 } },
    { id: 'friends-deep-talk', title: 'Deep Talk', subtitle: 'Existential dread and raw honesty', icon: '🌌', intensity: 18, seedWeights: { Existential: 0.95, Vulnerability: 0.85 } },
  ],
  relationship: [
    { id: 'lovers-warm-up', title: 'Warm Up', subtitle: 'Light, teasing observations', icon: '✨', intensity: 3, seedWeights: { Funny: 0.8, Scenarios: 0.5 } },
    { id: 'lovers-spicy', title: 'Spicy', subtitle: 'Physical tension and butterflies', icon: '🔥', intensity: 6, seedWeights: { Funny: 0.8, Relationships: 0.8 } },
    { id: 'lovers-what-ifs', title: 'What Ifs', subtitle: 'Us against the world realities', icon: '🎲', intensity: 9, seedWeights: { Scenarios: 0.95, Relationships: 0.6 } },
    { id: 'lovers-nostalgia', title: 'Nostalgia', subtitle: 'First impressions and the talking phase', icon: '📼', intensity: 12, seedWeights: { Nostalgia: 0.9, Relationships: 0.8 } },
    { id: 'lovers-connection', title: 'Connection', subtitle: 'How we function as a team', icon: '💬', intensity: 14, seedWeights: { Relationships: 0.95, Vulnerability: 0.7 } },
    { id: 'lovers-deep-talk', title: 'Deep Talk', subtitle: 'Vulnerability and future fears', icon: '🌌', intensity: 17, seedWeights: { Existential: 0.9, Vulnerability: 0.9 } },
  ],
  family: [
    { id: 'family-icebreakers', title: 'Icebreakers', subtitle: 'Easy questions for the table', icon: '✨', intensity: 1, seedWeights: { Funny: 0.9, Scenarios: 0.5 } },
    { id: 'family-most-likely', title: 'Most Likely', subtitle: 'Gentle teasing and grudges', icon: '🎯', intensity: 4, seedWeights: { Funny: 0.8, Relationships: 0.7 } },
    { id: 'family-what-ifs', title: 'What Ifs', subtitle: 'Absurd situations together', icon: '🎲', intensity: 7, seedWeights: { Scenarios: 0.9, Funny: 0.6 } },
    { id: 'family-nostalgia', title: 'Nostalgia', subtitle: 'House rules and funny disasters', icon: '📼', intensity: 10, seedWeights: { Nostalgia: 0.95, Funny: 0.5 } },
    { id: 'family-perspectives', title: 'Perspectives', subtitle: 'Bridging the generational gap', icon: '💬', intensity: 13, seedWeights: { Relationships: 0.8, Nostalgia: 0.7 } },
    { id: 'family-deep-talk', title: 'Deep Talk', subtitle: 'Wisdom, regrets, and reflections', icon: '🌌', intensity: 16, seedWeights: { Existential: 0.9, Vulnerability: 0.6 } },
  ]
};