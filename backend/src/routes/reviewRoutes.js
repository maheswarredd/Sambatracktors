import express from 'express';
import { createReview, getAllReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllReviews);
router.post('/', protect, createReview);

export default router;
