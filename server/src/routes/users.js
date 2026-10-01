const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllFarmers,
  getAllRiders,
  createRider,
  getUserById,
  updateUser,
  toggleUserStatus,
  getFarmerBookings,
  getRiderStats,
} = require('../controllers/usersController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// GET /api/users/farmers — admin only
router.get('/farmers', verifyToken, authorize('admin'), getAllFarmers);

// GET /api/users/riders — admin only
router.get('/riders', verifyToken, authorize('admin'), getAllRiders);

// POST /api/users/riders — admin only
router.post(
  '/riders',
  verifyToken,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone()
      .withMessage('Valid phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  ],
  validate,
  createRider
);

// GET /api/users/riders/:id/stats — admin only
// NOTE: Must be defined before /:id to avoid route conflicts
router.get('/riders/:id/stats', verifyToken, authorize('admin'), getRiderStats);

// GET /api/users/:id — authenticated users
router.get('/:id', verifyToken, getUserById);

// PUT /api/users/:id — admin only
router.put(
  '/:id',
  verifyToken,
  authorize('admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  ],
  validate,
  updateUser
);

// PATCH /api/users/:id/toggle-status — admin only
router.patch('/:id/toggle-status', verifyToken, authorize('admin'), toggleUserStatus);

// GET /api/users/:id/bookings — admin only
router.get('/:id/bookings', verifyToken, authorize('admin'), getFarmerBookings);

module.exports = router;
