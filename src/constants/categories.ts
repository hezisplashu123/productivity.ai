export interface ConversationCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  seedWeights: Record<string, number>;
}

export const VIBE_CATEGORIES: Record<string, ConversationCategory[]> = {
  friendship: [
    { id: 'friends-icebreakers', title: 'Icebreakers', subtitle: 'Hot takes and instant debates', icon: '✨', seedWeights: { Funny: 0.9, Scenarios: 0.6 } },
    { id: 'friends-most-likely', title: "Most Likely", subtitle: 'Point fingers and roast each other', icon: '🎯', seedWeights: { Funny: 0.85, Relationships: 0.7 } },
    { id: 'friends-what-ifs', title: 'What Ifs', subtitle: 'Absurd choices and moral chaos', icon: '🎲', seedWeights: { Scenarios: 0.95, Funny: 0.5 } },
    { id: 'friends-nostalgia', title: 'Nostalgia', subtitle: 'Cringe eras and teenage toxicity', icon: '📼', seedWeights: { Nostalgia: 0.95, Relationships: 0.5 } },
    { id: 'friends-confessions', title: 'Confessions', subtitle: 'Call yourself out on your BS', icon: '🔥', seedWeights: { Vulnerability: 0.85, Funny: 0.7 } },
    { id: 'friends-deep-talk', title: 'Deep Talk', subtitle: 'Existential dread and raw honesty', icon: '🌌', seedWeights: { Existential: 0.95, Vulnerability: 0.85 } },
  ],
  relationship: [
    { id: 'lovers-warm-up', title: 'Warm Up', subtitle: 'Light, teasing observations', icon: '✨', seedWeights: { Funny: 0.8, Scenarios: 0.5 } },
    { id: 'lovers-spicy', title: 'Spicy', subtitle: 'Physical tension and butterflies', icon: '🔥', seedWeights: { Funny: 0.8, Relationships: 0.8 } },
    { id: 'lovers-what-ifs', title: 'What Ifs', subtitle: 'Us against the world realities', icon: '🎲', seedWeights: { Scenarios: 0.95, Relationships: 0.6 } },
    { id: 'lovers-nostalgia', title: 'Nostalgia', subtitle: 'First impressions and the talking phase', icon: '📼', seedWeights: { Nostalgia: 0.9, Relationships: 0.8 } },
    { id: 'lovers-connection', title: 'Connection', subtitle: 'How we function as a team', icon: '💬', seedWeights: { Relationships: 0.95, Vulnerability: 0.7 } },
    { id: 'lovers-deep-talk', title: 'Deep Talk', subtitle: 'Vulnerability and future fears', icon: '🌌', seedWeights: { Existential: 0.9, Vulnerability: 0.9 } },
  ],
  family: [
    { id: 'family-icebreakers', title: 'Icebreakers', subtitle: 'Easy questions for the table', icon: '✨', seedWeights: { Funny: 0.9, Scenarios: 0.5 } },
    { id: 'family-most-likely', title: 'Most Likely', subtitle: 'Gentle teasing and grudges', icon: '🎯', seedWeights: { Funny: 0.8, Relationships: 0.7 } },
    { id: 'family-what-ifs', title: 'What Ifs', subtitle: 'Absurd situations together', icon: '🎲', seedWeights: { Scenarios: 0.9, Funny: 0.6 } },
    { id: 'family-nostalgia', title: 'Nostalgia', subtitle: 'House rules and funny disasters', icon: '📼', seedWeights: { Nostalgia: 0.95, Funny: 0.5 } },
    { id: 'family-perspectives', title: 'Perspectives', subtitle: 'Bridging the generational gap', icon: '💬', seedWeights: { Relationships: 0.8, Nostalgia: 0.7 } },
    { id: 'family-deep-talk', title: 'Deep Talk', subtitle: 'Wisdom, regrets, and reflections', icon: '🌌', seedWeights: { Existential: 0.9, Vulnerability: 0.6 } },
  ]
};

