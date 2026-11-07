'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle2, Award, Heart, MessageSquare, Wallet, Gift, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { walletService } from '@/services/wallet.service';

interface ReviewRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  creatorName?: string;
  existingReview?: {
    rating: number;
    comment?: string | null;
    createdAt?: string | null;
  } | null;
  onReviewSubmitted?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Xuất sắc — Vượt trên cả mong đợi! 🌟',
  4: 'Rất hài lòng — Tác phẩm chất lượng cao ✨',
  3: 'Tốt — Đúng theo yêu cầu & thỏa thuận 👍',
  2: 'Chưa hài lòng — Cần cải thiện tiến độ / giao tiếp ⚠️',
  1: 'Không hài lòng — Không đạt kỳ vọng ❌',
};

const QUICK_TAGS = [
  '⚡ Đúng tiến độ',
  '💬 Giao tiếp tận tâm',
  '🎨 Nét vẽ sắc nét',
  '✨ Chỉnh sửa chu đáo',
  '💖 Muốn hợp tác lại',
];

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' đ';
}

export default function ReviewRatingModal({
  isOpen,
  onClose,
  commissionId,
  creatorName = 'Họa sĩ',
  existingReview,
  onReviewSubmitted,
}: ReviewRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tip state
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [customTipInput, setCustomTipInput] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [tipSuccessInfo, setTipSuccessInfo] = useState<{ amount: number; remaining: number } | null>(null);

  // Fetch wallet balance when opening modal
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingWallet(true);
      walletService.getMine()
        .then((res) => {
          if (res?.wallet?.balance !== undefined) {
            setWalletBalance(res.wallet.balance);
          }
        })
        .catch(() => {
          // silently ignore
        })
        .finally(() => {
          setIsLoadingWallet(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (existingReview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(existingReview.rating || 5);
      setReviewText(existingReview.comment || '');
      setSelectedTip(50000);
    } else {
      setSelectedTip(0);
      setReviewText('');
      setSelectedTags([]);
    }
  }, [existingReview]);

  if (!isOpen) return null;

  const effectiveTip = isCustomTip
    ? (parseInt(customTipInput.replace(/\D/g, ''), 10) || 0)
    : selectedTip;

  const isBalanceInsufficient = walletBalance !== null && effectiveTip > 0 && effectiveTip > walletBalance;

  // Toggle tag purely in state — NEVER pollute or modify reviewText textarea!
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBalanceInsufficient) {
      setErrorMessage(`Số dư ví (${formatVND(walletBalance || 0)}) không đủ để gửi tip.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Submit review if not yet reviewed
      if (!existingReview) {
        // Construct clean comment: user comment + tags (if any)
        const tagText = selectedTags.length > 0 ? `[Điểm nổi bật: ${selectedTags.join(', ')}]` : '';
        const finalComment = [reviewText.trim(), tagText].filter(Boolean).join('\n\n') || undefined;

        await commissionService.createReview(commissionId, {
          rating,
          comment: finalComment,
        });
      }

      // 2. Submit tip if selected
      if (effectiveTip > 0) {
        const tipRes = await commissionService.sendTip(commissionId, {
          amount: effectiveTip,
          message: tipMessage.trim() || undefined,
        });
        if (tipRes?.clientRemainingBalance !== undefined) {
          setWalletBalance(tipRes.clientRemainingBalance);
          setTipSuccessInfo({
            amount: effectiveTip,
            remaining: tipRes.clientRemainingBalance,
          });
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted();
        onClose();
      }, 1600);
    } catch (error: unknown) {
      console.error(error);
      const msg = (error instanceof Error ? error.message : null) || 'Không thể thực hiện yêu cầu. Vui lòng thử lại sau.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;
  const isAlreadyReviewed = Boolean(existingReview);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#111420] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161928] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A7ACD9]/15 text-[#A7ACD9] flex items-center justify-center border border-[#A7ACD9]/30">
              {isAlreadyReviewed ? <Gift className="w-5 h-5 text-amber-400" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {isAlreadyReviewed ? 'Gửi Tip cho Họa sĩ' : 'Đánh giá & Tip Creator'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Họa sĩ: <strong className="text-slate-200">{creatorName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body with scrolling */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {isAlreadyReviewed ? (
                /* READONLY REVIEW SUMMARY */
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Đánh giá trước đó của bạn
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (existingReview?.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-amber-300 font-bold">{existingReview?.rating}/5</span>
                    </div>
                  </div>
                  {existingReview?.comment && (
                    <p className="text-white/80 italic bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px]">
                      &ldquo;{existingReview.comment}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                /* ACTIVE REVIEW FORM */
                <>
                  {/* Star Rating Section */}
                  <div className="text-center space-y-2.5 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-300">
                      Bạn cảm thấy thế nào về tác phẩm &amp; dịch vụ?
                    </p>
                    <div className="flex items-center justify-center gap-2 py-1">
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
                            className={`w-8 h-8 transition-colors ${
                              activeRating >= star
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                                : 'text-slate-600 hover:text-slate-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-amber-300/90 h-4">
                      {RATING_LABELS[activeRating] || ''}
                    </p>
                  </div>

                  {/* Quick Compliment Tags (Visual only, does NOT touch textarea) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Điểm bạn hài lòng nhất:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-[#A7ACD9]/25 border-[#A7ACD9] text-white shadow-sm'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Text Input (Clean, user types here) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#A7ACD9]" />
                      Lời nhận xét công khai cho Creator:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm về tiến độ, giao tiếp, chất lượng nét vẽ..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A7ACD9] transition-colors leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* REAL TIP SECTION */}
              <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-amber-300">
                      Gửi Tip động viên Họa sĩ {isAlreadyReviewed ? '' : '(Tùy chọn)'}
                    </span>
                  </div>

                  {/* Live Wallet Balance */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    <Wallet className="w-3 h-3 text-[#A7ACD9]" />
                    <span>Số dư ví:</span>
                    <strong className="text-white font-semibold">
                      {walletBalance !== null ? formatVND(walletBalance) : (isLoadingWallet ? '...' : '0 đ')}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Tiền tip được trừ trực tiếp từ số dư ví sàn và gửi ngay đến tài khoản của họa sĩ.
                </p>

                {/* Tip Preset Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {!isAlreadyReviewed && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTip(0);
                        setIsCustomTip(false);
                      }}
                      className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        selectedTip === 0 && !isCustomTip
                          ? 'bg-white/20 border-white text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Không tip
                    </button>
                  )}

                  {[20000, 50000, 100000, 200000].map((amount) => {
                    const isSelected = selectedTip === amount && !isCustomTip;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedTip(amount);
                          setIsCustomTip(false);
                        }}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-500/20'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                        }`}
                      >
                        +{amount >= 1000 ? `${amount / 1000}k` : amount}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTip(true);
                      setSelectedTip(0);
                    }}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isCustomTip
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    Khác
                  </button>
                </div>

                {/* Custom Tip Input */}
                {isCustomTip && (
                  <div className="pt-1 space-y-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={customTipInput}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCustomTipInput(raw ? Number(raw).toLocaleString('vi-VN') : '');
                        }}
                        placeholder="Nhập số tiền muốn tip (tối thiểu 1.000 đ)"
                        className="w-full px-3 py-2 bg-black/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-12"
                      />
                      <span className="absolute right-3 top-2 text-xs text-amber-400 font-bold">VND</span>
                    </div>
                  </div>
                )}

                {/* Optional Tip Message */}
                {effectiveTip > 0 && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      maxLength={100}
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      placeholder="Lời nhắn kèm tiền tip (vd: Cảm ơn vì tác phẩm tuyệt vời!)..."
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                )}

                {/* Balance Insufficient Warning */}
                {isBalanceInsufficient && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      Số dư ví hiện tại ({formatVND(walletBalance || 0)}) không đủ để gửi {formatVND(effectiveTip)}. Vui lòng nạp thêm ví.
                    </span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isBalanceInsufficient || (isAlreadyReviewed && effectiveTip <= 0)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    effectiveTip > 0
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                      : 'bg-[#A7ACD9] hover:bg-[#B8BCDF] text-[#1F2335]'
                  }`}
                >
                  {isSubmitting ? (
                    'Đang xử lý...'
                  ) : effectiveTip > 0 ? (
                    <>
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {isAlreadyReviewed
                        ? `Gửi Tip ${formatVND(effectiveTip)} ngay`
                        : `Gửi Đánh giá & Tip ${formatVND(effectiveTip)}`}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Gửi đánh giá ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* SUBMISSION SUCCESS */
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">
                {tipSuccessInfo ? 'Gửi đánh giá & Tip thành công!' : 'Cảm ơn bạn đã gửi đánh giá!'}
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                {tipSuccessInfo ? (
                  <>
                    Đã chuyển <strong className="text-amber-300">{formatVND(tipSuccessInfo.amount)}</strong> tiền tip tới ví của họa sĩ <strong>{creatorName}</strong>. Số dư ví còn lại: <span className="text-emerald-400">{formatVND(tipSuccessInfo.remaining)}</span>.
                  </>
                ) : (
                  <>Đánh giá {rating} sao của bạn đã được ghi nhận vào hồ sơ uy tín của họa sĩ {creatorName}.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
