import express from 'express';
import { getMyNotifications, markNotificationsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/mark-read', markNotificationsRead);

export default router;
