import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';
import {
  Tractor,
  PhoneCall,
  MessageSquare,
  Navigation,
  Play,
  CheckCircle2,
  Banknote,
  Clock,
  MapPin,
  Compass,
  CheckCheck
} from 'lucide-react';

export const RiderDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('todays'); // 'todays', 'upcoming', 'completed'
  const [data, setData] = useState({ todays: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);

  const fetchRiderTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getRiderBookings();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load rider bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => {
      fetchRiderTasks();
    };
    socket.on('booking_status_updated', handleStatusUpdate);
    return () => {
      socket.off('booking_status_updated', handleStatusUpdate);
    };
  }, [socket]);

  // Update status (e.g., RIDER_ON_THE_WAY, ARRIVED, SERVICE_STARTED, SERVICE_COMPLETED)
  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await api.updateRiderStatus(bookingId, status);
      fetchRiderTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  // Collect cash confirmation
  const handleCollectCash = async (bookingId) => {
    if (!window.confirm(language === 'te' ? 'నగదు చెల్లింపు తీసుకున్నట్లు నిర్ధారించాలా?' : 'Confirm cash collected from farmer?')) return;
    try {
      await api.collectCash(bookingId);
      fetchRiderTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const tasksToDisplay = data[activeTab] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            🚜 Pilot & Rider Cockpit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">{user?.name}</h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            Tractor Pilot • {user?.village || 'Godavari Operations Hub'} • Phone: {user?.phone}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-800/80 px-4 py-2.5 rounded-2xl border border-emerald-600/40 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-300 block">Today's Tasks</span>
            <span className="text-xl font-black text-amber-300">{data.todays?.length || 0}</span>
          </div>
          <div className="bg-emerald-800/80 px-4 py-2.5 rounded-2xl border border-emerald-600/40 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-300 block">Completed</span>
            <span className="text-xl font-black text-white">{data.completed?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4 text-sm font-bold">
        {[
          { key: 'todays', label: t('rider.todaysTasks'), count: data.todays?.length || 0 },
          { key: 'upcoming', label: t('rider.upcoming'), count: data.upcoming?.length || 0 },
          { key: 'completed', label: t('rider.completed'), count: data.completed?.length || 0 }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-2 transition flex items-center gap-2 border-b-2 ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-normal">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">{t('common.loading')}</div>
      ) : tasksToDisplay.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
          <Clock className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500">{t('rider.noTasks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasksToDisplay.map((b) => {
            const serviceName = b.serviceSnapshot?.name
              ? (b.serviceSnapshot.name[language] || b.serviceSnapshot.name.en)
              : 'Tractor Service';

            const timeSlotLabel = b.timeSlotLabel
              ? (b.timeSlotLabel[language] || b.timeSlotLabel.en)
              : b.timeSlot;

            const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.farmLocation?.latitude},${b.farmLocation?.longitude}`;

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl border border-emerald-100 shadow-md p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-400">
                        #{b.bookingId}
                      </span>
                      <h3 className="text-base font-black text-gray-900 mt-0.5">
                        {serviceName}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-100 text-emerald-800 uppercase">
                      {t(`statuses.${b.status}`) || b.status}
                    </span>
                  </div>

                  {/* Farmer Contact Info */}
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">{b.farmerName}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${b.farmerPhone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{t('rider.callFarmer')}</span>
                        </a>
                        <button
                          onClick={() => setSelectedBookingForChat(b)}
                          className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-3 py-1.5 rounded-xl border border-gray-300 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('rider.chatFarmer')}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-500">Phone: {b.farmerPhone}</p>
                    <p className="text-emerald-700 font-semibold">
                      Quantity: {b.quantity} {b.unit}s • Total: ₹{b.totalAmount?.toLocaleString()} ({b.paymentMethod})
                    </p>
                  </div>

                  {/* Farm GPS & Landmark Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-gray-800 font-medium">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{b.farmLocation?.address}</span>
                    </div>

                    {b.farmLocation?.landmark && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                        <span className="font-bold">🚩 {t('rider.landmark')}: </span>
                        <span>{b.farmLocation.landmark}</span>
                      </div>
                    )}

                    {b.farmLocation?.locationInstructions && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                        <span className="font-bold">🧭 {t('rider.instructions')}: </span>
                        <span>{b.farmLocation.locationInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Workflow Buttons */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {/* Google Maps Rapido Navigation Button */}
                  <a
                    href={googleMapsNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Navigation className="w-4 h-4 fill-white" />
                    <span>{t('rider.navToFarm')}</span>
                  </a>

                  {/* Status Progression Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {b.status === 'RIDER_ASSIGNED' && (
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'RIDER_ON_THE_WAY')}
                        className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
                      >
                        🚜 Rider On The Way
                      </button>
                    )}

                    {b.status === 'RIDER_ON_THE_WAY' && (
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'ARRIVED')}
                        className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
                      >
                        📍 Arrived at Farm Gate
                      </button>
                    )}

                    {b.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'SERVICE_STARTED')}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>{t('rider.startService')}</span>
                      </button>
                    )}

                    {b.status === 'SERVICE_STARTED' && (
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'SERVICE_COMPLETED')}
                        className="col-span-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>{t('rider.completeService')}</span>
                      </button>
                    )}

                    {/* Collect Cash Button for Offline payment */}
                    {b.paymentMethod === 'OFFLINE' && b.paymentStatus !== 'COMPLETED' && ['SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(b.status) && (
                      <button
                        onClick={() => handleCollectCash(b._id)}
                        className="col-span-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5"
                      >
                        <Banknote className="w-4 h-4" />
                        <span>{t('rider.collectCash')} (₹{b.totalAmount?.toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBookingForChat && (
        <ChatModal
          isOpen={!!selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
          bookingId={selectedBookingForChat._id}
          recipientName={selectedBookingForChat.farmerName}
        />
      )}
    </div>
  );
};

export default RiderDashboard;
