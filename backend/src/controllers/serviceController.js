import Service from '../models/Service.js';

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
export const getActiveServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services including inactive (Admin)
// @route   GET /api/services/admin/all
// @access  Private (Admin)
export const getAllServicesAdmin = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service (Admin)
// @route   POST /api/services
// @access  Private (Admin)
export const createService = async (req, res, next) => {
  try {
    const { name, code, description, pricePerAcre, category, minAcres, maxAcres, estimatedHoursPerAcre, features } = req.body;

    const existingCode = await Service.findOne({ code: code?.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Service with code ${code} already exists.`
      });
    }

    let image = req.body.image || '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const service = await Service.create({
      name,
      code: code ? code.toUpperCase() : name.toUpperCase().replace(/\s+/g, '_'),
      description,
      pricePerAcre: Number(pricePerAcre),
      category: category || 'Land Preparation',
      minAcres: Number(minAcres) || 1,
      maxAcres: Number(maxAcres) || 50,
      estimatedHoursPerAcre: Number(estimatedHoursPerAcre) || 1.5,
      features: features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim())) : [],
      image,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Farming service added successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service (Admin)
// @route   PUT /api/services/:id
// @access  Private (Admin)
export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const { name, description, pricePerAcre, category, minAcres, maxAcres, estimatedHoursPerAcre, isActive, features, image: bodyImage } = req.body;

    if (name) service.name = name;
    if (description) service.description = description;
    if (pricePerAcre !== undefined) service.pricePerAcre = Number(pricePerAcre);
    if (category) service.category = category;
    if (minAcres !== undefined) service.minAcres = Number(minAcres);
    if (maxAcres !== undefined) service.maxAcres = Number(maxAcres);
    if (estimatedHoursPerAcre !== undefined) service.estimatedHoursPerAcre = Number(estimatedHoursPerAcre);
    if (isActive !== undefined) service.isActive = Boolean(isActive);
    if (features) {
      service.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
    }

    if (req.file) {
      service.image = `/uploads/${req.file.filename}`;
    } else if (bodyImage) {
      service.image = bodyImage;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service (Admin)
// @route   DELETE /api/services/:id
// @access  Private (Admin)
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
