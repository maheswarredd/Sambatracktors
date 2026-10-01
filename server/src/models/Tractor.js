const mongoose = require('mongoose');

const tractorSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Indian vehicle registration format (e.g., TN-38-A-1234 or TN38A1234)
          return /^[A-Z]{2}[\s-]?[0-9]{2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{1,4}$/.test(v);
        },
        message:
          'Registration number must be a valid Indian vehicle registration (e.g., TN38A1234)',
      },
    },
    model: {
      type: String,
      required: [true, 'Tractor model is required'],
      trim: true,
      maxlength: [100, 'Model name cannot exceed 100 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Tractor brand is required'],
      trim: true,
      enum: {
        values: [
          'Mahindra',
          'John Deere',
          'TAFE',
          'Sonalika',
          'New Holland',
          'Eicher',
          'Escorts',
          'Force',
          'Indo Farm',
          'VST',
          'Other',
        ],
        message: 'Invalid tractor brand',
      },
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: {
        values: ['Diesel', 'Petrol', 'Electric', 'CNG'],
        message: 'Fuel type must be one of: Diesel, Petrol, Electric, CNG',
      },
      default: 'Diesel',
    },
    capacity: {
      type: Number,
      required: [true, 'Engine capacity (HP) is required'],
      min: [10, 'Capacity must be at least 10 HP'],
      max: [300, 'Capacity cannot exceed 300 HP'],
      comment: 'Engine power in horsepower (HP)',
    },
    lastServiceDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
tractorSchema.index({ registrationNumber: 1 }, { unique: true });
tractorSchema.index({ assignedRider: 1 });
tractorSchema.index({ isActive: 1, brand: 1 });
tractorSchema.index({ fuelType: 1 });

// ─── Virtual: age of tractor ─────────────────────────────────────────────
tractorSchema.virtual('age').get(function () {
  return new Date().getFullYear() - this.year;
});

// ─── Virtual: service overdue (>6 months since last service) ─────────────
tractorSchema.virtual('isServiceOverdue').get(function () {
  if (!this.lastServiceDate) return true;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return this.lastServiceDate < sixMonthsAgo;
});

// ─── Static: find available tractors (active + no rider or with rider) ──
tractorSchema.statics.findAvailable = function () {
  return this.find({ isActive: true }).populate('assignedRider', 'fullName mobile');
};

const Tractor = mongoose.model('Tractor', tractorSchema);

module.exports = Tractor;
