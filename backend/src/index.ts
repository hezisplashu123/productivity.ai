import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_VIBE_WEIGHTS,
  applySwipeFeedback,
  applyCategoryBoost,
  getNextPromptForSession,
  parseVibeWeights,
} from './services/ai.service';

const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return code;
}

async function ensureUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const roomCode = generateRoomCode();
    const existing = await prisma.gameSession.findUnique({ where: { roomCode } });
    if (!existing) return roomCode;
  }
  throw new Error('Could not allocate room code');
}

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// --- DATE HELPERS ---
const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (d1: Date, d2: Date) => {
  return normalizeDate(d1).getTime() === normalizeDate(d2).getTime();
};

const isYesterday = (today: Date, past: Date) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(yesterday, past);
};

app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. AUTH SYNC
// ==========================================
app.post('/users/sync', async (req, res) => {
  const { email, name, provider, socialId, onboardingData } = req.body;
  try {
    let user;
    if (socialId) user = await prisma.user.findUnique({ where: { socialId } });
    if (!user && email) user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          socialId: socialId || user.socialId,
          onboardingData: onboardingData || user.onboardingData
        }
      });
    } else {
      const finalEmail = email || `${socialId}@${provider}.com`;
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: name || 'Operative',
          provider: provider || 'email',
          socialId: socialId,
          onboardingData: onboardingData,
          currentStreak: 0,
          lastActiveDate: null
        }
      });
    }
    res.json(user);
  } catch (error) {
    console.error("Sync User Error:", error);
    res.status(500).json({ error: 'Failed to sync user', details: String(error) });
  }
});

// ==========================================
// 2. SOCIAL & SEARCH ROUTES (High Priority)
// ==========================================

// Search Users
app.get('/users/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: { id: true, name: true, currentStreak: true }
    });
    res.json(users);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get Leaderboard
app.get('/leaderboard', async (req, res) => {
  const { mode, userId } = req.query; // mode = 'global' | 'friends'

  try {
    let whereClause = {};

    if (mode === 'friends' && userId && prisma.friendship) {
      const following = await prisma.friendship.findMany({
        where: { 
          followerId: String(userId),
          status: 'ACCEPTED'
        },
        select: { followingId: true }
      });
      
      const friendIds = following.map(f => f.followingId);
      friendIds.push(String(userId)); // Include self

      whereClause = { id: { in: friendIds } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { currentStreak: 'desc' },
      take: 20,
      select: { id: true, name: true, currentStreak: true, onboardingData: true }
    });

    res.json(users.map(u => ({ 
      id: u.id, name: u.name || 'Operative', streak: u.currentStreak, onboardingData: u.onboardingData 
    })));
  } catch (error) {
    console.error("❌ Leaderboard Error:", error);
    res.status(500).json({ error: 'Leaderboard fetch failed' });
  }
});

