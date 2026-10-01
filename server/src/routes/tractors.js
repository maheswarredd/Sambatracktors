const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllTractors,
  createTractor,
  updateTractor,
  assignRiderToTractor,
  toggleTractorStatus,
  getAvailableTractors,
} = require('../controllers/tractorsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// GET /api/tractors/available — admin only
// NOTE: Must be defined before /:id to avoid route conflicts
router.get('/available', verifyToken, authorize('admin'), getAvailableTractors);

// GET /api/tractors — admin only
router.get('/', verifyToken, authorize('admin'), getAllTractors);

// POST /api/tractors — admin only
router.post(
  '/',
  verifyToken,
  authorize('admin'),
  [
    body('registrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Registration number is required'),
    body('model').trim().notEmpty().withMessage('Tractor model is required'),
    body('brand').trim().notEmpty().withMessage('Tractor brand is required'),
    body('year')
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage('Valid manufacturing year is required'),
    body('horsepower')
      .isNumeric()
      .withMessage('Horsepower must be a number'),
  ],
  validate,
  createTractor
);

// PUT /api/tractors/:id — admin only
router.put(
  '/:id',
  verifyToken,
  authorize('admin'),
  [
    body('registrationNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Registration number cannot be empty'),
    body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
    body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
    body('year')
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage('Valid manufacturing year is required'),
    body('horsepower')
      .optional()
      .isNumeric()
      .withMessage('Horsepower must be a number'),
  ],
  validate,
  updateTractor
);

// PATCH /api/tractors/:id/assign-rider — admin only
router.patch(
  '/:id/assign-rider',
  verifyToken,
  authorize('admin'),
  [
    body('riderId').notEmpty().withMessage('Rider ID is required'),
  ],
  validate,
  assignRiderToTractor
);

// PATCH /api/tractors/:id/toggle-status — admin only
router.patch('/:id/toggle-status', verifyToken, authorize('admin'), toggleTractorStatus);

module.exports = router;
