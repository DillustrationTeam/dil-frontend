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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FFFCF6] border border-[#221E1A]/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B24A26]/15 text-[#B24A26] flex items-center justify-center border border-[#B24A26]/30">
              {isAlreadyReviewed ? <Gift className="w-5 h-5 text-[#8A6A1F]" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241F1A] flex items-center gap-1.5">
                {isAlreadyReviewed ? 'Gửi Tip cho Họa sĩ' : 'Đánh giá & Tip họa sĩ'}
              </h3>
              <p className="text-[11px] text-[#746A5F]"> Họa sĩ: <strong className="text-[#6E6459]">{creatorName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
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
                <div className="p-4 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#746A5F] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#2F6B63]" /> Đánh giá trước đó của bạn </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (existingReview?.rating || 5)
                              ? 'fill-[#8A6A1F] text-[#8A6A1F]'
                              : 'text-[#241F1A]'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[#8A6A1F] font-bold">{existingReview?.rating}/5</span>
                    </div>
                  </div>
                  {existingReview?.comment && (
                    <p className="text-[#241F1A]/80 italic bg-[#F0E7D8] p-2.5 rounded-xl border border-[#221E1A]/10 text-[11px]">
                      &ldquo;{existingReview.comment}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                /* ACTIVE REVIEW FORM */
                <>
                  {/* Star Rating Section */}
                  <div className="text-center space-y-2.5 bg-[#FFFCF6] border border-[#221E1A]/10 p-4 rounded-2xl">
                    <p className="text-xs font-semibold text-[#746A5F]">
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
                                ? 'fill-[#8A6A1F] text-[#8A6A1F] drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                                : 'text-[#241F1A] hover:text-[#746A5F]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-[#8A6A1F] h-4">
                      {RATING_LABELS[activeRating] || ''}
                    </p>
                  </div>

                  {/* Quick Compliment Tags (Visual only, does NOT touch textarea) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[#746A5F] uppercase tracking-wider"> Điểm bạn hài lòng nhất: </label>
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
                                ? 'bg-[#B24A26]/25 border-[#B24A26] text-[#241F1A] shadow-sm'
                                : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:border-[#221E1A]/20 hover:text-[#6E6459]'
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
                    <label className="block text-[11px] font-bold text-[#746A5F] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#B24A26]" /> Lời nhận xét công khai cho họa sĩ: </label>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm về tiến độ, giao tiếp, chất lượng nét vẽ..."
                      className="w-full p-3 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#B24A26] transition-colors leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* REAL TIP SECTION */}
              <div className="p-4 rounded-2xl bg-[#8A6A1F]/12/[0.04] border border-[#8A6A1F]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#8A6A1F]/20 text-[#8A6A1F] flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 fill-[#8A6A1F]" />
                    </div>
                    <span className="text-xs font-bold text-[#8A6A1F]">
                      Gửi Tip động viên Họa sĩ {isAlreadyReviewed ? '' : '(Tùy chọn)'}
                    </span>
                  </div>

                  {/* Live Wallet Balance */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#746A5F] bg-[#FFFCF6] px-2.5 py-1 rounded-lg border border-[#221E1A]/10">
                    <Wallet className="w-3 h-3 text-[#B24A26]" />
                    <span>Số dư ví:</span>
                    <strong className="text-[#241F1A] font-semibold">
                      {walletBalance !== null ? formatVND(walletBalance) : (isLoadingWallet ? '...' : '0 đ')}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-[#746A5F]"> Tiền tip được trừ trực tiếp từ số dư ví sàn và gửi ngay đến tài khoản của họa sĩ. </p>

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
                          ? 'bg-[#F0E7D8] border-[#221E1A]/15 text-[#241F1A]'
                          : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] hover:border-[#221E1A]/20'
                      }`}
                    > Không tip </button>
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
                            ? 'bg-[#8A6A1F]/10 text-[#241F1A] font-bold border-[#8A6A1F]/30 shadow-md shadow-[#8A6A1F]'
                            : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] hover:border-[#221E1A]/20'
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
                        ? 'bg-[#8A6A1F]/10 text-[#241F1A] font-bold border-[#8A6A1F]/30 shadow-md shadow-[#8A6A1F]'
                        : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] hover:border-[#221E1A]/20'
                    }`}
                  > Khác </button>
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
                        className="w-full px-3 py-2 bg-[#F0E7D8] border border-[#8A6A1F]/40 rounded-xl text-xs text-[#8A6A1F] text-[#746A5F] focus:outline-none focus:border-[#8A6A1F]/30 pr-12"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[#8A6A1F] font-bold">VND</span>
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
                      className="w-full px-3 py-2 bg-[#F0E7D8] border border-[#221E1A]/10 rounded-xl text-[11px] text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#8A6A1F]/40"
                    />
                  </div>
                )}

                {/* Balance Insufficient Warning */}
                {isBalanceInsufficient && (
                  <div className="p-2.5 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/35 flex items-center gap-2 text-xs text-[#A8321C]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#A8321C]" />
                    <span>
                      Số dư ví hiện tại ({formatVND(walletBalance || 0)}) không đủ để gửi {formatVND(effectiveTip)}. Vui lòng nạp thêm ví.
                    </span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/30 text-xs text-[#A8321C]">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6] transition-colors"
                > Đóng </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isBalanceInsufficient || (isAlreadyReviewed && effectiveTip <= 0)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    effectiveTip > 0
                      ? 'bg-[#8A6A1F]/10 hover:bg-[#8A6A1F]/10 text-[#241F1A] shadow-[#8A6A1F]'
                      : 'bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9]'
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
                      <CheckCircle2 className="w-4 h-4" /> Gửi đánh giá ngay </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* SUBMISSION SUCCESS */
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#241F1A]">
                {tipSuccessInfo ? 'Gửi đánh giá & Tip thành công!' : 'Cảm ơn bạn đã gửi đánh giá!'}
              </h4>
              <p className="text-xs text-[#746A5F] max-w-sm mx-auto">
                {tipSuccessInfo ? (
                  <> Đã chuyển <strong className="text-[#8A6A1F]">{formatVND(tipSuccessInfo.amount)}</strong> tiền tip tới ví của họa sĩ <strong>{creatorName}</strong>. Số dư ví còn lại: <span className="text-[#2F6B63]">{formatVND(tipSuccessInfo.remaining)}</span>.
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
