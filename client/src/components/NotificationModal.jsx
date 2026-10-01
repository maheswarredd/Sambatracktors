import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCheck, X, AlertCircle } from 'lucide-react';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => {
      fetchNotifications();
    };
    socket.on('booking_status_updated', handleStatusUpdate);
    socket.on('payment_submitted', handleStatusUpdate);

    return () => {
      socket.off('booking_status_updated', handleStatusUpdate);
      socket.off('payment_submitted', handleStatusUpdate);
    };
  }, [socket]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-lg">
              {language === 'te' ? 'నోటిఫికేషన్‌లు' : language === 'hi' ? 'सूचनाएं' : 'Notifications'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-emerald-100 flex items-center gap-1 transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'అన్నీ చదివినట్లు' : language === 'hi' ? 'सभी पढ़ें' : 'Mark all read'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {language === 'te'
                  ? 'కొత్త నోటిఫికేషన్‌లు లేవు'
                  : language === 'hi'
                  ? 'कोई नई सूचना नहीं है'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  item.isRead
                    ? 'bg-gray-50 border-gray-100 text-gray-600'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    {item.title ? (item.title[language] || item.title.en) : 'Notification'}
                  </h4>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {item.message ? (item.message[language] || item.message.en) : ''}
                </p>
                <div className="text-[10px] text-gray-400 mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
