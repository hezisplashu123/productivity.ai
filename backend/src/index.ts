import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use((req, res, next) => {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Delegate ALL routes to their respective controllers
app.use('/users', userRoutes);
app.use('/profile', profileRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hezi API listening on port ${PORT}`);
});