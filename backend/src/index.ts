import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { 
  generateActionPlan, 
  generateClarifyingQuestion, 
  refineSingleTask 
} from './services/ai.service';

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// --- DATE HELPERS FOR STREAKS ---
const isSameDay = (d1: Date, d2: Date) => {
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
};

const isYesterday = (today: Date, past: Date) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(yesterday, past);
};

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. AUTH & USER ROUTES
// ==========================================

app.post('/register', async (req, res) => {
  const { email, name, password, onboardingData } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = await prisma.user.create({
      data: { 
        email, 
        name: name || 'Operative', 
        password, 
        provider: 'email',
        onboardingData 
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/auth/social', async (req, res) => {
    const { email, name, provider, socialId, onboardingData } = req.body;
    try {
      let user = await prisma.user.findUnique({ where: { email: email || '' } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email || `${socialId}@social.com`,
            socialId,
            name: name || 'Operative',
            provider,
            onboardingData
          }
        });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Social auth failed' });
    }
});

app.get('/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { goals: { include: { tasks: true } } }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

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
      res.status(500).json({ error: 'Update failed' });
    }
});

// ==========================================
// 2. AI STRATEGIST ROUTES
// ==========================================

// Step 1: Request Clarifying Question
app.post('/ai/clarify', async (req, res) => {
  const { email, goal } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const question = await generateClarifyingQuestion(goal, user);
    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: 'Clarification failed' });
  }
});

// Step 2: Generate Full Plan
app.post('/ai/generate-plan', async (req, res) => {
  const { email, goal, clarification } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await generateActionPlan(goal, user, clarification);
    res.json({ tasks: result });
  } catch (error) {
    res.status(500).json({ error: 'Plan generation failed' });
  }
});

// Step 3: Refine Task (The "Report to AI" Feature)
app.post('/ai/refine-task', async (req, res) => {
  const { email, taskId, feedback } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!user || !task) return res.status(404).json({ error: 'Not found' });

    console.log(`🔧 AI Refining Task: ${task.title} based on: ${feedback}`);
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
    res.status(500).json({ error: 'Refinement failed' });
  }
});

// ==========================================
// 3. GOAL & TASK MANAGEMENT
// ==========================================

app.post('/goals', async (req, res) => {
  const { title, userEmail } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }});
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = await prisma.goal.create({
      data: { title, userId: user.id }
    });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Goal creation failed' });
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
    res.status(500).json({ error: 'Task creation failed' });
  }
});

app.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body; 
  
  try {
    // Prevent Prisma error by filtering only valid DB fields
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

    // Streak Logic
    if (filteredData.status === 'completed') {
      const user = task.goal.user;
      const today = new Date();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      let newStreak = user.currentStreak;

      if (!lastActive) newStreak = 1;
      else if (isSameDay(today, lastActive)) newStreak = user.currentStreak;
      else if (isYesterday(today, lastActive)) newStreak = user.currentStreak + 1;
      else newStreak = 1;

      await prisma.user.update({
        where: { id: user.id },
        data: { currentStreak: newStreak, lastActiveDate: today }
      });
    }
    res.json(task);
  } catch (error) {
    console.error('Task Update Error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ==========================================
// 4. METRICS & LEADERBOARD
// ==========================================

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
    res.status(500).json({ error: 'Leaderboard fetch failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Chief of Staff listening on port ${PORT}`);
});