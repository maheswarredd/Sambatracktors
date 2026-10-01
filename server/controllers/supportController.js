import SupportTicket from '../models/SupportTicket.js';
import Notification from '../models/Notification.js';
import Booking from '../models/Booking.js';
import { getIO } from '../config/socket.js';

// @desc    Raise a new support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { issueType, subject, description, bookingId, refundAmount } = req.body;

    if (!issueType || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Please provide issue type, subject, and description' });
    }

    const ticketCount = await SupportTicket.countDocuments();
    const ticketId = `TIC-${1000 + ticketCount + 1}`;

    let bookingRef = null;
    if (bookingId) {
      const b = await Booking.findOne({
        $or: [{ _id: bookingId }, { bookingId: bookingId }]
      });
      if (b) bookingRef = b._id;
    }

    const ticket = await SupportTicket.create({
      ticketId,
      user: req.user._id,
      userName: req.user.name,
      userPhone: req.user.phone,
      booking: bookingRef,
      bookingId: bookingId || '',
      issueType,
      subject,
      description,
      refundAmount: Number(refundAmount) || 0,
      refundStatus: issueType === 'Refund Request' ? 'REQUESTED' : 'NONE',
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's tickets
// @route   GET /api/support/my
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/support/all
// @access  Private (Admin)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().populate('user', 'name phone email').sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Reply & update ticket status / refund
// @route   PATCH /api/support/:id/reply
// @access  Private (Admin)
export const replyTicket = async (req, res) => {
  try {
    const { adminReply, status, refundStatus, refundAmount } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (adminReply) ticket.adminReply = adminReply;
    if (status) ticket.status = status;
    if (refundStatus) ticket.refundStatus = refundStatus;
    if (refundAmount !== undefined) ticket.refundAmount = Number(refundAmount);
    ticket.resolvedBy = req.user._id;
    ticket.resolvedAt = new Date();

    await ticket.save();

    // Multilingual Notification for User
    await Notification.create({
      recipient: ticket.user,
      booking: ticket.booking,
      bookingId: ticket.bookingId,
      type: 'SUPPORT_REPLY',
      title: {
        te: `సహాయక టికెట్ స్పందన #${ticket.ticketId}`,
        en: `Support Ticket Response #${ticket.ticketId}`,
        hi: `सहायता टिकट पर प्रतिक्रिया #${ticket.ticketId}`
      },
      message: {
        te: `మీ సమస్యపై అడ్మిన్ స్పందించారు: "${adminReply || status}"`,
        en: `Admin replied to your ticket: "${adminReply || status}"`,
        hi: `एडमिन ने आपके टिकट पर जवाब दिया: "${adminReply || status}"`
      }
    });

    res.json({
      success: true,
      message: 'Support ticket updated and farmer notified',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
