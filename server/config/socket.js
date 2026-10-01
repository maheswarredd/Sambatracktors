import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  ioInstance.on('connection', (socket) => {
    // Join room for specific booking
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
    });

    // Join room for specific user notifications
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};
