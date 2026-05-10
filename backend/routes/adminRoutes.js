import express from 'express';
import { 
  updateAIConfig, getAIConfig, 
  getStats, getUsers, manageUser,
  getVerifications, handleVerification,
  getReports, updateReport,
  getAllTrips, updateTrip, deleteTrip,
  deleteMessage, sendBroadcast, getDestinations, getDestinationDetail
} from '../controllers/adminController.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Config
router.post('/config', updateAIConfig);
router.get('/config', getAIConfig);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.post('/users/:userId/manage', manageUser);

// Verifications
router.get('/verifications', getVerifications);
router.post('/verifications/:id/handle', handleVerification);

// Reports
router.get('/reports', getReports);
router.post('/reports/:id/update', updateReport);

// Trips
router.get('/trips', getAllTrips);
router.post('/trips/:id/update', updateTrip);
router.delete('/trips/:id', deleteTrip);

// Chat moderation
router.delete('/messages/:id', deleteMessage);

// Notifications
router.post('/broadcast', sendBroadcast);

// Destinations
router.get('/destinations', getDestinations);
router.get('/destinations/:name', getDestinationDetail);

export default router;
