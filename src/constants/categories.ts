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

export const PRESET_QUESTIONS: Record<string, string[]> = {
  'deep-talk': [
    "What is a belief you held strongly in college that you have quietly abandoned?",
    "If you could know the absolute, undeniable truth to one question, what would you ask?",
    "What part of your personality do you fake the most for the sake of other people?",
    "When did you last cry in front of someone—and what did it cost you?",
    "What is an insecurity you have that you know is totally irrational?",
    "Who is the one person you owe an apology to, but haven’t given one?",
    "If your life were a movie genre right now, what would the audience yell at the screen?",
    "What is a piece of advice you give to others but constantly struggle to follow yourself?",
    "At what age did you realize your parents were just regular people figuring it out?",
    "What is the nicest thing you have done that nobody in this room knows about?",
    "What is a hard truth you've learned about yourself recently?",
    "If you had to describe your current state of mind in one word, what would it be?",
    "What’s the most important lesson a failure has taught you?",
    "Which relationship in your life has shaped you the most?",
    "What do you think people misunderstand about you the most?"
  ],
  'icebreakers': [
    "What is the pettiest hill you are willing to die on at brunch?",
    "What song would play when you walk into a party where your ex is present?",
    "What is a food that everyone pretends to like but is actually terrible?",
    "Which conspiracy theory do you genuinely believe might be true?",
    "What is the weirdest thing you do when you are completely alone in your house?",
    "If animals could talk, which species would be the rudest?",
    "What is something you pretend to understand but actually have no clue about?",
    "Describe the worst fashion phase you went through in middle or high school.",
    "What is a totally non-physical trait that you find instantly attractive?",
    "What is the most ridiculous reason you’ve ever stopped talking to someone?",
    "If you were arrested with no explanation, what would your friends assume you did?",
    "You have to give a 30-minute TED talk right now with no prep. What is the topic?",
    "What's the weirdest Wikipedia rabbit hole you've fallen down?",
    "What's your most useless talent?",
    "What’s the worst piece of advice you’ve ever received?"
  ],
  'what-ifs': [
    "If everyone here swapped phones for one hour, what would surprise the group most?",
    "Would you rather relive one perfect day or erase one terrible one?",
    "If you had to disappear and start a new life in another country tomorrow, where do you go?",
    "You can pause time for exactly 24 hours. What do you do?",
    "If you could permanently remove one minor inconvenience from your life, what would it be?",
    "What if you found out you were the main character in a Truman Show situation?",
    "If you could have a 10-minute conversation with your future self, what would you ask?",
    "If your pet could talk for 60 seconds, what's the first thing they would say?",
    "What if you had to spend a million dollars in 24 hours but couldn't buy any assets?",
    "If you could master one instrument instantly, which one and what's the first song?",
    "What if humans didn't need sleep? What would you do with your extra 8 hours?",
    "If you could teleport anywhere right now, but couldn't come back for a year, where to?",
    "What if you had a remote that could mute people in real life? Who gets muted first?",
    "If you had to eat one meal for the rest of your life, what is it?",
    "If your entire life was a video game, what would be the hardest boss fight so far?"
  ],
  'relationships': [
    "Who in this room would you call first with good news—and who with bad news?",
    "What compliment do you secretly crave but never know how to accept?",
    "How do you know when a friendship has naturally run its course?",
    "What is the hardest boundary you've had to set with a family member?",
    "What makes you feel instantly safe with a new person?",
    "Who is someone you admire, but would never want to actually be?",
    "What is a red flag you ignored that turned out to be completely accurate?",
    "How has your definition of love changed since you were a teenager?",
    "What is the most difficult conversation you’ve had to have this year?",
    "What trait do you value most in a partner vs. a best friend?",
    "Describe a time you felt completely misunderstood by someone close to you.",
    "What is the biggest sacrifice you've made for someone else?",
    "Do you think people can ever truly change, or just modify their behavior?",
    "What’s a friendship you wish you had maintained better?",
    "When was the last time you felt truly appreciated?"
  ],
  'nostalgia': [
    "Which childhood smell instantly transports you back—and to which room?",
    "Which family tradition would you erase without guilt?",
    "What was your absolute favorite TV show when you were 12 years old?",
    "What was your first ever username or email address?",
    "What is a song that immediately makes you think of your first crush?",
    "What is a distinct memory from recess or the playground?",
    "Which early internet trend or website do you miss the most?",
    "What was the best birthday present you ever received as a kid?",
    "What is a snack that tastes purely like your childhood?",
    "Who was your favorite teacher and why do they stand out?",
    "What was the most dramatic thing that happened in your middle school?",
    "What movie scarred you as a child but is entirely harmless now?",
    "What is a trend you participated in that you now aggressively deny?",
    "What video game holds the most nostalgic value for you?",
    "Think of a family vacation gone wrong. What happened?"
  ],
  'spicy': [
    "What popular movie or TV show is incredibly overrated?",
    "What is a socially acceptable behavior that you think should be banned?",
    "Which celebrity do you genuinely believe is a bad person?",
    "What is a food combination you love that others find disgusting?",
    "Do you think soulmates exist, or is it just timing and proximity?",
    "What is an opinion you hold that would get you 'canceled' on the internet?",
    "Is it ever okay to lie to your partner? When?",
    "What is the most toxic trait you are willing to admit you have?",
    "Do you think men and women can truly just be best friends?",
    "What is the biggest waste of money that everyone seems to buy?",
    "Do you think marriage is an outdated concept?",
    "Which holiday is the absolute worst?",
    "What is a popular piece of life advice that is actually terrible?",
    "Would you ever date a friend’s ex?",
    "What is the most annoying thing about the generation below yours?"
  ]
};

export function getCategoryById(id: string): ConversationCategory | undefined {
  return CONVERSATION_CATEGORIES.find((c) => c.id === id);
}