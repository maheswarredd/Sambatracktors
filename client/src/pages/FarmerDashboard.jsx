import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import BookingTimeline from '../components/BookingTimeline';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import ReviewModal from '../components/ReviewModal';
import SupportModal from '../components/SupportModal';
import {
  Tractor,
  PhoneCall,
  MessageSquare,
  Navigation,
  FileText,
  XCircle,
  LifeBuoy,
  Star,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { socket } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [selectedBookingForSupport, setSelectedBookingForSupport] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching farmer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchBookings();
    };
    socket.on('booking_status_updated', handleUpdate);
    socket.on('payment_submitted', handleUpdate);

    return () => {
      socket.off('booking_status_updated', handleUpdate);
      socket.off('payment_submitted', handleUpdate);
    };
  }, [socket]);

  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt(
      language === 'te'
        ? 'బుకింగ్ రద్దు చేయడానికి కారణం నమోదు చేయండి:'
        : language === 'hi'
        ? 'बुकिंग रद्द करने का कारण दर्ज करें:'
        : 'Please enter reason for cancellation:'
    );
    if (!reason) return;

    try {
      await api.cancelBooking(bookingId, reason);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeBookings = bookings.filter((b) =>
    !['COMPLETED', 'CLOSED', 'CANCELLED', 'SERVICE_COMPLETED', 'PAYMENT_COMPLETED'].includes(b.status)
  );

  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CLOSED', 'CANCELLED', 'SERVICE_COMPLETED', 'PAYMENT_COMPLETED'].includes(b.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-green-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            {language === 'te' ? 'రైతు స్వాగతం' : language === 'hi' ? 'किसान का स्वागत है' : 'Welcome Farmer'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">{user?.name}</h1>
          <p className="text-xs text-emerald-200">
            {user?.phone} • {user?.village || 'Godavari Region'}
          </p>
        </div>

        <Link
          to="/book"
          className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('nav.bookNow')}</span>
        </Link>
      </div>

      {/* Active Bookings Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Tractor className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-black text-gray-900">{t('dashboard.activeBookings')}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            {activeBookings.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400">{t('common.loading')}</div>
        ) : activeBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-300 text-center space-y-3">
            <Tractor className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500">{t('dashboard.noBookings')}</p>
            <Link
              to="/book"
              className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              {t('nav.bookNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activeBookings.map((b) => {
              const serviceName = b.serviceSnapshot?.name
                ? (b.serviceSnapshot.name[language] || b.serviceSnapshot.name.en)
                : 'Service';

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-3xl border border-emerald-100 shadow-md p-6 space-y-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-500">
                          #{b.bookingId}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          • {new Date(b.bookingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                        {serviceName}
                      </h3>
                      <p className="text-xs text-emerald-700 font-bold">
                        {b.quantity} {b.unit}s @ ₹{b.unitPrice} = ₹{b.totalAmount?.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Call Rider Button */}
                      {b.rider?.phone && (
                        <a
                          href={`tel:${b.rider.phone}`}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition border border-emerald-200"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('dashboard.callRider')} ({b.rider.name})</span>
                        </a>
                      )}

                      {/* Chat with Rider Button */}
                      <button
                        onClick={() => setSelectedBookingForChat(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('dashboard.chatRider')}</span>
                      </button>

                      {/* Invoice Receipt */}
                      <button
                        onClick={() => setSelectedBookingForInvoice(b)}
                        className="bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                        <span>{t('dashboard.viewInvoice')}</span>
                      </button>

                      {/* Cancel Booking */}
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-xl border border-rose-200 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t('dashboard.cancelBooking')}</span>
                      </button>

                      {/* Help Ticket */}
                      <button
                        onClick={() => setSelectedBookingForSupport(b)}
                        className="text-amber-700 hover:bg-amber-50 text-xs font-bold px-2.5 py-2 rounded-xl border border-amber-200"
                        title="Raise Support Ticket"
                      >
                        <LifeBuoy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rider & Tractor details card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
                    <div>
                      <span className="text-gray-400 font-bold block mb-1">
                        {t('dashboard.assignedRider')}
                      </span>
                      <p className="font-bold text-gray-900 text-sm">
                        {b.rider ? b.rider.name : (language === 'te' ? 'కేటాయింపు పెండింగ్‌లో ఉంది' : 'Assigning pilot soon...')}
                      </p>
                      {b.rider?.phone && (
                        <p className="text-gray-600 mt-0.5">📞 {b.rider.phone}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold block mb-1">
                        {t('dashboard.tractor')}
                      </span>
                      <p className="font-bold text-gray-900 text-sm">
                        {b.tractor ? b.tractor.name : 'Mahindra Novo 605 DI'}
                      </p>
                      <p className="font-mono text-gray-500 mt-0.5">
                        Reg: {b.tractor ? b.tractor.registrationNumber : 'AP04 AB 1234'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold block mb-1">
                        Farm & Landmark
                      </span>
                      <p className="font-semibold text-gray-800 truncate">{b.farmLocation?.address}</p>
                      {b.farmLocation?.landmark && (
                        <p className="text-emerald-700 font-bold mt-0.5">Landmark: {b.farmLocation.landmark}</p>
                      )}
                    </div>
                  </div>

                  {/* Live Status Tracker */}
                  <BookingTimeline currentStatus={b.status} statusTimeline={b.statusTimeline} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking History Section */}
      <section className="space-y-4 pt-6">
        <h2 className="text-lg font-black text-gray-900">{t('dashboard.bookingHistory')}</h2>

        {pastBookings.length === 0 ? (
          <p className="text-xs text-gray-400">No completed bookings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBookings.map((b) => (
              <div key={b._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-gray-500">#{b.bookingId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {t(`statuses.${b.status}`) || b.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    {b.serviceSnapshot?.name ? (b.serviceSnapshot.name[language] || b.serviceSnapshot.name.en) : 'Service'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(b.bookingDate).toLocaleDateString()} • ₹{b.totalAmount?.toLocaleString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedBookingForInvoice(b)}
                    className="text-emerald-700 font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  {!b.rating && b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setSelectedBookingForReview(b)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{t('dashboard.rateService')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {selectedBookingForChat && (
        <ChatModal
          isOpen={!!selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
          bookingId={selectedBookingForChat._id}
          recipientName={selectedBookingForChat.rider?.name || 'Rider'}
        />
      )}

      {selectedBookingForInvoice && (
        <InvoiceModal
          isOpen={!!selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
          booking={selectedBookingForInvoice}
        />
      )}

      {selectedBookingForReview && (
        <ReviewModal
          isOpen={!!selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          booking={selectedBookingForReview}
          onReviewSubmitted={fetchBookings}
        />
      )}

      {selectedBookingForSupport && (
        <SupportModal
          isOpen={!!selectedBookingForSupport}
          onClose={() => setSelectedBookingForSupport(null)}
          bookingId={selectedBookingForSupport.bookingId}
        />
      )}
    </div>
  );
};

export default FarmerDashboard;
