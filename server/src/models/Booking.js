const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const farmLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude'],
    },
    address: {
      type: String,
      required: [true, 'Farm address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    village: {
      type: String,
      trim: true,
      maxlength: [100, 'Village name cannot exceed 100 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [200, 'Landmark cannot exceed 200 characters'],
    },
    locationInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Location instructions cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

// ─── Enums ────────────────────────────────────────────────────────────────────

const BOOKING_STATUS = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAYMENT_VERIFIED',
  'CONFIRMED',
  'RIDER_ASSIGNED',
  'RIDER_ON_THE_WAY',
  'ARRIVED',
  'SERVICE_STARTED',
  'SERVICE_COMPLETED',
  'PAYMENT_COMPLETED',
  'CLOSED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUND_APPROVED',
  'REFUND_COMPLETED',
  'REFUND_REJECTED',
];

const TIME_SLOTS = [
  'morning',   // 06:00 – 10:00
  'afternoon', // 11:00 – 15:00
  'evening',   // 15:00 – 19:00
  'night',     // 19:00 – 22:00
];

const TIME_SLOT_RANGES = {
  morning: '06:00 AM – 10:00 AM',
  afternoon: '11:00 AM – 03:00 PM',
  evening: '03:00 PM – 07:00 PM',
  night: '07:00 PM – 10:00 PM',
};

// ─── Main Schema ─────────────────────────────────────────────────────────────

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor',
      default: null,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
    },

    // ── Price snapshots (captured at booking time) ──────────────────────
    serviceNameSnapshot: {
      type: String,
      required: [true, 'Service name snapshot is required'],
      trim: true,
    },
    servicePricePerAcreSnapshot: {
      type: Number,
      required: [true, 'Service price per acre snapshot is required'],
      min: [0, 'Price snapshot cannot be negative'],
    },

    numberOfAcres: {
      type: Number,
      required: [true, 'Number of acres is required'],
      min: [0.1, 'Number of acres must be at least 0.1'],
      max: [1000, 'Number of acres cannot exceed 1000'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: {
        values: TIME_SLOTS,
        message: `Time slot must be one of: ${TIME_SLOTS.join(', ')}`,
      },
    },
    farmLocation: {
      type: farmLocationSchema,
      required: [true, 'Farm location is required'],
    },
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUS,
        message: `Status must be one of: ${BOOKING_STATUS.join(', ')}`,
      },
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['online', 'offline'],
        message: 'Payment method must be either online or offline',
      },
      default: 'online',
    },

    // ── Cancellation fields ──────────────────────────────────────────────
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationTime: {
      type: Date,
      default: null,
    },

    // ── Status history ───────────────────────────────────────────────────
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
bookingSchema.index({ bookingId: 1 }, { unique: true });
bookingSchema.index({ farmer: 1, status: 1 });
bookingSchema.index({ rider: 1, status: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ tractor: 1, bookingDate: 1 });
bookingSchema.index({ createdAt: -1 });

// ─── Virtual: time slot display range ─────────────────────────────────────
bookingSchema.virtual('timeSlotRange').get(function () {
  return TIME_SLOT_RANGES[this.timeSlot] || '';
});

// ─── Virtual: computed total (acres × price snapshot) ─────────────────────
bookingSchema.virtual('computedTotal').get(function () {
  return parseFloat((this.numberOfAcres * this.servicePricePerAcreSnapshot).toFixed(2));
});

// ─── Auto-generate bookingId before first save ────────────────────────────
bookingSchema.pre('save', async function (next) {
  if (!this.isNew || this.bookingId) return next();

  try {
    const year = new Date().getFullYear();
    // Count existing bookings this year to generate sequential ID
    const count = await mongoose.model('Booking').countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    });
    const seq = String(count + 1).padStart(4, '0');
    this.bookingId = `SB-${year}-${seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Push to statusHistory whenever status changes ────────────────────────
bookingSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// ─── Static helpers ───────────────────────────────────────────────────────
bookingSchema.statics.BOOKING_STATUS = BOOKING_STATUS;
bookingSchema.statics.TIME_SLOTS = TIME_SLOTS;
bookingSchema.statics.TIME_SLOT_RANGES = TIME_SLOT_RANGES;

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
