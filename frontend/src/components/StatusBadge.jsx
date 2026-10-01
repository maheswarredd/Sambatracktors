import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Truck, 
  MapPin, 
  PlayCircle, 
  CheckCheck, 
  DollarSign, 
  RotateCcw 
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'Pending Assignment'
        };
      case 'PAYMENT_PENDING':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300 animate-pulse',
          dot: 'bg-purple-500',
          icon: Clock,
          label: 'Payment Verification Pending'
        };
      case 'PAYMENT_VERIFIED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          icon: CheckCircle,
          label: 'Payment Verified'
        };
      case 'CONFIRMED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle,
          label: 'Booking Confirmed'
        };
      case 'RIDER_ASSIGNED':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          dot: 'bg-indigo-500',
          icon: Truck,
          label: 'Rider & Tractor Assigned'
        };
      case 'RIDER_ON_THE_WAY':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-400 font-bold animate-pulse',
          dot: 'bg-cyan-500',
          icon: Truck,
          label: 'Tractor On The Way'
        };
      case 'ARRIVED':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-400 font-bold',
          dot: 'bg-teal-500',
          icon: MapPin,
          label: 'Arrived at Farm'
        };
      case 'SERVICE_STARTED':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-500 font-extrabold shadow-sm',
          dot: 'bg-emerald-600 animate-ping',
          icon: PlayCircle,
          label: 'Field Service in Progress'
        };
      case 'SERVICE_COMPLETED':
        return {
          bg: 'bg-green-50 text-green-800 border-green-400 font-bold',
          dot: 'bg-green-600',
          icon: CheckCheck,
          label: 'Service Completed'
        };
      case 'PAYMENT_COMPLETED':
        return {
          bg: 'bg-green-100 text-green-900 border-green-500 font-bold',
          dot: 'bg-green-600',
          icon: DollarSign,
          label: 'Payment Received & Closed'
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
          icon: CheckCheck,
          label: 'Booking Closed'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-red-50 text-red-800 border-red-300',
          dot: 'bg-red-500',
          icon: XCircle,
          label: 'Booking Cancelled'
        };
      case 'REFUND_REQUESTED':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-500',
          icon: RotateCcw,
          label: 'Refund Requested'
        };
      case 'REFUND_APPROVED':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          dot: 'bg-sky-500',
          icon: CheckCircle,
          label: 'Refund Approved'
        };
      case 'REFUND_COMPLETED':
        return {
          bg: 'bg-green-50 text-green-800 border-green-300',
          dot: 'bg-green-600',
          icon: CheckCheck,
          label: 'Refund Disbursed'
        };
      case 'REFUND_REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          icon: XCircle,
          label: 'Refund Declined'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-400',
          icon: Clock,
          label: status || 'Unknown'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
