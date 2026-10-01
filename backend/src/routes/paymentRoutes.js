import express from 'express';
import { markCashCollected, submitOnlinePayment, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/submit', protect, upload.single('screenshot'), submitOnlinePayment);
router.post('/verify', protect, authorizeRoles('admin'), verifyPayment);
router.post('/cash-collected', protect, authorizeRoles('rider', 'admin'), markCashCollected);

export default router;
