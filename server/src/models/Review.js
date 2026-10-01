const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider reference is required'],
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ rider: 1, rating: 1 });
reviewSchema.index({ service: 1, rating: 1 });
reviewSchema.index({ farmer: 1, createdAt: -1 });
reviewSchema.index({ isPublished: 1, createdAt: -1 });

// ─── Virtual: star label ──────────────────────────────────────────────────
reviewSchema.virtual('starLabel').get(function () {
  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
  return labels[this.rating] || '';
});

// ─── Static: get average rating for a rider ──────────────────────────────
reviewSchema.statics.getAverageRatingForRider = async function (riderId) {
  const result = await this.aggregate([
    { $match: { rider: new mongoose.Types.ObjectId(riderId), isPublished: true } },
    {
      $group: {
        _id: '$rider',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingBreakdown: {
          $push: '$rating',
        },
      },
    },
  ]);
  if (!result.length) return { averageRating: 0, totalReviews: 0 };
  const { averageRating, totalReviews, ratingBreakdown } = result[0];
  // Build breakdown object {1: n, 2: n, ...}
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingBreakdown.forEach((r) => {
    breakdown[r] = (breakdown[r] || 0) + 1;
  });
  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalReviews,
    breakdown,
  };
};

// ─── Static: get average rating for a service ────────────────────────────
reviewSchema.statics.getAverageRatingForService = async function (serviceId) {
  const result = await this.aggregate([
    { $match: { service: new mongoose.Types.ObjectId(serviceId), isPublished: true } },
    {
      $group: {
        _id: '$service',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  if (!result.length) return { averageRating: 0, totalReviews: 0 };
  return {
    averageRating: parseFloat(result[0].averageRating.toFixed(1)),
    totalReviews: result[0].totalReviews,
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
