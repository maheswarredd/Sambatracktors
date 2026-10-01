import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import { emitToBooking } from '../config/socket.js';

// @desc    Get Chat by Booking ID
// @route   GET /api/chat/:bookingId
// @access  Private
export const getChatByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    let chat = await Chat.findOne({ booking: bookingId })
      .populate('participants', 'name role email phone');

    if (!chat) {
      chat = await Chat.create({
        booking: bookingId,
        participants: [req.user._id]
      });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate('sender', 'name role phone')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        chat,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Message
// @route   POST /api/chat/:bookingId/message
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty'
      });
    }

    let chat = await Chat.findOne({ booking: bookingId });
    if (!chat) {
      chat = await Chat.create({
        booking: bookingId,
        participants: [req.user._id]
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      chat.participants.push(req.user._id);
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      senderRole: req.user.role,
      text: text.trim()
    });

    chat.lastMessage = {
      text: text.trim(),
      sender: req.user._id,
      timestamp: new Date()
    };
    await chat.save();

    const populatedMsg = await Message.findById(message._id).populate('sender', 'name role phone');

    // Real-time broadcast to all participants in this booking room
    emitToBooking(bookingId, 'new_chat_message', populatedMsg);

    res.status(201).json({
      success: true,
      data: populatedMsg
    });
  } catch (error) {
    next(error);
  }
};
