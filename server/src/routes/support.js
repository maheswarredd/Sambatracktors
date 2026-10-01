const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} = require('../controllers/supportController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/support — farmer only
router.post(
  '/',
  verifyToken,
  authorize('farmer'),
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .optional()
      .isIn(['booking', 'payment', 'service', 'technical', 'other'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
  ],
  validate,
  createTicket
);

// GET /api/support/my — farmer only
router.get('/my', verifyToken, authorize('farmer'), getMyTickets);

// GET /api/support — admin only
router.get('/', verifyToken, authorize('admin'), getAllTickets);

// GET /api/support/:id — authenticated users
router.get('/:id', verifyToken, getTicketById);

// POST /api/support/:id/reply — admin only
router.post(
  '/:id/reply',
  verifyToken,
  authorize('admin'),
  [
    body('message').trim().notEmpty().withMessage('Reply message is required'),
  ],
  validate,
  replyToTicket
);

// PATCH /api/support/:id/status — admin only
router.patch(
  '/:id/status',
  verifyToken,
  authorize('admin'),
  [
    body('status')
      .isIn(['open', 'in-progress', 'resolved', 'closed'])
      .withMessage('Invalid status value'),
  ],
  validate,
  updateTicketStatus
);

module.exports = router;
