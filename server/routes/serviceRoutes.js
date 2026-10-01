import express from 'express';
import { getServices, getServiceById, updateService } from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.put('/:id', protect, authorize('admin'), updateService);

export default router;
