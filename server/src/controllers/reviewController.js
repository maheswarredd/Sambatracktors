const Review = require('../../models/Review');
const Booking = require('../../models/Booking');

// @desc    Create a review after SERVICE_COMPLETED booking
// @route   POST /api/reviews
// @access  Private (farmer)
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, error: 'Booking ID and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    // Validate booking belongs to farmer and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      farmer: req.user.id,
      status: 'SERVICE_COMPLETED',
    }).populate('assignedRider', 'fullName').populate('service', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or service not yet completed.',
      });
    }

    // One review per booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'A review for this booking already exists.',
      });
    }

    const review = await Review.create({
      booking: bookingId,
      farmer: req.user.id,
      rider: booking.assignedRider ? booking.assignedRider._id : null,
      service: booking.service ? booking.service._id : null,
      rating: Number(rating),
      comment: comment ? comment.trim() : '',
      isPublished: false, // Admin must publish
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.',
      data: { review },
    });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({ success: false, error: 'Server error submitting review.' });
  }
};

// @desc    Get reviews for a rider or service (public)
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res) => {
  try {
    const { riderId, serviceId, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { isPublished: true };
    if (riderId) query.rider = riderId;
    if (serviceId) query.service = serviceId;

    if (!riderId && !serviceId) {
      return res.status(400).json({ success: false, error: 'riderId or serviceId is required.' });
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('farmer', 'fullName')
        .populate('rider', 'fullName')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: parseFloat(avgRating.toFixed(2)),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getReviews error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching reviews.' });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Admin
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, isPublished } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('farmer', 'fullName email')
        .populate('rider', 'fullName email')
        .populate('service', 'name')
        .populate('booking', 'bookingId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getAllReviews error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching reviews.' });
  }
};

// @desc    Toggle review publish status (admin)
// @route   PATCH /api/admin/reviews/:id/toggle
// @access  Admin
const toggleReviewPublish = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    review.isPublished = !review.isPublished;
    await review.save();

    const statusMsg = review.isPublished ? 'published' : 'unpublished';
    return res.status(200).json({
      success: true,
      message: `Review ${statusMsg} successfully.`,
      data: { review },
    });
  } catch (error) {
    console.error('toggleReviewPublish error:', error);
    return res.status(500).json({ success: false, error: 'Server error toggling review.' });
  }
};

module.exports = {
  createReview,
  getReviews,
  getAllReviews,
  toggleReviewPublish,
};
