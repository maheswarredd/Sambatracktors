const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount,
} = require('../controllers/notificationsController');
const { verifyToken } = require('../middleware/auth');

// GET /api/notifications — get all notifications for the logged-in user
router.get('/', verifyToken, getMyNotifications);

// GET /api/notifications/unread-count — get count of unread notifications
// NOTE: Must be defined before /:id to avoid treating 'unread-count' as an ID
router.get('/unread-count', verifyToken, getUnreadCount);

// PATCH /api/notifications/read-all — mark all notifications as read
// NOTE: Must be defined before /:id/read to avoid route conflicts
router.patch('/read-all', verifyToken, markAllRead);

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', verifyToken, markAsRead);

module.exports = router;
