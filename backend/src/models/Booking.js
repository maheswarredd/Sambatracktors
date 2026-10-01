import mongoose from 'mongoose';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, TIME_SLOTS } from '../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farmerName: {
      type: String,
      required: true
    },
    farmerPhone: {
      type: String,
      required: true
    },
    farmerEmail: {
      type: String,
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    acres: {
      type: Number,
      required: true,
      min: [0.5, 'Minimum acres must be 0.5']
    },
    // Locked at booking time so future service price changes never affect existing bookings!
    pricePerAcre: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    bookingDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    timeSlot: {
      type: String,
      required: true,
      enum: TIME_SLOTS
    },
    // Google Maps & Farm Location Details
    farmLocation: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      village: {
        type: String,
        default: ''
      },
      landmark: {
        type: String,
        required: [true, 'Landmark or detailed location instruction is strictly compulsory']
      },
      locationInstructions: {
        type: String,
        default: ''
      }
    },
    // Assigned Fleet
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedTractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor',
      default: null
    },
    // Lifecycle Status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING
    },
    paymentDetails: {
      transactionId: { type: String, default: '' },
      screenshotUrl: { type: String, default: '' },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: '' },
      cashCollectedAt: { type: Date, default: null },
      cashCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    serviceStartedAt: { type: Date, default: null },
    serviceCompletedAt: { type: Date, default: null },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reason: { type: String, default: '' }
    },
    refund: {
      requestedAt: { type: Date, default: null },
      reason: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
        default: 'NONE'
      },
      processedAt: { type: Date, default: null },
      notes: { type: String, default: '' }
    },
    review: {
      rating: { type: Number, default: 0 },
      comment: { type: String, default: '' },
      createdAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

// Index for double-booking conflict prevention
bookingSchema.index({ assignedRider: 1, bookingDate: 1, timeSlot: 1, status: 1 });
bookingSchema.index({ assignedTractor: 1, bookingDate: 1, timeSlot: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
