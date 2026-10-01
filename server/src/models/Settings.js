const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const notificationSettingsSchema = new mongoose.Schema(
  {
    newBookingAlert: { type: Boolean, default: true },
    paymentReceivedAlert: { type: Boolean, default: true },
    supportTicketAlert: { type: Boolean, default: true },
    refundRequestAlert: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
  },
  { _id: false }
);

const cancellationPolicySchema = new mongoose.Schema(
  {
    allowCancellationBeforeHours: {
      type: Number,
      default: 24,
      min: [0, 'Hours must be non-negative'],
    },
    refundPercentage: {
      type: Number,
      default: 100,
      min: [0, 'Refund percentage cannot be negative'],
      max: [100, 'Refund percentage cannot exceed 100'],
    },
    cancellationFeePercentage: {
      type: Number,
      default: 0,
      min: [0, 'Cancellation fee cannot be negative'],
      max: [100, 'Cancellation fee cannot exceed 100'],
    },
    lateCancellationPolicy: {
      type: String,
      default: 'No refund for cancellations less than 24 hours before service.',
      trim: true,
      maxlength: [1000, 'Policy text cannot exceed 1000 characters'],
    },
  },
  { _id: false }
);

const refundPolicySchema = new mongoose.Schema(
  {
    processingDays: {
      type: Number,
      default: 5,
      min: [1, 'Processing days must be at least 1'],
    },
    autoApproveThresholdAmount: {
      type: Number,
      default: 0,
      min: [0, 'Threshold cannot be negative'],
      comment: 'Refunds below this amount are auto-approved. 0 = disabled.',
    },
    refundPolicyText: {
      type: String,
      default:
        'Refunds are processed within 5 business days. Contact support for assistance.',
      trim: true,
      maxlength: [2000, 'Refund policy text cannot exceed 2000 characters'],
    },
  },
  { _id: false }
);

// ─── Main schema (singleton) ──────────────────────────────────────────────

const settingsSchema = new mongoose.Schema(
  {
    // Singleton guard: only one document allowed
    singleton: {
      type: String,
      default: 'global',
      enum: ['global'],
      unique: true,
    },

    // ── Business info ─────────────────────────────────────────────────────
    businessName: {
      type: String,
      default: 'Samba Tractors',
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    businessPhone: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Business phone must be a valid 10-digit Indian number',
      },
    },
    businessEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid business email format',
      },
    },
    businessAddress: {
      type: String,
      trim: true,
      default: null,
      maxlength: [500, 'Business address cannot exceed 500 characters'],
    },

    // ── UPI payment settings ──────────────────────────────────────────────
    upiId: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[\w.\-]+@[\w.\-]+$/.test(v);
        },
        message: 'Invalid UPI ID format',
      },
    },
    qrCodeUrl: {
      type: String,
      default: null,
      comment: 'URL of the UPI QR code image shown to farmers during payment',
    },

    // ── Policies ──────────────────────────────────────────────────────────
    cancellationPolicy: {
      type: cancellationPolicySchema,
      default: () => ({}),
    },
    refundPolicy: {
      type: refundPolicySchema,
      default: () => ({}),
    },

    // ── App state ─────────────────────────────────────────────────────────
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently under maintenance. Please check back later.',
      trim: true,
      maxlength: [500, 'Maintenance message cannot exceed 500 characters'],
    },

    // ── Notification preferences ──────────────────────────────────────────
    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Index ────────────────────────────────────────────────────────────────
settingsSchema.index({ singleton: 1 }, { unique: true });

// ─── Static: get (or create with defaults) the singleton settings doc ────
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singleton: 'global' });
  if (!settings) {
    settings = await this.create({ singleton: 'global' });
  }
  return settings;
};

// ─── Static: update settings (merges) ────────────────────────────────────
settingsSchema.statics.updateSettings = async function (updates) {
  const settings = await this.findOneAndUpdate(
    { singleton: 'global' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
