import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './config/db.js';
import socketHandler from './socket/index.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import tripChatRoutes from './routes/tripChatRoutes.js';
import directChatRoutes from './routes/directChatRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const httpServer = createServer(app);
const io = socketHandler(httpServer);

// Make io accessible in controllers
app.set('io', io);

// Middleware - CORS Production Ready
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:10000',
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'https://tcfs.vercel.app',
      'https://www.tcfs.vercel.app'
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight requests

app.use(express.json({ limit: '15mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat', directChatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/trip-chats', tripChatRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).send('TCFS Backend is running');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 10000;

// Initialize server with database connection
(async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`TCFS backend running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();
