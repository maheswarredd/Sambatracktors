const express = require('express');
const router = express.Router();
const {
  submitOnlinePayment,
  getPaymentDetails,
  verifyPayment,
  rejectPayment,
  markCashCollected,
  requestRefund,
  processRefund,
  getPaymentStats,
  getUpiSettings,
} = require('../controllers/paymentsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { uploadPaymentScreenshot } = require('../middleware/upload');

// GET /api/payments/stats/summary — admin only
// NOTE: Must be defined before /:bookingId to avoid route conflicts
router.get('/stats/summary', verifyToken, authorize('admin'), getPaymentStats);

// GET /api/payments/settings/upi — public
router.get('/settings/upi', getUpiSettings);

// POST /api/payments/:bookingId/submit — farmer only with screenshot upload
router.post(
  '/:bookingId/submit',
  verifyToken,
  authorize('farmer'),
  uploadPaymentScreenshot,
  submitOnlinePayment
);

// GET /api/payments/:bookingId — authenticated users
router.get('/:bookingId', verifyToken, getPaymentDetails);

// PATCH /api/payments/:bookingId/verify — admin only
router.patch('/:bookingId/verify', verifyToken, authorize('admin'), verifyPayment);

// PATCH /api/payments/:bookingId/reject — admin only
router.patch('/:bookingId/reject', verifyToken, authorize('admin'), rejectPayment);

// PATCH /api/payments/:bookingId/cash-collected — rider or admin
router.patch(
  '/:bookingId/cash-collected',
  verifyToken,
  authorize('rider', 'admin'),
  markCashCollected
);

// PATCH /api/payments/:bookingId/refund — farmer only
router.patch('/:bookingId/refund', verifyToken, authorize('farmer'), requestRefund);

// PATCH /api/payments/:bookingId/process-refund — admin only
router.patch(
  '/:bookingId/process-refund',
  verifyToken,
  authorize('admin'),
  processRefund
);

module.exports = router;
