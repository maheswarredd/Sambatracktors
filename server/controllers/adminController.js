import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Service from '../models/Service.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

// @desc    Get complete administrative statistics & chart metrics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalFarmers,
      totalRiders,
      totalTractors,
      allBookings,
      allPayments
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'rider' }),
      Tractor.countDocuments(),
      Booking.find().sort({ createdAt: -1 }),
      Payment.find()
    ]);

    let todayBookings = 0;
    let pendingBookings = 0;
    let confirmedBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;
    let totalAcres = 0;
    let totalTrips = 0;

    const categoryStats = {
      SOIL_PLOUGHING: { count: 0, revenue: 0, acres: 0 },
      SEED_SOWING: { count: 0, revenue: 0, acres: 0 },
      TROLLEY_LOAD: { count: 0, revenue: 0, trips: 0 }
    };

    allBookings.forEach((b) => {
      const bDate = new Date(b.bookingDate);
      if (bDate >= today && bDate < tomorrow) {
        todayBookings++;
      }

      if (['PENDING', 'PAYMENT_PENDING'].includes(b.status)) pendingBookings++;
      if (['CONFIRMED', 'RIDER_ASSIGNED', 'RIDER_ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(b.status)) confirmedBookings++;
      if (['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(b.status)) {
        completedBookings++;
        totalRevenue += b.totalAmount || 0;
      }
      if (b.status === 'CANCELLED') cancelledBookings++;

      // Calculations by unit
      if (b.unit === 'Acre') {
        totalAcres += b.quantity;
      } else if (b.unit === 'Trip') {
        totalTrips += b.quantity;
      }

      // Category breakdown
      const cat = b.serviceSnapshot?.category;
      if (cat && categoryStats[cat]) {
        categoryStats[cat].count++;
        categoryStats[cat].revenue += b.totalAmount;
        if (b.unit === 'Acre') categoryStats[cat].acres += b.quantity;
        if (b.unit === 'Trip') categoryStats[cat].trips += b.quantity;
      }
    });

    const pendingPaymentsCount = allPayments.filter(p => p.status === 'PENDING').length;
    const verifiedPaymentsCount = allPayments.filter(p => p.status === 'VERIFIED').length;
    const onlineCount = allBookings.filter(b => b.paymentMethod === 'ONLINE').length;
    const offlineCount = allBookings.filter(b => b.paymentMethod === 'OFFLINE').length;

    res.json({
      success: true,
      data: {
        counts: {
          totalFarmers,
          totalRiders,
          totalTractors,
          todayBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue,
          totalAcres,
          totalTrips,
          pendingPaymentsCount,
          verifiedPaymentsCount,
          onlineCount,
          offlineCount
        },
        categoryStats,
        recentBookings: allBookings.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { farmerName: { $regex: search, $options: 'i' } },
        { farmerPhone: { $regex: search, $options: 'i' } },
        { 'farmLocation.address': { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('farmer', 'name email phone')
      .populate('rider', 'name phone')
      .populate('tractor', 'name registrationNumber hp')
      .populate('service')
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

// @desc    Assign Rider & Tractor to a booking (with double booking check)
// @route   POST /api/admin/bookings/:id/assign
// @access  Private (Admin)
export const assignRiderAndTractor = async (req, res) => {
  try {
    const { riderId, tractorId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== 'rider') {
      return res.status(400).json({ success: false, message: 'Invalid rider selected' });
    }

    const tractor = await Tractor.findById(tractorId);
    if (!tractor) {
      return res.status(400).json({ success: false, message: 'Invalid tractor selected' });
    }

    // Double Booking Prevention: Check if this rider or tractor is already booked for the exact same date and timeSlot
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      status: { $in: ['RIDER_ASSIGNED', 'RIDER_ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'] },
      $or: [{ rider: rider._id }, { tractor: tractor._id }]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: `Double booking conflict! Rider or Tractor is already assigned on ${booking.bookingDate.toISOString().slice(0, 10)} for slot ${booking.timeSlot} in booking #${conflictingBooking.bookingId}`
      });
    }

    booking.rider = rider._id;
    booking.tractor = tractor._id;
    booking.status = 'RIDER_ASSIGNED';
    booking.statusTimeline.push({
      status: 'RIDER_ASSIGNED',
      timestamp: new Date(),
      note: `Rider ${rider.name} and Tractor ${tractor.name} (${tractor.registrationNumber}) assigned by Admin.`
    });
    await booking.save();

    // Multilingual notification for Farmer
    await Notification.create({
      recipient: booking.farmer,
      booking: booking._id,
      bookingId: booking.bookingId,
      type: 'RIDER_ASSIGNED',
      title: {
        te: 'డ్రైవర్ కేటాయించబడ్డాడు 🚜',
        en: 'Rider & Tractor Assigned 🚜',
        hi: 'ड्राइवर और ट्रैक्टर आवंटित 🚜'
      },
      message: {
        te: `మీ బుకింగ్‌కు ${rider.name} (ఫోన్: ${rider.phone}) మరియు ట్రాక్టర్ ${tractor.registrationNumber} కేటాయించబడింది.`,
        en: `Rider ${rider.name} (${rider.phone}) and Tractor ${tractor.name} assigned to your booking.`,
        hi: `आपकी बुकिंग के लिए ड्राइवर ${rider.name} (${rider.phone}) और ट्रैक्टर ${tractor.name} आवंटित किया गया है।`
      }
    });

    // Notification for Rider
    await Notification.create({
      recipient: rider._id,
      booking: booking._id,
      bookingId: booking.bookingId,
      type: 'RIDER_ASSIGNED',
      title: {
        te: 'కొత్త పని కేటాయించబడింది 📋',
        en: 'New Task Assigned 📋',
        hi: 'नया कार्य सौंपा गया 📋'
      },
      message: {
        te: `రైతు: ${booking.farmerName}, సేవ: ${booking.serviceSnapshot.name.te}, గ్రామం: ${booking.farmLocation.village || booking.farmLocation.address}`,
        en: `Farmer: ${booking.farmerName}, Service: ${booking.serviceSnapshot.name.en}, Location: ${booking.farmLocation.address}`,
        hi: `किसान: ${booking.farmerName}, सेवा: ${booking.serviceSnapshot.name.hi}, स्थान: ${booking.farmLocation.address}`
      }
    });

    // Real-time Socket.IO emit
    try {
      const io = getIO();
      if (io) {
        io.to(`booking_${booking._id}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: 'RIDER_ASSIGNED',
          rider: { name: rider.name, phone: rider.phone },
          tractor: { name: tractor.name, registrationNumber: tractor.registrationNumber }
        });
      }
    } catch (e) {
      console.warn('Socket error:', e.message);
    }

    res.json({
      success: true,
      message: 'Rider and Tractor assigned successfully!',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all riders and tractors
// @route   GET /api/admin/resources
// @access  Private (Admin)
export const getAdminResources = async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider' }).populate('assignedTractor');
    const tractors = await Tractor.find().populate('currentRider', 'name phone');
    const payments = await Payment.find().populate('farmer', 'name phone').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        riders,
        tractors,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Rider
// @route   POST /api/admin/riders
// @access  Private (Admin)
export const createRider = async (req, res) => {
  try {
    const { name, email, phone, password, village, assignedTractor } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const rider = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'password123',
      role: 'rider',
      village: village || '',
      assignedTractor: assignedTractor || null
    });

    if (assignedTractor) {
      await Tractor.findByIdAndUpdate(assignedTractor, {
        currentRider: rider._id,
        status: 'assigned'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Rider created successfully',
      data: rider
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Tractor
// @route   POST /api/admin/tractors
// @access  Private (Admin)
export const createTractor = async (req, res) => {
  try {
    const { name, registrationNumber, hp, type } = req.body;
    const existing = await Tractor.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tractor registration number already exists' });
    }

    const tractor = await Tractor.create({
      name,
      registrationNumber: registrationNumber.toUpperCase(),
      hp: Number(hp) || 55,
      type: type || '4WD Agricultural',
      status: 'available',
      image: '/images/hero_banner.jpg'
    });

    res.status(201).json({
      success: true,
      message: 'Tractor registered successfully',
      data: tractor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Settings (UPI ID, QR code)
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    const { upiId, accountHolder, qrCodeUrl, supportPhone } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: 'PAYMENT_SETTINGS' },
      {
        $set: {
          'value.upiId': upiId,
          'value.accountHolder': accountHolder,
          'value.qrCodeUrl': qrCodeUrl,
          'value.supportPhone': supportPhone
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: setting.value
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
