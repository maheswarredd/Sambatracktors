import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await client.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen to live socket events
  useEffect(() => {
    if (!socket) return;

    const handleBookingStatusUpdated = (data) => {
      showToast({
        title: 'Booking Status Update',
        message: data.message || `Booking status changed to ${data.status}`,
        type: 'info'
      });
      fetchNotifications();
    };

    const handleAdminAlert = (data) => {
      if (user?.role === 'admin') {
        showToast({
          title: '🚨 New Booking Alert!',
          message: `#${data.bookingNumber} from ${data.farmerName} - ₹${data.totalAmount}`,
          type: 'success'
        });
        fetchNotifications();
      }
    };

    const handleJobAssigned = () => {
      if (user?.role === 'rider') {
        showToast({
          title: '🚜 New Farm Job Assigned!',
          message: 'You have been assigned to a new farm booking.',
          type: 'success'
        });
        fetchNotifications();
      }
    };

    socket.on('booking_status_updated', handleBookingStatusUpdated);
    socket.on('new_booking_alert', handleAdminAlert);
    socket.on('new_job_assigned', handleJobAssigned);

    return () => {
      socket.off('booking_status_updated', handleBookingStatusUpdated);
      socket.off('new_booking_alert', handleAdminAlert);
      socket.off('new_job_assigned', handleJobAssigned);
    };
  }, [socket, user, fetchNotifications]);

  const showToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const markAllRead = async () => {
    try {
      await client.put('/notifications/mark-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAllRead,
        toast,
        setToast
      }}
    >
      {children}
      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 border border-samba-500/40 text-white rounded-xl shadow-2xl p-4 flex items-start space-x-3 transition-all transform animate-bounce">
          <div className="p-2 bg-samba-600 rounded-lg text-white font-bold text-lg">
            🚜
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-samba-400">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold p-1"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
