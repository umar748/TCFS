import express from 'express';
import { handleChat, getHistory, createThread, listThreads, listMessages, sendMessage } from '../controllers/chatController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const lastRequestMap = new Map();
function rateLimit(req, res, next) {
  try {
    const key = req.body && req.body.userId ? String(req.body.userId) : req.ip;
    const now = Date.now();
    const last = lastRequestMap.get(key) || 0;
    if (now - last < 500) {
      return res.status(200).json({ success: true, response: "Please wait a moment before sending another message.", message: "Please wait a moment before sending another message." });
    }
    lastRequestMap.set(key, now);
    next();
  } catch {
    next();
  }
}

router.post('/', rateLimit, handleChat);
router.post('/ai', rateLimit, handleChat);
router.get('/:userId/history', getHistory);
router.post('/thread', authMiddleware, createThread);
router.get('/threads', authMiddleware, listThreads);
router.get('/thread/:id/messages', authMiddleware, listMessages);
router.post('/thread/:id/message', authMiddleware, sendMessage);

export default router;
