import * as dotenv from 'dotenv';
dotenv.config();
import { getNextPromptsForProfile, CategoryConfig } from './src/services/ai.service';
import { PrismaClient } from '@prisma/client';

const config: CategoryConfig = {
  title: 'Icebreakers',
  dbCategories: ['Icebreakers'],
  rules: 'Focus hot takes on modern social etiquette.',
  formatRequirement: 'Ask for a highly specific hot take.',
  bannedConcepts: 'No boring pet peeves.',
  fallback: 'Fallback prompt?'
};

async function testGeneration() {
  console.log('Running AI generation test...');
  const result = await getNextPromptsForProfile({
    vibeWeights: { "specific_instance": 0.9, "humor_forward": 0.8 },
    history: [
      { answered: true, prompt: { text: "What's an instant dealbreaker on a date?", category: "Icebreakers", mechanics: ["specific_instance"], tone: "playful" } },
      { answered: true, prompt: { text: "Who is most likely to fake their death to avoid a group chat?", category: "Most Likely", mechanics: ["humor_forward", "social_ranking"], tone: "chaotic" } }
    ],
    dbPrompts: [], // Force AI generation
    playedPromptIds: [],
    gamemode: 'friendship',
    categoryId: 'friends-icebreakers',
    playerCount: 4,
    ageRange: '22-25',
    count: 2
  });

  console.log('RESULT:');
  console.log(JSON.stringify(result, null, 2));
}

testGeneration().catch(console.error);
