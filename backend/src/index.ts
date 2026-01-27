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

// --- DATE HELPERS FOR STREAK LOGIC ---
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
// 1. AUTH SYNC (Fixed for Missing Emails)
// ==========================================

app.post('/users/sync', async (req, res) => {
  const { email, name, provider, socialId, onboardingData } = req.body;

  try {
    let user;

    // 1. Try to find user by socialId first (most reliable for Apple/Google)
    if (socialId) {
      user = await prisma.user.findUnique({ where: { socialId } });
    }

    // 2. If not found by socialId, try finding by email
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (user) {
      // UPDATE EXISTING USER
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          socialId: socialId || user.socialId,
          // Only update onboarding if the user is currently completing it
          onboardingData: onboardingData || user.onboardingData
        }
      });
    } else {
      // CREATE NEW USER
      // Fallback email logic: DB requires unique email string. 
      // If Apple doesn't provide it, we generate one using the socialId.
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
// 2. USER DATA ROUTES
// ==========================================

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
    user.goals.forEach(goal => {
      goal.tasks.forEach(task => {
        if (task.status === 'completed') {
          tasksCrushed++;
          totalMinutes += task.duration;
        }
      });
    });

    res.json({
      ...user,
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

// ==========================================
// 3. AI STRATEGIST ROUTES
// ==========================================

app.post('/ai/analyze-goal', async (req, res) => {
  const { goal, clarification } = req.body;
  try {
    const analysis = await analyzeGoalType(goal, clarification);
    res.json(analysis);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/ai/clarify', async (req, res) => {
  const { email, goal } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const question = await generateClarifyingQuestion(goal, user);
    res.json({ question });
  } catch (error) {
    console.error("AI Clarify Error:", error);
    res.status(500).json({ error: 'Clarification failed' });
  }
});

app.post('/ai/generate-plan', async (req, res) => {
  const { email, goal, clarification, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await generateActionPlan(goal, user, clarification, dailyMinutes);
    res.json({ tasks: result });
  } catch (error) {
    console.error("AI Generate Plan Error:", error);
    res.status(500).json({ error: 'Plan generation failed' });
  }
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
  } catch (error) {
    console.error("AI Refine Task Error:", error);
    res.status(500).json({ error: 'Refinement failed' });
  }
});

app.post('/ai/daily-plan', async (req, res) => {
  const { email, goalTitle, dayNumber, totalDays, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await generateDailyPlan(goalTitle, user, dayNumber, totalDays, dailyMinutes);
    res.json(result);
  } catch (error) {
    console.error("AI Daily Plan Error:", error);
    res.status(500).json({ error: 'Daily plan failed' });
  }
});

// ==========================================
// 4. GOAL & TASK MANAGEMENT
// ==========================================

app.post('/goals', async (req, res) => {
  const { title, userEmail, type, targetDate, dailyMinutes } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }});
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = await prisma.goal.create({
      data: { 
        title, 
        userId: user.id,
        type: type || 'project',
        targetDate: targetDate ? new Date(targetDate) : null,
        dailyMinutes: Number(dailyMinutes) || 45 
      }
    });
    res.json(goal);
  } catch (error) {
    console.error("Create Goal DB Error:", error);
    res.status(500).json({ error: 'Goal creation failed' });
  }
});

app.patch('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const updates = req.body;
  try {
    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updates
    });
    res.json(goal);
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// ADDED: Delete Goal Endpoint
app.delete('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  try {
    await prisma.goal.delete({
      where: { id: goalId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

app.post('/goals/:goalId/tasks', async (req, res) => {
  const { goalId } = req.params;
  const { tasks } = req.body; 
  try {
    const createdTasks = await prisma.$transaction(
      tasks.map((t: any) => prisma.task.create({
        data: {
          title: t.title,
          description: t.description || '',
          duration: Number(t.duration) || 15,
          goalId: goalId
        }
      }))
    );
    res.json(createdTasks);
  } catch (error) {
    console.error("Create Tasks Error:", error);
    res.status(500).json({ error: 'Task creation failed' });
  }
});

app.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body; 
  
  try {
    const allowedFields = ['title', 'description', 'duration', 'status', 'order'];
    const filteredData: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) filteredData[key] = updates[key];
    });

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
      let shouldUpdateLastActive = false;

      if (!lastActive) {
        newStreak = 1;
        shouldUpdateLastActive = true;
      } else if (isSameDay(today, lastActive)) {
        shouldUpdateLastActive = true;
      } else if (isYesterday(today, lastActive)) {
        newStreak = user.currentStreak + 1;
        shouldUpdateLastActive = true;
      } else {
        newStreak = 1;
        shouldUpdateLastActive = true;
      }

      if (shouldUpdateLastActive) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentStreak: newStreak, lastActiveDate: today }
        });
      }
    }

    res.json(task);
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { currentStreak: 'desc' },
      take: 10,
      select: { id: true, name: true, currentStreak: true }
    });

    const leaderboard = users.map(u => ({
      id: u.id,
      name: u.name || 'Operative',
      streak: u.currentStreak,
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ error: 'Leaderboard fetch failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});