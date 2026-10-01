import express from 'express';
import {
  createTractor,
  deleteTractor,
  getAllTractors,
  updateTractor
} from '../controllers/tractorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('admin', 'rider'), getAllTractors);
router.post('/', protect, authorizeRoles('admin'), upload.single('image'), createTractor);
router.put('/:id', protect, authorizeRoles('admin'), upload.single('image'), updateTractor);
router.delete('/:id', protect, authorizeRoles('admin'), deleteTractor);

export default router;
