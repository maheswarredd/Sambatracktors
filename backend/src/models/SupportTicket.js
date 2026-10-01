import mongoose from 'mongoose';
import { SUPPORT_CATEGORIES } from '../config/constants.js';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    category: {
      type: String,
      enum: SUPPORT_CATEGORIES,
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    // Special Rider Not Reached metadata
    riderNotReachedDetails: {
      waitingTimeMinutes: { type: Number, default: 0 },
      farmerContactAttempted: { type: Boolean, default: false },
      farmReachedExpectedTime: { type: String, default: '' }
    },
    // Refund Request metadata
    refundDetails: {
      requestedAmount: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      upiId: { type: String, default: '' },
      status: {
        type: String,
        enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
        default: 'NONE'
      },
      resolvedAt: { type: Date, default: null },
      adminNotes: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    responses: [
      {
        responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        responderRole: { type: String, default: 'admin' },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('SupportTicket', supportTicketSchema);
