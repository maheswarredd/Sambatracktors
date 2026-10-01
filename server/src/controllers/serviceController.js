const Service = require('../../models/Service');
const Booking = require('../../models/Booking');

// @desc    Get all active services (public)
// @route   GET /api/services
// @access  Public
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { services, total: services.length },
    });
  } catch (error) {
    console.error('getAllServices error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching services.' });
  }
};

// @desc    Get all services with booking counts (admin)
// @route   GET /api/admin/services
// @access  Admin
const getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    // Attach booking counts
    const servicesWithCounts = await Promise.all(
      services.map(async (service) => {
        const bookingCount = await Booking.countDocuments({ service: service._id });
        const activeBookingCount = await Booking.countDocuments({
          service: service._id,
          status: { $nin: ['CANCELLED'] },
        });
        return {
          ...service.toObject(),
          bookingCount,
          activeBookingCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: { services: servicesWithCounts, total: servicesWithCounts.length },
    });
  } catch (error) {
    console.error('getAllServicesAdmin error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching services.' });
  }
};

// @desc    Create a new service (admin)
// @route   POST /api/admin/services
// @access  Admin
const createService = async (req, res) => {
  try {
    const { name, description, pricePerAcre, unit, category } = req.body;

    if (!name || !description || pricePerAcre === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and price per acre are required.',
      });
    }

    if (isNaN(pricePerAcre) || Number(pricePerAcre) <= 0) {
      return res.status(400).json({ success: false, error: 'Price per acre must be a positive number.' });
    }

    // Image URL from upload middleware or body
    const imageUrl = req.file ? req.file.path : req.body.imageUrl || '';

    const service = await Service.create({
      name: name.trim(),
      description: description.trim(),
      pricePerAcre: Number(pricePerAcre),
      unit: unit || 'acre',
      category: category || 'general',
      imageUrl,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: { service },
    });
  } catch (error) {
    console.error('createService error:', error);
    return res.status(500).json({ success: false, error: 'Server error creating service.' });
  }
};

// @desc    Update a service (admin)
// @route   PUT /api/admin/services/:id
// @access  Admin
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, pricePerAcre, unit, category, imageUrl } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found.' });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description) updateFields.description = description.trim();
    if (pricePerAcre !== undefined) {
      if (isNaN(pricePerAcre) || Number(pricePerAcre) <= 0) {
        return res.status(400).json({ success: false, error: 'Price per acre must be a positive number.' });
      }
      updateFields.pricePerAcre = Number(pricePerAcre);
    }
    if (unit) updateFields.unit = unit;
    if (category) updateFields.category = category;
    if (req.file) updateFields.imageUrl = req.file.path;
    else if (imageUrl) updateFields.imageUrl = imageUrl;

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: { service: updatedService },
    });
  } catch (error) {
    console.error('updateService error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating service.' });
  }
};

// @desc    Delete a service (admin) - soft delete by default
// @route   DELETE /api/admin/services/:id
// @access  Admin
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found.' });
    }

    if (hard === 'true') {
      // Hard delete - check no active bookings
      const activeBookings = await Booking.countDocuments({
        service: id,
        status: { $nin: ['CANCELLED', 'SERVICE_COMPLETED'] },
      });

      if (activeBookings > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete service: ${activeBookings} active booking(s) exist.`,
        });
      }

      await Service.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Service permanently deleted.' });
    }

    // Soft delete
    service.isActive = false;
    service.isDeleted = true;
    await service.save();

    return res.status(200).json({ success: true, message: 'Service deactivated (soft deleted).' });
  } catch (error) {
    console.error('deleteService error:', error);
    return res.status(500).json({ success: false, error: 'Server error deleting service.' });
  }
};

// @desc    Toggle service active status (admin)
// @route   PATCH /api/admin/services/:id/toggle
// @access  Admin
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found.' });
    }

    service.isActive = !service.isActive;
    await service.save();

    const statusMsg = service.isActive ? 'enabled' : 'disabled';
    return res.status(200).json({
      success: true,
      message: `Service ${statusMsg} successfully.`,
      data: { service },
    });
  } catch (error) {
    console.error('toggleServiceStatus error:', error);
    return res.status(500).json({ success: false, error: 'Server error toggling service status.' });
  }
};

// @desc    Get service by ID (public)
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found.' });
    }

    return res.status(200).json({ success: true, data: { service } });
  } catch (error) {
    console.error('getServiceById error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching service.' });
  }
};

module.exports = {
  getAllServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceById,
};
