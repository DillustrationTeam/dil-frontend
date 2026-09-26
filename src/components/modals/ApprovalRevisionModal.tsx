'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';

interface ApprovalRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  wipPreviewUrl: string;
  maxRevisions: number;
  revisionCount: number;
  isCreator?: boolean;
  revisionFeedback?: string | null;
  milestoneStatus?: string;
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
  isCreator = false,
  revisionFeedback,
  milestoneStatus,
  onOpenSubmitModal,
  onSuccess,
}: ApprovalRevisionModalProps) {
  const [mode, setMode] = useState<'view' | 'revise'>('view');
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const revisionsLeft = maxRevisions - revisionCount;

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosErr = error as { response?: { data?: { error?: { detail?: string; title?: string; details?: string[] }; message?: string } } };
      const errObj = axiosErr.response?.data?.error;
      const detail = errObj?.detail || (Array.isArray(errObj?.details) ? errObj.details.join(' · ') : errObj?.details);
      const title = errObj?.title || axiosErr.response?.data?.message;
      if (detail) return detail;
      if (title && title !== 'Conflict' && title !== 'Bad Request') return title;
      if (title === 'Conflict') return 'Đơn hàng hoặc mốc đã được cập nhật trước đó. Vui lòng tải lại trang để xem trạng thái mới nhất.';
    }
    if (error instanceof Error) return error.message;
    return fallback;
  };

  const handleApprove = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await commissionService.approveMilestone(commissionId, milestoneId);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      setActionError(extractErrorMessage(error, 'Không thể duyệt mốc phác thảo này. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    setFeedbackError(null);
    setActionError(null);

    if (!feedback.trim()) {
      setFeedbackError('Vui lòng nhập nội dung chi tiết các điểm cần Creator chỉnh sửa.');
      return;
    }

    setIsSubmitting(true);
    try {
      await commissionService.requestRevision(commissionId, milestoneId, feedback.trim());
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error(error);
      setActionError(extractErrorMessage(error, 'Không thể gửi yêu cầu chỉnh sửa. Có thể đã vượt quá số lần cho phép.'));
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
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={wipPreviewUrl} 
              alt="Milestone Preview" 
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg pointer-events-none"
            />
          ) : (
            <p className="text-slate-500 text-sm">Chưa có ảnh xem thử.</p>
          )}
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Watermarked Preview</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="w-full md:w-2/5 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-space-grotesk font-bold text-white">
              {isCreator ? 'Xem bản phác thảo & Ý kiến phản hồi' : 'Duyệt mốc & Kiểm tra bản phác thảo'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6 overflow-y-auto">
            {actionError && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold text-red-200">Xử lý thất bại</p>
                  <p className="mt-0.5 text-[11px] text-red-300/90">{actionError}</p>
                </div>
              </div>
            )}

            {/* HIỂN THỊ DÀNH CHO CREATOR */}
            {isCreator ? (
              <div className="space-y-4">
                {revisionFeedback || milestoneStatus === 'RevisionRequested' ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> Yêu cầu chỉnh sửa từ Khách hàng
                    </h4>
                    <p className="text-xs text-amber-100 italic bg-black/40 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                      "{revisionFeedback || 'Khách hàng đã gửi yêu cầu chỉnh sửa cho mốc này.'}"
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Lượt sửa đã thực hiện: {revisionCount} / {maxRevisions}
                    </p>
                    {onOpenSubmitModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSubmitModal();
                        }}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg"
                      >
                        Nộp bản phác thảo đã sửa
                      </button>
                    )}
                  </div>
                ) : milestoneStatus === 'Approved' ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mốc này đã được Khách hàng duyệt
                    </h4>
                    <p className="text-xs text-emerald-300/80">
                      Tiền mốc đã được giải ngân vào ví của bạn. Bạn có thể tiến hành thực hiện các mốc tiếp theo.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" /> Đã nộp bản phác thảo
                    </h4>
                    <p className="text-xs text-purple-200/80">
                      Bản phác thảo đã được đăng tải kèm dấu Watermark bảo vệ. Đang chờ Khách hàng xem và bấm duyệt mốc.
                    </p>
                    {onOpenSubmitModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSubmitModal();
                        }}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-purple-500 text-white hover:bg-purple-400 transition-colors shadow-lg"
                      >
                        Cập nhật bản vẽ / Nộp lại WIP
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : mode === 'view' ? (
              /* HIỂN THỊ DÀNH CHO CLIENT */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Duyệt bản phác thảo này
                  </h4>
                  <p className="text-xs text-emerald-300/70 mb-4">
                    Nếu bạn đã hài lòng với bản phác thảo này, hãy duyệt để hệ thống giải ngân tiền mốc và cho phép Creator tiến hành vẽ bước kế tiếp.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang duyệt...' : 'Duyệt mốc & Giải ngân tiền mốc'}
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Yêu cầu sửa đổi (Revision)
                  </h4>
                  <p className="text-xs text-amber-300/70 mb-2">
                    Chưa đúng ý tưởng? Bạn có thể gửi phản hồi để Creator chỉnh sửa lại.
                  </p>
                  <p className="text-[11px] text-amber-400/80 mb-4 font-mono">
                    Lượt sửa còn lại: {revisionsLeft} / {maxRevisions}
                  </p>
                  <button
                    onClick={() => {
                      setActionError(null);
                      setFeedbackError(null);
                      setMode('revise');
                    }}
                    disabled={revisionsLeft <= 0}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {revisionsLeft > 0 ? 'Viết yêu cầu sửa đổi' : 'Hết lượt sửa tối đa'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-space-grotesk font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Nội dung cần sửa đổi
                  </label>
                  <textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      if (feedbackError) setFeedbackError(null);
                    }}
                    placeholder="Mô tả cụ thể những điểm cần chỉnh sửa, thêm bớt hoặc đổi màu..."
                    className={`w-full p-4 bg-black/40 rounded-xl text-sm text-amber-100 placeholder-amber-500/40 focus:outline-none ${
                      feedbackError
                        ? 'border-2 border-red-500/70 focus:border-red-500'
                        : 'border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                  />
                  {feedbackError && (
                    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {feedbackError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActionError(null);
                      setFeedbackError(null);
                      setMode('view');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu sửa'}
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
