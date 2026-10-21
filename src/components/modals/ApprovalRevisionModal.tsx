'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Loader2,
  MapPin,
  Edit3,
  Undo2,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import type { MilestoneStatus, PinAnnotation } from '@/types/commission.types';

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
  revisionFeedbackImageUrl?: string | null;
  revisionAnnotationsJson?: string | null;
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
  isCreator = false,
  revisionFeedback,
  revisionFeedbackImageUrl,
  revisionAnnotationsJson,
  milestoneStatus,
  onOpenSubmitModal,
  onSuccess,
}: ApprovalRevisionModalProps) {
  const [mode, setMode] = useState<'view' | 'revise'>('view');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);

  // Redline & Pin annotation state
  const [activeTool, setActiveTool] = useState<'pin' | 'draw'>('pin');
  const [showRedlineLayer, setShowRedlineLayer] = useState(true);
  const [pins, setPins] = useState<PinAnnotation[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas drawing state
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokeHistoryRef = useRef<ImageData[]>([]);

  // Parse existing annotations if creator or viewing submitted feedback
  useEffect(() => {
    if (revisionAnnotationsJson) {
      try {
        const parsed = JSON.parse(revisionAnnotationsJson);
        if (Array.isArray(parsed)) {
          setPins(parsed);
        }
      } catch {
        // ignore parse error
      }
    }
  }, [revisionAnnotationsJson]);

  // Synchronize canvas size with preview image container
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Save existing drawing if any
        const ctx = canvas.getContext('2d');
        let tempImage: HTMLCanvasElement | null = null;
        if (canvas.width > 0 && canvas.height > 0) {
          tempImage = document.createElement('canvas');
          tempImage.width = canvas.width;
          tempImage.height = canvas.height;
          tempImage.getContext('2d')?.drawImage(canvas, 0, 0);
        }

        canvas.width = rect.width;
        canvas.height = rect.height;

        if (tempImage && ctx) {
          ctx.drawImage(tempImage, 0, 0, rect.width, rect.height);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [isOpen, syncCanvasSize, mode]);

  if (!isOpen) return null;

  const revisionsLeft = maxRevisions - revisionCount;

  // Handle Canvas Drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'revise') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pin') {
      // Add a relative % pin
      const relX = Math.round((x / rect.width) * 1000) / 10;
      const relY = Math.round((y / rect.height) * 1000) / 10;
      const newPinId = pins.length > 0 ? Math.max(...pins.map((p) => p.id)) + 1 : 1;

      const newPin: PinAnnotation = { id: newPinId, x: relX, y: relY };
      setPins((prev) => [...prev, newPin]);

      // Automatically append prompt marker into feedback textarea
      setFeedback((prev) => {
        const marker = `[Điểm ${newPinId}]: `;
        return prev.trim() ? `${prev.trim()}\n${marker}` : marker;
      });
      return;
    }

    if (activeTool === 'draw') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Save snapshot for undo
      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current.push(snapshot);
        if (strokeHistoryRef.current.length > 20) strokeHistoryRef.current.shift();
      } catch {
        // ignore
      }

      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = '#FF3344';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setHasDrawn(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'revise' || activeTool !== 'draw' || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
    }
  };

  const handleUndo = () => {
    if (activeTool === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const previous = strokeHistoryRef.current.pop();
      if (previous) {
        ctx.putImageData(previous, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    } else {
      // Undo last pin
      if (pins.length > 0) {
        setPins((prev) => prev.slice(0, prev.length - 1));
      }
    }
  };

  const handleClearAll = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    strokeHistoryRef.current = [];
    setPins([]);
    setHasDrawn(false);
  };

  const removePin = (id: number) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await commissionService.approveMilestone(commissionId, milestoneId);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Không thể duyệt mốc này lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      alert('Không thể chuẩn hóa phản hồi lúc này.');
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!feedback.trim()) return alert('Vui lòng nhập nội dung góp ý cần chỉnh sửa.');
    setIsSubmitting(true);
    try {
      let redlineDataUrl: string | undefined = undefined;
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        redlineDataUrl = canvas.toDataURL('image/png');
      }

      const annotationsJson = pins.length > 0 ? JSON.stringify(pins) : undefined;

      await commissionService.requestRevision(
        commissionId,
        milestoneId,
        feedback.trim(),
        redlineDataUrl,
        annotationsJson
      );
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Gửi yêu cầu chỉnh sửa thất bại. Có thể bạn đã vượt quá số lần sửa tối đa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* Left Side: Interactive Image Viewer & Redline Canvas */}
        <div className="w-full md:w-3/5 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative min-h-[360px] overflow-hidden select-none">
          {/* Top Badges */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className="bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">
                Watermarked Preview
              </span>
            </div>

            {/* Redline Visibility Toggle */}
            {(revisionFeedbackImageUrl || hasDrawn || pins.length > 0) && (
              <button
                type="button"
                onClick={() => setShowRedlineLayer((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 transition-colors ${
                  showRedlineLayer
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-black/60 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {showRedlineLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showRedlineLayer ? 'Redline (Bật)' : 'Redline (Tắt)'}</span>
              </button>
            )}
          </div>

          {/* Interactive Artwork Wrapper */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center max-w-full max-h-[65vh] rounded-xl overflow-hidden shadow-2xl"
          >
            {wipPreviewUrl ? (
              <Image
                src={wipPreviewUrl}
                alt="Milestone Preview"
                width={1200}
                height={900}
                unoptimized
                onLoad={syncCanvasSize}
                className="max-w-full max-h-[65vh] w-auto h-auto object-contain rounded-xl pointer-events-none"
              />
            ) : (
              <p className="text-slate-500 text-sm">Chưa có bản xem trước.</p>
            )}

            {/* Saved Redline Image Layer (for Creator or Historical view) */}
            {revisionFeedbackImageUrl && showRedlineLayer && (
              <img
                src={revisionFeedbackImageUrl}
                alt="Client Redline Layer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
            )}

            {/* Active Drawing Canvas Layer (Client Revise Mode) */}
            {mode === 'revise' && showRedlineLayer && (
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute inset-0 w-full h-full z-15 ${
                  activeTool === 'pin' ? 'cursor-crosshair' : 'cursor-crosshair'
                }`}
              />
            )}

            {/* Pin Badges Overlay */}
            {showRedlineLayer &&
              pins.map((pin) => (
                <div
                  key={pin.id}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'revise') removePin(pin.id);
                  }}
                  title={mode === 'revise' ? `Điểm ${pin.id} (Bấm để xóa điểm)` : `Điểm ${pin.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg border-2 border-white select-none cursor-pointer group hover:scale-125 transition-transform"
                >
                  <span>{pin.id}</span>
                  {mode === 'revise' && (
                    <span className="absolute -top-1 -right-1 hidden group-hover:flex w-3.5 h-3.5 bg-black rounded-full items-center justify-center text-[9px] text-rose-300">
                      ×
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Floating Toolbar when in Revise Mode */}
          {mode === 'revise' && (
            <div className="absolute bottom-4 z-30 flex items-center gap-1.5 p-1.5 bg-black/80 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <button
                type="button"
                onClick={() => setActiveTool('pin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'pin'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Bấm lên tranh để đánh dấu điểm cần chỉnh sửa"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ghim vị trí ({pins.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('draw')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'draw'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Vẽ nét đỏ khoanh vùng lên tranh"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bút đỏ</span>
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Hoàn tác nét vẽ / ghim gần nhất"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-white/10 transition"
                title="Xóa tất cả nét vẽ & ghim"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Actions & Feedback */}
        <div className="w-full md:w-2/5 flex flex-col justify-between overflow-y-auto">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-space-grotesk font-bold text-white">Review Milestone</h3>
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
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Góp ý chỉnh sửa từ khách hàng:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-amber-100 font-body leading-relaxed">
                    {revisionFeedback || 'Đang chờ khách hàng duyệt bản vẽ.'}
                  </p>
                  {pins.length > 0 && (
                    <p className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-500/20">
                      * Khách có ghim <strong>{pins.length} vị trí</strong> trên tranh. Bấm nút Redline ở trên để bật/tắt xem điểm ghim.
                    </p>
                  )}
                </div>

                {milestoneStatus === 'RevisionRequested' ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubmitModal?.();
                    }}
                    className="w-full rounded-xl bg-[#A7ACD9] px-4 py-3 font-semibold text-[#1F2335] hover:bg-white transition"
                  >
                    Nộp bản chỉnh sửa mới
                  </button>
                ) : null}
              </div>
            ) : milestoneStatus && milestoneStatus !== 'Submitted' ? (
              <p className="text-sm text-slate-300">
                Chỉ có thể duyệt hoặc yêu cầu chỉnh sửa khi bản vẽ đang ở trạng thái chờ duyệt.
              </p>
            ) : mode === 'view' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Nghiệm thu giai đoạn này
                  </h4>
                  <p className="text-xs text-emerald-300/70 mb-4 leading-relaxed">
                    Nếu bạn đã hài lòng với phác thảo này, hãy xác nhận duyệt để giải ngân tiền mốc và cho phép Họa sĩ bước sang giai đoạn tiếp theo.
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
                    <MessageSquare className="w-4 h-4" /> Yêu cầu chỉnh sửa (Có Redline)
                  </h4>
                  <p className="text-xs text-amber-300/70 mb-2 leading-relaxed">
                    Chưa ưng ý? Bạn có thể khoanh vùng, ghim điểm trực tiếp lên tranh và yêu cầu Họa sĩ chỉnh sửa.
                  </p>
                  <p className="text-[11px] text-amber-400/70 mb-4 font-mono">
                    Số lần sửa còn lại: {revisionsLeft} / {maxRevisions}
                  </p>
                  <button
                    onClick={() => setMode('revise')}
                    disabled={revisionsLeft <= 0}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {revisionsLeft > 0 ? 'Mở Redline Canvas & Góp ý' : 'Đã hết lượt sửa miễn phí'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-space-grotesk font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Chi tiết cần sửa
                    </label>
                    <button
                      type="button"
                      disabled={isStandardizing || !feedback.trim()}
                      onClick={handleStandardizeFeedback}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {isStandardizing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{isStandardizing ? 'Đang chuẩn hóa…' : '✨ AI Chuẩn hóa yêu cầu'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">
                    * Bấm công cụ <strong>Ghim vị trí</strong> hoặc <strong>Bút đỏ</strong> bên cạnh tranh để chỉ rõ vị trí cần sửa.
                  </p>

                  <textarea
                    rows={7}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Mô tả cụ thể những điểm cần sửa, ví dụ:&#10;[Điểm 1]: Hạ thấp đường chân tóc xuống một chút&#10;[Điểm 2]: Đổi màu mắt sang xanh nhạt..."
                    className="w-full p-3.5 bg-black/40 border border-amber-500/30 rounded-xl text-xs text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono leading-relaxed"
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
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu chỉnh sửa'}
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
