import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starterPrompts = [
  { text: 'What is a belief you held strongly in college that you have quietly abandoned?', category: 'Existential', tags: ['reflection', 'growth'] },
  { text: 'Which childhood smell instantly transports you back—and to which room?', category: 'Nostalgia', tags: ['memory', 'sensory'] },
  { text: 'If everyone here swapped phones for one hour, what would surprise the group most?', category: 'Scenarios', tags: ['hypothetical', 'funny'] },
  { text: 'Who in this room would you call first with good news—and who with bad news?', category: 'Relationships', tags: ['trust', 'bonds'] },
  { text: 'What is the pettiest hill you are willing to die on at brunch?', category: 'Funny', tags: ['debate', 'light'] },
  { text: 'When did you last cry in front of someone—and what did it cost you?', category: 'Vulnerability', tags: ['emotion', 'honesty'] },
  { text: 'If your life were a movie genre right now, what would the audience yell at the screen?', category: 'Existential', tags: ['meta', 'story'] },
  { text: 'What song would play when you walk into a party where your ex is present?', category: 'Scenarios', tags: ['music', 'awkward'] },
  { text: 'What compliment do you secretly crave but never know how to accept?', category: 'Relationships', tags: ['affirmation', 'self'] },
  { text: 'Which family tradition would you erase without guilt?', category: 'Nostalgia', tags: ['family', 'boundaries'] },
  { text: 'What is the nicest thing you have done that nobody in this room knows about?', category: 'Vulnerability', tags: ['kindness', 'secrets'] },
  { text: 'Would you rather relive one perfect day or erase one terrible one?', category: 'Scenarios', tags: ['choice', 'memory'] },
];

async function main() {
  console.log('🌱 Seeding Hezi prompts...');

  const count = await prisma.questionPrompt.count();
  if (count === 0) {
    for (const prompt of starterPrompts) {
      await prisma.questionPrompt.create({ data: prompt });
    }
    console.log(`✅ Seeded ${starterPrompts.length} prompts`);
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
