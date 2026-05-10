import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import SimpleUser from './models/User.js';
import ChatRoom from './models/ChatRoom.js';
import Message from './models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.SIMPLE_CHAT_PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TCFS';

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
  // eslint-disable-next-line no-console
  console.log(`SimpleChat MongoDB Connected: ${mongoose.connection.host}`);
}

async function ensureSeed() {
  const usernames = ['alice', 'bob'];
  const display = { alice: 'Alice', bob: 'Bob' };
  const existing = await SimpleUser.find({ username: { $in: usernames } });
  const existingMap = new Map(existing.map(u => [u.username, u]));
  const toCreate = usernames
    .filter(u => !existingMap.has(u))
    .map(u => ({ username: u, displayName: display[u] }));
  if (toCreate.length) {
    await SimpleUser.insertMany(toCreate);
  }
  const users = await SimpleUser.find({ username: { $in: usernames } });
  let room = await ChatRoom.findOne({ name: 'default-room' });
  if (!room) {
    room = await ChatRoom.create({
      name: 'default-room',
      participants: users.map(u => u._id),
    });
  }
  return { users, room };
}

async function main() {
  await connectDB();
  const { users, room } = await ensureSeed();

  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (req, res) => {
    res.json({ ok: true, roomId: room._id.toString() });
  });

  app.get('/api/users', async (req, res) => {
    const list = await SimpleUser.find().select('_id username displayName').lean();
    res.json({ users: list });
  });

  app.post('/api/login', async (req, res) => {
    const { username } = req.body || {};
    const user = await SimpleUser.findOne({ username }).select('_id username displayName').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found. Use alice or bob.' });
    }
    res.json({ user, roomId: room._id.toString() });
  });

  app.get('/api/messages', async (req, res) => {
    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username displayName')
      .lean();
    res.json({
      messages: messages.reverse().map(m => ({
        id: m._id.toString(),
        userId: m.sender._id.toString(),
        username: m.sender.username,
        displayName: m.sender.displayName,
        text: m.text,
        createdAt: m.createdAt,
      })),
    });
  });

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log('Socket connected', socket.id);
    socket.on('join', async ({ userId }) => {
      socket.data.userId = userId;
      socket.join(room._id.toString());
      const recent = await Message.find({ room: room._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('sender', 'username displayName')
        .lean();
      socket.emit('history', recent.reverse().map(m => ({
        id: m._id.toString(),
        userId: m.sender._id.toString(),
        username: m.sender.username,
        displayName: m.sender.displayName,
        text: m.text,
        createdAt: m.createdAt,
      })));
    });

    socket.on('message', async ({ userId, text }) => {
      if (!text || !text.trim()) return;
      const msg = await Message.create({
        room: room._id,
        sender: userId,
        text: text.trim(),
      });
      const sender = await SimpleUser.findById(userId).lean();
      const payload = {
        id: msg._id.toString(),
        userId: userId.toString(),
        username: sender?.username || 'user',
        displayName: sender?.displayName || sender?.username || 'User',
        text: msg.text,
        createdAt: msg.createdAt,
      };
      io.to(room._id.toString()).emit('message', payload);
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Socket disconnected', socket.id);
    });
  });

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Simple chat server running at http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start simple chat server:', e);
  process.exit(1);
});