// Get User Public Profile
app.get('/social/profile/:id', async (req, res) => {
  const { id } = req.params;
  const { viewerId } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { followers: true, following: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let isFollowing = false;
    if (viewerId && prisma.friendship) {
      const friendship = await prisma.friendship.findUnique({
        where: {
          followerId_followingId: {
            followerId: String(viewerId),
            followingId: id
          }
        }
      });
      isFollowing = !!friendship;
    }

    res.json({
      id: user.id,
      name: user.name || 'Operative',
      streak: user.currentStreak,
      stats: {
        hoursFocused: '0.0',
        tasksCrushed: 0,
        sessionsHosted: 0,
      },
      habits: user.onboardingData,
      isFollowing,
      followersCount: user._count.followers
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// Get Friends List
app.get('/social/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (!prisma.friendship) return res.json([]);

    const friends = await prisma.friendship.findMany({
      where: { 
        followerId: userId,
        status: 'ACCEPTED' 
      },
      include: {
        following: {
          select: { id: true, name: true, currentStreak: true }
        }
      }
    });

    res.json(friends.map(f => ({
      id: f.following.id,
      name: f.following.name || 'Operative',
      streak: f.following.currentStreak,
    })));
  } catch (error) {
    console.error("Get Friends Error:", error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get Friend Requests
app.get('/social/requests/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (!prisma.friendship) return res.json([]);

    const requests = await prisma.friendship.findMany({
      where: { 
        followingId: userId, // I am being followed
        status: 'PENDING'
      },
      include: {
        follower: {
          select: { id: true, name: true, currentStreak: true }
        }
      }
    });

    res.json(requests.map(r => ({
      requestId: r.id,
      id: r.follower.id,
      name: r.follower.name || 'Operative',
      streak: r.follower.currentStreak,
    })));
  } catch (error) {
    console.error("Get Requests Error:", error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Send Friend Request
app.post('/social/follow', async (req, res) => {
  const { followerId, followingId } = req.body;
  try {
    if (!prisma.friendship) throw new Error("Friendship table missing");

    const existing = await prisma.friendship.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') return res.json({ status: 'already_friends' });
      return res.json({ status: 'pending' });
    }

    // Create pending request
    await prisma.friendship.create({
      data: { followerId, followingId, status: 'PENDING' }
    });
    
    return res.json({ status: 'requested' });
  } catch (error) {
    console.error("Follow Error:", error);
    res.status(500).json({ error: 'Action failed' });
  }
});

// Respond to Request
app.post('/social/respond', async (req, res) => {
  const { requestId, action } = req.body;
  try {
    if (action === 'accept') {
      // 1. Mark as accepted
      const friendship = await prisma.friendship.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // 2. Create reverse friendship (mutual)
      const reverseExists = await prisma.friendship.findUnique({
        where: { 
          followerId_followingId: { 
            followerId: friendship.followingId, 
            followingId: friendship.followerId 
          } 
        }
      });

      if (!reverseExists) {
        await prisma.friendship.create({
          data: {
            followerId: friendship.followingId,
            followingId: friendship.followerId,
            status: 'ACCEPTED'
          }
        });
      } else {
        await prisma.friendship.update({
            where: { id: reverseExists.id },
            data: { status: 'ACCEPTED' }
        });
      }
      res.json({ success: true, status: 'accepted' });
    } else {
      // Decline: Delete request
      await prisma.friendship.delete({ where: { id: requestId } });
      res.json({ success: true, status: 'declined' });
    }
  } catch (error) {
    console.error("Respond Error:", error);
    res.status(500).json({ error: 'Action failed' });
  }
});

// Report User
app.post('/social/report', async (req, res) => {
  const { reporterId, reportedUserId, reason } = req.body;
  try {
    if (!prisma.report) throw new Error("Report table missing");
    
    await prisma.report.create({
      data: { reporterId, reportedUserId, reason }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ error: 'Report failed' });
  }
});

// ==========================================
// 3. GAME SESSION ROUTES
// ==========================================

app.post('/session/create', async (req, res) => {
  const { hostId } = req.body;
  if (!hostId) return res.status(400).json({ error: 'hostId is required' });

  try {
    const roomCode = await ensureUniqueRoomCode();
    const session = await prisma.gameSession.create({
      data: {
        roomCode,
        hostId: String(hostId),
        vibeWeights: DEFAULT_VIBE_WEIGHTS,
      },
    });
    res.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/session/join', async (req, res) => {
  const { roomCode } = req.body;
  if (!roomCode) return res.status(400).json({ error: 'roomCode is required' });

  try {
    const session = await prisma.gameSession.findUnique({
      where: { roomCode: String(roomCode).toUpperCase().trim() },
    });
    if (!session) return res.status(404).json({ error: 'Room not found' });
    res.json(session);
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

app.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
          take: 40,
          include: { prompt: true },
        },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.post('/session/next-prompt', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        history: {
          orderBy: { timestamp: 'asc' },
          include: { prompt: true },
        },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const dbPrompts = await prisma.questionPrompt.findMany();
    const history = session.history.map((play) => ({
      swipedLeft: play.swipedLeft,
      prompt: { category: play.prompt.category, tags: play.prompt.tags },
    }));
    const playedPromptIds = session.history.map((play) => play.promptId);

    const result = await getNextPromptForSession({
      vibeWeights: session.vibeWeights,
      history,
      dbPrompts,
      playedPromptIds,
    });

    let prompt = result.prompt;
    if (result.source === 'generated' || !dbPrompts.find((p) => p.id === prompt.id)) {
      const created = await prisma.questionPrompt.create({
        data: {
          text: prompt.text,
          category: prompt.category,
          tags: prompt.tags,
        },
      });
      prompt = created;
    }

    res.json({
      prompt,
      vibeWeights: result.vibeWeights,
      source: result.source,
    });
  } catch (error) {
    console.error('Next prompt error:', error);
    res.status(500).json({ error: 'Failed to get next prompt' });
  }
});

app.post('/session/:sessionId/swipe', async (req, res) => {
  const { sessionId } = req.params;
  const { promptId, swipedLeft } = req.body;

  if (!promptId || typeof swipedLeft !== 'boolean') {
    return res.status(400).json({ error: 'promptId and swipedLeft are required' });
  }

  try {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    const prompt = await prisma.questionPrompt.findUnique({ where: { id: promptId } });
    if (!session || !prompt) return res.status(404).json({ error: 'Session or prompt not found' });

    const weights = parseVibeWeights(session.vibeWeights);
    const updatedWeights = applySwipeFeedback(
      weights,
      prompt.category,
      prompt.tags,
      swipedLeft
    );

    const play = await prisma.sessionPlay.create({
      data: { sessionId, promptId, swipedLeft },
    });
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { vibeWeights: updatedWeights },
    });

    res.json({ play, vibeWeights: updatedWeights });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
});

app.post('/session/:sessionId/more-like-this', async (req, res) => {
  const { sessionId } = req.params;
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'category is required' });

  try {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const updatedWeights = applyCategoryBoost(
      parseVibeWeights(session.vibeWeights),
      String(category)
    );

    const updated = await prisma.gameSession.update({
      where: { id: sessionId },
      data: { vibeWeights: updatedWeights },
    });

    res.json({ vibeWeights: updated.vibeWeights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to boost category' });
  }
});

app.post('/session/:sessionId/pivot', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        history: {
          orderBy: { timestamp: 'asc' },
          take: 12,
          include: { prompt: true },
        },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const inverted = Object.fromEntries(
      Object.entries(parseVibeWeights(session.vibeWeights)).map(([k, v]) => [
        k,
        Math.max(0.05, 1 - v),
      ])
    );

    const updated = await prisma.gameSession.update({
      where: { id: sessionId },
      data: { vibeWeights: inverted },
    });

    res.json({ vibeWeights: updated.vibeWeights, pivoted: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pivot session' });
  }
});

// ==========================================
// 5. GENERIC USER ROUTES (LAST!)
// ==========================================

// DELETE User Route
app.delete('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Use transaction to ensure clean delete across related tables
    await prisma.$transaction(async (tx) => {
        // 1. Delete Social Relations
        if (prisma.friendship) {
          await tx.friendship.deleteMany({ 
              where: { OR: [{ followerId: user.id }, { followingId: user.id }] } 
          });
        }
        if (prisma.report) {
          await tx.report.deleteMany({ 
              where: { OR: [{ reporterId: user.id }, { reportedUserId: user.id }] } 
          });
        }

        // 2. Delete User
        await tx.user.delete({ where: { id: user.id } });
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// This wildcard route consumes everything starting with /users/, so it must be last
app.get('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.lastActiveDate && user.currentStreak > 0) {
      const today = new Date();
      const lastActive = new Date(user.lastActiveDate);
      const diffTime = normalizeDate(today).getTime() - normalizeDate(lastActive).getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays > 1) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { currentStreak: 0 },
        });
      }
    }

    res.json({
      ...user,
      goals: [],
      stats: {
        tasksCrushed: 0,
        hoursFocused: '0.0',
        streak: user.currentStreak,
        level: 1,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.patch('/users/:email', async (req, res) => {
    const { email } = req.params;
    try {
      const user = await prisma.user.update({
        where: { email },
        data: req.body
      });
      res.json(user);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ error: 'Update failed' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});