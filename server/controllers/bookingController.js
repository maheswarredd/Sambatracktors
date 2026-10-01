import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';

// Time slot dictionary with labels in all 3 languages
export const TIME_SLOTS = {
  MORNING: {
    te: 'ఉదయం (4:00 AM – 10:00 AM)',
    en: 'Morning (4:00 AM – 10:00 AM)',
    hi: 'सुबह (4:00 AM – 10:00 AM)'
  },
  AFTERNOON: {
    te: 'మధ్యాహ్నం (10:00 AM – 2:00 PM)',
    en: 'Afternoon (10:00 AM – 2:00 PM)',
    hi: 'दोपहर (10:00 AM – 2:00 PM)'
  },
  EVENING: {
    te: 'సాయంత్రం (2:00 PM – 6:00 PM)',
    en: 'Evening (2:00 PM – 6:00 PM)',
    hi: 'शाम (2:00 PM – 6:00 PM)'
  },
  NIGHT: {
    te: 'రాత్రి (6:00 PM – 9:00 PM)',
    en: 'Night (6:00 PM – 9:00 PM)',
    hi: 'रात (6:00 PM – 9:00 PM)'
  }
};

// Generate clean booking ID: STB-YYYYMMDD-XXXX
const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STB-${dateStr}-${rand}`;
};

// @desc    Create a new tractor service booking
// @route   POST /api/bookings
// @access  Private (Farmer)
export const createBooking = async (req, res) => {
  try {
    const {
      farmerName,
      farmerPhone,
      serviceId,
      quantity,
      bookingDate,
      timeSlot,
      farmLocation,
      paymentMethod
    } = req.body;

    // 1. Validation
    if (!farmerName || !farmerPhone || !serviceId || !quantity || !bookingDate || !timeSlot || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Please provide all compulsory booking fields' });
    }

    if (!TIME_SLOTS[timeSlot]) {
      return res.status(400).json({ success: false, message: 'Invalid time slot selected' });
    }

    if (!farmLocation || typeof farmLocation.latitude !== 'number' || typeof farmLocation.longitude !== 'number' || !farmLocation.address) {
      return res.status(400).json({
        success: false,
        message: 'Farm location (coordinates & address) is required.'
      });
    }

    // Check Landmark or Detailed Instructions requirement
    const hasLandmark = farmLocation.landmark && farmLocation.landmark.trim().length > 0;
    const hasInstructions = farmLocation.locationInstructions && farmLocation.locationInstructions.trim().length > 0;
    if (!hasLandmark && !hasInstructions) {
      return res.status(400).json({
        success: false,
        message: 'The landmark is compulsory. If no landmark is available, detailed location instructions must be provided.'
      });
    }

    // 2. Fetch Service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Selected tractor service does not exist' });
    }
    if (!service.isActive) {
      return res.status(400).json({ success: false, message: 'This service is temporarily unavailable.' });
    }

    const numQuantity = Math.max(1, Number(quantity));
    // Exact calculation based on Acre or Trip unit
    const totalAmount = numQuantity * service.price;

    const startOfBookingDay = new Date(bookingDate);
    startOfBookingDay.setHours(0, 0, 0, 0);

    const bookingId = generateBookingId();

    // Determine initial status based on payment method
    let initialStatus = 'PENDING';
    let initialPaymentStatus = 'PENDING';
    if (paymentMethod === 'ONLINE') {
      initialStatus = 'PAYMENT_PENDING';
      initialPaymentStatus = 'PENDING';
    } else {
      // Offline/Cash payment
      initialStatus = 'CONFIRMED';
      initialPaymentStatus = 'PENDING'; // to be collected upon service completion
    }

    const booking = new Booking({
      bookingId,
      farmer: req.user._id,
      farmerName,
      farmerPhone,
      service: service._id,
      serviceSnapshot: {
        code: service.code,
        name: service.name,
        category: service.category,
        unit: service.unit,
        price: service.price
      },
      quantity: numQuantity,
      unit: service.unit,
      unitPrice: service.price,
      totalAmount,
      bookingDate: startOfBookingDay,
      timeSlot,
      timeSlotLabel: TIME_SLOTS[timeSlot],
      farmLocation: {
        latitude: farmLocation.latitude,
        longitude: farmLocation.longitude,
        address: farmLocation.address,
        village: farmLocation.village || '',
        landmark: farmLocation.landmark || '',
        locationInstructions: farmLocation.locationInstructions || ''
      },
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: initialStatus,
      statusTimeline: [
        {
          status: initialStatus,
          timestamp: new Date(),
          note: paymentMethod === 'ONLINE'
            ? 'Booking created. Awaiting online payment proof verification.'
            : 'Booking created and confirmed for cash on delivery.'
        }
      ]
    });

    await booking.save();

    // Emit Socket.IO event to admin and rider rooms
    try {
      const io = getIO();
      if (io) {
        io.emit('new_booking', {
          bookingId: booking.bookingId,
          farmerName: booking.farmerName,
          totalAmount: booking.totalAmount,
          service: booking.serviceSnapshot.name.en,
          status: booking.status
        });
      }
    } catch (socketErr) {
      console.warn('Socket notification error (non-fatal):', socketErr.message);
    }

    // Create In-App Notification for Farmer
    await Notification.create({
      recipient: req.user._id,
      booking: booking._id,
      bookingId: booking.bookingId,
      type: 'BOOKING_CREATED',
      title: {
        te: `బుకింగ్ నమోదైంది #${booking.bookingId}`,
        en: `Booking Created #${booking.bookingId}`,
        hi: `बुकिंग बनाई गई #${booking.bookingId}`
      },
      message: {
        te: `మీ ${service.name.te} బుకింగ్ విజయవంతంగా నమోదైంది. మొత్తం: ₹${totalAmount}`,
        en: `Your booking for ${service.name.en} is placed successfully. Amount: ₹${totalAmount}`,
        hi: `आपकी ${service.name.hi} के लिए बुकिंग सफलतापूर्वक दर्ज की गई है। राशि: ₹${totalAmount}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for logged-in farmer
// @route   GET /api/bookings/my
// @access  Private (Farmer)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ farmer: req.user._id })
      .populate('rider', 'name phone')
      .populate('tractor', 'name registrationNumber hp')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [{ _id: req.params.id }, { bookingId: req.params.id }]
    })
      .populate('farmer', 'name email phone')
      .populate('rider', 'name phone')
      .populate('tractor', 'name registrationNumber hp image')
      .populate('service');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Farmers can only view their own bookings unless admin or assigned rider
    if (
      req.user.role === 'farmer' &&
      booking.farmer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check allowed cancellation states
    const nonCancellable = ['SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED', 'CANCELLED'];
    if (nonCancellable.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking when in status: ${booking.status}`
      });
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledBy = req.user._id;
    booking.statusTimeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: `Booking cancelled: ${reason || 'User request'}`
    });

    if (booking.paymentStatus === 'VERIFIED') {
      booking.status = 'REFUND_REQUESTED';
      booking.statusTimeline.push({
        status: 'REFUND_REQUESTED',
        timestamp: new Date(),
        note: 'Online payment was verified. Automatic refund request generated.'
      });
    }

    await booking.save();

    // Notify farmer / admin
    await Notification.create({
      recipient: booking.farmer,
      booking: booking._id,
      bookingId: booking.bookingId,
      type: 'BOOKING_CANCELLED',
      title: {
        te: `బుకింగ్ రద్దు చేయబడింది #${booking.bookingId}`,
        en: `Booking Cancelled #${booking.bookingId}`,
        hi: `बुकिंग रद्द की गई #${booking.bookingId}`
      },
      message: {
        te: `మీ బుకింగ్ విజయవంతంగా రద్దు చేయబడింది. కారణం: ${reason || 'సహజ రద్దు'}`,
        en: `Your booking was cancelled. Reason: ${reason || 'User requested'}`,
        hi: `आपकी बुकिंग रद्द कर दी गई है। कारण: ${reason || 'उपयोगकर्ता द्वारा अनुरोधित'}`
      }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
