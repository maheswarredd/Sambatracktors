const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceById,
} = require('../controllers/servicesController');
const { verifyToken, authorize } = require('../middleware/auth');
const { uploadServiceImage } = require('../middleware/upload');

// GET /api/services — public
router.get('/', getAllServices);

// GET /api/services/admin — admin only
router.get('/admin', verifyToken, authorize('admin'), getAllServicesAdmin);

// POST /api/services — admin only with image upload
router.post(
  '/',
  verifyToken,
  authorize('admin'),
  uploadServiceImage,
  createService
);

// PUT /api/services/:id — admin only
router.put('/:id', verifyToken, authorize('admin'), updateService);

// DELETE /api/services/:id — admin only
router.delete('/:id', verifyToken, authorize('admin'), deleteService);

// PATCH /api/services/:id/toggle — admin only
router.patch('/:id/toggle', verifyToken, authorize('admin'), toggleServiceStatus);

// GET /api/services/:id — public
router.get('/:id', getServiceById);

module.exports = router;
