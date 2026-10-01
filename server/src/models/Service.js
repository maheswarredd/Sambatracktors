const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [150, 'Service name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    pricePerAcre: {
      type: Number,
      required: [true, 'Price per acre is required'],
      min: [0, 'Price per acre cannot be negative'],
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'Plowing',
          'Tilling',
          'Leveling',
          'Planting',
          'Harvesting',
          'Spraying',
          'Rotavation',
          'Bund Making',
          'Other',
        ],
        message: 'Invalid service category',
      },
    },
    minAcres: {
      type: Number,
      default: 0.5,
      min: [0.1, 'Minimum acres must be at least 0.1'],
    },
    maxAcres: {
      type: Number,
      default: 50,
      min: [1, 'Maximum acres must be at least 1'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
serviceSchema.index({ isActive: 1, category: 1 });
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ pricePerAcre: 1 });
serviceSchema.index({ createdAt: -1 });

// ─── Validation: minAcres < maxAcres ────────────────────────────────────
serviceSchema.pre('save', function (next) {
  if (this.minAcres >= this.maxAcres) {
    return next(
      new Error('Minimum acres must be less than maximum acres')
    );
  }
  next();
});

// ─── Virtual: formatted price ────────────────────────────────────────────
serviceSchema.virtual('formattedPrice').get(function () {
  return `₹${this.pricePerAcre.toLocaleString('en-IN')} / acre`;
});

// ─── Static: find active services by category ────────────────────────────
serviceSchema.statics.findByCategory = function (category) {
  return this.find({ isActive: true, category }).sort({ pricePerAcre: 1 });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
