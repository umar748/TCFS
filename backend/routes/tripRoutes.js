import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createTrip, listMyTrips, discoverTrips, getMyTripById, updateTrip } from '../controllers/tripController.js';

const router = express.Router();

router.get('/discover', discoverTrips);
router.post('/', authMiddleware, createTrip);
router.get('/mine', authMiddleware, listMyTrips);
router.get('/:tripId', authMiddleware, getMyTripById);
router.put('/:tripId', authMiddleware, updateTrip);

export default router;
