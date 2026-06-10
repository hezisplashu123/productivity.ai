import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_VIBE_WEIGHTS,
  applySwipeFeedback,
  applySeedWeights,
  getNextPromptsForProfile,
  parseVibeWeights,
} from './services/ai.service';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Health check for Render Keep-Awake
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

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
        traitProfile: null,
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

  if (!email && !socialId) {
    return res.status(400).json({ error: 'email or socialId is required' });
  }

  try {
    const isGuest = typeof email === 'string' && email.endsWith('@hezi.app') && email.startsWith('guest_');
    const displayName = name || (isGuest ? 'Guest' : 'Player');
    const authProvider = provider || (isGuest ? 'guest' : 'email');

    let user;
    if (socialId) user = await prisma.user.findUnique({ where: { socialId } });
    if (!user && email) user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          socialId: socialId || user.socialId,
          provider: authProvider,
        },
      });
    } else {
      const finalEmail = email || `${socialId}@${authProvider}.com`;
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: displayName,
          provider: authProvider,
          socialId: socialId ?? null,
        },
      });
    }

    const profile = await ensureProfile(user.id);
    const populatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    res.json({
      ...populatedUser,
      profile: populatedUser?.profile ?? profile,
      profileId: populatedUser?.profile?.id ?? profile.id,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync user', details: String(error) });
  }
});

app.get('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

app.delete('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete user' }); }
});

app.post('/profile/ensure', async (req, res) => {
  const { userId, seedWeights } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const profile = await ensureProfile(String(userId), seedWeights);
    res.json(profile);
  } catch (error) { res.status(500).json({ error: 'Failed to ensure profile' }); }
});

// ==========================================
// BATCH PROMPT FETCHING
// ==========================================
app.post('/profile/next-prompt', async (req, res) => {
  const { profileId, count = 2 } = req.body;
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
      prompt: { text: play.prompt.text, category: play.prompt.category, tags: play.prompt.tags },
    }));
    const playedPromptIds = profile.history.map((play) => play.promptId);

    const result = await getNextPromptsForProfile({
      vibeWeights: profile.vibeWeights,
      traitProfile: profile.traitProfile,
      history,
      dbPrompts,
      playedPromptIds,
      count,
    });

    // Save generated prompts to DB to act as history anchors later
    const savedPrompts = await Promise.all(
      result.prompts.map(async (p) => {
        if (p.id.startsWith('generated-') || p.id.startsWith('fallback-')) {
          return await prisma.questionPrompt.create({
            data: { text: p.text, category: p.category, tags: p.tags },
          });
        }
        return p;
      })
    );

    // Save the newly updated AI Character Profile
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { traitProfile: result.updatedTraitProfile },
    });

    res.json({ prompts: savedPrompts, traitProfile: result.updatedTraitProfile });
  } catch (error) {
    console.error('Next prompt error:', error);
    res.status(500).json({ error: 'Failed to get next prompts' });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hezi API listening on port ${PORT}`);
});