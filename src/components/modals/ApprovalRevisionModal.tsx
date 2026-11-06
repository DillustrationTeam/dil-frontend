'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { addonService } from '@/services/addon.service';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import toast from 'react-hot-toast';
import type { MilestoneStatus } from '@/types/commission.types';

interface ApprovalRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  wipPreviewUrl: string;
  maxRevisions: number;
  revisionCount: number;
  extraRevisionPrice?: number;
  milestoneSequence?: number;
  isCreator?: boolean;
  revisionFeedback?: string | null;
  milestoneStatus?: MilestoneStatus;
  onOpenSubmitModal?: () => void;
  onSuccess?: () => void;
}

export default function ApprovalRevisionModal({
  isOpen,
  onClose,
  commissionId,
  milestoneId,
  wipPreviewUrl,
  maxRevisions,
  revisionCount,
  extraRevisionPrice = 50000,
  milestoneSequence = 1,
  isCreator = false,
  revisionFeedback,
  milestoneStatus,
  onOpenSubmitModal,
  onSuccess,
}: ApprovalRevisionModalProps) {
  const [mode, setMode] = useState<'view' | 'revise'>('view');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);

  if (!isOpen) return null;

  const revisionsLeft = maxRevisions - revisionCount;

  const handleStandardizeFeedback = async () => {
    if (!feedback.trim()) return;
    setIsStandardizing(true);
    try {
      const res = await aiService.standardizeRevision({ feedback });
      if (res?.content) {
        setFeedback(res.content);
      }
    } catch (err) {
      console.error('Failed to standardize revision', err);
      toast.error('Không thể chuẩn hóa phản hồi lúc này.');
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await commissionService.approveMilestone(commissionId, milestoneId);
      toast.success('Đã duyệt bản vẽ & giải ngân cho cột mốc!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Không thể duyệt cột mốc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nội dung cần chỉnh sửa.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (revisionsLeft <= 0) {
        // Exceeded free revisions: Propose paid extra revision to Creator
        await addonService.propose(commissionId, {
          title: `Sửa đổi bổ sung mốc #${milestoneSequence}`,
          description: feedback.trim(),
          price: extraRevisionPrice,
          allowedMilestone: 'Any',
          extendDays: 0,
        });
        toast.success(
          `Đã gửi đề xuất sửa thêm (+${extraRevisionPrice.toLocaleString('vi-VN')} đ) cho Creator. Vui lòng chờ Creator duyệt.`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        await commissionService.requestRevision(commissionId, milestoneId, feedback);
        toast.success('Đã gửi yêu cầu chỉnh sửa thành công.');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể gửi yêu cầu chỉnh sửa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Image Viewer */}
        <div className="w-full md:w-3/5 bg-black/40 border-r border-white/10 p-6 flex flex-col justify-center items-center relative min-h-[300px]">
          {wipPreviewUrl ? (
            <Image
              src={wipPreviewUrl}
              alt="Milestone Preview"
              width={1200}
              height={900}
              unoptimized
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg pointer-events-none"
            />
          ) : (
            <p className="text-slate-500 text-sm">Chưa có bản vẽ preview.</p>
          )}
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Watermarked Preview</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="w-full md:w-2/5 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-space-grotesk font-bold text-white">Nghiệm thu bản vẽ mốc #{milestoneSequence}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6">
            {isCreator ? (
              <div className="space-y-4 text-sm text-slate-300">
                <p>{revisionFeedback || 'Đang chờ khách hàng duyệt bản vẽ.'}</p>
                {milestoneStatus === 'RevisionRequested' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubmitModal?.();
                    }}
                    className="w-full rounded-xl bg-[#A7ACD9] px-4 py-3 font-semibold text-[#1F2335]"
                  >
                    Nộp bản chỉnh sửa
                  </button>
                )}
              </div>
            ) : milestoneStatus && milestoneStatus !== 'Submitted' ? (
              <p className="text-sm text-slate-300">Chỉ có thể duyệt hoặc yêu cầu chỉnh sửa khi bản vẽ đang chờ duyệt.</p>
            ) : mode === 'view' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Nghiệm thu & Duyệt bản vẽ
                  </h4>
                  <p className="text-xs text-emerald-300/70 mb-4">
                    Nếu bạn hài lòng, duyệt để mở khóa thanh toán cho mốc này và cho phép Creator tiến hành mốc tiếp theo.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang duyệt...' : 'Duyệt & Giải ngân mốc này'}
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Yêu cầu chỉnh sửa (Revision)
                  </h4>
                  <p className="text-xs text-amber-300/70 mb-2">
                    {revisionsLeft > 0
                      ? 'Chưa ưng ý? Gửi yêu cầu chỉnh sửa cho Creator.'
                      : 'Đã hết lượt sửa miễn phí. Mỗi lần sửa thêm sẽ tính phụ phí và cần Creator đồng ý.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] mb-4 font-mono">
                    <span className="text-amber-400/70">
                      Lượt sửa: {revisionCount} / {maxRevisions}
                    </span>
                    {revisionsLeft <= 0 && (
                      <span className="text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        +{extraRevisionPrice.toLocaleString('vi-VN')} đ/lần
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setMode('revise')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    {revisionsLeft > 0
                      ? 'Viết phản hồi chỉnh sửa'
                      : `Yêu cầu sửa thêm (+${extraRevisionPrice.toLocaleString('vi-VN')} đ)`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {revisionsLeft <= 0 && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <DollarSign className="w-4 h-4" /> Rào chặn số lần sửa
                    </div>
                    <p className="text-amber-200/80">
                      Đơn hàng đã sử dụng hết {maxRevisions} lần sửa miễn phí. Đề xuất này sẽ được gửi tới Creator với mức phụ phí <strong>{extraRevisionPrice.toLocaleString('vi-VN')} đ</strong>. Creator sẽ xem xét nhận sửa trước khi tiến hành.
                    </p>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-space-grotesk font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Chi tiết cần sửa đổi
                    </label>
                    <button
                      type="button"
                      disabled={isStandardizing || !feedback.trim()}
                      onClick={handleStandardizeFeedback}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {isStandardizing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{isStandardizing ? 'Đang chuẩn hóa…' : '✨ AI Chuẩn hóa yêu cầu'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Mô tả chi tiết những điểm cần thay đổi, sửa chữa, thêm bớt..."
                    className="w-full p-4 bg-black/40 border border-amber-500/30 rounded-xl text-sm text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Đang gửi...'
                      : revisionsLeft > 0
                        ? 'Gửi yêu cầu sửa'
                        : `Gửi đề xuất sửa thêm (+${extraRevisionPrice.toLocaleString('vi-VN')} đ)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
