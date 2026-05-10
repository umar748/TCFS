import express from 'express';
import { getTripChats, getChatMessages, sendMessage } from '../controllers/tripChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getTripChats);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/send', protect, sendMessage);

export default router;
