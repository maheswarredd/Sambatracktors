import express from 'express';
import { getRiderBookings, updateBookingStatusByRider } from '../controllers/riderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('rider', 'admin'));

router.get('/bookings', getRiderBookings);
router.patch('/bookings/:id/status', updateBookingStatusByRider);

export default router;
