import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import { 
  Tractor, 
  MapPin, 
  PhoneCall, 
  MessageSquare, 
  Navigation, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  FileText
} from 'lucide-react';

const TRACKING_STAGES = [
  { key: 'CONFIRMED', label: 'Booking Confirmed' },
  { key: 'RIDER_ASSIGNED', label: 'Tractor Assigned' },
  { key: 'RIDER_ON_THE_WAY', label: 'On The Way' },
  { key: 'ARRIVED', label: 'Arrived at Farm' },
  { key: 'SERVICE_STARTED', label: 'Ploughing in Field' },
  { key: 'SERVICE_COMPLETED', label: 'Work Completed' }
];

const TrackBooking = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-3">
        <Tractor className="w-12 h-12 text-samba-600 animate-bounce mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Connecting to Satellite Farm GPS...</h3>
        <p className="text-xs text-slate-500">Fetching live tractor status and dispatch records.</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm">
          Booking record not found or unauthorized.
        </div>
        <Link to="/" className="inline-block px-5 py-2.5 bg-samba-600 text-white font-bold text-xs rounded-xl">
          Return to Home
        </Link>
      </div>
    );
  }

  const getStageIndex = (status) => {
    const map = {
      PENDING: 0,
      PAYMENT_PENDING: 0,
      PAYMENT_VERIFIED: 1,
      CONFIRMED: 1,
      RIDER_ASSIGNED: 2,
      RIDER_ON_THE_WAY: 3,
      ARRIVED: 4,
      SERVICE_STARTED: 5,
      SERVICE_COMPLETED: 6,
      PAYMENT_COMPLETED: 6,
      CLOSED: 6
    };
    return map[status] !== undefined ? map[status] : 0;
  };

  const currentStageIndex = getStageIndex(booking.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in">
      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              Tracking #{booking.bookingNumber}
            </span>
            <StatusBadge status={booking.status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {booking.serviceName}
          </h1>
          <p className="text-xs text-slate-500">
            {booking.acres} Acres • ₹{booking.pricePerAcre}/acre • Total ₹{booking.totalAmount?.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBooking}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Live Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setInvoiceOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Digital Invoice</span>
          </button>
        </div>
      </div>

      {/* RAPIDO-STYLE STATUS TIMELINE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
          Field Dispatch Progress
        </h3>

        {/* Steps */}
        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="hidden sm:block absolute top-1/2 left-0 h-1 bg-samba-600 -translate-y-1/2 z-0 transition-all duration-700"
            style={{ width: `${(Math.min(currentStageIndex, 5) / 5) * 100}%` }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
            {TRACKING_STAGES.map((st, idx) => {
              const isPassed = currentStageIndex >= idx + 1;
              const isCurrent = currentStageIndex === idx;

              return (
                <div key={st.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition duration-500 ${
                      isPassed
                        ? 'bg-samba-600 text-white shadow-md'
                        : isCurrent
                        ? 'bg-harvest-400 text-slate-950 ring-4 ring-harvest-200 font-black animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isPassed || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FLEET & CONTACT INFORMATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rider Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-samba-700">
            Assigned Tractor Rider & Machine
          </h3>

          {booking.assignedRider ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-base">
                  {booking.assignedRider.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">{booking.assignedRider.name}</h4>
                  <p className="text-xs text-slate-500">
                    ⭐ {booking.assignedRider.riderDetails?.rating || 4.9} • {booking.assignedRider.riderDetails?.experienceYears || 5} yrs experience
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><span className="text-slate-500">Machinery:</span> <strong className="text-slate-800">{booking.assignedTractor?.modelName || 'Mahindra Heavy Fleet'}</strong></p>
                <p><span className="text-slate-500">Registration:</span> <strong className="font-mono text-slate-800">{booking.assignedTractor?.registrationNumber || 'Fleet Verified'}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${booking.assignedRider.phone || booking.farmerPhone}`}
                  className="py-3 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Rider</span>
                </a>

                <button
                  onClick={() => setChatOpen(true)}
                  className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Rider</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-slate-400">
              <Tractor className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-xs text-slate-600">Assigning Tractor & Driver...</p>
              <p className="text-[11px]">Central dispatch will assign the nearest available fleet unit shortly.</p>
            </div>
          )}
        </div>

        {/* Farm Location Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-samba-700">
            Farm Google Maps Destination
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Field Address:</span>
              <p className="font-semibold text-slate-800 flex items-start space-x-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{booking.farmLocation?.address}</span>
              </p>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-1">
              <span className="text-[10px] font-black text-amber-900 uppercase block">
                Compulsory Landmark / Route Directions:
              </span>
              <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                {booking.farmLocation?.landmark}
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`https://www.google.com/maps?q=${booking.farmLocation?.latitude},${booking.farmLocation?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 border border-blue-200 transition"
              >
                <span>View Google Maps Pin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatModal
          booking={booking}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {invoiceOpen && (
        <InvoiceModal
          booking={booking}
          isOpen={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
        />
      )}
    </div>
  );
};

export default TrackBooking;
