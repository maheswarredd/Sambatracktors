import express from 'express';
import { getRiderBookings, updateBookingStatusByRider, updateRiderLocation } from '../controllers/riderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('rider', 'admin'));

router.get('/my-bookings', getRiderBookings);
router.put('/booking/:id/status', updateBookingStatusByRider);
router.put('/location', updateRiderLocation);

export default router;
