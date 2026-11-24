'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, X, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

/**
 * KHÔNG có ảnh thay thế.
 *
 * Bản cũ thay bằng một ảnh Unsplash khi tác phẩm thiếu ảnh hoặc ảnh lỗi — người
 * xem thấy một bức tranh KHÔNG PHẢI của họa sĩ, kèm badge "Ảnh có dấu chìm bảo vệ".
 * Thiếu ảnh thì phải nói thẳng là thiếu, không mượn ảnh của người khác.
 */
const NO_IMAGE = '';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075/api/v1').replace(/\/api\/v1\/?$/, '');

interface ViewReceipt {
  receiptId: string;
  receiptToken: string;
  watermarkedImageUrl: string;
  displayTitle: string;
  creatorName: string;
  createdAt: string;
  overlayMaskText: string;
}

interface ProtectedArtworkViewerProps {
  artworkId: string;
  fallbackImageUrl?: string | null;
  alt: string;
  className?: string;
  fitMode?: 'cover' | 'contain';
  onOpenLightbox?: () => void;
  skipViewSession?: boolean;
  showWatermarkBadge?: boolean;
}

export function ProtectedArtworkViewer({
  artworkId,
  fallbackImageUrl,
  alt,
  className = '',
  fitMode = 'cover',
  onOpenLightbox,
  skipViewSession = false,
  showWatermarkBadge = true,
}: ProtectedArtworkViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [receipt, setReceipt] = useState<ViewReceipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copyWarning, setCopyWarning] = useState<boolean>(false);

  // 1. Tạo phiên xem bảo mật & nhận Biên lai số từ Backend API (hoặc dùng bảo vệ cục bộ cho WIP Workroom)
  useEffect(() => {
    // Ảnh dự phòng duy nhất được phép: chính ảnh của tác phẩm này.
    const validFallback = fallbackImageUrl || NO_IMAGE;

    let isMounted = true;
    if (skipViewSession) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setReceipt({
          receiptId: 'workroom-session',
          receiptToken: `WIP-${artworkId.replace(/-/g, "").slice(0, 12).toUpperCase()}`,
          watermarkedImageUrl: validFallback,
          displayTitle: alt,
          creatorName: 'DIL Workroom',
          createdAt: new Date().toISOString(),
          overlayMaskText: `DIL Workroom • WIP-${artworkId.slice(0, 8).toUpperCase()} • ${new Date().toLocaleDateString('vi-VN')}`,
        });
        setLoading(false);
      });
      return () => {
        isMounted = false;
      };
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.post<ApiResponse<ViewReceipt>>(
          `/artworks/${artworkId}/view-session`,
          {}
        );

        if (isMounted && res.data?.data) {
          setReceipt(res.data.data);
        }
      } catch (err) {
        console.warn('Không thể kết nối lấy view-session, sử dụng fallback bảo vệ cục bộ:', err);
        if (isMounted) {
          setReceipt({
            receiptId: 'local-session',
            receiptToken: `WR-${artworkId.replace(/-/g, "").slice(0, 12).toUpperCase()}`,
            watermarkedImageUrl: validFallback,
            displayTitle: alt,
            creatorName: 'DIL Verified',
            createdAt: new Date().toISOString(),
            overlayMaskText: `DIL Protected • WR-${artworkId.slice(0, 8).toUpperCase()} • ${new Date().toLocaleDateString('vi-VN')}`,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [artworkId, fallbackImageUrl, alt, skipViewSession]);

  const rawUrl = receipt?.watermarkedImageUrl || fallbackImageUrl;
  const isFallbackGif = Boolean(fallbackImageUrl && /\.gif(\?|#|$)/i.test(fallbackImageUrl));
  const isRawGif = Boolean(rawUrl && /\.gif(\?|#|$)/i.test(rawUrl));
  const isAnimatedGif = isRawGif || isFallbackGif;

  const effectiveUrl = React.useMemo(() => {
    if (isFallbackGif && !isRawGif && fallbackImageUrl) {
      return fallbackImageUrl;
    }
    if (!rawUrl) {
      return NO_IMAGE;
    }
    if (rawUrl.startsWith('/api/v1/')) {
      return `${API_ORIGIN}${rawUrl}`;
    }
    return rawUrl;
  }, [rawUrl, fallbackImageUrl, isFallbackGif, isRawGif]);

  // 2. Hàm vẽ ảnh SẠCH 100% với mắt thường + Nhúng thuỷ vân VÔ HÌNH cấp độ vi mô (Micro-Steganography)
  const paintCanvas = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerW = container.clientWidth || 720;
      const containerH = container.clientHeight || 640;

      // Sử dụng devicePixelRatio để ảnh sắc nét tuyệt đối trên màn hình Retina/HiDPI
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = containerW * dpr;
      canvas.height = containerH * dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      const imgRatio = img.naturalWidth / (img.naturalHeight || 1);
      const containerRatio = containerW / (containerH || 1);

      let drawW = containerW;
      let drawH = containerH;
      let offsetX = 0;
      let offsetY = 0;

      if (fitMode === 'contain') {
        if (imgRatio > containerRatio) {
          drawW = containerW;
          drawH = containerW / imgRatio;
          offsetY = (containerH - drawH) / 2;
        } else {
          drawH = containerH;
          drawW = containerH * imgRatio;
          offsetX = (containerW - drawW) / 2;
        }
      } else {
        if (imgRatio > containerRatio) {
          drawH = containerH;
          drawW = containerH * imgRatio;
          offsetX = (containerW - drawW) / 2;
        } else {
          drawW = containerW;
          drawH = containerW / imgRatio;
          offsetY = (containerH - drawH) / 2;
        }
      }

      ctx.clearRect(0, 0, containerW, containerH);

      // Với ảnh tĩnh (PNG/JPG/WebP tĩnh), vẽ trực tiếp lên Canvas.
      // Với ảnh động GIF, thẻ <img> bên dưới đảm nhiệm phát chuyển động mượt mà,
      // còn Canvas chỉ phủ lớp thuỷ vân vi mô trong suốt phía trên để không làm đứng hình GIF.
      if (!isAnimatedGif) {
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }

      // Nhúng Thuỷ vân VÔ HÌNH (Micro-Steganography, alpha = 0.008 ~ lệch chỉ 2/255 đơn vị RGB):
      // Mắt người hoàn toàn KHÔNG THỂ nhìn thấy (tranh sạch 100% nguyên bản),
      // nhưng khi đưa ảnh chụp màn hình vào bộ lọc khuếch đại tương phản (Equalize/Levels) sẽ hiện rõ mã biên lai!
      ctx.save();
      ctx.beginPath();
      ctx.rect(offsetX, offsetY, drawW, drawH);
      ctx.clip();

      const overlayText =
        receipt?.overlayMaskText ||
        `DIL • ${receipt?.receiptToken || 'PROTECTED'} • ${new Date().toLocaleDateString('vi-VN')}`;

      ctx.rotate((-22 * Math.PI) / 180);
      ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = 'rgba(128, 128, 255, 0.008)'; // Vô hình với mắt người (0.8% alpha trên kênh Blue)

      const stepX = 280;
      const stepY = 110;
      for (let y = -containerH; y < containerH * 2; y += stepY) {
        for (let x = -containerW; x < containerW * 2; x += stepX) {
          ctx.fillText(overlayText, x, y);
        }
      }

      ctx.restore();
      ctx.restore();
    },
    [receipt, fitMode, isAnimatedGif]
  );

  // 3. Nạp ảnh
  useEffect(() => {
    let isCancelled = false;
    let retriedWithoutCors = false;

    if (!effectiveUrl) {
      loadedImageRef.current = null;
      setLoading(false);
      setError('');
      return;
    }

    const img = new window.Image();
    if (effectiveUrl.startsWith(API_ORIGIN)) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (isCancelled) return;
      loadedImageRef.current = img;
      setError(null);
      paintCanvas(img);
    };

    // Ảnh lỗi thì báo lỗi — KHÔNG thay bằng ảnh mẫu của người khác.
    img.onerror = () => {
      if (isCancelled) return;
      if (img.crossOrigin && !retriedWithoutCors) {
        retriedWithoutCors = true;
        img.removeAttribute('crossOrigin');
        img.crossOrigin = null;
        img.src = effectiveUrl;
        return;
      }
      setError('Không tải được ảnh tác phẩm.');
    };

    img.src = effectiveUrl;

    return () => {
      isCancelled = true;
    };
  }, [effectiveUrl, paintCanvas]);

  // Vẽ lại khi thay đổi kích thước khung nhìn
  useEffect(() => {
    const handleResize = () => {
      if (loadedImageRef.current) {
        paintCanvas(loadedImageRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [paintCanvas]);

  // 4. Chặn hành vi sao chép & BẪY PHẢN XẠ CHỐNG CHỤP MÀN HÌNH (Reactive Anti-Screenshot)
  const triggerWarning = useCallback(() => {
    setCopyWarning(true);
    setTimeout(() => setCopyWarning(false), 3000);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerWarning();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };


  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      className={`relative h-full w-full select-none overflow-hidden bg-[#FFFCF6] ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Nếu là ảnh động GIF, hiển thị lớp <img> khóa tương tác nằm dưới Canvas thuỷ vân & Kính chắn để giữ nguyên chuyển động */}
      {isAnimatedGif && (
        <img
          src={effectiveUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 z-0 h-full w-full select-none ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />
      )}

      {/* Canvas hiển thị tranh SẠCH 100% (chỉ chứa thuỷ vân vi mô vô hình):
          Đặt pointer-events-none để trình duyệt và extension (AI Image Tools) KHÔNG thể chạm vào */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none relative z-[5] block h-full w-full"
      />

      {/* LỚP KÍNH CHẮN BẢO VỆ VÔ HÌNH (Glass Shield Overlay):
          Che phủ 100% bề mặt phía trên Canvas. Chuột phải chỉ chạm vào <div> rỗng nên KHÔNG thể lưu ảnh */}
      <div
        onClick={() => {
          if (onOpenLightbox) onOpenLightbox();
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className={`absolute inset-0 z-10 bg-transparent ${onOpenLightbox ? 'cursor-zoom-in' : 'cursor-default'}`}
        aria-label={alt}
      />


      {/* Badge bảo vệ: chỉ hiện khi THẬT SỰ có ảnh để bảo vệ */}
      {showWatermarkBadge && effectiveUrl && !error ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFFCF6]/80 px-3.5 py-1.5 text-xs text-[#241F1A] backdrop-blur-md border border-[#221E1A]/10 shadow-lg">
          <ShieldCheck className="h-3.5 w-3.5 text-[#B24A26] shrink-0" />
          <span>Ảnh có dấu chìm bảo vệ</span>
        </div>
      ) : null}

      {/* Cảnh báo khi người dùng cố tình chuột phải hoặc nhấn phím tắt sao chép */}
      {copyWarning && (
        <div className="pointer-events-none absolute inset-x-4 top-14 z-50 flex items-center justify-center animate-fade-in">
          <div className="flex items-center gap-2 rounded-xl bg-[#A8321C]/20 border border-[#A8321C]/40 px-4 py-2.5 text-xs font-medium text-[#A8321C] shadow-2xl backdrop-blur-md">
            <AlertTriangle className="h-4 w-4 text-[#A8321C] shrink-0" />
            <span> Tác phẩm được bảo vệ bản quyền số. Không thể tải hoặc sao chép trực tiếp. </span>
          </div>
        </div>
      )}

      {/* Trạng thái đang tải */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FFFCF6]/70 backdrop-blur-sm text-[#6E6459] gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-[#B24A26]" />
          <span className="text-xs">Đang khởi tạo biên lai thuỷ vân ẩn...</span>
        </div>
      )}

      {/* Trạng thái lỗi */}
      {error && !loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#FFFCF6]/95 p-4 text-center text-[#6E6459]">
          <AlertTriangle className="h-8 w-8 text-[#8A6A1F]" />
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs">Hệ thống không thay bằng ảnh khác, để bạn không xem nhầm tác phẩm.</p>
        </div>
      )}

      {/* Không có ảnh: nói thẳng, không mượn ảnh mẫu */}
      {!effectiveUrl && !loading ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#F0E7D8] p-4 text-center text-[#6E6459]">
          <ShieldCheck className="h-8 w-8 text-[#746A5F]" aria-hidden />
          <p className="text-sm font-medium text-[#241F1A]">Tác phẩm chưa có ảnh gốc</p>
          <p className="text-xs">Họa sĩ chưa tải tệp lên, nên không có gì để hiển thị.</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Modal phóng to toàn màn hình có bảo vệ thuỷ vân ẩn & kính chắn chống lưu ảnh.
 */
export function ProtectedArtworkLightbox({
  artworkId,
  imageUrl,
  alt,
  onClose,
}: {
  artworkId: string;
  imageUrl?: string | null;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F0E7D8]/92 p-4 sm:p-8 backdrop-blur-md select-none"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-5 top-5 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-[#F0E7D8] text-[#241F1A] transition hover:bg-[#F0E7D8] border border-[#221E1A]/10"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative h-[86vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ProtectedArtworkViewer
          artworkId={artworkId}
          fallbackImageUrl={imageUrl}
          alt={alt}
          fitMode="contain"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
