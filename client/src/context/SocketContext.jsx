import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Samba Tractors Socket.IO server:', newSocket.id);
      if (user) {
        newSocket.emit('join_user', user._id);
        if (user.role === 'admin') {
          newSocket.emit('join_admin');
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinBookingRoom = (bookingId) => {
    if (socket && bookingId) {
      socket.emit('join_booking', bookingId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinBookingRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
