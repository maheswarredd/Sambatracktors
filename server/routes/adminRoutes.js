import express from 'express';
import {
  getAdminStats,
  getAllBookings,
  assignRiderAndTractor,
  getAdminResources,
  createRider,
  createTractor,
  updateSettings
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.post('/bookings/:id/assign', assignRiderAndTractor);
router.get('/resources', getAdminResources);
router.post('/riders', createRider);
router.post('/tractors', createTractor);
router.put('/settings', updateSettings);

export default router;
