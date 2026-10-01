const express = require('express');
const router = express.Router();
const {
  getOrCreateChat,
  getChatMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount,
} = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// GET /api/chat/unread-count — authenticated users
// NOTE: Must be defined before /:chatId routes to avoid conflicts
router.get('/unread-count', verifyToken, getUnreadCount);

// GET /api/chat/booking/:bookingId — get or create chat for a booking
router.get('/booking/:bookingId', verifyToken, getOrCreateChat);

// GET /api/chat/:chatId/messages — get messages for a chat
router.get('/:chatId/messages', verifyToken, getChatMessages);

// POST /api/chat/:chatId/messages — send a message in a chat
router.post('/:chatId/messages', verifyToken, sendMessage);

// PATCH /api/chat/:chatId/read — mark messages as read
router.patch('/:chatId/read', verifyToken, markMessagesRead);

module.exports = router;
