import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    bookingId: {
      type: String,
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      required: true
    },
    upiId: {
      type: String
    },
    transactionId: {
      type: String,
      trim: true
    },
    screenshotUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    cashCollectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cashCollectedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
