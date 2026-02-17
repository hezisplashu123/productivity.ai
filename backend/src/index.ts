import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { 
  generateActionPlan, 
  generateClarifyingQuestion, 
  refineSingleTask,
  analyzeGoalType,
  generateDailyPlan
} from './services/ai.service';

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
        goals: { select: { tasks: true } },
        _count: { select: { followers: true, following: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let totalMinutes = 0;
    let tasksCompleted = 0;
    user.goals.forEach(g => {
      g.tasks.forEach(t => {
        if (t.status === 'completed') {
          totalMinutes += t.duration;
          tasksCompleted++;
        }
      });
    });

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
        hoursFocused: (totalMinutes / 60).toFixed(1),
        tasksCrushed: tasksCompleted,
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
// 3. AI ROUTES
// ==========================================
app.post('/ai/analyze-goal', async (req, res) => {
  const { goal, clarification, question } = req.body;
  try {
    const analysis = await analyzeGoalType(goal, question || "", clarification || "");
    res.json(analysis);
  } catch (error) { res.status(500).json({ error: 'Analysis failed' }); }
});
app.post('/ai/clarify', async (req, res) => {
  const { email, goal } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const question = await generateClarifyingQuestion(goal, user);
    res.json({ question });
  } catch (error) { res.status(500).json({ error: 'Clarification failed' }); }
});
app.post('/ai/generate-plan', async (req, res) => {
  const { email, goal, clarification, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await generateActionPlan(goal, user, clarification, dailyMinutes);
    res.json({ tasks: result });
  } catch (error) { res.status(500).json({ error: 'Plan generation failed' }); }
});
app.post('/ai/refine-task', async (req, res) => {
  const { email, taskId, feedback } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!user || !task) return res.status(404).json({ error: 'Not found' });
    const newTaskData = await refineSingleTask(task, feedback, user);
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: newTaskData.title,
        duration: newTaskData.duration,
        description: newTaskData.description
      }
    });
    res.json(updatedTask);
  } catch (error) { res.status(500).json({ error: 'Refinement failed' }); }
});

// --- UPDATED DAILY PLAN ENDPOINT ---
app.post('/ai/daily-plan', async (req, res) => {
  const { email, goalTitle, dayNumber, totalDays, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Fetch the specific goal to find history
    const goal = await prisma.goal.findFirst({
      where: { 
        userId: user.id,
        title: goalTitle 
      },
      include: {
        tasks: {
          where: {
            dayNumber: { lt: dayNumber } // Only get past tasks
          },
          orderBy: { dayNumber: 'desc' }, // Latest first
          take: 15 // Limit context size (last 3-5 days approx)
        }
      }
    });

    // 2. Format history for AI
    const history = goal?.tasks.map(t => ({
      day: t.dayNumber,
      title: t.title
    })).reverse() || []; // Reverse back to chronological order

    const result = await generateDailyPlan(
      goalTitle, 
      user, 
      dayNumber, 
      totalDays, 
      dailyMinutes,
      history // Pass history to AI service
    );
    
    res.json(result);
  } catch (error) { 
    console.error("Daily Plan Error:", error);
    res.status(500).json({ error: 'Daily plan failed' }); 
  }
});

