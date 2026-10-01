const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const adminReplySchema = new mongoose.Schema(
  {
    reply: {
      type: String,
      required: [true, 'Reply text is required'],
      trim: true,
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ─── Enums ────────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'RIDER_NOT_REACHED',
  'RIDER_LATE',
  'WRONG_LOCATION',
  'SERVICE_NOT_COMPLETED',
  'CANCELLATION',
  'REFUND_REQUEST',
  'OTHER',
];

const TICKET_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ─── Main schema ─────────────────────────────────────────────────────────────

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    issueType: {
      type: String,
      required: [true, 'Issue type is required'],
      enum: {
        values: ISSUE_TYPES,
        message: `Issue type must be one of: ${ISSUE_TYPES.join(', ')}`,
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUS,
        message: `Status must be one of: ${TICKET_STATUS.join(', ')}`,
      },
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY_LEVELS,
        message: `Priority must be one of: ${PRIORITY_LEVELS.join(', ')}`,
      },
      default: 'MEDIUM',
    },
    // Specifically for RIDER_NOT_REACHED – how long the farmer waited (minutes)
    waitingTime: {
      type: Number,
      min: [0, 'Waiting time cannot be negative'],
      default: null,
    },
    adminReplies: {
      type: [adminReplySchema],
      default: [],
    },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          fileName: { type: String },
          mimeType: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 5;
        },
        message: 'Cannot attach more than 5 files to a support ticket',
      },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
supportTicketSchema.index({ ticketId: 1 }, { unique: true });
supportTicketSchema.index({ farmer: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ booking: 1 }, { sparse: true });
supportTicketSchema.index({ issueType: 1, status: 1 });

// ─── Auto-generate ticketId ───────────────────────────────────────────────
supportTicketSchema.pre('save', async function (next) {
  if (!this.isNew || this.ticketId) return next();

  try {
    const count = await mongoose.model('SupportTicket').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.ticketId = `ST-${seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Set resolvedAt when status becomes RESOLVED ──────────────────────────
supportTicketSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'RESOLVED' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// ─── Auto-set priority for critical issue types ───────────────────────────
supportTicketSchema.pre('save', function (next) {
  if (this.isNew) {
    const criticalTypes = ['PAYMENT_ISSUE', 'REFUND_REQUEST'];
    const highTypes = ['RIDER_NOT_REACHED', 'SERVICE_NOT_COMPLETED'];
    if (criticalTypes.includes(this.issueType)) {
      this.priority = 'CRITICAL';
    } else if (highTypes.includes(this.issueType) && this.priority === 'MEDIUM') {
      this.priority = 'HIGH';
    }
  }
  next();
});

// ─── Virtual: response time (hours) ──────────────────────────────────────
supportTicketSchema.virtual('responseTimeHours').get(function () {
  if (!this.resolvedAt || !this.createdAt) return null;
  const diffMs = this.resolvedAt - this.createdAt;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
});

// ─── Statics ─────────────────────────────────────────────────────────────
supportTicketSchema.statics.ISSUE_TYPES = ISSUE_TYPES;
supportTicketSchema.statics.TICKET_STATUS = TICKET_STATUS;
supportTicketSchema.statics.PRIORITY_LEVELS = PRIORITY_LEVELS;

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
