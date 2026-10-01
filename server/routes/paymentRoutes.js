import express from 'express';
import {
  getPaymentSettings,
  submitPaymentProof,
  verifyPayment,
  collectCash
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/settings', getPaymentSettings);
router.post('/submit', protect, upload.single('screenshot'), submitPaymentProof);
router.post('/:id/verify', protect, authorize('admin'), verifyPayment);
router.post('/:id/collect-cash', protect, authorize('rider', 'admin'), collectCash);

export default router;