// ==========================================
// 4. GOAL & TASK ROUTES
// ==========================================
app.post('/goals', async (req, res) => {
  const { title, userEmail, type, targetDate, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }});
    if (!user) return res.status(404).json({ error: 'User not found' });
    const goal = await prisma.goal.create({
      data: { title, userId: user.id, type: type || 'project', targetDate: targetDate ? new Date(targetDate) : null, dailyMinutes: Number(dailyMinutes) || 45 }
    });
    res.json(goal);
  } catch (error) { res.status(500).json({ error: 'Goal creation failed' }); }
});
app.patch('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  try {
    const goal = await prisma.goal.update({ where: { id: goalId }, data: req.body });
    res.json(goal);
  } catch (error) { res.status(500).json({ error: 'Failed to update goal' }); }
});
app.delete('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  try {
    await prisma.goal.delete({ where: { id: goalId } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete goal' }); }
});
app.post('/goals/:goalId/tasks', async (req, res) => {
  const { goalId } = req.params;
  const { tasks } = req.body; 
  if (!tasks || !Array.isArray(tasks)) { return res.status(400).json({ error: "Invalid tasks array" }); }
  try {
    const createdTasks = await prisma.$transaction(
      tasks.map((t: any, index: number) => {
        const linkUrl = t.link?.url || null;
        const linkLabel = t.link?.label || null;
        return prisma.task.create({
          data: {
            title: t.title,
            description: t.description || '',
            duration: Number(t.duration) || 15,
            status: 'queued',
            goalId: goalId,
            order: index, 
            dayNumber: t.dayNumber ? Number(t.dayNumber) : 1,
            linkUrl,
            linkLabel
          }
        });
      })
    );
    const responseTasks = createdTasks.map(t => ({
      ...t,
      link: t.linkUrl ? { url: t.linkUrl, label: t.linkLabel || 'Resource' } : undefined
    }));
    res.json(responseTasks);
  } catch (error) { res.status(500).json({ error: 'Task creation failed' }); }
});
app.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;
  try {
    const allowedFields = ['title', 'description', 'duration', 'status', 'order', 'dayNumber', 'linkUrl', 'linkLabel'];
    const filteredData: any = {};
    Object.keys(updates).forEach(key => { if (allowedFields.includes(key)) filteredData[key] = updates[key]; });
    const task = await prisma.task.update({
      where: { id: taskId },
      data: filteredData,
      include: { goal: { include: { user: true } } }
    });
    if (filteredData.status === 'completed') {
      const user = task.goal.user;
      const today = new Date();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      let newStreak = user.currentStreak;
      let shouldUpdate = false;
      if (!lastActive || !isSameDay(today, lastActive)) {
        shouldUpdate = true;
        newStreak = (lastActive && isYesterday(today, lastActive)) ? user.currentStreak + 1 : 1;
      }
      if (shouldUpdate) {
        await prisma.user.update({ where: { id: user.id }, data: { currentStreak: newStreak, lastActiveDate: today } });
      }
    }
    const formattedTask = { ...task, link: task.linkUrl ? { url: task.linkUrl, label: task.linkLabel || 'Resource' } : undefined };
    res.json(formattedTask);
  } catch (error) { res.status(500).json({ error: 'Failed to update task' }); }
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

        // 2. Delete Goals (Tasks cascade automatically via Prisma schema if set, otherwise manual cleanup recommended)
        // Check schema: Goal deletion usually doesn't cascade to user, but user deletion fails if goals exist without cascade.
        // We delete goals explicitly to be safe.
        // Note: In schema `Task` has `onDelete: Cascade` relation to `Goal`. So deleting Goals deletes Tasks.
        await tx.goal.deleteMany({ where: { userId: user.id } });

        // 3. Delete User
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
      include: { goals: { include: { tasks: true } } }
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
          include: { goals: { include: { tasks: true } } }
        });
      }
    }

    let tasksCrushed = 0;
    let totalMinutes = 0;
    user.goals.forEach(g => {
      g.tasks.forEach(t => {
        if (t.status === 'completed') {
          tasksCrushed++;
          totalMinutes += t.duration;
        }
      });
    });

    // Transform tasks to include 'link' object
    const transformedGoals = user.goals.map(goal => ({
      ...goal,
      tasks: goal.tasks.map(task => ({
        ...task,
        link: task.linkUrl ? { url: task.linkUrl, label: task.linkLabel || 'View Resource' } : undefined
      }))
    }));

    res.json({
      ...user,
      goals: transformedGoals,
      stats: {
        tasksCrushed,
        hoursFocused: (totalMinutes / 60).toFixed(1),
        streak: user.currentStreak, 
        level: Math.floor(tasksCrushed / 5) + 1
      }
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