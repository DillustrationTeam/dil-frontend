'use client';

import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2, Award } from 'lucide-react';

interface ReviewRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName?: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewRatingModal({
  isOpen,
  onClose,
  creatorName = 'Kaelen Voss',
  onReviewSubmitted,
}: ReviewRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Rate & Review Commission</h3>
              <p className="text-[11px] text-slate-400">Creator: {creatorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Selection */}
              <div className="text-center space-y-2">
                <p className="text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider">
                  How satisfied are you with the artwork?
                </p>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Public Review & Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe your experience, communication, and artwork quality..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Tip Artist Option */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" /> Send Artist Tip
                  </span>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 25, 50].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTipAmount(amount)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        tipAmount === amount
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {amount === 0 ? 'No Tip' : `+$${amount}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
                >
                  Skip Review
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Review
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-400">Your 5-star review has been published on {creatorName}&apos;s profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
