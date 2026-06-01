import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock data with varying streaks to trigger different tiers
const mockUsers =[
  // Legends (30+ days)
  { email: 'legend1@test.com', name: 'David Kim', currentStreak: 42 },
  { email: 'legend2@test.com', name: 'Elena R.', currentStreak: 35 },
  
  // Elites (14-29 days)
  { email: 'elite1@test.com', name: 'Marcus T.', currentStreak: 28 },
  { email: 'elite2@test.com', name: 'Sarah Jenkins', currentStreak: 19 },
  
  // Veterans (7-13 days)
  { email: 'vet1@test.com', name: 'James Wilson', currentStreak: 12 },
  { email: 'vet2@test.com', name: 'Priya Patel', currentStreak: 8 },
  
  // Agents (3-6 days)
  { email: 'agent1@test.com', name: 'Michael B.', currentStreak: 5 },
  
  // Recruits (0-2 days)
  { email: 'recruit1@test.com', name: 'Emma W.', currentStreak: 2 },
];

const starterPrompts = [
  { text: 'What is a belief you held strongly in college that you have quietly abandoned?', category: 'Existential', tags: ['reflection', 'growth'] },
  { text: 'Which childhood smell instantly transports you back—and to which room?', category: 'Nostalgia', tags: ['memory', 'sensory'] },
  { text: 'If everyone in this room swapped phones for one hour, what scandal would break first?', category: 'Scenarios', tags: ['hypothetical', 'funny'] },
  { text: 'Who here do you trust with a secret that could change your reputation?', category: 'Relationships', tags: ['trust', 'vulnerability'] },
  { text: 'What is the pettiest hill you are willing to die on at brunch?', category: 'Funny', tags: ['debate', 'light'] },
  { text: 'When did you last cry in front of someone—and what did it cost you?', category: 'Vulnerability', tags: ['emotion', 'honesty'] },
  { text: 'If your life were a movie genre right now, what would the audience yell at the screen?', category: 'Existential', tags: ['meta', 'story'] },
  { text: 'What song would play when you walk into a party where your ex is present?', category: 'Scenarios', tags: ['music', 'awkward'] },
  { text: 'What compliment do you secretly crave but never know how to accept?', category: 'Relationships', tags: ['affirmation', 'self'] },
  { text: 'Which family tradition would you erase without guilt?', category: 'Nostalgia', tags: ['family', 'boundaries'] },
];

async function main() {
  console.log('🌱 Starting database seed...');

  const existingPrompts = await prisma.questionPrompt.count();
  if (existingPrompts === 0) {
    for (const prompt of starterPrompts) {
      await prisma.questionPrompt.create({ data: prompt });
    }
    console.log(`✅ Seeded ${starterPrompts.length} conversation prompts`);
  }

  // 1. Create the mock users
  for (const u of mockUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        currentStreak: u.currentStreak,
        name: u.name,
      },
      create: {
        email: u.email,
        name: u.name,
        password: 'password123',
        currentStreak: u.currentStreak,
      },
    });
  }
  console.log('✅ Created mock leaderboard users!');

  // 2. Update YOUR specific account
  // ⚠️ CHANGE THIS TO THE EMAIL YOU ARE LOGGED IN WITH ON YOUR PHONE ⚠️
  const myEmail = 'yashrajput1114@gmail.com'; 
  
  try {
    const me = await prisma.user.findUnique({ where: { email: myEmail } });
    if (me) {
      await prisma.user.update({
        where: { email: myEmail },
        data: { currentStreak: 24 } // 24 puts you right in the middle (Elite tier)
      });
      console.log(`✅ Updated your account (${myEmail}) to a 24-day streak!`);
    } else {
      console.log(`⚠️ Could not find your account (${myEmail}). Make sure the email matches exactly!`);
    }
  } catch (error) {
    console.log('⚠️ Error updating your personal account. Did you change the email string?');
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });