import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// @desc    Submit Review & Rating for Completed Service
// @route   POST /api/reviews
// @access  Private (Farmer)
export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, punctualityRating, workQualityRating } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, rating (1-5), and comment are required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to review this booking' });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this service' });
    }

    const review = await Review.create({
      booking: booking._id,
      farmer: req.user._id,
      rider: booking.assignedRider || null,
      service: booking.service,
      rating: Number(rating),
      comment: comment.trim(),
      punctualityRating: Number(punctualityRating) || 5,
      workQualityRating: Number(workQualityRating) || 5
    });

    booking.review = {
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date()
    };
    await booking.save();

    // Recalculate rider average rating if rider was assigned
    if (booking.assignedRider) {
      const riderReviews = await Review.find({ rider: booking.assignedRider });
      const avg = riderReviews.reduce((sum, r) => sum + r.rating, 0) / riderReviews.length;
      await User.findByIdAndUpdate(booking.assignedRider, {
        'riderDetails.rating': Number(avg.toFixed(1))
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating and feedback!',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Reviews (Public)
// @route   GET /api/reviews
// @access  Public
export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('farmer', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
