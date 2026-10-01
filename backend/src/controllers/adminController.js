import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, ROLES } from '../config/constants.js';
import { emitToBooking, emitToUser } from '../config/socket.js';

// @desc    Get Comprehensive Admin Analytics & Stats
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalFarmers,
      totalRiders,
      totalTractors,
      allBookings,
      allPayments,
      allServices
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.FARMER }),
      User.countDocuments({ role: ROLES.RIDER }),
      Tractor.countDocuments(),
      Booking.find(),
      Payment.find(),
      Service.find()
    ]);

    let totalRevenue = 0;
    let totalAcresServiced = 0;
    let todayBookingsCount = 0;
    let pendingBookingsCount = 0;
    let confirmedBookingsCount = 0;
    let completedBookingsCount = 0;
    let cancelledBookingsCount = 0;
    let onlineBookingsCount = 0;
    let offlineBookingsCount = 0;

    const serviceDistribution = {};
    allServices.forEach(s => {
      serviceDistribution[s.name] = { count: 0, revenue: 0, acres: 0 };
    });

    allBookings.forEach((b) => {
      if (b.bookingDate === todayStr) {
        todayBookingsCount++;
      }

      if ([BOOKING_STATUSES.PENDING, BOOKING_STATUSES.PAYMENT_PENDING].includes(b.status)) {
        pendingBookingsCount++;
      }
      if ([BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.RIDER_ASSIGNED, BOOKING_STATUSES.RIDER_ON_THE_WAY, BOOKING_STATUSES.ARRIVED, BOOKING_STATUSES.SERVICE_STARTED].includes(b.status)) {
        confirmedBookingsCount++;
      }
      if ([BOOKING_STATUSES.SERVICE_COMPLETED, BOOKING_STATUSES.PAYMENT_COMPLETED, BOOKING_STATUSES.CLOSED].includes(b.status)) {
        completedBookingsCount++;
        totalAcresServiced += b.acres || 0;
      }
      if ([BOOKING_STATUSES.CANCELLED, BOOKING_STATUSES.REFUND_COMPLETED].includes(b.status)) {
        cancelledBookingsCount++;
      }

      if (b.paymentMethod === PAYMENT_METHODS.ONLINE) {
        onlineBookingsCount++;
      } else {
        offlineBookingsCount++;
      }

      // Count revenue for completed/verified
      if (b.paymentStatus === PAYMENT_STATUSES.VERIFIED || b.paymentStatus === PAYMENT_STATUSES.COMPLETED) {
        totalRevenue += b.totalAmount || 0;
      }

      if (serviceDistribution[b.serviceName]) {
        serviceDistribution[b.serviceName].count++;
        serviceDistribution[b.serviceName].acres += b.acres || 0;
        if (b.paymentStatus === PAYMENT_STATUSES.VERIFIED || b.paymentStatus === PAYMENT_STATUSES.COMPLETED) {
          serviceDistribution[b.serviceName].revenue += b.totalAmount || 0;
        }
      }
    });

    const pendingPaymentsCount = allBookings.filter(b => b.paymentStatus === PAYMENT_STATUSES.PENDING && b.paymentMethod === PAYMENT_METHODS.ONLINE).length;
    const verifiedPaymentsCount = allBookings.filter(b => b.paymentStatus === PAYMENT_STATUSES.VERIFIED).length;

    // Recent 10 bookings
    const recentBookings = await Booking.find()
      .populate('farmer', 'name phone email')
      .populate('service', 'name code')
      .populate('assignedRider', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFarmers,
          totalRiders,
          totalTractors,
          totalBookings: allBookings.length,
          todayBookings: todayBookingsCount,
          pendingBookings: pendingBookingsCount,
          confirmedBookings: confirmedBookingsCount,
          completedBookings: completedBookingsCount,
          cancelledBookings: cancelledBookingsCount,
          pendingPayments: pendingPaymentsCount,
          verifiedPayments: verifiedPaymentsCount,
          onlinePaymentsCount,
          offlinePaymentsCount,
          totalRevenue,
          totalAcresServiced
        },
        serviceDistribution,
        recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Bookings with Filter & Search
