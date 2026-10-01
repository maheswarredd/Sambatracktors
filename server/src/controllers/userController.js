const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Booking = require('../../models/Booking');

// @desc    Get all farmers with pagination/search (admin)
// @route   GET /api/admin/users/farmers
// @access  Admin
const getAllFarmers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { role: 'farmer' };
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: regex }, { email: regex }, { mobile: regex }];
    }

    const [farmers, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        farmers,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getAllFarmers error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching farmers.' });
  }
};

// @desc    Get all riders with pagination/search (admin)
// @route   GET /api/admin/users/riders
// @access  Admin
const getAllRiders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { role: 'rider' };
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: regex }, { email: regex }, { mobile: regex }];
    }

    const [riders, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        riders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getAllRiders error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching riders.' });
  }
};

// @desc    Create a new rider account (admin)
// @route   POST /api/admin/users/riders
// @access  Admin
const createRider = async (req, res) => {
  try {
    const { fullName, email, password, mobile, address, licenseNumber } = req.body;

    if (!fullName || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, password, and mobile are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const rider = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      mobile: mobile.trim(),
      address: address || '',
      licenseNumber: licenseNumber || '',
      role: 'rider',
      isActive: true,
    });

    const riderData = rider.toObject();
    delete riderData.password;

    return res.status(201).json({
      success: true,
      message: 'Rider account created successfully.',
      data: { rider: riderData },
    });
  } catch (error) {
    console.error('createRider error:', error);
    return res.status(500).json({ success: false, error: 'Server error creating rider.' });
  }
};

// @desc    Update any user (admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile, address, licenseNumber } = req.body;

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName.trim();
    if (mobile) updateFields.mobile = mobile.trim();
    if (address !== undefined) updateFields.address = address;
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating user.' });
  }
};

// @desc    Toggle user active status (admin)
// @route   PATCH /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const statusMsg = user.isActive ? 'activated' : 'deactivated';
    return res.status(200).json({
      success: true,
      message: `User ${statusMsg} successfully.`,
      data: { user },
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    return res.status(500).json({ success: false, error: 'Server error toggling user status.' });
  }
};

// @desc    Get full user details by ID (admin)
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching user.' });
  }
};

// @desc    Get all bookings for a specific farmer (admin)
// @route   GET /api/admin/users/farmers/:id/bookings
// @access  Admin
const getFarmerBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const farmer = await User.findOne({ _id: id, role: 'farmer' }).select('-password');
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found.' });
    }

    const query = { farmer: id };
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'name pricePerAcre imageUrl')
        .populate('assignedRider', 'fullName mobile')
        .populate('tractor', 'registrationNumber model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        farmer,
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getFarmerBookings error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching farmer bookings.' });
  }
};

// @desc    Get rider stats (admin)
// @route   GET /api/admin/users/riders/:id/stats
// @access  Admin
const getRiderStats = async (req, res) => {
  try {
    const { id } = req.params;

    const rider = await User.findOne({ _id: id, role: 'rider' }).select('-password');
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    const [completedBookings, totalRevenue, allBookings] = await Promise.all([
      Booking.countDocuments({ assignedRider: id, status: 'SERVICE_COMPLETED' }),
      Booking.aggregate([
        { $match: { assignedRider: require('mongoose').Types.ObjectId(id), status: 'PAYMENT_COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.countDocuments({ assignedRider: id }),
    ]);

    // Average rating from reviews
    const Review = require('../../models/Review');
    const ratingData = await Review.aggregate([
      { $match: { rider: require('mongoose').Types.ObjectId(id), isPublished: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const avgRating = ratingData.length > 0 ? ratingData[0].avgRating : 0;
    const reviewCount = ratingData.length > 0 ? ratingData[0].count : 0;

    return res.status(200).json({
      success: true,
      data: {
        rider,
        stats: {
          totalBookings: allBookings,
          completedBookings,
          totalRevenue: revenue,
          averageRating: parseFloat(avgRating.toFixed(2)),
          reviewCount,
        },
      },
    });
  } catch (error) {
    console.error('getRiderStats error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching rider stats.' });
  }
};

module.exports = {
  getAllFarmers,
  getAllRiders,
  createRider,
  updateUser,
  toggleUserStatus,
  getUserById,
  getFarmerBookings,
  getRiderStats,
};
