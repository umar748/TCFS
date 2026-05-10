import express from 'express';
import { searchUsers, updateProfile, blockUser, unblockUser, getBlockedUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchUsers);
router.put('/update', protect, updateProfile);
router.get('/blocked', protect, getBlockedUsers);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);

export default router;
