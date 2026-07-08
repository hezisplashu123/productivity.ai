import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  DEFAULT_VIBE_WEIGHTS,
  applySwipeFeedback,
  applySeedWeights,
  getNextPromptsForProfile,
  parseVibeWeights,
} from '../services/ai.service';

export async function ensureProfile(userId: string, seedWeights?: Record<string, number>, ageRange?: string) {
  let profile = await prisma.userProfile.findUnique({ where: { userId } });
  
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        userId,
        vibeWeights: seedWeights ? applySeedWeights(seedWeights) : DEFAULT_VIBE_WEIGHTS,
        traitProfile: null,
        ageRange: ageRange || null,
      },
    });
  } else if (ageRange && profile.ageRange !== ageRange) {
    // Update age range if provided and different
    profile = await prisma.userProfile.update({
      where: { userId },
      data: { ageRange }
    });
  }
  return profile;
}

export async function ensureProfileHandler(req: Request, res: Response) {
  const { userId, seedWeights, ageRange } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const profile = await ensureProfile(String(userId), seedWeights, ageRange);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ensure profile' });
  }
}

export async function getNextPrompt(req: Request, res: Response) {
  const { profileId, gamemode = 'friendship', categoryId = 'friends-deep-talk', count = 5, playerCount = 3 } = req.body;
  if (!profileId) return res.status(400).json({ error: 'profileId is required' });

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
          take: 200,
          include: { prompt: true },
        },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (gamemode === 'relationship' && profile.ageRange === 'Under 18') {
      return res.status(403).json({ error: 'Lovers gamemode is not available for Under 18 profiles.' });
    }

    // 🔒 BULLETPROOF FIX: We ONLY ask the database for questions that match the exact gamemode. 
    // It is now physically impossible for a Family question to enter a Friends queue.
    const dbPrompts = await prisma.questionPrompt.findMany({
      where: { gamemode: gamemode }
    });
    
    const history = profile.history.reverse().map((play) => ({
      answered: play.answered,
      prompt: { text: play.prompt.text, category: play.prompt.category, mechanics: play.prompt.mechanics, tone: play.prompt.tone },
    }));
    const playedPromptIds = profile.history.map((play) => play.promptId);

    const result = await getNextPromptsForProfile({
      vibeWeights: profile.vibeWeights,
      history,
      dbPrompts,
      playedPromptIds,
      gamemode,
      categoryId,
      count,
      playerCount,
      ageRange: profile.ageRange,
    });

    const savedPrompts = (await Promise.all(
      result.prompts.map(async (p) => {
        if (p.id.startsWith('generated-') || p.id.startsWith('fallback-')) {
          const isDuplicate = dbPrompts.some(dbP => dbP.text === p.text);
          const isValid = p.text.length >= 10 && !p.text.toLowerCase().startsWith('here are');
          if (isDuplicate || !isValid) return null;

          return await prisma.questionPrompt.create({
            data: { 
              text: p.text, 
              category: result.config.title, 
              gamemode: gamemode,
              mechanics: p.mechanics,
              tone: p.tone
            }, 
          });
        }
        return p;
      })
    )).filter((p) => p !== null);

    res.json({ prompts: savedPrompts });
  } catch (error) {
    console.error('Next prompt error:', error);
    res.status(500).json({ error: 'Failed to get next prompts' });
  }
}

export async function recordSwipe(req: Request, res: Response) {
  const { profileId } = req.params;
  const { promptId, answered } = req.body;

  if (!promptId || typeof answered !== 'boolean') {
    return res.status(400).json({ error: 'promptId and answered are required' });
  }

  try {
    const profile = await prisma.userProfile.findUnique({ 
      where: { id: profileId },
      include: { _count: { select: { history: true } } }
    });
    const prompt = await prisma.questionPrompt.findUnique({ where: { id: promptId } });
    if (!profile || !prompt) return res.status(404).json({ error: 'Profile or prompt not found' });

    const historyLength = profile._count.history;

    const updatedWeights = applySwipeFeedback(
      parseVibeWeights(profile.vibeWeights),
      prompt.category,
      prompt.mechanics,
      prompt.tone,
      answered,
      historyLength
    );

    const play = await prisma.promptPlay.create({
      data: { profileId, promptId, answered },
    });
    
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { vibeWeights: updatedWeights },
    });

    res.json({ play, vibeWeights: updatedWeights });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
}

export async function resetWeights(req: Request, res: Response) {
  const { profileId } = req.params;
  const { seedWeights } = req.body;
  try {
    const weights = seedWeights ? applySeedWeights(seedWeights) : DEFAULT_VIBE_WEIGHTS;
    const profile = await prisma.userProfile.update({
      where: { id: profileId },
      data: { vibeWeights: weights },
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset weights' });
  }
}