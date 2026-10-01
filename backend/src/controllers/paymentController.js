import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../config/constants.js';
import { emitToAdmin, emitToBooking, emitToUser } from '../config/socket.js';

// @desc    Submit Online Payment (Transaction ID + Screenshot)
// @route   POST /api/payments/submit
// @access  Private (Farmer)
export const submitOnlinePayment = async (req, res, next) => {
  try {
    const { bookingId, transactionId } = req.body;

    if (!bookingId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Transaction/UTR ID are required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    let screenshotUrl = '';
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    // Update booking payment details
    booking.paymentMethod = PAYMENT_METHODS.ONLINE;
    booking.paymentStatus = PAYMENT_STATUSES.PENDING;
    booking.status = BOOKING_STATUSES.PAYMENT_PENDING;
    booking.paymentDetails.transactionId = transactionId.trim();
    if (screenshotUrl) {
      booking.paymentDetails.screenshotUrl = screenshotUrl;
    }

    booking.timeline.push({
      status: BOOKING_STATUSES.PAYMENT_PENDING,
      timestamp: new Date(),
      note: `Online payment submitted. Transaction ID: ${transactionId}. Awaiting Admin inspection.`,
      updatedBy: req.user._id
    });

    await booking.save();

    // Create or update Payment record
    let payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
      payment.transactionId = transactionId.trim();
      if (screenshotUrl) payment.screenshotUrl = screenshotUrl;
      payment.status = PAYMENT_STATUSES.PENDING;
      payment.rejectionReason = '';
      await payment.save();
    } else {
      payment = await Payment.create({
        booking: booking._id,
        farmer: req.user._id,
        amount: booking.totalAmount,
        method: PAYMENT_METHODS.ONLINE,
        status: PAYMENT_STATUSES.PENDING,
        transactionId: transactionId.trim(),
        screenshotUrl
      });
    }

    // Real-time alert to Admin
    emitToAdmin('payment_submitted_alert', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      amount: booking.totalAmount,
      transactionId,
      farmerName: booking.farmerName
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully. Admin will verify shortly.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Verify or Reject Online Payment
// @route   POST /api/payments/verify
// @access  Private (Admin)
export const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, action, rejectionReason } = req.body; // action: 'ACCEPT' or 'REJECT'

    const booking = await Booking.findById(bookingId).populate('farmer');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const payment = await Payment.findOne({ booking: booking._id });

    if (action === 'ACCEPT') {
      booking.paymentStatus = PAYMENT_STATUSES.VERIFIED;
      // If no rider assigned yet, status becomes CONFIRMED, ready for dispatch
      booking.status = booking.assignedRider ? BOOKING_STATUSES.RIDER_ASSIGNED : BOOKING_STATUSES.CONFIRMED;
      booking.paymentDetails.verifiedBy = req.user._id;
      booking.paymentDetails.verifiedAt = new Date();
      booking.paymentDetails.rejectionReason = '';

      booking.timeline.push({
        status: BOOKING_STATUSES.PAYMENT_VERIFIED,
        timestamp: new Date(),
        note: `Online payment of ₹${booking.totalAmount} verified and accepted by Admin.`,
        updatedBy: req.user._id
      });

      if (payment) {
        payment.status = PAYMENT_STATUSES.VERIFIED;
        payment.verifiedBy = req.user._id;
        payment.verifiedAt = new Date();
        await payment.save();
      }

      await booking.save();

      // Create Notification for Farmer
      await Notification.create({
        recipient: booking.farmer._id,
        title: 'Payment Verified & Booking Confirmed!',
        message: `Your payment of ₹${booking.totalAmount} for Booking #${booking.bookingNumber} is verified. Your tractor service is confirmed.`,
        type: 'PAYMENT_ACCEPTED',
        relatedBooking: booking._id
      });

      // Send chat message in booking room
      const chat = await Chat.findOne({ booking: booking._id });
      if (chat) {
        const msg = await Message.create({
          chat: chat._id,
          sender: req.user._id,
          senderRole: 'admin',
          text: `[System Notice]: Your online payment of ₹${booking.totalAmount} (UTR: ${booking.paymentDetails.transactionId}) has been verified and approved by Samba Tractors Admin. Booking is confirmed!`
        });
        emitToBooking(booking._id, 'new_chat_message', msg);
      }

      emitToUser(booking.farmer._id.toString(), 'booking_status_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: 'Payment verified! Booking confirmed.'
      });

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully. Booking is now confirmed.',
        data: booking
      });
    } else if (action === 'REJECT') {
      booking.paymentStatus = PAYMENT_STATUSES.REJECTED;
      booking.paymentDetails.rejectionReason = rejectionReason || 'Invalid Transaction ID / Screenshot did not match receipt.';

      booking.timeline.push({
        status: 'PAYMENT_REJECTED',
        timestamp: new Date(),
        note: `Payment rejected by Admin. Reason: ${booking.paymentDetails.rejectionReason}`,
        updatedBy: req.user._id
      });

      if (payment) {
        payment.status = PAYMENT_STATUSES.REJECTED;
        payment.rejectionReason = booking.paymentDetails.rejectionReason;
        await payment.save();
      }

      await booking.save();

      // Create Notification for Farmer
      await Notification.create({
        recipient: booking.farmer._id,
        title: 'Payment Verification Failed',
        message: `Your payment proof for Booking #${booking.bookingNumber} was rejected: ${booking.paymentDetails.rejectionReason}. Please re-submit valid payment proof.`,
        type: 'PAYMENT_REJECTED',
        relatedBooking: booking._id
      });

      // Send rejection notice in booking chat
      const chat = await Chat.findOne({ booking: booking._id });
      if (chat) {
        const msg = await Message.create({
          chat: chat._id,
          sender: req.user._id,
          senderRole: 'admin',
          text: `[Payment Alert]: Payment verification failed for Booking #${booking.bookingNumber}. Reason: ${booking.paymentDetails.rejectionReason}. Please click 'Submit Payment Proof' to enter correct transaction details.`
        });
        emitToBooking(booking._id, 'new_chat_message', msg);
      }

      emitToUser(booking.farmer._id.toString(), 'booking_status_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: `Payment rejected: ${booking.paymentDetails.rejectionReason}`
      });

      return res.status(200).json({
        success: true,
        message: 'Payment rejected. Farmer notified to re-submit proof.',
        data: booking
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be ACCEPT or REJECT.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Offline/Cash Payment as Collected (Rider or Admin)
// @route   POST /api/payments/cash-collected
// @access  Private (Rider / Admin)
export const markCashCollected = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.paymentStatus = PAYMENT_STATUSES.COMPLETED;
    booking.status = BOOKING_STATUSES.PAYMENT_COMPLETED;
    booking.paymentDetails.cashCollectedAt = new Date();
    booking.paymentDetails.cashCollectedBy = req.user._id;

    booking.timeline.push({
      status: BOOKING_STATUSES.PAYMENT_COMPLETED,
      timestamp: new Date(),
      note: `Cash amount of ₹${booking.totalAmount} collected in field by ${req.user.name}.`,
      updatedBy: req.user._id
    });

    await booking.save();

    // Create or update Payment
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        booking: booking._id,
        farmer: booking.farmer,
        amount: booking.totalAmount,
        method: PAYMENT_METHODS.CASH,
        status: PAYMENT_STATUSES.COMPLETED,
        notes: `Collected in cash by ${req.user.name}`
      },
      { upsert: true, new: true }
    );

    // Notify farmer
    await Notification.create({
      recipient: booking.farmer,
      title: 'Cash Payment Received',
      message: `Cash payment of ₹${booking.totalAmount} for Booking #${booking.bookingNumber} was received. Digital receipt is ready.`,
      type: 'SERVICE_COMPLETED',
      relatedBooking: booking._id
    });

    emitToBooking(booking._id, 'booking_status_updated', {
      bookingId: booking._id,
      status: booking.status,
      message: 'Cash payment confirmed and recorded.'
    });

    res.status(200).json({
      success: true,
      message: 'Cash payment confirmed successfully.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
