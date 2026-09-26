'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle2, Award, Heart, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';

interface ReviewRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  creatorName?: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewRatingModal({
  isOpen,
  onClose,
  commissionId,
  creatorName = 'Creator',
  onReviewSubmitted,
}: ReviewRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setRatingError(null);

    if (rating < 1 || rating > 5) {
      setRatingError('Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao).');
      return;
    }

    setIsSubmitting(true);
    try {
      await commissionService.createReview(commissionId, {
        rating,
        comment: reviewText.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted();
        onClose();
      }, 1200);
    } catch (error: unknown) {
      console.error(error);
      let msg = 'Không thể gửi đánh giá.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { error?: { title?: string; detail?: string; details?: string[] }; message?: string } } };
        const errObj = axiosErr.response?.data?.error;
        const details = errObj?.detail || (Array.isArray(errObj?.details) ? errObj.details.join(' · ') : errObj?.details);
        const title = errObj?.title || axiosErr.response?.data?.message;
        if (details) msg = details;
        else if (title && title !== 'Bad Request') msg = title;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="text-sm font-space-grotesk font-bold text-white">Đánh giá tác phẩm & Dịch vụ</h3>
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
                  Bạn đánh giá mức độ hài lòng về tác phẩm thế nào?
                </p>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        if (ratingError) setRatingError(null);
                      }}
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

                {/* Inline error for rating */}
                {ratingError && (
                  <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {ratingError}
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nhận xét công khai (Không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Chia sẻ cảm nhận về giao tiếp, thái độ làm việc và chất lượng nét vẽ của Artist..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Tip Artist Option */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" /> Tặng thêm Tip cho Artist
                  </span>
                  <span className="text-xs text-slate-400">Tùy chọn</span>
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
                      {amount === 0 ? 'Không Tip' : `+${amount}k đ`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inline API Error Banner */}
              {submitError && (
                <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <p className="font-bold text-red-200">Gửi đánh giá thất bại</p>
                    <p className="mt-0.5 text-[11px] text-red-300/90">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Cảm ơn bạn đã gửi đánh giá!</h4>
              <p className="text-xs text-slate-400">Đánh giá {rating} sao của bạn đã được xuất bản trên trang cá nhân của {creatorName}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
