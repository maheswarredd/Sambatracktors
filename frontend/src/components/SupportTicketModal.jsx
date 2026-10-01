import React, { useState } from 'react';
import client from '../api/client';
import { LifeBuoy, X, AlertCircle, Clock, DollarSign, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Rider Not Reached',
  'Rider Late',
  'Booking Issue',
  'Payment Issue',
  'Wrong Location',
  'Service Not Completed',
  'Cancellation',
  'Refund Request',
  'Other Issue'
];

const SupportTicketModal = ({ booking, isOpen, onClose, onTicketCreated }) => {
  const [category, setCategory] = useState(booking ? 'Rider Not Reached' : 'Booking Issue');
  const [subject, setSubject] = useState(booking ? `Issue with Booking #${booking.bookingNumber}` : '');
  const [description, setDescription] = useState('');
  const [waitingTimeMinutes, setWaitingTimeMinutes] = useState(20);
  const [farmerContactAttempted, setFarmerContactAttempted] = useState(true);
  const [refundAmount, setRefundAmount] = useState(booking?.totalAmount || 0);
  const [refundUpiId, setRefundUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide detailed information about your issue');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        bookingId: booking?._id || null,
        category,
        subject: subject.trim() || `${category} - Samba Tractors`,
        description: description.trim(),
        waitingTimeMinutes: category === 'Rider Not Reached' ? Number(waitingTimeMinutes) : 0,
        farmerContactAttempted: category === 'Rider Not Reached' ? farmerContactAttempted : false,
        refundAmount: category === 'Refund Request' ? Number(refundAmount) : 0,
        refundReason: category === 'Refund Request' ? description.trim() : '',
        refundUpiId: category === 'Refund Request' ? refundUpiId.trim() : ''
      };

      const res = await client.post('/support', payload);

      if (res.data.success) {
        setSuccess(true);
        onTicketCreated && onTicketCreated(res.data.data);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-samba-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-samba-800 rounded-xl text-harvest-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Farmer Support & Issue Reporting</h3>
              <p className="text-[11px] text-samba-300">
                {booking ? `Linked to Booking #${booking.bookingNumber}` : 'General Inquiry'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-samba-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-samba-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-800 text-base">Support Ticket Raised!</h4>
            <p className="text-xs text-slate-500">
              Our central dispatch office has received your alert and will assist you immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-samba-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Rider Not Reached' ? '🚨 Rider Not Reached at Farm' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Rider Not Reached Specialized Inputs */}
            {category === 'Rider Not Reached' && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Rider Not Reached Information</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Time Spent Waiting:
                    </label>
                    <select
                      value={waitingTimeMinutes}
                      onChange={(e) => setWaitingTimeMinutes(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>Over 1 Hour</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={farmerContactAttempted}
                        onChange={(e) => setFarmerContactAttempted(e.target.checked)}
                        className="rounded text-samba-600 focus:ring-samba-500 w-4 h-4"
                      />
                      <span className="text-slate-700 text-xs">I tried calling rider</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Request Specialized Inputs */}
            {category === 'Refund Request' && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-300 space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2 text-orange-900 font-bold text-xs">
                  <DollarSign className="w-4 h-4 text-orange-700" />
                  <span>Refund Disbursal Information</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Farmer UPI ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi"
                      value={refundUpiId}
                      onChange={(e) => setRefundUpiId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your problem"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-samba-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the issue in detail so our support staff can resolve it immediately..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-samba-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-samba-600 hover:bg-samba-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportTicketModal;
