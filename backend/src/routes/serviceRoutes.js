import express from 'express';
import {
  createService,
  deleteService,
  getActiveServices,
  getAllServicesAdmin,
  getServiceById,
  updateService
} from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getActiveServices);
router.get('/admin/all', protect, authorizeRoles('admin'), getAllServicesAdmin);
router.get('/:id', getServiceById);

router.post('/', protect, authorizeRoles('admin'), upload.single('image'), createService);
router.put('/:id', protect, authorizeRoles('admin'), upload.single('image'), updateService);
router.delete('/:id', protect, authorizeRoles('admin'), deleteService);

export default router;
