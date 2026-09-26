import React, { useRef, useState } from 'react';
import { X, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
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

  // Dynamic Interactive Zoom & Free Dragging Panning State
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });

  if (!isOpen) return null;

  const revisionsLeft = maxRevisions - revisionCount;

  // Handlers cho kéo thả tự do (Free Drag & Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      posStartRef.current = { ...position };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPosition({
        x: posStartRef.current.x + dx,
        y: posStartRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomScale((prev) => Math.min(3.5, Math.max(0.5, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D14]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#1F2335] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row rounded-3xl">
        
        {/* Left Side: Interactive Free Drag & Pan Image Viewer */}
        <div 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`w-full md:w-3/5 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative min-h-[360px] max-h-[80vh] overflow-hidden select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Nút Điều Khiển Zoom & Reset Vị Trí */}
          <div className="absolute top-4 right-4 z-20 flex items-center bg-[#161926]/90 border border-white/10 p-1.5 gap-1.5 rounded-xl backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Thu nhỏ (-)"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-mono font-bold text-white px-1.5 select-none">{Math.round(zoomScale * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(3.5, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Phóng to (+)"
            >
              <ZoomIn size={14} />
            </button>
            {(zoomScale !== 1 || position.x !== 0 || position.y !== 0) && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition border-l border-white/10 pl-2"
                title="Đặt lại khung nhìn (100%)"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Tag Watermark & Hướng Dẫn Kéo Thả */}
          <div className="absolute top-4 left-4 z-20 bg-[#161926]/90 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Watermarked Preview</span>
          </div>

          <div className="absolute bottom-3 left-4 z-20 text-[10px] text-slate-400/80 pointer-events-none flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
            <Move size={11} className="text-slate-400 shrink-0" />
            <span>Kéo thả để di chuyển tự do · Lăn chuột để zoom</span>
          </div>

          {wipPreviewUrl ? (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="will-change-transform flex items-center justify-center pointer-events-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={wipPreviewUrl} 
                alt="Milestone Preview" 
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Chưa có ảnh xem thử.</p>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="w-full md:w-2/5 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/80">
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
                    <p className="text-xs text-amber-100 italic bg-[#1b1b1e] p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                      &ldquo;{revisionFeedback || 'Khách hàng đã gửi yêu cầu chỉnh sửa cho mốc này.'}&rdquo;
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
                        className="w-full mt-2 py-2.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md"
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
                  <div className="p-4 bg-[#A7ACD9]/10 border border-[#A7ACD9]/30 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-[#A7ACD9] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#A7ACD9]" /> Đã nộp bản phác thảo
                    </h4>
                    <p className="text-xs text-slate-300">
                      Bản phác thảo đã được đăng tải kèm dấu Watermark bảo vệ. Đang chờ Khách hàng xem và bấm duyệt mốc.
                    </p>
                    {onOpenSubmitModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSubmitModal();
                        }}
                        className="w-full mt-2 py-2.5 rounded-full text-xs font-bold bg-[#A7ACD9] text-[#131316] hover:bg-[#b8bde8] transition-all shadow-md"
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
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all disabled:opacity-50"
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
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                    className={`w-full p-4 bg-[#1b1b1e] rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none transition-all ${
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
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setActionError(null);
                      setFeedbackError(null);
                      setMode('view');
                    }}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-all"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all disabled:opacity-50"
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