// @route   GET /api/admin/bookings
// @access  Private (Admin)
export const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const { status, paymentMethod, paymentStatus, search, date } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (date) filter.bookingDate = date;
    if (search) {
      filter.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { farmerName: { $regex: search, $options: 'i' } },
        { farmerPhone: { $regex: search, $options: 'i' } },
        { 'farmLocation.address': { $regex: search, $options: 'i' } },
        { 'farmLocation.landmark': { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('farmer', 'name email phone')
      .populate('service', 'name code pricePerAcre')
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

// @desc    Assign Rider & Tractor to Booking (With Double-Booking Prevention!)
// @route   PUT /api/admin/bookings/:id/assign
// @access  Private (Admin)
export const assignFleetToBooking = async (req, res, next) => {
  try {
    const { riderId, tractorId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!riderId || !tractorId) {
      return res.status(400).json({
        success: false,
        message: 'Both Rider and Tractor must be selected for assignment'
      });
    }

    // CHECK DOUBLE BOOKING: Check if this rider or tractor is already booked on the same date and timeSlot
    const activeConflictStatuses = [
      BOOKING_STATUSES.CONFIRMED,
      BOOKING_STATUSES.RIDER_ASSIGNED,
      BOOKING_STATUSES.RIDER_ON_THE_WAY,
      BOOKING_STATUSES.ARRIVED,
      BOOKING_STATUSES.SERVICE_STARTED
    ];

    const riderConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      assignedRider: riderId,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      status: { $in: activeConflictStatuses }
    });

    if (riderConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: This Rider is already assigned to Booking #${riderConflict.bookingNumber} on ${booking.bookingDate} during ${booking.timeSlot}. Please select another rider or time slot.`
      });
    }

    const tractorConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      assignedTractor: tractorId,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      status: { $in: activeConflictStatuses }
    });

    if (tractorConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: This Tractor is already assigned to Booking #${tractorConflict.bookingNumber} on ${booking.bookingDate} during ${booking.timeSlot}. Please select another tractor.`
      });
    }

    const rider = await User.findById(riderId);
    const tractor = await Tractor.findById(tractorId);

    if (!rider || !tractor) {
      return res.status(404).json({
        success: false,
        message: 'Selected Rider or Tractor could not be found'
      });
    }

    booking.assignedRider = rider._id;
    booking.assignedTractor = tractor._id;
    booking.status = BOOKING_STATUSES.RIDER_ASSIGNED;

    booking.timeline.push({
      status: BOOKING_STATUSES.RIDER_ASSIGNED,
      timestamp: new Date(),
      note: `Assigned Rider ${rider.name} and Tractor ${tractor.modelName} (${tractor.registrationNumber}).`,
      updatedBy: req.user._id
    });

    await booking.save();

    // Mark tractor status
    tractor.status = 'IN_SERVICE';
    await tractor.save();

    // Ensure chat participant includes rider
    const chat = await Chat.findOne({ booking: booking._id });
    if (chat && !chat.participants.includes(rider._id)) {
      chat.participants.push(rider._id);
      await chat.save();
    }

    // Notify Rider
    await Notification.create({
      recipient: rider._id,
      title: 'New Tractor Job Assigned',
      message: `You have been assigned to Farm Booking #${booking.bookingNumber} for ${booking.farmerName} (${booking.acres} acres of ${booking.serviceName}) on ${booking.bookingDate} (${booking.timeSlot}).`,
      type: 'RIDER_ASSIGNED',
      relatedBooking: booking._id
    });

    // Notify Farmer
    await Notification.create({
      recipient: booking.farmer,
      title: 'Tractor Fleet Assigned',
      message: `Rider ${rider.name} has been assigned to your farm with Tractor ${tractor.modelName} (${tractor.registrationNumber}).`,
      type: 'RIDER_ASSIGNED',
      relatedBooking: booking._id
    });

    // Real-time updates
    emitToUser(rider._id.toString(), 'new_job_assigned', { bookingId: booking._id });
    emitToBooking(booking._id, 'booking_status_updated', {
      bookingId: booking._id,
      status: booking.status,
      message: `Rider ${rider.name} assigned with Tractor ${tractor.modelName}`
    });

    res.status(200).json({
      success: true,
      message: 'Rider and Tractor assigned successfully without any scheduling conflict!',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Manage Users (Farmers & Riders)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .populate('riderDetails.currentTractor')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Create Rider User
// @route   POST /api/admin/riders
// @access  Private (Admin)
export const createRiderAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password, licenseNumber, experienceYears } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const rider = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: password || 'rider123',
      role: ROLES.RIDER,
      riderDetails: {
        licenseNumber: licenseNumber || '',
        experienceYears: Number(experienceYears) || 2,
        isAvailable: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tractor Rider created successfully',
      data: rider
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle User Active / Deactivate
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (Admin)
export const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get / Update System & UPI Settings
// @route   GET & PUT /api/admin/settings
// @access  Private (Admin)
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = await Setting.create({
        key: 'main_settings',
        upiId: 'sambatractors@upi',
        upiPayeeName: 'Samba Tractors Agricultural Services',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dsambatractors%40upi%26pn%3DSamba%20Tractors%26cu%3DINR',
        supportPhone: '+91 98420 56789',
        supportEmail: 'support@sambatractors.com'
      });
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { upiId, upiPayeeName, supportPhone, supportEmail, workingHours, qrCodeUrl: bodyQr } = req.body;
    let settings = await Setting.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = new Setting({ key: 'main_settings' });
    }

    if (upiId) settings.upiId = upiId.trim();
    if (upiPayeeName) settings.upiPayeeName = upiPayeeName.trim();
    if (supportPhone) settings.supportPhone = supportPhone.trim();
    if (supportEmail) settings.supportEmail = supportEmail.trim();
    if (workingHours) settings.workingHours = workingHours.trim();

    if (req.file) {
      settings.qrCodeUrl = `/uploads/${req.file.filename}`;
    } else if (bodyQr) {
      settings.qrCodeUrl = bodyQr;
    } else if (upiId) {
      // Auto-generate UPI QR Code URL
      settings.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(settings.upiId)}%26pn%3D${encodeURIComponent(settings.upiPayeeName)}%26cu%3DINR`;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'UPI QR and system settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
