import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Payment from '../models/Payment.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, TIME_SLOTS } from '../config/constants.js';
import { emitToAdmin, emitToBooking, emitToUser } from '../config/socket.js';

// @desc    Create new farm service booking
// @route   POST /api/bookings
// @access  Private (Farmer)
export const createBooking = async (req, res, next) => {
  try {
    const {
      farmerName,
      farmerPhone,
      farmerEmail,
      serviceId,
      acres,
      bookingDate,
      timeSlot,
      farmLocation,
      paymentMethod,
      transactionId
    } = req.body;

    // Validate mandatory fields
    if (!farmerName || !farmerPhone || !serviceId || !acres || !bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'All booking fields (farmer name, mobile, service, acres, date, and time slot) are strictly mandatory.'
      });
    }

    // Validate time slot
    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: `Invalid time slot. Must be one of: ${TIME_SLOTS.join(', ')}`
      });
    }

    // Validate farm location and compulsory landmark
    if (
      !farmLocation ||
      farmLocation.latitude === undefined ||
      farmLocation.longitude === undefined ||
      !farmLocation.address
    ) {
      return res.status(400).json({
        success: false,
        message: 'Farm location with GPS coordinates and address is strictly compulsory.'
      });
    }

    const landmark = farmLocation.landmark?.trim();
    const instructions = farmLocation.locationInstructions?.trim();

    if (!landmark && !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Landmark is strictly compulsory! If your farm has no landmark, please provide detailed location instructions.'
      });
    }

    // Fetch service and lock in the current price per acre
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'The selected tractor service is currently not available.'
      });
    }

    const numericAcres = Number(acres);
    if (numericAcres <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of acres must be greater than zero.'
      });
    }

    const pricePerAcre = service.pricePerAcre;
    const totalAmount = Math.round(numericAcres * pricePerAcre);

    // Generate unique human-readable booking ID
    const bookingNumber = `STB-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

    // Set initial status based on payment method
    let initialStatus = BOOKING_STATUSES.PENDING;
    let initialPaymentStatus = PAYMENT_STATUSES.PENDING;

    if (paymentMethod === PAYMENT_METHODS.ONLINE) {
      initialStatus = BOOKING_STATUSES.PAYMENT_PENDING;
    } else {
      initialStatus = BOOKING_STATUSES.CONFIRMED; // Cash booking confirmed and pending fleet dispatch
    }

    let screenshotUrl = '';
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    const booking = await Booking.create({
      bookingNumber,
      farmer: req.user._id,
      farmerName: farmerName.trim(),
      farmerPhone: farmerPhone.trim(),
      farmerEmail: farmerEmail || req.user.email,
      service: service._id,
      serviceName: service.name,
      acres: numericAcres,
      pricePerAcre, // Permanently saved at booking time!
      totalAmount,
      bookingDate,
      timeSlot,
      farmLocation: {
        latitude: Number(farmLocation.latitude),
        longitude: Number(farmLocation.longitude),
        address: farmLocation.address.trim(),
        village: farmLocation.village ? farmLocation.village.trim() : '',
        landmark: landmark || instructions,
        locationInstructions: instructions || ''
      },
      status: initialStatus,
      paymentMethod: paymentMethod || PAYMENT_METHODS.CASH,
      paymentStatus: initialPaymentStatus,
      paymentDetails: {
        transactionId: transactionId ? transactionId.trim() : '',
        screenshotUrl
      },
      timeline: [
        {
          status: initialStatus,
          timestamp: new Date(),
          note: paymentMethod === PAYMENT_METHODS.ONLINE 
            ? 'Booking created. Payment verification pending.' 
            : 'Booking confirmed via Cash on Completion.',
          updatedBy: req.user._id
        }
      ]
    });

    // Create payment entry if online payment submitted
    if (paymentMethod === PAYMENT_METHODS.ONLINE && (transactionId || screenshotUrl)) {
      await Payment.create({
        booking: booking._id,
        farmer: req.user._id,
        amount: totalAmount,
        method: PAYMENT_METHODS.ONLINE,
        status: PAYMENT_STATUSES.PENDING,
        transactionId: transactionId ? transactionId.trim() : '',
        screenshotUrl
      });
    }

    // Initialize Chat room for Farmer, Rider, and Admin
    await Chat.create({
      booking: booking._id,
      participants: [req.user._id]
    });

    // Notify Admin in real-time
    const adminNotification = await Notification.create({
      recipient: req.user._id, // placeholder, will also emit to admin
      title: 'New Tractor Booking Received',
      message: `Booking #${bookingNumber} for ${service.name} (${numericAcres} acres) from ${farmerName}. Total: ₹${totalAmount.toLocaleString('en-IN')}`,
      type: 'BOOKING_CREATED',
      relatedBooking: booking._id
    });

    emitToAdmin('new_booking_alert', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      farmerName,
      totalAmount,
      serviceName: service.name,
      timeSlot,
      bookingDate
    });

    res.status(201).json({
      success: true,
      message: 'Tractor service booked successfully!',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for logged-in Farmer
// @route   GET /api/bookings/my-bookings
// @access  Private (Farmer)
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ farmer: req.user._id })
      .populate('service', 'name code image')
      .populate('assignedRider', 'name phone riderDetails')
      .populate('assignedTractor', 'modelName registrationNumber horsePower')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('farmer', 'name email phone farmerDetails')
      .populate('service', 'name code description pricePerAcre category image features')
      .populate('assignedRider', 'name phone email riderDetails')
      .populate('assignedTractor', 'modelName registrationNumber horsePower fuelType image');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Role check: Farmer can view only their own bookings; Rider can view only assigned bookings; Admin can view all
    if (
      req.user.role === 'farmer' &&
      booking.farmer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this booking'
      });
    }

    if (
      req.user.role === 'rider' &&
      booking.assignedRider &&
      booking.assignedRider._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Farmer / Admin)
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Farmers can only cancel their own booking
    if (req.user.role === 'farmer' && booking.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking'
      });
    }

    // Check cancellation rules
    const nonCancellable = [
      BOOKING_STATUSES.SERVICE_STARTED,
      BOOKING_STATUSES.SERVICE_COMPLETED,
      BOOKING_STATUSES.PAYMENT_COMPLETED,
      BOOKING_STATUSES.CLOSED,
      BOOKING_STATUSES.CANCELLED
    ];

    if (nonCancellable.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled once status is ${booking.status}. Please contact support.`
      });
    }

    booking.status = BOOKING_STATUSES.CANCELLED;
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      reason: reason || 'Cancelled by farmer'
    };

    booking.timeline.push({
      status: BOOKING_STATUSES.CANCELLED,
      timestamp: new Date(),
      note: `Booking cancelled: ${reason || 'Farmer requested cancellation'}`,
      updatedBy: req.user._id
    });

    // If online payment was already made, trigger refund request
    if (
      booking.paymentMethod === PAYMENT_METHODS.ONLINE &&
      (booking.paymentStatus === PAYMENT_STATUSES.VERIFIED || booking.paymentStatus === PAYMENT_STATUSES.COMPLETED)
    ) {
      booking.status = BOOKING_STATUSES.REFUND_REQUESTED;
      booking.refund = {
        requestedAt: new Date(),
        reason: `Auto-initiated upon cancellation: ${reason || 'Cancelled by farmer'}`,
        amount: booking.totalAmount,
        status: 'REQUESTED'
      };
      booking.timeline.push({
        status: BOOKING_STATUSES.REFUND_REQUESTED,
        timestamp: new Date(),
        note: `Refund of ₹${booking.totalAmount} automatically requested.`,
        updatedBy: req.user._id
      });
    }

    await booking.save();

    // Release tractor and rider
    if (booking.assignedTractor) {
      await Tractor.findByIdAndUpdate(booking.assignedTractor, { status: 'AVAILABLE' });
    }

    // Notify farmer and admin
    emitToBooking(booking._id, 'booking_status_updated', {
      bookingId: booking._id,
      status: booking.status,
      message: `Booking #${booking.bookingNumber} was cancelled.`
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
