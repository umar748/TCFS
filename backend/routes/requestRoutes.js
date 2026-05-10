import express from 'express';
import { sendJoinRequest, handleRequestAction, getMyIncomingRequests, getMyOutgoingRequests, deleteRequest } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendJoinRequest);
router.put('/:requestId/action', protect, handleRequestAction);
router.get('/incoming', protect, getMyIncomingRequests);
router.get('/outgoing', protect, getMyOutgoingRequests);
router.delete('/:requestId', protect, deleteRequest);

export default router;
