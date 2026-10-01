import express from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllRead);

export default router;
