const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true,
      index: true,
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      validate: {
        validator: function (arr) {
          return arr && arr.length >= 2;
        },
        message: 'A chat must have at least 2 participants',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
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
chatSchema.index({ booking: 1 }, { unique: true });
chatSchema.index({ participants: 1 });
chatSchema.index({ isActive: 1, lastMessageAt: -1 });

// ─── Virtual: participant count ────────────────────────────────────────────
chatSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});

// ─── Static: get or create chat for a booking ─────────────────────────────
chatSchema.statics.getOrCreateForBooking = async function (bookingId, participantIds) {
  let chat = await this.findOne({ booking: bookingId });
  if (!chat) {
    chat = await this.create({
      booking: bookingId,
      participants: participantIds,
      isActive: true,
    });
  }
  return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
