import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // User joins their personal room for direct notifications
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] User ${userId} joined personal room user_${userId}`);
      }
    });

    // Join admin room for real-time admin monitoring
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`[Socket.IO] Socket ${socket.id} joined admin_room`);
    });

    // Join booking chat room
    socket.on('join_booking_chat', (bookingId) => {
      if (bookingId) {
        socket.join(`booking_${bookingId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined booking room booking_${bookingId}`);
      }
    });

    // Leave booking chat room
    socket.on('leave_booking_chat', (bookingId) => {
      if (bookingId) {
        socket.leave(`booking_${bookingId}`);
      }
    });

    // Real-time chat message broadcast
    socket.on('send_chat_message', (data) => {
      const { bookingId } = data;
      if (bookingId) {
        ioInstance.to(`booking_${bookingId}`).emit('new_chat_message', data);
      }
    });

    // Rider live location update broadcast
    socket.on('update_rider_location', ({ bookingId, lat, lng }) => {
      if (bookingId) {
        ioInstance.to(`booking_${bookingId}`).emit('rider_location_changed', { lat, lng });
      }
    });

    // Typing status
    socket.on('typing', ({ bookingId, senderName }) => {
      socket.to(`booking_${bookingId}`).emit('user_typing', { senderName });
    });

    socket.on('stop_typing', ({ bookingId }) => {
      socket.to(`booking_${bookingId}`).emit('user_stopped_typing');
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return ioInstance;
};

export const emitToUser = (userId, event, payload) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId}`).emit(event, payload);
  }
};

export const emitToBooking = (bookingId, event, payload) => {
  if (ioInstance && bookingId) {
    ioInstance.to(`booking_${bookingId}`).emit(event, payload);
  }
};

export const emitToAdmin = (event, payload) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit(event, payload);
  }
};
