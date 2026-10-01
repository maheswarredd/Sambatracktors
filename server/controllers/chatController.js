import ChatMessage from '../models/Chat.js';
import Booking from '../models/Booking.js';
import { getIO } from '../config/socket.js';

// @desc    Get chat message history for a booking
// @route   GET /api/chat/:bookingId
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [{ _id: req.params.bookingId }, { bookingId: req.params.bookingId }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const messages = await ChatMessage.find({ booking: booking._id }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a chat message for a booking
// @route   POST /api/chat/:bookingId
// @access  Private
export const sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const booking = await Booking.findOne({
      $or: [{ _id: req.params.bookingId }, { bookingId: req.params.bookingId }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const chatMsg = await ChatMessage.create({
      booking: booking._id,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: message.trim()
    });

    // Real-time broadcast via Socket.IO room
    try {
      const io = getIO();
      if (io) {
        io.to(`booking_${booking._id}`).emit('new_message', chatMsg);
      }
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    res.status(201).json({
      success: true,
      data: chatMsg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
