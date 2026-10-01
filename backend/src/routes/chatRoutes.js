import express from 'express';
import { getChatByBooking, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:bookingId', getChatByBooking);
router.post('/:bookingId/message', sendMessage);

export default router;
