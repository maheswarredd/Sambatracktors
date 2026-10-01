import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import { 
  Tractor, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  MessageSquare, 
  PlayCircle, 
  CheckCircle2, 
  CheckCheck, 
  Clock, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const RiderDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    all: [],
    active: null,
    today: [],
    upcoming: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  const fetchRiderBookings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/riders/my-bookings');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rider bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, note = '') => {
    try {
      setUpdatingStatus(true);
      const res = await client.put(`/riders/booking/${bookingId}/status`, {
        status: newStatus,
        note
      });
      if (res.data.success) {
        fetchRiderBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmCashCollection = async (bookingId) => {
    if (!window.confirm('Confirm that you have collected full cash payment from the farmer?')) return;
    try {
      setUpdatingStatus(true);
      const res = await client.post('/payments/cash-collected', { bookingId });
      if (res.data.success) {
        alert('Cash payment confirmed and recorded in system.');
        fetchRiderBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm cash collection');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const activeBooking = data.active || data.today[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Rider Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Tractor Pilot / Rider Console
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              Active on Duty
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Welcome, {user?.name || 'Driver'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned Tractor: <strong className="text-slate-800">{user?.riderDetails?.currentTractor?.modelName || 'Mahindra Heavy Fleet (TN-54)'}</strong> • 
            Completed Trips: <strong className="text-slate-800">{user?.riderDetails?.totalTrips || 142}</strong> • 
            Rating: <strong className="text-samba-700">⭐ {user?.riderDetails?.rating || 4.9}</strong>
          </p>
        </div>

        <button
          onClick={fetchRiderBookings}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-2 self-start md:self-auto font-bold text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Dispatches</span>
        </button>
      </div>

      {/* ACTIVE JOB DISPATCH CARD */}
      {activeBooking ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-blue-500 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
                <Tractor className="w-7 h-7 text-harvest-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-slate-700">
                    Job #{activeBooking.bookingNumber}
                  </span>
                  <StatusBadge status={activeBooking.status} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {activeBooking.serviceName} ({activeBooking.acres} Acres)
                </h3>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Collection Amount</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                ₹{activeBooking.totalAmount?.toLocaleString('en-IN')}
              </span>
              <span className={`text-[11px] font-bold block ${activeBooking.paymentStatus === 'COMPLETED' || activeBooking.paymentStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {activeBooking.paymentMethod} • {activeBooking.paymentStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Farmer & Location Details */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Farmer Customer:</span>
                  <h4 className="text-base font-extrabold text-slate-900">{activeBooking.farmerName}</h4>
                  <p className="text-slate-500 font-mono">{activeBooking.farmerPhone}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Direct Phone Call Button */}
                  <a
                    href={`tel:${activeBooking.farmerPhone}`}
                    className="px-3.5 py-2 bg-samba-600 hover:bg-samba-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Farmer</span>
                  </a>

                  {/* Chat Farmer Button */}
                  <button
                    onClick={() => setSelectedBookingForChat(activeBooking)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>

              {/* Exact Farm Address */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Farm Address:</span>
                <p className="font-semibold text-slate-800 flex items-start space-x-1.5">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{activeBooking.farmLocation?.address}</span>
                </p>
              </div>

              {/* Strictly Compulsory Landmark & Directions */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-1">
                <span className="text-[10px] font-black text-amber-900 uppercase block">
                  Compulsory Farm Landmark / Driving Directions:
                </span>
                <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                  {activeBooking.farmLocation?.landmark}
                </p>
                {activeBooking.farmLocation?.locationInstructions && (
                  <p className="text-[11px] text-amber-800 italic pt-1">
                    Extra instructions: {activeBooking.farmLocation.locationInstructions}
                  </p>
                )}
              </div>

              {/* RAPIDO-STYLE NAVIGATE TO FARM BUTTON */}
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.farmLocation?.latitude},${activeBooking.farmLocation?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
                >
                  <Navigation className="w-5 h-5 text-harvest-300 animate-pulse" />
                  <span>Navigate to Farm (Google Maps GPS Turn-by-Turn)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Rider Operational Action Steps */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Update Dispatch Operational Status:
              </span>

              <div className="space-y-2.5">
                {/* Step 1: Rider on the way */}
                <button
                  type="button"
                  disabled={updatingStatus || activeBooking.status !== 'RIDER_ASSIGNED'}
                  onClick={() => handleUpdateStatus(activeBooking._id, 'RIDER_ON_THE_WAY', 'Tractor is heading to your farm')}
                  className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition ${
                    activeBooking.status === 'RIDER_ON_THE_WAY'
                      ? 'bg-cyan-100 text-cyan-900 border-2 border-cyan-500 ring-2 ring-cyan-200'
                      : activeBooking.status === 'RIDER_ASSIGNED'
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>1. Tractor On The Way</span>
                </button>

                {/* Step 2: Arrived at Farm */}
                <button
                  type="button"
                  disabled={updatingStatus || activeBooking.status !== 'RIDER_ON_THE_WAY'}
                  onClick={() => handleUpdateStatus(activeBooking._id, 'ARRIVED', 'Tractor has arrived at farm boundary')}
                  className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition ${
                    activeBooking.status === 'ARRIVED'
                      ? 'bg-teal-100 text-teal-900 border-2 border-teal-500 ring-2 ring-teal-200'
                      : activeBooking.status === 'RIDER_ON_THE_WAY'
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>2. Arrived at Farm</span>
                </button>

                {/* Step 3: Start Service */}
                <button
                  type="button"
                  disabled={updatingStatus || activeBooking.status !== 'ARRIVED'}
                  onClick={() => handleUpdateStatus(activeBooking._id, 'SERVICE_STARTED', 'Tractor field ploughing started')}
                  className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition ${
                    activeBooking.status === 'SERVICE_STARTED'
                      ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                      : activeBooking.status === 'ARRIVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>3. Start Tractor Service</span>
                </button>

                {/* Step 4: Complete Service */}
                <button
                  type="button"
                  disabled={updatingStatus || activeBooking.status !== 'SERVICE_STARTED'}
                  onClick={() => handleUpdateStatus(activeBooking._id, 'SERVICE_COMPLETED', 'All acres completed')}
                  className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition ${
                    ['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(activeBooking.status)
                      ? 'bg-green-100 text-green-900 border-2 border-green-500'
                      : activeBooking.status === 'SERVICE_STARTED'
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>4. Complete Service</span>
                </button>

                {/* Step 5: Offline Cash Collection Confirmation */}
                {activeBooking.paymentMethod === 'CASH' && activeBooking.paymentStatus !== 'COMPLETED' && (
                  <button
                    type="button"
                    disabled={updatingStatus || !['SERVICE_COMPLETED', 'SERVICE_STARTED'].includes(activeBooking.status)}
                    onClick={() => handleConfirmCashCollection(activeBooking._id)}
                    className="w-full py-3 px-4 bg-harvest-400 hover:bg-harvest-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition disabled:opacity-40"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Confirm Cash Collected (₹{activeBooking.totalAmount})</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                All status updates trigger instant push alerts to the farmer.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Tractor className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-lg text-slate-800">No Active Dispatch Currently</h3>
          <p className="text-xs text-slate-500">
            You are currently available in the fleet pool. Check today's schedule below.
          </p>
        </div>
      )}

      {/* RIDER DISPATCH TABS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'today'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Today's Schedule ({data.today?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upcoming Bookings ({data.upcoming?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Completed Jobs ({data.completed?.length || 0})
          </button>
        </div>

        <div className="overflow-x-auto">
          {data[activeTab]?.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No bookings under this tab.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Farmer & Phone</th>
                  <th className="py-3 px-4">Service & Acres</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Farm Landmark</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data[activeTab]?.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{b.bookingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{b.farmerName}</span>
                      <a href={`tel:${b.farmerPhone}`} className="text-blue-600 hover:underline text-[11px]">
                        {b.farmerPhone}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{b.serviceName}</span>
                      <span className="text-[10px] text-slate-500">{b.acres} Acres</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold block">{b.bookingDate}</span>
                      <span className="text-[10px] text-slate-500">{b.timeSlot}</span>
                    </td>
                    <td className="py-3 px-4 text-amber-900 max-w-xs truncate font-medium">
                      {b.farmLocation?.landmark}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${b.farmLocation?.latitude},${b.farmLocation?.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg inline-block"
                        title="Navigate"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setSelectedBookingForChat(b)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedBookingForChat && (
        <ChatModal
          booking={selectedBookingForChat}
          isOpen={!!selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
        />
      )}
    </div>
  );
};

export default RiderDashboard;
