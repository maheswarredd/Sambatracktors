import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

// @desc    Get bookings assigned to logged-in rider
// @route   GET /api/rider/bookings
// @access  Private (Rider)
export const getRiderBookings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allRiderBookings = await Booking.find({ rider: req.user._id })
      .populate('farmer', 'name phone email village address')
      .populate('tractor', 'name registrationNumber hp')
      .sort({ bookingDate: 1, createdAt: -1 });

    const todaysBookings = allRiderBookings.filter(b => {
      const d = new Date(b.bookingDate);
      return d >= today && d < tomorrow && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(b.status);
    });

    const upcomingBookings = allRiderBookings.filter(b => {
      const d = new Date(b.bookingDate);
      return d >= tomorrow && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(b.status);
    });

    const completedBookings = allRiderBookings.filter(b => {
      return ['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(b.status);
    });

    res.json({
      success: true,
      data: {
        todays: todaysBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
        all: allRiderBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking workflow status by Rider
// @route   PATCH /api/rider/bookings/:id/status
// @access  Private (Rider)
export const updateBookingStatusByRider = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = [
      'RIDER_ON_THE_WAY',
      'ARRIVED',
      'SERVICE_STARTED',
      'SERVICE_COMPLETED'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition for rider. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      rider: req.user._id
    }).populate('farmer', 'name phone email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or not assigned to you' });
    }

    booking.status = status;
    booking.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status} by Rider ${req.user.name}`
    });

    if (status === 'SERVICE_STARTED') {
      booking.serviceStartedAt = new Date();
    }
    if (status === 'SERVICE_COMPLETED') {
      booking.serviceCompletedAt = new Date();
      // If payment was already verified online, mark payment completed
      if (booking.paymentMethod === 'ONLINE' && booking.paymentStatus === 'VERIFIED') {
        booking.paymentStatus = 'COMPLETED';
        booking.status = 'PAYMENT_COMPLETED';
      }
    }

    await booking.save();

    // Multilingual Notification for Farmer
    const statusMessages = {
      RIDER_ON_THE_WAY: {
        title: { te: 'డ్రైవర్ బయలుదేరాడు 🚜', en: 'Rider On The Way 🚜', hi: 'ड्राइवर रास्ते में है 🚜' },
        message: {
          te: `మీ ట్రాక్టర్ డ్రైవర్ ${req.user.name} మీ పొలానికి బయలుదేరాడు.`,
          en: `Your tractor rider ${req.user.name} is on the way to your farm.`,
          hi: `आपका ट्रैक्टर ड्राइवर ${req.user.name} आपके खेत के लिए निकल चुका है।`
        }
      },
      ARRIVED: {
        title: { te: 'ట్రాక్టర్ పొలానికి చేరుకుంది 📍', en: 'Tractor Arrived at Farm 📍', hi: 'ट्रैक्टर खेत पर पहुंच गया 📍' },
        message: {
          te: `ట్రాక్టర్ మీ పొలం వద్దకు చేరుకుంది. దయచేసి డ్రైవర్‌ను కలవండి.`,
          en: `Tractor has arrived at your farm gate/landmark. Please guide the rider.`,
          hi: `ट्रैक्टर आपके खेत के लैंडमार्क पर पहुंच गया है। कृपया ड्राइवर से मिलें।`
        }
      },
      SERVICE_STARTED: {
        title: { te: 'పని ప్రారంభమైంది ⚙️', en: 'Farming Service Started ⚙️', hi: 'खेत का कार्य शुरू हुआ ⚙️' },
        message: {
          te: `మీ ${booking.serviceSnapshot.name.te} పని ప్రారంభమైంది.`,
          en: `Service for ${booking.serviceSnapshot.name.en} has started.`,
          hi: `आपकी ${booking.serviceSnapshot.name.hi} का कार्य शुरू हो गया है।`
        }
      },
      SERVICE_COMPLETED: {
        title: { te: 'పని పూర్తయింది! 🌾', en: 'Service Completed! 🌾', hi: 'कार्य सफलतापूर्वक पूर्ण! 🌾' },
        message: {
          te: `మీ ${booking.serviceSnapshot.name.te} పని పూర్తయింది. దయచేసి రేటింగ్ ఇవ్వండి!`,
          en: `Tractor service successfully completed. Please leave your rating and feedback!`,
          hi: `ट्रैक्टर सेवा सफलतापूर्वक पूर्ण हो गई। कृपया अपनी रेटिंग दें!`
        }
      }
    };

    const msgConfig = statusMessages[status];
    if (msgConfig) {
      await Notification.create({
        recipient: booking.farmer._id,
        booking: booking._id,
        bookingId: booking.bookingId,
        type: status,
        title: msgConfig.title,
        message: msgConfig.message
      });
    }

    // Socket.IO real time emit
    try {
      const io = getIO();
      if (io) {
        io.to(`booking_${booking._id}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: booking.status,
          updatedBy: req.user.name
        });
      }
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    res.json({
      success: true,
      message: `Booking updated to ${status}`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
