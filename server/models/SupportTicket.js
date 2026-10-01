import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userPhone: String,
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    bookingId: String,
    issueType: {
      type: String,
      enum: [
        'Booking Issue',
        'Payment Issue',
        'Rider Not Reached',
        'Rider Late',
        'Wrong Location',
        'Service Not Completed',
        'Cancellation',
        'Refund Request',
        'Other Issue'
      ],
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
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    adminReply: {
      type: String,
      default: ''
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED'],
      default: 'NONE'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  {
    timestamps: true
  }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
