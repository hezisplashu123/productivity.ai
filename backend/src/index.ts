import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// --- DATE HELPERS ---
const isSameDay = (d1: Date, d2: Date) => {
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
};

const isYesterday = (today: Date, past: Date) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(yesterday, past);
};

// --- LOGGING ---
app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- AUTH ROUTES ---

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

// --- USER ROUTES ---

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
        streak: user.currentStreak, // SOURCE OF TRUTH
        level: Math.floor(tasksCrushed / 5) + 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- GOAL & TASK ROUTES ---

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
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.post('/goals/:goalId/tasks', async (req, res) => {
  const { goalId } = req.params;
  const { tasks } = req.body; 
  try {
    const dbTasks = tasks.map((task: any) => ({
      title: task.title,
      description: task.description || '',
      duration: Number(task.duration) || 15,
      status: 'queued',
      goalId: goalId
    }));

    const createdTasks = await prisma.$transaction(
      dbTasks.map((t: any) => prisma.task.create({ data: t }))
    );
    res.json(createdTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add tasks' });
  }
});

app.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body; 
  
  try {
    const cleanUpdates: any = {};
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.completed === true) cleanUpdates.status = 'completed';

    // 1. Update the Task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: cleanUpdates,
      include: { goal: { include: { user: true } } }
    });

    // 2. Handle Streak Update
    if (cleanUpdates.status === 'completed') {
      const user = task.goal.user;
      const today = new Date();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

      let newStreak = user.currentStreak;

      if (!lastActive) {
        newStreak = 1; // First ever
      } else if (isSameDay(today, lastActive)) {
        newStreak = user.currentStreak; // No change if already active today
      } else if (isYesterday(today, lastActive)) {
        newStreak = user.currentStreak + 1; // Increment!
      } else {
        newStreak = 1; // Reset if missed a day
      }

      // Force update the User record immediately
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentStreak: newStreak,
          lastActiveDate: today
        }
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// --- LEADERBOARD ROUTE ---

app.get('/leaderboard', async (req, res) => {
  try {
    // Return EXACTLY what is in the DB
    const users = await prisma.user.findMany({
      orderBy: { currentStreak: 'desc' },
      take: 10,
      select: { id: true, name: true, currentStreak: true }
    });

    const leaderboard = users.map(user => ({
      id: user.id,
      name: user.name || 'Operative',
      streak: user.currentStreak, // Ensure this matches User Route
    }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});