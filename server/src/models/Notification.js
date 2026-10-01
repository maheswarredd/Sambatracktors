const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'booking',
  'payment',
  'rider',
  'support',
  'refund',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
      maxlength: [1000, 'Body cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Arbitrary payload for deep-linking or extra context',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    bookingId: {
      type: String,
      default: null,
      comment: 'Human-readable booking ID like SB-2024-0001 for quick lookup',
    },
    // Whether the push notification was delivered via FCM
    isSentPush: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ bookingId: 1 }, { sparse: true });
notificationSchema.index({ createdAt: -1 });

// ─── TTL: auto-delete notifications after 90 days ─────────────────────────
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─── Instance method: mark as read ────────────────────────────────────────
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// ─── Static: mark all unread for a user ──────────────────────────────────
notificationSchema.statics.markAllRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// ─── Static: unread count for a user ─────────────────────────────────────
notificationSchema.statics.unreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// ─── Static: factory helper ────────────────────────────────────────────────
notificationSchema.statics.createAndSend = async function ({
  userId,
  title,
  body,
  type,
  data = {},
  bookingId = null,
}) {
  return this.create({ user: userId, title, body, type, data, bookingId });
};

// ─── Statics export ───────────────────────────────────────────────────────
notificationSchema.statics.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
