const Tractor = require('../../models/Tractor');
const User = require('../../models/User');
const Booking = require('../../models/Booking');

// @desc    Get all tractors with pagination (admin)
// @route   GET /api/admin/tractors
// @access  Admin
const getAllTractors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ registrationNumber: regex }, { model: regex }, { brand: regex }];
    }

    const [tractors, total] = await Promise.all([
      Tractor.find(query)
        .populate('assignedRider', 'fullName mobile email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Tractor.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        tractors,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getAllTractors error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching tractors.' });
  }
};

// @desc    Create a new tractor (admin)
// @route   POST /api/admin/tractors
// @access  Admin
const createTractor = async (req, res) => {
  try {
    const { registrationNumber, model, brand, yearOfManufacture, horsePower, notes } = req.body;

    if (!registrationNumber || !model || !brand) {
      return res.status(400).json({
        success: false,
        error: 'Registration number, model, and brand are required.',
      });
    }

    // Check duplicate registration
    const existing = await Tractor.findOne({
      registrationNumber: registrationNumber.toUpperCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A tractor with this registration number already exists.',
      });
    }

    const tractor = await Tractor.create({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      model: model.trim(),
      brand: brand.trim(),
      yearOfManufacture: yearOfManufacture || null,
      horsePower: horsePower || null,
      notes: notes || '',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Tractor created successfully.',
      data: { tractor },
    });
  } catch (error) {
    console.error('createTractor error:', error);
    return res.status(500).json({ success: false, error: 'Server error creating tractor.' });
  }
};

// @desc    Update tractor details (admin)
// @route   PUT /api/admin/tractors/:id
// @access  Admin
const updateTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationNumber, model, brand, yearOfManufacture, horsePower, notes } = req.body;

    const tractor = await Tractor.findById(id);
    if (!tractor) {
      return res.status(404).json({ success: false, error: 'Tractor not found.' });
    }

    const updateFields = {};
    if (registrationNumber) {
      const regNum = registrationNumber.toUpperCase().trim();
      // Check duplicate if registration number is changing
      if (regNum !== tractor.registrationNumber) {
        const existing = await Tractor.findOne({ registrationNumber: regNum });
        if (existing) {
          return res.status(409).json({
            success: false,
            error: 'A tractor with this registration number already exists.',
          });
        }
      }
      updateFields.registrationNumber = regNum;
    }
    if (model) updateFields.model = model.trim();
    if (brand) updateFields.brand = brand.trim();
    if (yearOfManufacture !== undefined) updateFields.yearOfManufacture = yearOfManufacture;
    if (horsePower !== undefined) updateFields.horsePower = horsePower;
    if (notes !== undefined) updateFields.notes = notes;

    const updatedTractor = await Tractor.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('assignedRider', 'fullName mobile email');

    return res.status(200).json({
      success: true,
      message: 'Tractor updated successfully.',
      data: { tractor: updatedTractor },
    });
  } catch (error) {
    console.error('updateTractor error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating tractor.' });
  }
};

// @desc    Assign or unassign a rider to/from a tractor (admin)
// @route   PATCH /api/admin/tractors/:id/assign-rider
// @access  Admin
const assignRiderToTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const { riderId } = req.body; // null to unassign

    const tractor = await Tractor.findById(id);
    if (!tractor) {
      return res.status(404).json({ success: false, error: 'Tractor not found.' });
    }

    if (riderId) {
      const rider = await User.findOne({ _id: riderId, role: 'rider', isActive: true });
      if (!rider) {
        return res.status(404).json({ success: false, error: 'Active rider not found.' });
      }

      // Check if rider already has a different tractor assigned
      const existingTractor = await Tractor.findOne({ assignedRider: riderId, _id: { $ne: id } });
      if (existingTractor) {
        return res.status(400).json({
          success: false,
          error: `Rider is already assigned to tractor ${existingTractor.registrationNumber}. Unassign first.`,
        });
      }

      tractor.assignedRider = riderId;
    } else {
      tractor.assignedRider = null;
    }

    await tractor.save();

    const updatedTractor = await Tractor.findById(id).populate('assignedRider', 'fullName mobile email');
    const action = riderId ? 'Rider assigned to tractor' : 'Rider unassigned from tractor';

    return res.status(200).json({
      success: true,
      message: `${action} successfully.`,
      data: { tractor: updatedTractor },
    });
  } catch (error) {
    console.error('assignRiderToTractor error:', error);
    return res.status(500).json({ success: false, error: 'Server error assigning rider.' });
  }
};

// @desc    Toggle tractor active status (admin)
// @route   PATCH /api/admin/tractors/:id/toggle
// @access  Admin
const toggleTractorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const tractor = await Tractor.findById(id);
    if (!tractor) {
      return res.status(404).json({ success: false, error: 'Tractor not found.' });
    }

    tractor.isActive = !tractor.isActive;
    await tractor.save();

    const statusMsg = tractor.isActive ? 'activated' : 'deactivated';
    return res.status(200).json({
      success: true,
      message: `Tractor ${statusMsg} successfully.`,
      data: { tractor },
    });
  } catch (error) {
    console.error('toggleTractorStatus error:', error);
    return res.status(500).json({ success: false, error: 'Server error toggling tractor status.' });
  }
};

// @desc    Get tractors available for a given date/timeSlot (admin)
// @route   GET /api/admin/tractors/available
// @access  Admin
const getAvailableTractors = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'Date and timeSlot are required.' });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format.' });
    }

    // Get tractors already booked for that date/timeSlot (not cancelled)
    const bookedTractors = await Booking.distinct('tractor', {
      scheduledDate: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999)),
      },
      timeSlot,
      status: { $nin: ['CANCELLED'] },
      tractor: { $ne: null },
    });

    // Return active tractors not in bookedTractors list
    const availableTractors = await Tractor.find({
      isActive: true,
      _id: { $nin: bookedTractors },
    }).populate('assignedRider', 'fullName mobile');

    return res.status(200).json({
      success: true,
      data: { tractors: availableTractors, total: availableTractors.length },
    });
  } catch (error) {
    console.error('getAvailableTractors error:', error);
    return res.status(500).json({ success: false, error: 'Server error checking tractor availability.' });
  }
};

module.exports = {
  getAllTractors,
  createTractor,
  updateTractor,
  assignRiderToTractor,
  toggleTractorStatus,
  getAvailableTractors,
};
