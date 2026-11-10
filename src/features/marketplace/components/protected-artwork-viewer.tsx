'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, X, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=85';

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
  // Bẫy chống chụp màn hình (kích hoạt khi cửa sổ mất focus do mở Snipping Tool / Zalo / PrtScn)
  const [captureShieldActive, setCaptureShieldActive] = useState<boolean>(false);

  // 1. Tạo phiên xem bảo mật & nhận Biên lai số từ Backend API (hoặc dùng bảo vệ cục bộ cho WIP Workroom)
  useEffect(() => {
    const validFallback =
      fallbackImageUrl && !fallbackImageUrl.startsWith('blob:')
        ? fallbackImageUrl
        : DEFAULT_FALLBACK_IMAGE;

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
    if (isFallbackGif && !isRawGif && fallbackImageUrl && !fallbackImageUrl.startsWith('blob:')) {
      return fallbackImageUrl;
    }
    if (!rawUrl || rawUrl.startsWith('blob:')) {
      return DEFAULT_FALLBACK_IMAGE;
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

    img.onerror = () => {
      if (isCancelled) return;
      if (img.src !== DEFAULT_FALLBACK_IMAGE) {
        img.src = DEFAULT_FALLBACK_IMAGE;
      } else {
        setError('Không thể nạp dữ liệu ảnh bảo mật.');
      }
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phát hiện phím PrintScreen hoặc tổ hợp chụp màn hình / lưu trang / DevTools
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4')) ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P' || e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        setCaptureShieldActive(true);
        triggerWarning();
        // Xóa clipboard nếu người dùng vừa bấm PrintScreen
        if (e.key === 'PrintScreen' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => undefined);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        setCaptureShieldActive(true);
        triggerWarning();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => undefined);
        }
      }
    };

    // Khi người dùng mở Snipping Tool (Win+Shift+S), Lightshot, Zalo Screenshot...
    // cửa sổ trình duyệt lập tức mất focus -> bật màn chắn bảo vệ ngay lập tức!
    const handleWindowBlur = () => {
      setCaptureShieldActive(true);
    };

    const handleWindowFocus = () => {
      setCaptureShieldActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setCaptureShieldActive(true);
      } else {
        setCaptureShieldActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerWarning]);

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onMouseEnter={() => setCaptureShieldActive(false)}
      className={`relative h-full w-full select-none overflow-hidden bg-[#131624] ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Nếu là ảnh động GIF, hiển thị lớp <img> khóa tương tác nằm dưới Canvas thuỷ vân & Kính chắn để giữ nguyên chuyển động */}
      {isAnimatedGif && (
        <img
          src={effectiveUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 z-0 h-full w-full select-none transition-all duration-75 ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover'
          } ${captureShieldActive ? 'blur-2xl brightness-50 scale-105' : ''}`}
        />
      )}

      {/* Canvas hiển thị tranh SẠCH 100% (chỉ chứa thuỷ vân vi mô vô hình):
          Đặt pointer-events-none để trình duyệt và extension (AI Image Tools) KHÔNG thể chạm vào */}
      <canvas
        ref={canvasRef}
        className={`pointer-events-none relative z-[5] block h-full w-full transition-all duration-75 ${
          captureShieldActive ? 'blur-2xl brightness-50 scale-105' : ''
        }`}
      />

      {/* LỚP KÍNH CHẮN BẢO VỆ VÔ HÌNH (Glass Shield Overlay):
          Che phủ 100% bề mặt phía trên Canvas. Chuột phải chỉ chạm vào <div> rỗng nên KHÔNG thể lưu ảnh */}
      <div
        onClick={() => {
          if (captureShieldActive) {
            setCaptureShieldActive(false);
          } else if (onOpenLightbox) {
            onOpenLightbox();
          }
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className={`absolute inset-0 z-10 bg-transparent ${onOpenLightbox ? 'cursor-zoom-in' : 'cursor-default'}`}
        aria-label={alt}
      />

      {/* MÀN CHẮN CHỐNG CHỤP MÀN HÌNH (Chỉ bung ra khi phát hiện Snipping Tool / PrintScreen / Mất focus) */}
      {captureShieldActive && (
        <div
          onClick={() => setCaptureShieldActive(false)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d101b]/85 p-6 text-center backdrop-blur-xl cursor-pointer select-none"
        >
          <EyeOff className="h-10 w-10 text-[#A7ACD9] mb-3" />
          <p className="text-sm font-semibold text-white">
            Chế độ chống chụp màn hình đang kích hoạt
          </p>
          <p className="mt-1 max-w-xs text-xs text-[#C7C5CF]">
            Tác phẩm được tự động che mờ khi dùng công cụ chụp màn hình hoặc rời cửa sổ. Chạm vào tranh để tiếp tục ngắm.
          </p>
        </div>
      )}

      {/* Badge bảo vệ gọn gàng ở góc dưới (không hiện mã biên lai) */}
      {showWatermarkBadge && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#111424]/80 px-3.5 py-1.5 text-xs text-[#E4E1E5] backdrop-blur-md border border-white/10 shadow-lg">
          <ShieldCheck className="h-3.5 w-3.5 text-[#A7ACD9] shrink-0" />
          <span>Ảnh có watermark bảo vệ</span>
        </div>
      )}

      {/* Cảnh báo khi người dùng cố tình chuột phải hoặc nhấn phím tắt sao chép */}
      {copyWarning && (
        <div className="pointer-events-none absolute inset-x-4 top-14 z-50 flex items-center justify-center animate-fade-in">
          <div className="flex items-center gap-2 rounded-xl bg-red-950/95 border border-red-700/80 px-4 py-2.5 text-xs font-medium text-red-100 shadow-2xl backdrop-blur-md">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>
              Tác phẩm được bảo vệ bản quyền số. Không thể tải hoặc sao chép trực tiếp.
            </span>
          </div>
        </div>
      )}

      {/* Trạng thái đang tải */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#131624]/70 backdrop-blur-sm text-[#C7C5CF] gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-[#A7ACD9]" />
          <span className="text-xs">Đang khởi tạo biên lai thuỷ vân ẩn...</span>
        </div>
      )}

      {/* Trạng thái lỗi */}
      {error && !loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#131624]/95 text-[#C7C5CF] p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 sm:p-8 backdrop-blur-md select-none"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-5 top-5 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 border border-white/15"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative h-[86vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d101b] shadow-2xl"
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
