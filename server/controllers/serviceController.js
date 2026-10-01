import Service from '../models/Service.js';
import { initialServices } from '../seeds/seedData.js';

// @desc    Get all tractor services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
  try {
    const { category, activeOnly } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (activeOnly === 'true' || activeOnly === undefined) {
      // By default return active services for farmers, unless specified activeOnly=false
      if (activeOnly !== 'false') {
        filter.isActive = true;
      }
    }

    let services = await Service.find(filter).sort({ displayOrder: 1, createdAt: 1 });

    // Self-healing check: if database has zero services, automatically seed the exact 29 services
    if (services.length === 0) {
      console.log('No services found in DB, auto-seeding initial exact 29 services...');
      for (const s of initialServices) {
        await Service.findOneAndUpdate({ code: s.code }, { $set: s }, { upsert: true });
      }
      services = await Service.find(filter).sort({ displayOrder: 1 });
    }

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single service by ID or Code
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update service price, details, active state
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req, res) => {
  try {
    const { price, isActive, description, name, image } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (price !== undefined) service.price = Number(price);
    if (isActive !== undefined) service.isActive = Boolean(isActive);
    if (description) service.description = { ...service.description, ...description };
    if (name) service.name = { ...service.name, ...name };
    if (image) service.image = image;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
