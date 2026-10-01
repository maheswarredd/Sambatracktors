import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Clock,
  CreditCard,
  CheckCircle2,
  UserCheck,
  Truck,
  MapPin,
  Play,
  CheckCheck,
  XCircle,
  RefreshCw,
  FileCheck
} from 'lucide-react';

const statusStepOrder = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAYMENT_VERIFIED',
  'CONFIRMED',
  'RIDER_ASSIGNED',
  'RIDER_ON_THE_WAY',
  'ARRIVED',
  'SERVICE_STARTED',
  'SERVICE_COMPLETED',
  'PAYMENT_COMPLETED',
  'CLOSED'
];

export const BookingTimeline = ({ currentStatus, statusTimeline = [] }) => {
  const { t, language } = useLanguage();

  const isCancelled = currentStatus === 'CANCELLED';
  const isRefunded = currentStatus?.startsWith('REFUND');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'PAYMENT_PENDING':
        return <CreditCard className="w-4 h-4" />;
      case 'PAYMENT_VERIFIED':
      case 'CONFIRMED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'RIDER_ASSIGNED':
        return <UserCheck className="w-4 h-4" />;
      case 'RIDER_ON_THE_WAY':
        return <Truck className="w-4 h-4" />;
      case 'ARRIVED':
        return <MapPin className="w-4 h-4" />;
      case 'SERVICE_STARTED':
        return <Play className="w-4 h-4" />;
      case 'SERVICE_COMPLETED':
      case 'PAYMENT_COMPLETED':
      case 'CLOSED':
        return <CheckCheck className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'CANCELLED') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (status?.startsWith('REFUND')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(status)) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (['RIDER_ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(status)) {
      return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {language === 'te' ? 'బుకింగ్ స్థితి క్రమం' : language === 'hi' ? 'बुकिंग स्थिति समयरेखा' : 'Live Status Timeline'}
        </h4>
        <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${getStatusBadgeColor(currentStatus)} flex items-center gap-1.5`}>
          {getStatusIcon(currentStatus)}
          <span>{t(`statuses.${currentStatus}`) || currentStatus}</span>
        </span>
      </div>

      {/* Stepper Dots for Major Stages */}
      {!isCancelled && !isRefunded && (
        <div className="relative pt-2 pb-1">
          <div className="overflow-hidden h-1.5 mb-3 text-xs flex rounded-full bg-gray-200">
            {(() => {
              const idx = statusStepOrder.indexOf(currentStatus);
              const progressPct = idx >= 0 ? Math.min(100, Math.round(((idx + 1) / statusStepOrder.length) * 100)) : 10;
              return (
                <div
                  style={{ width: `${progressPct}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-700"
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {statusTimeline?.length > 0 ? (
          statusTimeline.slice().reverse().map((entry, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-gray-700 border-l-2 border-emerald-500 pl-3 py-0.5">
              <span className="font-semibold text-gray-900 flex-shrink-0">
                {t(`statuses.${entry.status}`) || entry.status}:
              </span>
              <span className="text-gray-600 flex-1">{entry.note}</span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">Status timeline created.</p>
        )}
      </div>
    </div>
  );
};

export default BookingTimeline;
