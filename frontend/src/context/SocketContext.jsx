import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', newSocket.id);
      setIsConnected(true);

      if (user?._id) {
        newSocket.emit('join_user_room', user._id);
        if (user.role === 'admin') {
          newSocket.emit('join_admin_room');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && user?._id) {
      socket.emit('join_user_room', user._id);
      if (user.role === 'admin') {
        socket.emit('join_admin_room');
      }
    }
  }, [socket, isConnected, user]);

  const joinBookingChat = (bookingId) => {
    if (socket && isConnected && bookingId) {
      socket.emit('join_booking_chat', bookingId);
    }
  };

  const leaveBookingChat = (bookingId) => {
    if (socket && isConnected && bookingId) {
      socket.emit('leave_booking_chat', bookingId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinBookingChat,
        leaveBookingChat
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
