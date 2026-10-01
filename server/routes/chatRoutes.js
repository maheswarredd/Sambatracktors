import express from 'express';
import { getChatMessages, sendChatMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:bookingId', getChatMessages);
router.post('/:bookingId', sendChatMessage);

export default router;
