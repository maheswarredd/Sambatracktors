import React, { useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { LifeBuoy, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SupportModal = ({ isOpen, onClose, bookingId }) => {
  const [issueType, setIssueType] = useState('Booking Issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const issueOptions = [
    { value: 'Booking Issue', label: t('support.bookingIssue') },
    { value: 'Payment Issue', label: t('support.paymentIssue') },
    { value: 'Rider Not Reached', label: t('support.riderNotReached') },
    { value: 'Rider Late', label: language === 'te' ? 'డ్రైవర్ ఆలస్యం' : language === 'hi' ? 'ड्राइवर देर से आया' : 'Rider Late' },
    { value: 'Wrong Location', label: t('support.wrongLocation') },
    { value: 'Service Not Completed', label: t('support.serviceNotCompleted') },
    { value: 'Cancellation', label: t('support.cancellation') },
    { value: 'Refund Request', label: t('support.refundRequest') },
    { value: 'Other Issue', label: t('support.other') }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createTicket({
        issueType,
        subject,
        description,
        bookingId,
        refundAmount: Number(refundAmount) || 0
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">{t('support.title')}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <p className="font-bold text-gray-800 text-sm">Ticket Raised Successfully!</p>
            <p className="text-xs text-gray-500">Samba Admin will review and reply shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {bookingId && (
              <div className="p-2.5 bg-gray-50 rounded-xl text-xs font-mono text-gray-700 border border-gray-200">
                Booking ID: {bookingId}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('support.issueType')}
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {issueOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {issueType === 'Refund Request' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Requested Refund Amount (₹)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('support.subject')}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of issue"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('support.description')}
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('support.description')}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : t('support.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
