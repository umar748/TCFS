import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createReport, listMyReports } from '../controllers/reportController.js';

const router = express.Router();

router.post('/', authMiddleware, createReport);
router.get('/mine', authMiddleware, listMyReports);

export default router;
