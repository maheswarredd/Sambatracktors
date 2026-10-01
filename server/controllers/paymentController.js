import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { getIO } from '../config/socket.js';

// @desc    Get payment settings (Admin UPI ID, QR code)
// @route   GET /api/payments/settings
// @access  Public
export const getPaymentSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'PAYMENT_SETTINGS' });
    if (!setting) {
      setting = {
        value: {
          upiId: 'sambatractors@okaxis',
          accountHolder: 'Samba Tractors Agricultural Services',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=sambatractors@okaxis%26pn=Samba%20Tractors%26cu=INR',
          supportPhone: '+91 98480 12345'
        }
      };
    }
    res.json({ success: true, data: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Farmer submits online payment proof (UTR + screenshot)
// @route   POST /api/payments/submit
// @access  Private (Farmer)
export const submitPaymentProof = async (req, res) => {
  try {
    const { bookingId, transactionId } = req.body;
    let screenshotUrl = '';

    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.screenshotUrl) {
      screenshotUrl = req.body.screenshotUrl;
    }

    if (!bookingId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Transaction UTR ID are compulsory.'
      });
    }

    const booking = await Booking.findOne({
      $or: [{ _id: bookingId }, { bookingId: bookingId }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const payment = await Payment.create({
      booking: booking._id,
      bookingId: booking.bookingId,
      farmer: req.user._id,
      amount: booking.totalAmount,
      paymentMethod: 'ONLINE',
      transactionId,
      screenshotUrl,
      status: 'PENDING'
    });

    // Update booking details
    booking.paymentStatus = 'PENDING';
    booking.status = 'PAYMENT_PENDING';
    booking.paymentDetails = {
      transactionId,
      screenshotUrl,
      submittedAt: new Date()
    };
    booking.statusTimeline.push({
      status: 'PAYMENT_PENDING',
      timestamp: new Date(),
      note: `Online payment submitted. UTR: ${transactionId}. Awaiting Admin verification.`
    });
    await booking.save();

    // Notify Admin via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.emit('payment_submitted', {
          bookingId: booking.bookingId,
          transactionId,
          amount: booking.totalAmount
        });
      }
    } catch (e) {
      console.warn('Socket error:', e.message);
    }

    // In-app notification
    await Notification.create({
      recipient: req.user._id,
      booking: booking._id,
      bookingId: booking.bookingId,
      type: 'PAYMENT_SUBMITTED',
      title: {
        te: 'చెల్లింపు సమర్పించబడింది',
        en: 'Payment Submitted for Verification',
        hi: 'भुगतान सत्यापन के लिए प्रस्तुत'
      },
      message: {
        te: `UTR: ${transactionId} విజయవంతంగా సమర్పించబడింది. అడ్మిన్ త్వరలోనే పరిశీలిస్తారు.`,
        en: `UTR: ${transactionId} received. Samba Admin is verifying your payment.`,
        hi: `UTR: ${transactionId} प्राप्त हुआ। एडमिन जल्द ही सत्यापित करेंगे।`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment proof submitted successfully! Verification is pending.',
      data: { payment, booking }
    });
  } catch (error) {
    console.error('Payment submit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Verify or Reject online payment
// @route   POST /api/payments/:id/verify
// @access  Private (Admin)
export const verifyPayment = async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'ACCEPT' or 'REJECT'
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    const io = getIO();

    if (action === 'ACCEPT') {
      payment.status = 'VERIFIED';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();
      await payment.save();

      booking.paymentStatus = 'VERIFIED';
      booking.status = booking.rider ? 'RIDER_ASSIGNED' : 'CONFIRMED';
      booking.statusTimeline.push({
        status: 'PAYMENT_VERIFIED',
        timestamp: new Date(),
        note: `Online payment approved and verified by Admin. Notes: ${notes || 'Verified with bank record'}`
      });
      await booking.save();

      // Emit to room
      if (io) {
        io.to(`booking_${booking._id}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: booking.status,
          paymentStatus: 'VERIFIED'
        });
      }

      await Notification.create({
        recipient: booking.farmer,
        booking: booking._id,
        bookingId: booking.bookingId,
        type: 'PAYMENT_ACCEPTED',
        title: {
          te: 'చెల్లింపు ఆమోదించబడింది! 🎉',
          en: 'Payment Accepted & Verified! 🎉',
          hi: 'भुगतान स्वीकृत एवं सत्यापित! 🎉'
        },
        message: {
          te: `మీ ₹${payment.amount} చెల్లింపు ఆమోదించబడింది. మీ బుకింగ్ ఖరారైంది!`,
          en: `Your ₹${payment.amount} payment was verified. Booking is now confirmed!`,
          hi: `आपका ₹${payment.amount} का भुगतान सत्यापित हो गया है। बुकिंग पुष्ट है!`
        }
      });

      return res.json({
        success: true,
        message: 'Payment verified and booking confirmed successfully!',
        data: { payment, booking }
      });
    } else if (action === 'REJECT') {
      payment.status = 'REJECTED';
      payment.rejectionReason = notes || 'Transaction ID not matching or invalid screenshot';
      await payment.save();

      booking.paymentStatus = 'REJECTED';
      booking.statusTimeline.push({
        status: 'PAYMENT_REJECTED',
        timestamp: new Date(),
        note: `Payment rejected by Admin. Reason: ${notes || 'Invalid details'}`
      });
      await booking.save();

      if (io) {
        io.to(`booking_${booking._id}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: booking.status,
          paymentStatus: 'REJECTED'
        });
      }

      await Notification.create({
        recipient: booking.farmer,
        booking: booking._id,
        bookingId: booking.bookingId,
        type: 'PAYMENT_REJECTED',
        title: {
          te: 'చెల్లింపు తిరస్కరించబడింది ⚠️',
          en: 'Payment Rejected ⚠️',
          hi: 'भुगतान अस्वीकृत ⚠️'
        },
        message: {
          te: `మీ చెల్లింపు తిరస్కరించబడింది. కారణం: ${notes || 'తప్పుడు వివరాలు'}. దయచేసి సరైన రసీదు పంపండి.`,
          en: `Your payment was rejected: ${notes || 'Invalid UTR/Screenshot'}. Please resubmit valid proof.`,
          hi: `आपका भुगतान अस्वीकृत हुआ: ${notes || 'अमान्य प्रमाण'}. कृपया पुनः सही प्रमाण भेजें।`
        }
      });

      return res.json({
        success: true,
        message: 'Payment rejected. Farmer has been notified.',
        data: { payment, booking }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be ACCEPT or REJECT.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rider / Admin marks offline cash collected
// @route   POST /api/payments/:id/collect-cash
// @access  Private (Rider / Admin)
export const collectCash = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.paymentStatus = 'COMPLETED';
    booking.status = 'PAYMENT_COMPLETED';
    booking.paymentDetails.cashCollectedAt = new Date();
    booking.statusTimeline.push({
      status: 'PAYMENT_COMPLETED',
      timestamp: new Date(),
      note: `Cash ₹${booking.totalAmount} collected by ${req.user.name} (${req.user.role}). Service fully closed.`
    });
    await booking.save();

    await Payment.create({
      booking: booking._id,
      bookingId: booking.bookingId,
      farmer: booking.farmer,
      amount: booking.totalAmount,
      paymentMethod: 'OFFLINE',
      status: 'COMPLETED',
      cashCollectedBy: req.user._id,
      cashCollectedAt: new Date()
    });

    const io = getIO();
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_status_updated', {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: 'COMPLETED'
      });
    }

    res.json({
      success: true,
      message: 'Cash payment collected and confirmed successfully!',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
