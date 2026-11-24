'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProtectedArtworkViewer } from '@/features/marketplace/components/protected-artwork-viewer';
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import toast from 'react-hot-toast';
import type { MilestoneStatus, PinAnnotation } from '@/types/commission.types';

interface ApprovalRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  wipPreviewUrl: string;
  maxRevisions: number;
  revisionCount: number;
  milestoneSequence?: number;
  isCreator?: boolean;
  revisionFeedback?: string | null;
  revisionFeedbackImageUrl?: string | null;
  revisionAnnotationsJson?: string | null;
  milestoneStatus?: MilestoneStatus;
  onOpenSubmitModal?: () => void;
  onSuccess?: (result: { action: 'approved' | 'revision_requested'; feedback?: string }) => void;
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

  // Zoom state
  const [zoomScale, setZoomScale] = useState(1);

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
    } else {
      setPins([]);
    }
  }, [revisionAnnotationsJson]);

  // Reset zoom when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setZoomScale(1);
    }
  }, [isOpen]);

  // Synchronize canvas size with unscaled preview container
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
      if (canvas.width !== width || canvas.height !== height) {
        const ctx = canvas.getContext('2d');
        let tempImage: HTMLCanvasElement | null = null;
        if (canvas.width > 0 && canvas.height > 0) {
          tempImage = document.createElement('canvas');
          tempImage.width = canvas.width;
          tempImage.height = canvas.height;
          tempImage.getContext('2d')?.drawImage(canvas, 0, 0);
        }

        canvas.width = width;
        canvas.height = height;

        if (tempImage && ctx) {
          ctx.drawImage(tempImage, 0, 0, width, height);
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

  const getRelativeCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    return {
      x: relX * canvas.width,
      y: relY * canvas.height,
      pctX: Math.round(relX * 1000) / 10,
      pctY: Math.round(relY * 1000) / 10,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'revise') return;
    const canvas = canvasRef.current;
    const coords = getRelativeCoords(e);
    if (!canvas || !coords) return;

    if (activeTool === 'pin') {
      const newPinId = pins.length > 0 ? Math.max(...pins.map((p) => p.id)) + 1 : 1;
      const newPin: PinAnnotation = { id: newPinId, x: coords.pctX, y: coords.pctY };
      setPins((prev) => [...prev, newPin]);

      setFeedback((prev) => {
        const marker = `[Điểm ${newPinId}]: `;
        return prev.trim() ? `${prev.trim()}\n${marker}` : marker;
      });
      return;
    }

    if (activeTool === 'draw') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current.push(snapshot);
        if (strokeHistoryRef.current.length > 20) strokeHistoryRef.current.shift();
      } catch {
        // ignore
      }

      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
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
    const coords = getRelativeCoords(e);
    if (!canvas || !coords) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
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
    } else if (pins.length > 0) {
      setPins((prev) => prev.slice(0, prev.length - 1));
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
      if (onSuccess) onSuccess({ action: 'approved' });
    } catch (error) {
      console.error(error);
      alert('Failed to approve milestone.');
    } finally {
      setIsSubmitting(false);
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
      if (onSuccess) onSuccess({ action: 'revision_requested', feedback: feedback.trim() });
    } catch (error) {
      console.error(error);
      alert('Gửi yêu cầu chỉnh sửa thất bại. Có thể bạn đã vượt quá số lần sửa tối đa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#FFFCF6]/95 border border-[#221E1A]/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* Left Side: Protected Image Viewer + Zoom + Redline Canvas */}
        <div className="w-full md:w-3/5 bg-[#E5D8C2] border-r border-[#221E1A]/10 p-6 flex flex-col justify-center items-center relative min-h-[360px] overflow-hidden select-none">
          {/* Top-Left Badge */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className="bg-[#E5D8C2] px-3 py-1.5 rounded-xl border border-[#221E1A]/10 backdrop-blur-md flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2F6B63]" />
              <span className="text-[10px] text-[#2F6B63] font-semibold tracking-wide uppercase">
                Watermarked Preview
              </span>
            </div>
          </div>

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-[#F0E7D8]/75 border border-[#221E1A]/10 rounded-xl p-1 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(1, Math.round((prev - 0.25) * 100) / 100))}
              disabled={zoomScale <= 1}
              className="p-1.5 rounded-lg text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition disabled:opacity-30"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-[#6E6459] min-w-[44px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100))}
              disabled={zoomScale >= 2.5}
              className="p-1.5 rounded-lg text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition disabled:opacity-30"
              title="Phóng to tranh"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomScale > 1 && (
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1.5 rounded-lg text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition"
                title="Đặt lại 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable Zoom Viewport */}
          <div className="w-full h-[65vh] overflow-auto flex items-center justify-center rounded-xl">
            <div
              ref={containerRef}
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
              }}
              className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl transition-transform duration-150"
            >
              {wipPreviewUrl ? (
                <div className="w-full h-full pointer-events-none">
                  <ProtectedArtworkViewer
                    artworkId={milestoneId || commissionId}
                    fallbackImageUrl={wipPreviewUrl}
                    alt="Milestone Preview"
                    fitMode="contain"
                    skipViewSession
                    showWatermarkBadge={false}
                    className="h-full w-full rounded-xl bg-[#FFFCF6]"
                  />
                </div>
              ) : (
                <p className="text-[#746A5F] text-sm">Chưa có bản xem trước.</p>
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
                  className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
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
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-6 rounded-full bg-[#A8321C]/12 text-[#241F1A] font-bold text-xs shadow-lg border-2 border-[#221E1A]/15 select-none cursor-pointer group hover:scale-125 transition-transform"
                  >
                    <span>{pin.id}</span>
                    {mode === 'revise' && (
                      <span className="absolute -top-1 -right-1 hidden group-hover:flex w-3.5 h-3.5 bg-[#F0E7D8] rounded-full items-center justify-center text-[9px] text-[#A8321C]">
                        ×
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Redline Visibility Toggle (Bottom-Right corner of viewer) */}
          {(revisionFeedbackImageUrl || hasDrawn || pins.length > 0) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRedlineLayer((prev) => !prev);
              }}
              title={showRedlineLayer ? 'Ẩn nét vẽ Redline' : 'Hiện nét vẽ Redline'}
              className={`absolute bottom-4 right-4 z-30 w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all shadow-lg ${
                showRedlineLayer
                  ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40 hover:bg-[#A8321C]/20'
                  : 'bg-[#E5D8C2] text-[#746A5F] border-[#221E1A]/10 hover:text-[#241F1A] hover:bg-[#F0E7D8]/90'
              }`}
            >
              {showRedlineLayer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}

          {/* Floating Toolbar when in Revise Mode */}
          {mode === 'revise' && (
            <div className="absolute bottom-4 z-30 flex items-center gap-1.5 p-1.5 bg-[#E5D8C2] border border-[#221E1A]/10 rounded-2xl backdrop-blur-md shadow-xl">
              <button
                type="button"
                onClick={() => setActiveTool('pin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'pin'
                    ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-lg shadow-[#A8321C]'
                    : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
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
                    ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-lg shadow-[#A8321C]'
                    : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
                }`}
                title="Vẽ nét đỏ khoanh vùng lên tranh"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bút đỏ</span>
              </button>

              <div className="w-[1px] h-4 bg-[#F0E7D8] mx-1" />

              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 rounded-xl text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition"
                title="Hoàn tác nét vẽ / ghim gần nhất"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl text-[#746A5F] hover:text-[#A8321C] hover:bg-[#F0E7D8] transition"
                title="Xóa tất cả nét vẽ & ghim"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Actions & Feedback */}
        <div className="w-full md:w-2/5 flex flex-col justify-between overflow-y-auto">
          <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between">
            <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Review Milestone</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6">
            {isCreator ? (
              <div className="space-y-4 text-sm text-[#746A5F]">
                <div className="p-4 bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-[#8A6A1F] font-bold text-xs uppercase">
                    <MessageSquare className="w-4 h-4 text-[#8A6A1F]" />
                    <span>Góp ý chỉnh sửa từ khách hàng:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[#8A6A1F] font-body leading-relaxed">
                    {revisionFeedback || 'Đang chờ khách hàng duyệt bản vẽ.'}
                  </p>
                  {pins.length > 0 && (
                    <p className="text-[11px] text-[#8A6A1F] pt-1 border-t border-[#8A6A1F]/30">
                      * Khách có ghim <strong>{pins.length} vị trí</strong> trên tranh. Bấm nút Redline ở góc dưới để bật/tắt xem điểm ghim. </p>
                  )}
                </div>
                {milestoneStatus === 'RevisionRequested' ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubmitModal?.();
                    }}
                    className="w-full rounded-xl bg-[#B24A26] px-4 py-3 font-semibold text-[#F7F2E9] hover:bg-[#F0E7D8] transition"
                  > Nộp bản chỉnh sửa mới </button>
                ) : null}
              </div>
            ) : milestoneStatus && milestoneStatus !== 'Submitted' ? (
              <p className="text-sm text-[#746A5F]"> Chỉ có thể duyệt hoặc yêu cầu chỉnh sửa khi bản vẽ đang chờ duyệt. </p>
            ) : mode === 'view' ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#2F6B63]/10 border border-[#2F6B63]/30 rounded-2xl">
                  <h4 className="text-sm font-semibold text-[#2F6B63] flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve this draft
                  </h4>
                  <p className="text-xs text-[#2F6B63] mb-4">
                    If you are satisfied with this work, approve it to release funds for this milestone and allow the creator to proceed to the next stage.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#2F6B63]/12 text-[#F7F2E9] shadow-lg shadow-[#2F6B63] hover:bg-[#2F6B63]/10 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Approving...' : 'Approve & Release Funds'}
                  </button>
                </div>

                <div className="p-4 bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 rounded-2xl">
                  <h4 className="text-sm font-semibold text-[#8A6A1F] flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Yêu cầu chỉnh sửa (Có Redline) </h4>
                  <p className="text-xs text-[#8A6A1F] mb-2"> Chưa ưng ý? Bạn có thể khoanh vùng, ghim điểm trực tiếp lên tranh và yêu cầu họa sĩ chỉnh sửa. </p>
                  <p className="text-[11px] text-[#8A6A1F] mb-4 font-mono">
                    Số lần sửa còn lại: {revisionsLeft} / {maxRevisions}
                  </p>
                  <button
                    onClick={() => setMode('revise')}
                    disabled={revisionsLeft <= 0}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40 hover:bg-[#8A6A1F]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {revisionsLeft > 0 ? 'Mở Redline Canvas & Góp ý' : 'Đã hết lượt sửa miễn phí'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-[#A8321C]/10 border border-[#A8321C]/30 rounded-xl text-xs text-[#A8321C] leading-relaxed">
                  <strong>Mẹo:</strong> Dùng tool <strong>Ghim vị trí</strong> hoặc <strong>Bút đỏ</strong> bên khung tranh để đánh dấu trực tiếp chỗ cần sửa. </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-space-grotesk font-bold text-[#8A6A1F] uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Chi tiết cần sửa đổi </label>
                    <button
                      type="button"
                      disabled={isStandardizing || !feedback.trim()}
                      onClick={handleStandardizeFeedback}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 text-brand-periwinkle px-3 py-1 text-[11px] font-bold transition-all hover:border-brand-periwinkle/60 shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="AI chuyển đổi phản hồi của bạn thành danh mục cần kiểm kỹ thuật rõ ràng cho họa sĩ"
                    >
                      {isStandardizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-periwinkle" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-brand-periwinkle" />
                      )}
                      <span>{isStandardizing ? 'Đang chuẩn hóa…' : 'AI Chuẩn hóa danh mục cần kiểm'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Ví dụ: [Điểm 1]: Chỉnh lại ánh sáng phần tóc cho mềm hơn..."
                    className="w-full p-4 bg-[#F0E7D8] border border-[#8A6A1F]/40 rounded-xl text-sm text-[#8A6A1F] text-[#8A6A1F] focus:outline-none focus:border-[#8A6A1F]/30 focus:ring-1 focus:ring-[#8A6A1F]/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8] transition-colors"
                  > Quay lại </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#8A6A1F]/12 text-[#F7F2E9] shadow-lg shadow-[#8A6A1F] hover:bg-[#8A6A1F]/10 transition-colors disabled:opacity-50"
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
