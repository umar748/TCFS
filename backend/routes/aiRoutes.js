import express from 'express';
import { aiStatus } from '../controllers/aiStatusController.js';

const router = express.Router();

router.get('/status', aiStatus);

export default router;

