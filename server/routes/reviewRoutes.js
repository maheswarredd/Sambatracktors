import express from 'express';
import { createReview, getServiceReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/service/:serviceId', getServiceReviews);

export default router;
