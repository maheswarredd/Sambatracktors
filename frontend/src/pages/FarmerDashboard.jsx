import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import RatingModal from '../components/RatingModal';
import SupportTicketModal from '../components/SupportTicketModal';
import { 
  Tractor, 
  Calendar, 
  Clock, 
  MapPin, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  Star, 
  AlertTriangle, 
  LifeBuoy, 
  XCircle, 
  ExternalLink, 
  CheckCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'tickets'

  // Modal states
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState(null);
  const [selectedBookingForSupport, setSelectedBookingForSupport] = useState(null);

  // Cancellation modal
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, ticketsRes] = await Promise.all([
        client.get('/bookings/my-bookings'),
        client.get('/support/my-tickets')
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }
      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerData();
  }, []);

  // Find most relevant active booking (not closed/cancelled)
  const activeBooking = bookings.find(
    (b) =>
      !['CLOSED', 'CANCELLED', 'REFUND_COMPLETED', 'PAYMENT_COMPLETED'].includes(b.status)
  ) || bookings[0];

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancellingBookingId) return;

    try {
      setCancellingLoading(true);
      await client.put(`/bookings/${cancellingBookingId}/cancel`, {
        reason: cancelReason || 'Farmer requested cancellation'
      });
      setCancellingBookingId(null);
      setCancelReason('');
      fetchFarmerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black bg-samba-100 text-samba-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Farmer Control Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Vanakkam, {user?.name || 'Farmer'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {user?.farmerDetails?.village ? `${user.farmerDetails.village} • ` : ''}
            Track your tractor operations, talk with riders, and manage digital farm receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchFarmerData}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/book"
            className="px-5 py-3 bg-samba-600 hover:bg-samba-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Tractor className="w-4 h-4 text-harvest-300" />
            <span>Book New Tractor</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE DISPATCH SPOTLIGHT CARD */}
      {activeBooking && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-samba-500/40 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-samba-600 text-white flex items-center justify-center font-black shadow-md">
                <Tractor className="w-7 h-7 text-harvest-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-slate-700">
                    #{activeBooking.bookingNumber}
                  </span>
                  <StatusBadge status={activeBooking.status} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {activeBooking.serviceName} ({activeBooking.acres} Acres)
                </h3>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Locked Farm Bill</span>
              <span className="text-2xl font-black text-samba-700 font-mono">
                ₹{activeBooking.totalAmount?.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 block">
                ₹{activeBooking.pricePerAcre}/acre ({activeBooking.paymentMethod})
              </span>
            </div>
          </div>

          {/* Details & Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Slot & Location Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-samba-700 block">
                Dispatch Schedule & Location
              </span>
              <div className="space-y-1.5">
                <p className="flex items-center space-x-2 font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-samba-600" />
                  <span>{activeBooking.bookingDate}</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold text-slate-700">
                  <Clock className="w-4 h-4 text-samba-600" />
                  <span>{activeBooking.timeSlot}</span>
                </p>
                <p className="flex items-start space-x-2 text-slate-600 pt-1">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{activeBooking.farmLocation?.address}</span>
                </p>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                  <span className="text-[10px] font-black text-amber-900 uppercase block">Landmark Instructions:</span>
                  <span className="text-xs text-amber-800 font-medium">{activeBooking.farmLocation?.landmark}</span>
                </div>
              </div>

              {/* View in Google Maps */}
              <a
                href={`https://www.google.com/maps?q=${activeBooking.farmLocation?.latitude},${activeBooking.farmLocation?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Open Google Maps Pin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Assigned Fleet & Rider Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-samba-700 block">
                Assigned Fleet & Rider
              </span>

              {activeBooking.assignedRider ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {activeBooking.assignedRider.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{activeBooking.assignedRider.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {activeBooking.assignedRider.riderDetails?.experienceYears || 5} yrs experience • ⭐ {activeBooking.assignedRider.riderDetails?.rating || 4.9}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <p><span className="text-slate-500">Tractor:</span> <strong className="text-slate-800">{activeBooking.assignedTractor?.modelName || 'Mahindra Heavy Fleet'}</strong></p>
                    <p><span className="text-slate-500">Registration:</span> <strong className="text-slate-800 font-mono">{activeBooking.assignedTractor?.registrationNumber || 'Fleet Verified'}</strong></p>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${activeBooking.assignedRider.phone || activeBooking.farmerPhone}`}
                      className="py-2.5 px-3 bg-samba-600 hover:bg-samba-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Rider</span>
                    </a>

                    <button
                      onClick={() => setSelectedBookingForChat(activeBooking)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Rider</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2 text-slate-400">
                  <Tractor className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium text-xs text-slate-600">Assigning Tractor & Driver...</p>
                  <p className="text-[11px] text-slate-400">Central dispatch is optimizing the nearest tractor for your farm slot.</p>
                </div>
              )}
            </div>

            {/* Quick Actions & Status Lifecycle */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-samba-700 block">
                Actions & Documentation
              </span>

              <div className="space-y-2 text-xs">
                {/* Invoice Button */}
                <button
                  onClick={() => setSelectedBookingForInvoice(activeBooking)}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center justify-center space-x-1.5 transition"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Download / Print Tax Invoice</span>
                </button>

                {/* Rating Button if completed */}
                {['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(activeBooking.status) && (
                  <button
                    onClick={() => setSelectedBookingForRating(activeBooking)}
                    className="w-full py-2.5 px-3 bg-harvest-400 hover:bg-harvest-500 text-slate-950 font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>Rate Tractor Work (1-5 Stars)</span>
                  </button>
                )}

                {/* Rider Not Reached Support Alert */}
                <button
                  onClick={() => setSelectedBookingForSupport(activeBooking)}
                  className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Report Rider Not Reached / Issue</span>
                </button>

                {/* Cancel Booking Button */}
                {!['SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED', 'CANCELLED'].includes(activeBooking.status) && (
                  <button
                    onClick={() => setCancellingBookingId(activeBooking._id)}
                    className="w-full py-2 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded-lg border border-red-200 transition"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              {/* Status Timeline Snippet */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                Current status: <strong className="text-slate-700">{activeBooking.status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS: ALL BOOKINGS & SUPPORT TICKETS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'bookings'
                ? 'border-samba-600 text-samba-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Booking Records ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'tickets'
                ? 'border-samba-600 text-samba-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Support Tickets & Refunds ({tickets.length})
          </button>
        </div>

        {/* Tab 1: Bookings Table */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            {bookings.length === 0 ? (
              <div className="text-center py-16 p-6 space-y-3">
                <Tractor className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700">No bookings yet</h4>
                <p className="text-xs text-slate-400">Book your first ploughing or rotavating service today.</p>
                <Link
                  to="/book"
                  className="inline-block mt-2 px-5 py-2.5 bg-samba-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  Book Tractor Now
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Service & Acres</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Rate & Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rider</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{b.bookingNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{b.serviceName}</span>
                        <span className="text-[10px] text-slate-500">{b.acres} Acres</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold block">{b.bookingDate}</span>
                        <span className="text-[10px] text-slate-500">{b.timeSlot}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ₹{b.pricePerAcre}/ac • {b.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {b.assignedRider?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBookingForChat(b)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          title="Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBookingForInvoice(b)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          title="Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Support Tickets Table */}
        {activeTab === 'tickets' && (
          <div className="overflow-x-auto p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">Your Raised Tickets & Refund Requests</h3>
              <button
                onClick={() => setSelectedBookingForSupport(activeBooking || {})}
                className="px-4 py-2 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                + Raise New Ticket
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No support tickets raised yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 space-y-4">
                {tickets.map((t) => (
                  <div key={t._id} className="pt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">#{t.ticketNumber}</span>
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {t.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{t.subject}</h4>
                      </div>
                      <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full uppercase text-[10px]">
                        Status: {t.status}
                      </span>
                    </div>

                    <p className="text-slate-600">{t.description}</p>

                    {/* Rider not reached info */}
                    {t.riderNotReachedDetails?.waitingTimeMinutes > 0 && (
                      <div className="bg-red-50 p-2.5 rounded-lg border border-red-200 text-[11px] text-red-800">
                        🚨 Waiting time reported: <strong>{t.riderNotReachedDetails.waitingTimeMinutes} minutes</strong>
                      </div>
                    )}

                    {/* Refund info */}
                    {t.refundDetails?.requestedAmount > 0 && (
                      <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200 text-[11px] text-orange-900">
                        💰 Refund Requested: <strong>₹{t.refundDetails.requestedAmount}</strong> | Status: <strong>{t.refundDetails.status}</strong>
                        {t.refundDetails.adminNotes && <p className="mt-0.5 text-slate-600">Admin Note: {t.refundDetails.adminNotes}</p>}
                      </div>
                    )}

                    {/* Responses from Admin */}
                    {t.responses && t.responses.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-samba-600 space-y-2 bg-samba-50/50 p-3 rounded-r-xl">
                        <span className="text-[10px] font-bold text-samba-800 uppercase block">Admin Support Responses:</span>
                        {t.responses.map((resp, i) => (
                          <div key={i} className="text-slate-700 text-xs">
                            <span className="font-semibold text-slate-900">Operations Officer:</span> {resp.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-slate-900">Cancel Tractor Booking?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this booking? If you made an online payment, a refund request will be automatically recorded.
            </p>

            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. rain in field, machinery no longer required)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={handleCancelBooking}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow"
              >
                {cancellingLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      {selectedBookingForChat && (
        <ChatModal
          booking={selectedBookingForChat}
          isOpen={!!selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
        />
      )}

      {selectedBookingForInvoice && (
        <InvoiceModal
          booking={selectedBookingForInvoice}
          isOpen={!!selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
        />
      )}

      {selectedBookingForRating && (
        <RatingModal
          booking={selectedBookingForRating}
          isOpen={!!selectedBookingForRating}
          onClose={() => setSelectedBookingForRating(null)}
          onReviewSubmitted={() => fetchFarmerData()}
        />
      )}

      {selectedBookingForSupport && (
        <SupportTicketModal
          booking={selectedBookingForSupport}
          isOpen={!!selectedBookingForSupport}
          onClose={() => setSelectedBookingForSupport(null)}
          onTicketCreated={() => fetchFarmerData()}
        />
      )}
    </div>
  );
};

export default FarmerDashboard;
