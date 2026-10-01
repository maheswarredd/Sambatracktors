import SupportTicket from '../models/SupportTicket.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import { BOOKING_STATUSES, SUPPORT_CATEGORIES } from '../config/constants.js';
import { emitToAdmin, emitToBooking, emitToUser } from '../config/socket.js';

// @desc    Create Support Ticket (including 'Rider Not Reached' and Refund Requests)
// @route   POST /api/support
// @access  Private (Farmer)
export const createTicket = async (req, res, next) => {
  try {
    const {
      bookingId,
      category,
      subject,
      description,
      priority,
      waitingTimeMinutes,
      farmerContactAttempted,
      refundAmount,
      refundReason,
      refundUpiId
    } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and description are required'
      });
    }

    if (!SUPPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${SUPPORT_CATEGORIES.join(', ')}`
      });
    }

    const ticketNumber = `STK-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

    const ticketData = {
      ticketNumber,
      farmer: req.user._id,
      booking: bookingId || null,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || (category === 'Rider Not Reached' ? 'URGENT' : 'MEDIUM'),
      status: 'OPEN'
    };

    if (category === 'Rider Not Reached') {
      ticketData.riderNotReachedDetails = {
        waitingTimeMinutes: Number(waitingTimeMinutes) || 15,
        farmerContactAttempted: Boolean(farmerContactAttempted),
        farmReachedExpectedTime: new Date().toLocaleTimeString()
      };
    }

    if (category === 'Refund Request' || refundAmount) {
      ticketData.refundDetails = {
        requestedAmount: Number(refundAmount) || 0,
        reason: refundReason || description,
        upiId: refundUpiId || '',
        status: 'PENDING'
      };

      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          status: BOOKING_STATUSES.REFUND_REQUESTED,
          'refund.requestedAt': new Date(),
          'refund.reason': refundReason || description,
          'refund.amount': Number(refundAmount) || 0,
          'refund.status': 'REQUESTED'
        });
      }
    }

    const ticket = await SupportTicket.create(ticketData);

    // Notify Admin
    emitToAdmin('new_support_ticket', {
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      subject: ticket.subject,
      farmerName: req.user.name,
      priority: ticket.priority
    });

    res.status(201).json({
      success: true,
      message: 'Support request submitted. Our support team will assist you immediately.',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Logged-in Farmer Tickets
// @route   GET /api/support/my-tickets
// @access  Private (Farmer)
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ farmer: req.user._id })
      .populate('booking', 'bookingNumber serviceName acres totalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Tickets (Admin)
// @route   GET /api/support/admin/all
// @access  Private (Admin)
export const getAllTicketsAdmin = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate('farmer', 'name email phone')
      .populate('booking', 'bookingNumber serviceName acres totalAmount paymentMethod paymentStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Reply to Ticket
// @route   POST /api/support/:id/reply
// @access  Private (Admin)
export const replyToTicket = async (req, res, next) => {
  try {
    const { message, status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id).populate('farmer');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    ticket.responses.push({
      responder: req.user._id,
      responderRole: 'admin',
      message: message.trim(),
      createdAt: new Date()
    });

    if (status) {
      ticket.status = status;
    } else {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    // Create Notification for Farmer
    await Notification.create({
      recipient: ticket.farmer._id,
      title: `Support Update: Ticket #${ticket.ticketNumber}`,
      message: `Admin replied: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
      type: 'SUPPORT_REPLY'
    });

    emitToUser(ticket.farmer._id.toString(), 'support_reply', {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      message
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Process Refund
// @route   PUT /api/support/:id/refund-action
// @access  Private (Admin)
export const processRefundAction = async (req, res, next) => {
  try {
    const { action, adminNotes } = req.body; // 'APPROVE', 'REJECT', 'COMPLETE'
    const ticket = await SupportTicket.findById(req.params.id).populate('farmer booking');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (action === 'APPROVE') {
      ticket.refundDetails.status = 'APPROVED';
      ticket.refundDetails.adminNotes = adminNotes || 'Refund approved by Admin. Processing disbursement.';
      if (ticket.booking) {
        await Booking.findByIdAndUpdate(ticket.booking._id, {
          status: BOOKING_STATUSES.REFUND_APPROVED,
          'refund.status': 'APPROVED',
          'refund.notes': ticket.refundDetails.adminNotes
        });
      }
    } else if (action === 'REJECT') {
      ticket.refundDetails.status = 'REJECTED';
      ticket.refundDetails.adminNotes = adminNotes || 'Refund request declined.';
      if (ticket.booking) {
        await Booking.findByIdAndUpdate(ticket.booking._id, {
          status: BOOKING_STATUSES.REFUND_REJECTED,
          'refund.status': 'REJECTED',
          'refund.notes': ticket.refundDetails.adminNotes
        });
      }
    } else if (action === 'COMPLETE') {
      ticket.refundDetails.status = 'COMPLETED';
      ticket.refundDetails.resolvedAt = new Date();
      ticket.refundDetails.adminNotes = adminNotes || 'Refund successfully disbursed via UPI/Bank transfer.';
      ticket.status = 'RESOLVED';
      if (ticket.booking) {
        await Booking.findByIdAndUpdate(ticket.booking._id, {
          status: BOOKING_STATUSES.REFUND_COMPLETED,
          'refund.status': 'COMPLETED',
          'refund.processedAt': new Date(),
          'refund.notes': ticket.refundDetails.adminNotes
        });
      }
    }

    await ticket.save();

    // Notify farmer
    await Notification.create({
      recipient: ticket.farmer._id,
      title: `Refund Request ${action}`,
      message: `Your refund request for Ticket #${ticket.ticketNumber} has been ${action.toLowerCase()}. Details: ${ticket.refundDetails.adminNotes}`,
      type: 'REFUND_UPDATE'
    });

    emitToUser(ticket.farmer._id.toString(), 'refund_updated', {
      ticketId: ticket._id,
      status: ticket.refundDetails.status,
      action
    });

    res.status(200).json({
      success: true,
      message: `Refund status updated to ${ticket.refundDetails.status}`,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};
