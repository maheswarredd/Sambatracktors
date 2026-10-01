const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {import('socket.io').Server | null} */
let _io = null;

/**
 * connectedUsers — maps userId (string) → Set of socket IDs.
 * Allows one user to have multiple tabs/devices connected simultaneously.
 * @type {Map<string, Set<string>>}
 */
const connectedUsers = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Register a socket for a user, creating the Set if needed. */
const addUserSocket = (userId, socketId) => {
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socketId);
};

/** Remove a socket from a user's set; clean up the map entry if empty. */
const removeUserSocket = (userId, socketId) => {
  if (!connectedUsers.has(userId)) return;
  connectedUsers.get(userId).delete(socketId);
  if (connectedUsers.get(userId).size === 0) {
    connectedUsers.delete(userId);
  }
};

/** Check whether a user has at least one active socket connection. */
const isUserOnline = (userId) => connectedUsers.has(userId.toString());

// ---------------------------------------------------------------------------
// JWT authentication middleware for Socket.IO
// ---------------------------------------------------------------------------

/**
 * socketAuthMiddleware — verifies the JWT token passed in socket handshake
 * and attaches the authenticated user to socket.data.user.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Token can be sent via handshake.auth.token or query param
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'samba-tractors',
      audience: 'samba-tractors-client',
    });

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not found or inactive.'));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error(`Authentication error: ${err.message}`));
  }
};

// ---------------------------------------------------------------------------
// Socket event handlers
// ---------------------------------------------------------------------------

/**
 * registerSocketEvents — attaches all event listeners to a connected socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const registerSocketEvents = (socket, io) => {
  const user = socket.data.user;
  const userId = user._id.toString();

  // ── join-room ─────────────────────────────────────────────────────────────
  // The client joins its own user room (for private notifications) and may
  // also join conversation/booking rooms.
  socket.on('join-room', ({ roomId } = {}) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`[Socket] User ${userId} joined room: ${roomId}`);
  });

  // ── send-message ──────────────────────────────────────────────────────────
  socket.on('send-message', ({ roomId, message, recipientId } = {}) => {
    if (!roomId || !message) return;

    const payload = {
      senderId: userId,
      senderName: user.name,
      message,
      timestamp: new Date().toISOString(),
      roomId,
    };

    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit('receive-message', payload);

    // Also emit to recipient's personal room if provided (for cross-room delivery)
    if (recipientId && recipientId !== userId) {
      socket.to(recipientId).emit('receive-message', payload);
    }
  });

  // ── mark-read ─────────────────────────────────────────────────────────────
  socket.on('mark-read', ({ notificationId } = {}) => {
    if (!notificationId) return;
    // Acknowledgement back to sender
    socket.emit('notification-read', { notificationId });
  });

  // ── typing / stop-typing ──────────────────────────────────────────────────
  socket.on('typing', ({ roomId } = {}) => {
    if (!roomId) return;
    socket.to(roomId).emit('user-typing', {
      userId,
      userName: user.name,
      roomId,
    });
  });

  socket.on('stop-typing', ({ roomId } = {}) => {
    if (!roomId) return;
    socket.to(roomId).emit('user-stop-typing', { userId, roomId });
  });

  // ── booking-update ────────────────────────────────────────────────────────
  // Operators/admins can push booking status changes to all room members.
  socket.on('booking-update', ({ bookingId, status, data } = {}) => {
    if (!bookingId) return;
    const roomId = `booking-${bookingId}`;
    io.to(roomId).emit('booking-updated', {
      bookingId,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      ...data,
    });
  });

  // ── rider-location-update ─────────────────────────────────────────────────
  // Operator/driver streams GPS coordinates for real-time tracking.
  socket.on('rider-location-update', ({ bookingId, coordinates } = {}) => {
    if (!bookingId || !coordinates) return;
    const roomId = `booking-${bookingId}`;
    io.to(roomId).emit('location-updated', {
      bookingId,
      coordinates, // { lat, lng }
      timestamp: new Date().toISOString(),
      operatorId: userId,
    });
  });

  // ── notification ──────────────────────────────────────────────────────────
  // Allow server-side code to push a notification to a specific user room.
  // Clients can also acknowledge notifications via this event.
  socket.on('notification', ({ targetUserId, title, body, type, data } = {}) => {
    // Only admins can push arbitrary notifications via socket
    if (user.role !== 'admin' && user.role !== 'operator') return;
    if (!targetUserId) return;

    io.to(targetUserId.toString()).emit('notification', {
      title,
      body,
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    removeUserSocket(userId, socket.id);

    // Notify contacts that user went offline (if they subscribed)
    socket.broadcast.emit('user-offline', {
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Socket] User ${userId} disconnected (${reason}). Online: ${connectedUsers.size}`);
  });
};

// ---------------------------------------------------------------------------
// Initialiser
// ---------------------------------------------------------------------------

/**
 * initSocket — attaches Socket.IO to an existing HTTP server and configures
 * all event handlers and middleware.
 *
 * @param {import('http').Server} httpServer - Node HTTP server instance
 * @returns {import('socket.io').Server} Configured Socket.IO server
 */
const initSocket = (httpServer) => {
  _io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach JWT auth middleware
  _io.use(socketAuthMiddleware);

  _io.on('connection', (socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    // Register this socket in the connected-users map
    addUserSocket(userId, socket.id);

    // Each user automatically joins a personal room for private events
    socket.join(userId);

    console.log(
      `[Socket] User connected: ${user.name} (${user.role}) — socket ${socket.id}. Online: ${connectedUsers.size}`
    );

    // Inform the client that connection was successful
    socket.emit('connected', {
      message: 'Connected to Samba Tractors socket server.',
      userId,
      role: user.role,
    });

    // Broadcast online status to others
    socket.broadcast.emit('user-online', {
      userId,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    registerSocketEvents(socket, _io);
  });

  console.log('[Socket] Socket.IO initialised.');
  return _io;
};

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/**
 * getIO — returns the active Socket.IO server instance.
 * Throws if initSocket has not been called yet.
 * @returns {import('socket.io').Server}
 */
const getIO = () => {
  if (!_io) {
    throw new Error('Socket.IO has not been initialised. Call initSocket(httpServer) first.');
  }
  return _io;
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  connectedUsers,
};
