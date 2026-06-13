import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starterPrompts = [
  // --- EXISTENTIAL (Deep Talk) ---
  { text: 'What is a belief you held strongly in college that you have quietly abandoned?', category: 'Existential', tags: ['reflection', 'growth'] },
  { text: 'If your life were a movie genre right now, what would the audience yell at the screen?', category: 'Existential', tags: ['meta', 'story'] },
  { text: 'If you could know the absolute, undeniable truth to one question, what would you ask?', category: 'Existential', tags: ['truth', 'mystery'] },
  { text: 'What is a piece of advice you give to others but constantly struggle to follow yourself?', category: 'Existential', tags: ['advice', 'hypocrisy'] },
  { text: 'What part of your personality do you fake the most for the sake of other people?', category: 'Existential', tags: ['identity', 'social'] },
  { text: 'At what age did you realize your parents were just regular people figuring it out?', category: 'Existential', tags: ['growing up', 'family'] },

  // --- VULNERABILITY (Relationships / Deep Talk) ---
  { text: 'When did you last cry in front of someone—and what did it cost you?', category: 'Vulnerability', tags: ['emotion', 'honesty'] },
  { text: 'What is the nicest thing you have done that nobody in this room knows about?', category: 'Vulnerability', tags: ['kindness', 'secrets'] },
  { text: 'What is an insecurity you have that you know is totally irrational?', category: 'Vulnerability', tags: ['fear', 'self'] },
  { text: 'Who is the one person you owe an apology to, but haven’t given one?', category: 'Vulnerability', tags: ['regret', 'relationships'] },
  { text: 'What is something you pretend to understand but actually have no clue about?', category: 'Vulnerability', tags: ['honesty', 'funny'] },

  // --- NOSTALGIA ---
  { text: 'Which childhood smell instantly transports you back—and to which room?', category: 'Nostalgia', tags: ['memory', 'sensory'] },
  { text: 'Which family tradition would you erase without guilt?', category: 'Nostalgia', tags: ['family', 'boundaries'] },
  { text: 'What was your absolute favorite TV show when you were 12 years old?', category: 'Nostalgia', tags: ['childhood', 'pop culture'] },
  { text: 'Describe the worst fashion phase you went through in middle or high school.', category: 'Nostalgia', tags: ['regret', 'funny'] },
  { text: 'What was your first ever username or email address?', category: 'Nostalgia', tags: ['cringe', 'internet'] },
  { text: 'What is a song that immediately makes you think of your first crush?', category: 'Nostalgia', tags: ['music', 'romance'] },

  // --- SCENARIOS (What Ifs / Icebreakers) ---
  { text: 'If everyone here swapped phones for one hour, what would surprise the group most?', category: 'Scenarios', tags: ['hypothetical', 'funny'] },
  { text: 'Would you rather relive one perfect day or erase one terrible one?', category: 'Scenarios', tags: ['choice', 'memory'] },
  { text: 'If you had to disappear and start a new life in another country tomorrow, where do you go?', category: 'Scenarios', tags: ['escape', 'travel'] },
  { text: 'You can pause time for exactly 24 hours. What do you do?', category: 'Scenarios', tags: ['superpower', 'fun'] },
  { text: 'If you were arrested with no explanation, what would your friends assume you did?', category: 'Scenarios', tags: ['crime', 'reputation'] },
  { text: 'You have to give a 30-minute TED talk right now with no prep. What is the topic?', category: 'Scenarios', tags: ['passion', 'skills'] },

  // --- RELATIONSHIPS ---
  { text: 'Who in this room would you call first with good news—and who with bad news?', category: 'Relationships', tags: ['trust', 'bonds'] },
  { text: 'What compliment do you secretly crave but never know how to accept?', category: 'Relationships', tags: ['affirmation', 'self'] },
  { text: 'What is a totally non-physical trait that you find instantly attractive?', category: 'Relationships', tags: ['attraction', 'dating'] },
  { text: 'How do you know when a friendship has naturally run its course?', category: 'Relationships', tags: ['boundaries', 'growth'] },
  { text: 'What is the most ridiculous reason you’ve ever stopped talking to someone?', category: 'Relationships', tags: ['petty', 'drama'] },

  // --- WHO'S MOST LIKELY ---
  { text: "Who is most likely to secretly survive a zombie apocalypse because of a weird hyper-fixation?", category: "Who's Most Likely", tags: ['funny', 'scenarios', 'survival'] },
  { text: "Who is most likely to accidentally join a cult because they liked the free snacks?", category: "Who's Most Likely", tags: ['funny', 'gullible', 'social'] },
  { text: "Who is most likely to drop their phone in the toilet and pretend it never happened?", category: "Who's Most Likely", tags: ['clumsy', 'funny', 'secrets'] },
  { text: "Who is most likely to fake their own death to get out of a minor social obligation?", category: "Who's Most Likely", tags: ['introvert', 'funny', 'drastic'] },
  { text: "Who is most likely to win a reality TV show by aggressively manipulating everyone?", category: "Who's Most Likely", tags: ['smart', 'social', 'strategy'] },
  { text: "Who is most likely to get arrested for a crime they committed completely by accident?", category: "Who's Most Likely", tags: ['clumsy', 'funny', 'scenarios'] },

  // --- FUNNY (Spicy Takes / Icebreakers) ---
  { text: 'What is the pettiest hill you are willing to die on at brunch?', category: 'Funny', tags: ['debate', 'light'] },
  { text: 'What song would play when you walk into a party where your ex is present?', category: 'Funny', tags: ['music', 'awkward'] },
  { text: 'What is a food that everyone pretends to like but is actually terrible?', category: 'Funny', tags: ['food', 'opinions'] },
  { text: 'Which conspiracy theory do you genuinely believe might be true?', category: 'Funny', tags: ['wild', 'theories'] },
  { text: 'What is the weirdest thing you do when you are completely alone in your house?', category: 'Funny', tags: ['habits', 'secrets'] },
  { text: 'If animals could talk, which species would be the rudest?', category: 'Funny', tags: ['animals', 'humor'] }
];

async function main() {
  console.log('🌱 Seeding Hezi prompts...');

  const count = await prisma.questionPrompt.count();
  if (count < 35) {
    console.log(`⚠️ Expanding DB prompts...`);
    for (const prompt of starterPrompts) {
      // Avoid duplicates if some already exist
      const exists = await prisma.questionPrompt.findFirst({ where: { text: prompt.text } });
      if (!exists) {
        await prisma.questionPrompt.create({ data: prompt });
      }
    }
    console.log(`✅ Seeded prompts successfully! Game is ready to play.`);
  } else {
    console.log(`ℹ️ ${count} prompts already in DB — skipping seed`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });