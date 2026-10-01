const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDashboardStats,
  getBookingStats,
  getRevenueStats,
  updateSettings,
  getSettings,
  uploadQrCodeHandler,
} = require('../controllers/adminController');
const { verifyToken, authorize } = require('../middleware/auth');
const { uploadQrCode } = require('../middleware/upload');
const { validate } = require('../middleware/validate');

// GET /api/admin/dashboard — admin only
router.get('/dashboard', verifyToken, authorize('admin'), getDashboardStats);

// GET /api/admin/booking-stats — admin only
router.get('/booking-stats', verifyToken, authorize('admin'), getBookingStats);

// GET /api/admin/revenue-stats — admin only
router.get('/revenue-stats', verifyToken, authorize('admin'), getRevenueStats);

// GET /api/admin/settings — admin only
router.get('/settings', verifyToken, authorize('admin'), getSettings);

// PUT /api/admin/settings — admin only
router.put(
  '/settings',
  verifyToken,
  authorize('admin'),
  [
    body('businessName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Business name cannot be empty'),
    body('contactEmail')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid contact email is required'),
    body('contactPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Valid contact phone is required'),
    body('upiId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('UPI ID cannot be empty'),
    body('bookingAdvanceDays')
      .optional()
      .isInt({ min: 1, max: 90 })
      .withMessage('Advance booking days must be between 1 and 90'),
    body('cancellationPolicyHours')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Cancellation policy hours must be a non-negative integer'),
  ],
  validate,
  updateSettings
);

// POST /api/admin/settings/qr-code — admin only with QR code image upload
router.post(
  '/settings/qr-code',
  verifyToken,
  authorize('admin'),
  uploadQrCode,
  uploadQrCodeHandler
);

module.exports = router;
