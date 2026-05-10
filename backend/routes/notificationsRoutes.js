import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { listMyNotifications, acceptNotification, createMatchRequest } from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', authMiddleware, listMyNotifications);
router.post('/:id/accept', authMiddleware, acceptNotification);
router.post('/request', authMiddleware, createMatchRequest);

export default router;
