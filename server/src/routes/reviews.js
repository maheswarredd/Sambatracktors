const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createReview,
  getReviews,
  getAllReviews,
  toggleReviewPublish,
} = require('../controllers/reviewsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/reviews — farmer only
router.post(
  '/',
  verifyToken,
  authorize('farmer'),
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('riderId').notEmpty().withMessage('Rider ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
  ],
  validate,
  createReview
);

// GET /api/reviews/admin — admin only
// NOTE: Must be defined before /rider/:riderId to avoid route conflicts
router.get('/admin', verifyToken, authorize('admin'), getAllReviews);

// GET /api/reviews/rider/:riderId — public
router.get('/rider/:riderId', getReviews);

// PATCH /api/reviews/:id/toggle-publish — admin only
router.patch('/:id/toggle-publish', verifyToken, authorize('admin'), toggleReviewPublish);

module.exports = router;
