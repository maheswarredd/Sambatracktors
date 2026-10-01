const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getRiderBookings,
  checkAvailability,
  getBookingById,
  getBookingInvoice,
  cancelBooking,
  assignRider,
  updateBookingStatus,
} = require('../controllers/bookingsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/bookings — farmer only
router.post(
  '/',
  verifyToken,
  authorize('farmer'),
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
    body('scheduledTime').notEmpty().withMessage('Scheduled time is required'),
    body('fieldLocation').isObject().withMessage('Field location is required'),
    body('fieldLocation.address').notEmpty().withMessage('Field address is required'),
    body('fieldArea').isNumeric().withMessage('Field area must be a number'),
    body('fieldAreaUnit')
      .optional()
      .isIn(['acres', 'hectares'])
      .withMessage('Field area unit must be acres or hectares'),
    body('paymentMethod')
      .isIn(['online', 'cash'])
      .withMessage('Payment method must be online or cash'),
  ],
  validate,
  createBooking
);

// GET /api/bookings/my — farmer only
router.get('/my', verifyToken, authorize('farmer'), getMyBookings);

// GET /api/bookings/availability — authenticated users
router.get('/availability', verifyToken, checkAvailability);

// GET /api/bookings — admin only
router.get('/', verifyToken, authorize('admin'), getAllBookings);

// GET /api/bookings/rider — rider only
router.get('/rider', verifyToken, authorize('rider'), getRiderBookings);

// GET /api/bookings/:id — authenticated users
router.get('/:id', verifyToken, getBookingById);

// GET /api/bookings/:id/invoice — authenticated users
router.get('/:id/invoice', verifyToken, getBookingInvoice);

// PATCH /api/bookings/:id/cancel — authenticated users
router.patch('/:id/cancel', verifyToken, cancelBooking);

// PATCH /api/bookings/:id/assign-rider — admin only
router.patch('/:id/assign-rider', verifyToken, authorize('admin'), assignRider);

// PATCH /api/bookings/:id/status — authenticated users (role-based logic in controller)
router.patch('/:id/status', verifyToken, updateBookingStatus);

module.exports = router;
