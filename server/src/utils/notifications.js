const Notification = require('../models/Notification');

// ---------------------------------------------------------------------------
// Notification Types
// ---------------------------------------------------------------------------
const NOTIFICATION_TYPES = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_IN_PROGRESS: 'booking_in_progress',
  BOOKING_RESCHEDULED: 'booking_rescheduled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUNDED: 'payment_refunded',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  SUPPORT_TICKET_RESOLVED: 'support_ticket_resolved',
  SYSTEM: 'system',
};

// ---------------------------------------------------------------------------
// Core notification creator
// ---------------------------------------------------------------------------

/**
 * createNotification — saves a notification document to the database.
 *
 * @param {string|ObjectId} userId   - Recipient user's ID
 * @param {string}          title    - Short title for the notification
 * @param {string}          body     - Full notification body/message
 * @param {string}          type     - One of NOTIFICATION_TYPES
 * @param {object}          [data]   - Optional extra data payload (stored as metadata)
 * @returns {Promise<object>}        - Saved Mongoose notification document
 */
const createNotification = async (userId, title, body, type, data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type: type || NOTIFICATION_TYPES.SYSTEM,
      data,
      isRead: false,
    });
    return notification;
  } catch (error) {
    // Notifications should never crash core flows — log and swallow
    console.error('[Notification] Failed to create notification:', error.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Notification Templates
// ---------------------------------------------------------------------------

/**
 * notifyBookingCreated — notify operator/admin of a new booking.
 * @param {string|ObjectId} operatorId
 * @param {object}          booking    - Booking document
 */
const notifyBookingCreated = async (operatorId, booking) => {
  return createNotification(
    operatorId,
    'New Booking Received 🚜',
    `A new booking (${booking.bookingId}) has been placed by ${booking.farmer?.name || 'a farmer'} for ${booking.acres} acres on ${new Date(booking.scheduledDate).toDateString()}.`,
    NOTIFICATION_TYPES.BOOKING_CREATED,
    { bookingId: booking._id, bookingRef: booking.bookingId }
  );
};

/**
 * notifyBookingConfirmed — notify farmer that their booking is confirmed.
 * @param {string|ObjectId} farmerId
 * @param {object}          booking
 */
const notifyBookingConfirmed = async (farmerId, booking) => {
  return createNotification(
    farmerId,
    'Booking Confirmed ✅',
    `Your booking (${booking.bookingId}) has been confirmed. The tractor will arrive on ${new Date(booking.scheduledDate).toDateString()}.`,
    NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    { bookingId: booking._id, bookingRef: booking.bookingId }
  );
};

/**
 * notifyBookingCancelled — notify relevant party of booking cancellation.
 * @param {string|ObjectId} userId
 * @param {object}          booking
 * @param {string}          [reason]
 */
const notifyBookingCancelled = async (userId, booking, reason = '') => {
  return createNotification(
    userId,
    'Booking Cancelled ❌',
    `Booking (${booking.bookingId}) has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    NOTIFICATION_TYPES.BOOKING_CANCELLED,
    { bookingId: booking._id, bookingRef: booking.bookingId, reason }
  );
};

/**
 * notifyBookingCompleted — notify farmer that service is done.
 * @param {string|ObjectId} farmerId
 * @param {object}          booking
 */
const notifyBookingCompleted = async (farmerId, booking) => {
  return createNotification(
    farmerId,
    'Service Completed 🎉',
    `The tractor service for booking (${booking.bookingId}) has been completed successfully. Please make the payment if not done already.`,
    NOTIFICATION_TYPES.BOOKING_COMPLETED,
    { bookingId: booking._id, bookingRef: booking.bookingId }
  );
};

/**
 * notifyBookingInProgress — notify farmer that the tractor has started.
 * @param {string|ObjectId} farmerId
 * @param {object}          booking
 */
const notifyBookingInProgress = async (farmerId, booking) => {
  return createNotification(
    farmerId,
    'Tractor On The Way 🚜',
    `Your tractor service for booking (${booking.bookingId}) is now in progress.`,
    NOTIFICATION_TYPES.BOOKING_IN_PROGRESS,
    { bookingId: booking._id, bookingRef: booking.bookingId }
  );
};

/**
 * notifyBookingRescheduled — notify farmer/operator of reschedule.
 * @param {string|ObjectId} userId
 * @param {object}          booking
 * @param {Date}            newDate
 */
const notifyBookingRescheduled = async (userId, booking, newDate) => {
  return createNotification(
    userId,
    'Booking Rescheduled 📅',
    `Booking (${booking.bookingId}) has been rescheduled to ${new Date(newDate).toDateString()}.`,
    NOTIFICATION_TYPES.BOOKING_RESCHEDULED,
    { bookingId: booking._id, bookingRef: booking.bookingId, newDate }
  );
};

/**
 * notifyPaymentReceived — notify operator/admin of a payment.
 * @param {string|ObjectId} operatorId
 * @param {object}          payment
 * @param {object}          booking
 */
const notifyPaymentReceived = async (operatorId, payment, booking) => {
  return createNotification(
    operatorId,
    'Payment Received 💰',
    `Payment of ₹${payment.amount} received for booking (${booking.bookingId}).`,
    NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    { paymentId: payment._id, bookingId: booking._id, amount: payment.amount }
  );
};

/**
 * notifyPaymentFailed — notify farmer of a failed payment.
 * @param {string|ObjectId} farmerId
 * @param {object}          booking
 */
const notifyPaymentFailed = async (farmerId, booking) => {
  return createNotification(
    farmerId,
    'Payment Failed ⚠️',
    `Your payment for booking (${booking.bookingId}) could not be processed. Please try again.`,
    NOTIFICATION_TYPES.PAYMENT_FAILED,
    { bookingId: booking._id, bookingRef: booking.bookingId }
  );
};

/**
 * notifyPaymentRefunded — notify farmer of a refund.
 * @param {string|ObjectId} farmerId
 * @param {object}          payment
 * @param {object}          booking
 */
const notifyPaymentRefunded = async (farmerId, payment, booking) => {
  return createNotification(
    farmerId,
    'Refund Processed 🔄',
    `A refund of ₹${payment.refundAmount || payment.amount} for booking (${booking.bookingId}) has been processed.`,
    NOTIFICATION_TYPES.PAYMENT_REFUNDED,
    { paymentId: payment._id, bookingId: booking._id }
  );
};

// ---------------------------------------------------------------------------
// Socket broadcast helper
// ---------------------------------------------------------------------------

/**
 * broadcastToSocket — emits a Socket.IO event to a specific user's room.
 * If the user is offline, the event is silently dropped (they'll see the
 * notification from the DB on next login).
 *
 * @param {import('socket.io').Server} io     - Socket.IO server instance
 * @param {string}                     userId - Target user ID (room name)
 * @param {string}                     event  - Event name
 * @param {object}                     data   - Event payload
 */
const broadcastToSocket = (io, userId, event, data) => {
  if (!io || !userId || !event) return;
  try {
    io.to(userId.toString()).emit(event, data);
  } catch (error) {
    console.error('[Socket] broadcastToSocket error:', error.message);
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  notifyBookingCreated,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingInProgress,
  notifyBookingRescheduled,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifyPaymentRefunded,
  broadcastToSocket,
};
