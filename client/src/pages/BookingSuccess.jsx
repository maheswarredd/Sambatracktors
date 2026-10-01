import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import BookingTimeline from '../components/BookingTimeline';
import InvoiceModal from '../components/InvoiceModal';
import { CheckCircle2, Tractor, Calendar, MapPin, Printer, ArrowRight } from 'lucide-react';

export const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const res = await api.getBookingById(bookingId);
        if (res.success) {
          setBooking(res.data);
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center text-gray-500 text-sm">
        {t('common.loading')}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Booking Record Not Found</h2>
        <Link to="/" className="text-emerald-600 font-bold text-sm">Return to Home</Link>
      </div>
    );
  }

  const serviceName = booking.serviceSnapshot?.name
    ? (booking.serviceSnapshot.name[language] || booking.serviceSnapshot.name.en)
    : 'Tractor Service';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      {/* Success Badge Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-8 rounded-3xl text-center space-y-3 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10 fill-emerald-950 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          {language === 'te' ? 'బుకింగ్ విజయవంతంగా నమోదైంది!' : language === 'hi' ? 'बुकिंग सफलतापूर्वक दर्ज की गई!' : 'Booking Placed Successfully!'}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200 font-mono">
          Booking ID: #{booking.bookingId}
        </p>
      </div>

      {/* Booking Overview Card */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-4 border-b border-gray-100">
          <div>
            <span className="text-gray-400 font-bold block mb-0.5">Service</span>
            <span className="text-sm font-bold text-gray-900">{serviceName}</span>
            <span className="text-gray-500 block mt-0.5">
              {booking.quantity} {booking.unit}s @ ₹{booking.unitPrice} / {booking.unit}
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-gray-400 font-bold block mb-0.5">Total Amount</span>
            <span className="text-xl font-black text-emerald-800">₹{booking.totalAmount?.toLocaleString()}</span>
            <span className="text-emerald-600 font-semibold block mt-0.5 uppercase">
              Mode: {booking.paymentMethod}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 font-bold block mb-0.5">Farm Location & Landmark</span>
            <p className="font-semibold text-gray-800">{booking.farmLocation?.address}</p>
            {booking.farmLocation?.landmark && (
              <p className="text-emerald-700 font-bold mt-1">Landmark: {booking.farmLocation.landmark}</p>
            )}
            <p className="font-mono text-[11px] text-gray-400 mt-1">
              GPS: {booking.farmLocation?.latitude?.toFixed(4)}, {booking.farmLocation?.longitude?.toFixed(4)}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-gray-400 font-bold block mb-0.5">Date & Slot</span>
            <p className="font-bold text-gray-900">
              {new Date(booking.bookingDate).toLocaleDateString()}
            </p>
            <p className="text-emerald-700 font-semibold mt-0.5">
              {booking.timeSlotLabel ? (booking.timeSlotLabel[language] || booking.timeSlotLabel.en) : booking.timeSlot}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Status Tracker */}
      <BookingTimeline currentStatus={booking.status} statusTimeline={booking.statusTimeline} />

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <button
          onClick={() => setShowInvoice(true)}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition"
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span>{t('invoice.title')}</span>
        </button>

        <Link
          to="/farmer-dashboard"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
        >
          <span>{t('nav.dashboard')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        booking={booking}
      />
    </div>
  );
};

export default BookingSuccess;
