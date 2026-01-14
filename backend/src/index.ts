import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

// Ensure PORT is a number to fix TypeScript errors
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// --- DEBUG LOGGER ---
// This prints to the terminal whenever the phone tries to connect
app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
// --------------------

// --- 1. AUTH ROUTES ---

// REGISTER (Sign Up)
app.post('/register', async (req, res) => {
  const { email, name, password, onboardingData } = req.body;
  
  console.log(`👤 Attempting to register: ${email}`);

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password, // Note: In production, hash this password!
        onboardingData
      },
    });
    
    console.log('✅ User created successfully');
    res.json(user);
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`🔑 Attempting login: ${email}`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.password !== password) {
      console.log('⛔ Invalid credentials');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ Login successful');
    res.json(user);
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- 2. GOAL ROUTES ---

// Create Goal
app.post('/goals', async (req, res) => {
  const { title, userEmail } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }});
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = await prisma.goal.create({
      data: {
        title,
        userId: user.id
      }
    });
    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get User Goals
app.get('/users/:email/goals', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        goals: {
          include: { tasks: true },
          orderBy: { createdAt: 'desc' }
        } 
      }
    });
    res.json(user?.goals || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// --- 3. TASK ROUTES ---

// Add Tasks
app.post('/goals/:goalId/tasks', async (req, res) => {
  const { goalId } = req.params;
  const { tasks } = req.body; 

  try {
    const createdTasks = await prisma.$transaction(
      tasks.map((task: any) => 
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            duration: task.duration,
            goalId: goalId
          }
        })
      )
    );
    res.json(createdTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add tasks' });
  }
});

// Update Task
app.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body; 

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates
    });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📱 Connect your phone to your local IP address`);
});