import Tractor from '../models/Tractor.js';
import User from '../models/User.js';

// @desc    Get all tractors
// @route   GET /api/tractors
// @access  Private (Admin / Rider)
export const getAllTractors = async (req, res, next) => {
  try {
    const tractors = await Tractor.find()
      .populate('assignedRider', 'name email phone riderDetails')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tractors.length,
      data: tractors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tractor
// @route   POST /api/tractors
// @access  Private (Admin)
export const createTractor = async (req, res, next) => {
  try {
    const { registrationNumber, modelName, horsePower, fuelType, implementsSupported, assignedRider } = req.body;

    const existing = await Tractor.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A tractor with this registration number already exists'
      });
    }

    let image = req.body.image || '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const tractor = await Tractor.create({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      modelName,
      horsePower: Number(horsePower),
      fuelType: fuelType || 'Diesel',
      implementsSupported: implementsSupported ? (Array.isArray(implementsSupported) ? implementsSupported : implementsSupported.split(',').map(i => i.trim())) : [],
      assignedRider: assignedRider || null,
      image: image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
      status: assignedRider ? 'IN_SERVICE' : 'AVAILABLE'
    });

    if (assignedRider) {
      await User.findByIdAndUpdate(assignedRider, {
        'riderDetails.currentTractor': tractor._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tractor added to fleet successfully',
      data: tractor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tractor
// @route   PUT /api/tractors/:id
// @access  Private (Admin)
export const updateTractor = async (req, res, next) => {
  try {
    const tractor = await Tractor.findById(req.params.id);
    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: 'Tractor not found'
      });
    }

    const { modelName, horsePower, fuelType, implementsSupported, status, assignedRider, isActive } = req.body;

    if (modelName) tractor.modelName = modelName;
    if (horsePower) tractor.horsePower = Number(horsePower);
    if (fuelType) tractor.fuelType = fuelType;
    if (status) tractor.status = status;
    if (isActive !== undefined) tractor.isActive = Boolean(isActive);
    if (implementsSupported) {
      tractor.implementsSupported = Array.isArray(implementsSupported) ? implementsSupported : implementsSupported.split(',').map(i => i.trim());
    }

    if (req.file) {
      tractor.image = `/uploads/${req.file.filename}`;
    }

    // Handle rider assignment change
    if (assignedRider !== undefined) {
      const oldRider = tractor.assignedRider;
      tractor.assignedRider = assignedRider || null;
      if (oldRider && oldRider.toString() !== assignedRider) {
        await User.findByIdAndUpdate(oldRider, { 'riderDetails.currentTractor': null });
      }
      if (assignedRider) {
        await User.findByIdAndUpdate(assignedRider, { 'riderDetails.currentTractor': tractor._id });
        tractor.status = 'IN_SERVICE';
      }
    }

    await tractor.save();

    res.status(200).json({
      success: true,
      message: 'Tractor updated successfully',
      data: tractor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tractor
// @route   DELETE /api/tractors/:id
// @access  Private (Admin)
export const deleteTractor = async (req, res, next) => {
  try {
    const tractor = await Tractor.findByIdAndDelete(req.params.id);
    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: 'Tractor not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Tractor removed from fleet'
    });
  } catch (error) {
    next(error);
  }
};
