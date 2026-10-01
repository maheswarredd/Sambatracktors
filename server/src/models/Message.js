const mongoose = require('mongoose');

const MESSAGE_TYPES = ['text', 'image', 'system'];

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat reference is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    senderRole: {
      type: String,
      required: [true, 'Sender role is required'],
      enum: {
        values: ['farmer', 'rider', 'admin', 'system'],
        message: 'Sender role must be one of: farmer, rider, admin, system',
      },
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },
    messageType: {
      type: String,
      enum: {
        values: MESSAGE_TYPES,
        message: `Message type must be one of: ${MESSAGE_TYPES.join(', ')}`,
      },
      default: 'text',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // For image messages: the stored URL
    mediaUrl: {
      type: String,
      default: null,
    },
    // For system messages: metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
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
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ chat: 1, isRead: 1 });

// ─── Post-save: update Chat's lastMessage & lastMessageAt ─────────────────
messageSchema.post('save', async function (doc) {
  try {
    await mongoose.model('Chat').findByIdAndUpdate(doc.chat, {
      lastMessage: doc._id,
      lastMessageAt: doc.createdAt,
    });
  } catch (err) {
    // Non-critical; log but do not throw
    console.error('[Message post-save] Failed to update chat lastMessage:', err.message);
  }
});

// ─── Instance method: mark as read ────────────────────────────────────────
messageSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// ─── Static: mark all unread messages in a chat as read ──────────────────
messageSchema.statics.markChatAsRead = async function (chatId, userId) {
  return this.updateMany(
    { chat: chatId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// ─── Static: count unread messages for a user in a chat ──────────────────
messageSchema.statics.unreadCount = function (chatId, userId) {
  return this.countDocuments({ chat: chatId, sender: { $ne: userId }, isRead: false });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
