import express from 'express';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  getMyBookings
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('paymentScreenshot'), createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
