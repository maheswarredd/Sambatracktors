import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

// @desc    Submit farmer rating and review for completed booking
// @route   POST /api/reviews
// @access  Private (Farmer)
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and star rating (1-5) are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booked farmer can leave a review' });
    }

    // Check if review already exists
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      existing.rating = Number(rating);
      existing.comment = comment || '';
      await existing.save();

      booking.rating = Number(rating);
      booking.review = comment || '';
      await booking.save();

      return res.json({ success: true, message: 'Review updated successfully', data: existing });
    }

    const review = await Review.create({
      booking: booking._id,
      farmer: req.user._id,
      service: booking.service,
      rider: booking.rider,
      rating: Number(rating),
      comment: comment || ''
    });

    booking.rating = Number(rating);
    booking.review = comment || '';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
export const getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate('farmer', 'name village')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