// These are the exact 10/10 questions you picked!
export const PRESET_QUESTIONS: Record<string, string[]> = {
  // Friends
  'friends-icebreakers': [
    "What is a massive 'red flag' in a person that you actually find highly attractive?", 
    "What is a common piece of advice that is actually complete garbage?", 
    "What is a normal human behavior that immediately makes you lose respect for someone?"
  ],
  'friends-most-likely': [
    "Who is most likely to seamlessly lie their way into a VIP section and leave the rest of us outside?", 
    "Who is most likely to date an absolutely terrible person just because they think they can 'fix' them?", 
    "Who is most likely to ruin their own life just out of pure boredom?"
  ],
  'friends-what-ifs': [
    "If you had a button that gave you $1 million but permanently ruined the life of someone you went to high school with, how many times do you press it?", 
    "If you were on trial for a crime you actually committed, which friend in this room are you trusting to be your lawyer?", 
    "If you had to read one person's mind in this room for exactly 60 seconds, whose mind would destroy your feelings the most?"
  ],
  'friends-nostalgia': [
    "What is the most undeniably toxic thing you did in your first real relationship?", 
    "What is the most elaborate, unhinged lie you consistently told your parents in high school?", 
    "Who is a person from your past that everyone hated, but you secretly kind of liked?"
  ],
  'friends-confessions': [
    "What is a terrible trait you have that you secretly judge other people for having?", 
    "Which friend's ex were you secretly rooting against the entire time they were together?", 
    "What is a boundary you pretend to be strict about, but you constantly let people cross?"
  ],
  'friends-deep-talk': [
    "Are you actually a good person, or are you just terrified of people being mad at you?", 
    "What is a painful truth about yourself that took you way too long to finally accept?", 
    "What part of your personality do you fake the most for the sake of other people?"
  ],
  
  // Lovers
  'lovers-warm-up': [
    "What is a weird, highly specific habit of mine that you secretly love?", 
    "If we could teleport to any restaurant right now, where are we eating?",
    "What was the most nerve-wracking part of our first few dates?"
  ],
  'lovers-spicy': [
    "What was the exact moment you first felt physical tension between us?", 
    "What is a completely non-physical thing I do that turns you on?",
    "What is something I do innocently that you find extremely attractive?"
  ],
  'lovers-what-ifs': [
    "If we had to fake our deaths and move to another country, what would our new jobs be?", 
    "If we were dropped into a horror movie, how far do we make it and who dies first?",
    "If we had to drop everything and open a business together tomorrow, what would it be?"
  ],
  'lovers-nostalgia': [
    "What was your exact first thought the very first time you saw me?",
    "What is a small, random moment from early in our relationship that you still think about?",
    "What is a movie scene that permanently rewired your brain romantically?"
  ],
  'lovers-connection': [
    "What is something I do to show love that you think I don't realize I'm doing?", 
    "In what highly specific way do you think we balance each other out perfectly?",
    "What makes you feel the most loved by me?"
  ],
  'lovers-deep-talk': [
    "What is a fear you have about our future that you rarely say out loud?", 
    "How has your actual definition of love changed since you met me?",
    "What is an insecurity you have that I can help soothe?"
  ],

  // Family
  'family-icebreakers': [
    "If our family was a reality TV show, what would the title be?", 
    "What is a food that always tastes exactly like 'home' to you?",
    "Who in the family has the absolute worst driving skills?"
  ],
  'family-most-likely': [
    "Who is most likely to bring up a 10-year-old argument at Thanksgiving dinner?", 
    "Who is most likely to give completely unsolicited advice?",
    "Who is most likely to keep a secret from everyone else?"
  ],
  'family-what-ifs': [
    "If our family had to win a talent show to save the world, what is our act?", 
    "If money was no object, what kind of ridiculous family compound would we build?",
    "If you could witness any moment from family history before you were born, what would it be?"
  ],
  'family-nostalgia': [
    "Which family vacation was an absolute disaster at the time, but hilarious now?", 
    "What was the absolute strictest, most weird rule we had in our house growing up?",
    "What is the most ridiculous thing you believed as a kid?"
  ],
  'family-perspectives': [
    "What is a slang word or trend from today that makes absolutely zero sense to you?", 
    "What is something you think my generation actually got right?",
    "What did you get away with as a teen that teens today could never do?"
  ],
  'family-deep-talk': [
    "What is a life lesson you had to learn the hard way so I wouldn't have to?", 
    "What is something you wish you started doing much earlier in your life?",
    "What is a piece of advice you ignored when you were younger, but now realize was right?"
  ]
};