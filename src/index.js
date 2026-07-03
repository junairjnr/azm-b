
import express from 'express';
import cors from 'cors';
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from './config/db.js';



dotenv.config();

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import habitRoutes from './routes/habits.js';
import diaryRoutes from './routes/diary.js';
import expenseRoutes from './routes/expenses.js';
import summaryRoutes from './routes/summary.js';

const app = express();

// ── 1. Allowed origins ────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://azm-f.vercel.app/",
  process.env.CLIENT_URL,
].filter(Boolean);

// ── 2. CORS — must be first ───────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const connected = dbState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    message: connected ? 'Habit Tracker API is running' : 'API up but database disconnected',
    database: dbStatus[dbState] || 'unknown',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/summary', summaryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Change PORT in backend/.env`);
    } else {
      console.error('Server error:', error.message);
    }
    process.exit(1);
  });
};

startServer();
