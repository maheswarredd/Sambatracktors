import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'BOOKING_CREATED',
        'PAYMENT_SUBMITTED',
        'PAYMENT_ACCEPTED',
        'PAYMENT_REJECTED',
        'BOOKING_CONFIRMED',
        'RIDER_ASSIGNED',
        'RIDER_ON_THE_WAY',
        'ARRIVED',
        'SERVICE_STARTED',
        'SERVICE_COMPLETED',
        'CANCELLATION',
        'REFUND_UPDATE',
        'SUPPORT_REPLY',
        'SYSTEM'
      ],
      default: 'SYSTEM'
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
