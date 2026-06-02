import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_VIBE_WEIGHTS,
  applySwipeFeedback,
  applySeedWeights,
  getNextPromptForProfile,
  invertWeights,
  parseVibeWeights,
} from './services/ai.service';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

async function ensureProfile(userId: string, seedWeights?: Record<string, number>) {
  let profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        userId,
        vibeWeights: seedWeights ? applySeedWeights(seedWeights) : DEFAULT_VIBE_WEIGHTS,
      },
    });
  }
  return profile;
}

// ==========================================
// AUTH
// ==========================================
app.post('/users/sync', async (req, res) => {
  const { email, name, provider, socialId } = req.body;
  try {
    let user;
    if (socialId) user = await prisma.user.findUnique({ where: { socialId } });
    if (!user && email) user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name || user.name, socialId: socialId || user.socialId },
      });
    } else {
      const finalEmail = email || `${socialId}@${provider}.com`;
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: name || 'Player',
          provider: provider || 'email',
          socialId: socialId,
        },
      });
    }

    await ensureProfile(user.id);
    res.json(user);
  } catch (error) {
    console.error('Sync User Error:', error);
    res.status(500).json({ error: 'Failed to sync user', details: String(error) });
  }
});

app.get('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.delete('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// PROFILE & PROMPTS
// ==========================================
app.post('/profile/ensure', async (req, res) => {
  const { userId, seedWeights } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const profile = await ensureProfile(String(userId), seedWeights);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ensure profile' });
  }
});

app.post('/profile/next-prompt', async (req, res) => {
  const { profileId, forcePivot } = req.body;
  if (!profileId) return res.status(400).json({ error: 'profileId is required' });

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      include: {
        history: {
          orderBy: { timestamp: 'asc' },
          include: { prompt: true },
        },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const dbPrompts = await prisma.questionPrompt.findMany();
    const history = profile.history.map((play) => ({
      swipedLeft: play.swipedLeft,
      prompt: { category: play.prompt.category, tags: play.prompt.tags },
    }));
    const playedPromptIds = profile.history.map((play) => play.promptId);

    const result = await getNextPromptForProfile({
      vibeWeights: profile.vibeWeights,
      history,
      dbPrompts,
      playedPromptIds,
      forcePivot: Boolean(forcePivot),
    });

    let prompt = result.prompt;
    if (result.source === 'generated' || !dbPrompts.find((p) => p.id === prompt.id)) {
      prompt = await prisma.questionPrompt.create({
        data: {
          text: prompt.text,
          category: prompt.category,
          tags: prompt.tags,
        },
      });
    }

    res.json({ prompt, vibeWeights: result.vibeWeights, source: result.source });
  } catch (error) {
    console.error('Next prompt error:', error);
    res.status(500).json({ error: 'Failed to get next prompt' });
  }
});

app.post('/profile/:profileId/swipe', async (req, res) => {
  const { profileId } = req.params;
  const { promptId, swipedLeft } = req.body;

  if (!promptId || typeof swipedLeft !== 'boolean') {
    return res.status(400).json({ error: 'promptId and swipedLeft are required' });
  }

  try {
    const profile = await prisma.userProfile.findUnique({ where: { id: profileId } });
    const prompt = await prisma.questionPrompt.findUnique({ where: { id: promptId } });
    if (!profile || !prompt) return res.status(404).json({ error: 'Profile or prompt not found' });

    const updatedWeights = applySwipeFeedback(
      parseVibeWeights(profile.vibeWeights),
      prompt.category,
      prompt.tags,
      swipedLeft
    );

    const play = await prisma.promptPlay.create({
      data: { profileId, promptId, swipedLeft },
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
});

app.post('/profile/:profileId/reset-weights', async (req, res) => {
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
});

app.post('/profile/:profileId/pivot', async (req, res) => {
  const { profileId } = req.params;
  try {
    const profile = await prisma.userProfile.findUnique({ where: { id: profileId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const inverted = invertWeights(parseVibeWeights(profile.vibeWeights));
    const updated = await prisma.userProfile.update({
      where: { id: profileId },
      data: { vibeWeights: inverted },
    });
    res.json({ vibeWeights: updated.vibeWeights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pivot' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hezi API listening on port ${PORT}`);
});
