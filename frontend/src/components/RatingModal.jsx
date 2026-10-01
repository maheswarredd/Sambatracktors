import React, { useState } from 'react';
import client from '../api/client';
import { Star, X, CheckCircle } from 'lucide-react';

const RatingModal = ({ booking, isOpen, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [workQualityRating, setWorkQualityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback about your tractor experience');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await client.post('/reviews', {
        bookingId: booking._id,
        rating,
        punctualityRating,
        workQualityRating,
        comment: comment.trim()
      });

      if (res.data.success) {
        onReviewSubmitted && onReviewSubmitted(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-samba-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm">Rate Your Tractor Service</h3>
            <p className="text-[11px] text-samba-300">#{booking.bookingNumber} • {booking.serviceName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-samba-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
              {error}
            </div>
          )}

          {/* Overall Star Rating */}
          <div className="text-center">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Overall Experience
            </label>
            <div className="flex justify-center items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-harvest-400 text-harvest-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="inline-block mt-2 text-xs font-semibold text-samba-700">
              {rating === 5 && 'Outstanding Service!'}
              {rating === 4 && 'Very Good Service'}
              {rating === 3 && 'Average Experience'}
              {rating === 2 && 'Needs Improvement'}
              {rating === 1 && 'Disappointing'}
            </span>
          </div>

          {/* Sub-ratings */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Rider Punctuality</span>
              <select
                value={punctualityRating}
                onChange={(e) => setPunctualityRating(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value={5}>5 - Reached on time</option>
                <option value={4}>4 - Slight delay</option>
                <option value={3}>3 - Moderate delay</option>
                <option value={2}>2 - Late</option>
                <option value={1}>1 - Extremely late</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Tillage Quality</span>
              <select
                value={workQualityRating}
                onChange={(e) => setWorkQualityRating(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value={5}>5 - Excellent depth</option>
                <option value={4}>4 - Very good</option>
                <option value={3}>3 - Acceptable</option>
                <option value={2}>2 - Uneven</option>
                <option value={1}>1 - Poor quality</option>
              </select>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Farmer Feedback & Suggestions <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the tractor's ploughing depth, speed, and driver behavior?"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-samba-600 hover:bg-samba-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            {submitting ? 'Submitting Rating...' : 'Submit Rating & Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
