import express from 'express';
import {
  assignFleetToBooking,
  createRiderAdmin,
  getAdminDashboardStats,
  getAllBookingsAdmin,
  getAllUsersAdmin,
  getSettings,
  toggleUserActive,
  updateSettings
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/bookings', getAllBookingsAdmin);
router.put('/bookings/:id/assign', assignFleetToBooking);

router.get('/users', getAllUsersAdmin);
router.post('/riders', createRiderAdmin);
router.put('/users/:id/toggle-active', toggleUserActive);

router.get('/settings', getSettings);
router.put('/settings', upload.single('qrCode'), updateSettings);

export default router;
