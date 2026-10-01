const mongoose = require('mongoose');

const PAYMENT_STATUS = [
  'PENDING',
  'VERIFICATION_PENDING',
  'VERIFIED',
  'REJECTED',
  'COMPLETED',
  'REFUNDED',
];

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['online', 'offline'],
        message: 'Payment method must be either online or offline',
      },
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUS,
        message: `Status must be one of: ${PAYMENT_STATUS.join(', ')}`,
      },
      default: 'PENDING',
    },

    // ── Online payment fields ─────────────────────────────────────────────
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    screenshotUrl: {
      type: String,
      default: null,
      comment: 'URL of the UPI payment screenshot uploaded by farmer',
    },
    upiId: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          return /^[\w.\-]+@[\w.\-]+$/.test(v);
        },
        message: 'Invalid UPI ID format',
      },
    },

    // ── Admin verification fields ─────────────────────────────────────────
    adminNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null,
    },

    // ── Refund fields ─────────────────────────────────────────────────────
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
      default: null,
    },
    refundNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund note cannot exceed 500 characters'],
      default: null,
    },
    refundCompletedAt: {
      type: Date,
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
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ farmer: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ verifiedAt: -1 }, { sparse: true });

// ─── Virtual: is refund eligible ─────────────────────────────────────────
paymentSchema.virtual('isRefundEligible').get(function () {
  return ['VERIFIED', 'COMPLETED'].includes(this.status);
});

// ─── Virtual: formatted amount ────────────────────────────────────────────
paymentSchema.virtual('formattedAmount').get(function () {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

// ─── Static ───────────────────────────────────────────────────────────────
paymentSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
