export interface ConversationCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  seedWeights: Record<string, number>;
}

export const VIBE_CATEGORIES: Record<string, ConversationCategory[]> = {
  friendship: [
    { id: 'friends-icebreakers', title: 'Icebreakers', subtitle: 'Low-stakes sparks to warm up the room', icon: '✨', seedWeights: { Funny: 0.9, Scenarios: 0.6 } },
    { id: 'friends-most-likely', title: "Who's Most Likely", subtitle: 'Point fingers and state your case', icon: '🎯', seedWeights: { Funny: 0.85, Relationships: 0.7 } },
    { id: 'friends-what-ifs', title: 'What Ifs', subtitle: 'Hypotheticals that reveal how you think', icon: '🎲', seedWeights: { Scenarios: 0.95, Funny: 0.5 } },
    { id: 'friends-nostalgia', title: 'Nostalgia', subtitle: 'Memory lanes and shared eras', icon: '📼', seedWeights: { Nostalgia: 0.95, Relationships: 0.5 } },
    { id: 'friends-deep-talk', title: 'Deep Talk', subtitle: 'Identity, fears, and the real stuff', icon: '🌌', seedWeights: { Existential: 0.95, Vulnerability: 0.85 } },
    { id: 'friends-spicy', title: 'Spicy Takes', subtitle: 'Playful heat without killing the vibe', icon: '🔥', seedWeights: { Funny: 0.85, Scenarios: 0.7 } },
  ],
  relationship: [
    { id: 'lovers-warm-up', title: 'Warm Up', subtitle: 'Light questions to get talking', icon: '✨', seedWeights: { Funny: 0.8, Scenarios: 0.5 } },
    { id: 'lovers-our-story', title: 'Our Story', subtitle: 'Looking back at how it started', icon: '📼', seedWeights: { Nostalgia: 0.9, Relationships: 0.8 } },
    { id: 'lovers-us-talk', title: 'The "Us" Talk', subtitle: 'Love, trust, and connection', icon: '💬', seedWeights: { Relationships: 0.95, Vulnerability: 0.7 } },
    { id: 'lovers-deep-talk', title: 'Deep Talk', subtitle: 'Fears, dreams, and meaning', icon: '🌌', seedWeights: { Existential: 0.9, Vulnerability: 0.9 } },
    { id: 'lovers-spicy', title: 'Spicy Takes', subtitle: 'A little heat for the two of you', icon: '🔥', seedWeights: { Funny: 0.8, Scenarios: 0.8 } },
    { id: 'lovers-what-ifs', title: 'What Ifs', subtitle: 'Alternate realities together', icon: '🎲', seedWeights: { Scenarios: 0.95, Relationships: 0.6 } },
  ],
  family: [
    { id: 'family-icebreakers', title: 'Icebreakers', subtitle: 'Easy questions for the table', icon: '✨', seedWeights: { Funny: 0.9, Scenarios: 0.5 } },
    { id: 'family-growing-up', title: 'Growing Up', subtitle: 'Childhood memories and nostalgia', icon: '📼', seedWeights: { Nostalgia: 0.95, Funny: 0.5 } },
    { id: 'family-dynamics', title: 'Family Dynamics', subtitle: "Who's most likely to...", icon: '🎯', seedWeights: { Funny: 0.8, Relationships: 0.7 } },
    { id: 'family-life-lessons', title: 'Life Lessons', subtitle: 'Wisdom, regrets, and growth', icon: '🌌', seedWeights: { Existential: 0.9, Vulnerability: 0.6 } },
    { id: 'family-what-ifs', title: 'What Ifs', subtitle: 'Hypothetical family scenarios', icon: '🎲', seedWeights: { Scenarios: 0.9, Funny: 0.6 } },
    { id: 'family-generational', title: 'Generational', subtitle: 'Bridging the age gap', icon: '💬', seedWeights: { Relationships: 0.8, Nostalgia: 0.7 } },
  ]
};

export const PRESET_QUESTIONS: Record<string, string[]> = {
  // Friends
  'friends-icebreakers': ["What is the pettiest hill you are willing to die on?", "What song would play when you walk into a party?", "What food does everyone pretend to like?"],
  'friends-most-likely': ["Who is most likely to secretly survive a zombie apocalypse?", "Who is most likely to accidentally join a cult?", "Who is most likely to drop their phone in the toilet?"],
  'friends-what-ifs': ["If you had to disappear and start a new life, where do you go?", "You can pause time for 24 hours. What do you do?", "If everyone swapped phones for an hour, what would surprise us?"],
  'friends-nostalgia': ["What childhood smell instantly transports you back?", "What was your absolute favorite TV show when you were 12?", "What was your first ever username?"],
  'friends-deep-talk': ["What is a belief you held strongly that you have quietly abandoned?", "When did you last cry in front of someone?", "What part of your personality do you fake the most?"],
  'friends-spicy': ["What popular movie is incredibly overrated?", "What socially acceptable behavior should be banned?", "What opinion would get you 'canceled'?"],
  
  // Lovers
  'lovers-warm-up': ["What's a weird habit of mine that you secretly find endearing?", "If we could teleport to any restaurant right now, where are we going?", "What was your exact first impression of me?"],
  'lovers-our-story': ["What is a small, random moment from early in our relationship that you still think about?", "When did you realize you were falling for me?", "What was the most nerve-wracking part of our first few dates?"],
  'lovers-us-talk': ["What makes you feel the most loved by me?", "In what way do you think we balance each other out perfectly?", "What is something you want us to be better at together?"],
  'lovers-deep-talk': ["What is an insecurity you have that I can help soothe?", "What is a dream you have that you rarely talk about?", "How has your definition of love changed since we met?"],
  'lovers-spicy': ["What is a movie scene that permanently rewired your brain?", "What is something I do innocently that you find extremely attractive?", "What is a completely non-physical trait that gets you?"],
  'lovers-what-ifs': ["If we had to quit our jobs and open a business together, what is it?", "If we were characters in a horror movie, how far do we make it?", "If we had to live in a different decade, which one fits our vibe best?"],

  // Family
  'family-icebreakers': ["If our family was a TV sitcom, what would the title be?", "Who in the family has the worst driving skills?", "What is a food that always reminds you of home?"],
  'family-growing-up': ["What is the most ridiculous thing you believed as a kid?", "What was the strictest rule in the house growing up?", "Which family vacation was an absolute disaster at the time, but funny now?"],
  'family-dynamics': ["Who is most likely to give completely unsolicited advice?", "Who is most likely to keep a secret from everyone else?", "Who is most likely to win in a ruthless game of Monopoly?"],
  'family-life-lessons': ["What is a piece of advice you ignored when you were younger, but now realize was right?", "What is the hardest lesson you've had to learn the hard way?", "What is something you wish you started doing earlier in life?"],
  'family-what-ifs': ["If our family had to win a talent show, what is our act?", "If you could witness any moment from family history before you were born, what would it be?", "If money was no object, what kind of family compound would we build?"],
  'family-generational': ["What is a slang word or trend from today that makes absolutely zero sense to you?", "What did you get away with as a teen that teens today could never do?", "What is one thing you think my generation actually got right?"]
};