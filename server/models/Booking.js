import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farmerName: {
      type: String,
      required: true,
      trim: true
    },
    farmerPhone: {
      type: String,
      required: true,
      trim: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    serviceSnapshot: {
      code: String,
      name: {
        te: String,
        en: String,
        hi: String
      },
      category: String,
      unit: String,
      price: Number
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      enum: ['Acre', 'Trip'],
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
      required: true
    },
    timeSlotLabel: {
      te: String,
      en: String,
      hi: String
    },
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
        default: ''
      },
      locationInstructions: {
        type: String,
        default: ''
      }
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor'
    },
    status: {
      type: String,
      enum: [
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
        'REFUND_REJECTED'
      ],
      default: 'PENDING'
    },
    statusTimeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ],
    paymentMethod: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'COMPLETED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentDetails: {
      transactionId: String,
      screenshotUrl: String,
      submittedAt: Date,
      verifiedAt: Date,
      cashCollectedAt: Date
    },
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    serviceStartedAt: Date,
    serviceCompletedAt: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String
  },
  {
    timestamps: true
  }
);

bookingSchema.pre('validate', function (next) {
  // Verify that either landmark or locationInstructions is provided
  if (this.farmLocation) {
    const hasLandmark = this.farmLocation.landmark && this.farmLocation.landmark.trim().length > 0;
    const hasInstructions = this.farmLocation.locationInstructions && this.farmLocation.locationInstructions.trim().length > 0;
    if (!hasLandmark && !hasInstructions) {
      return next(new Error('Either a landmark or detailed location instructions must be provided for the farm.'));
    }
  }
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
