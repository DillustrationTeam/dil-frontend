'use client';

import { useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface ReferenceLightboxModalProps {
  url: string | null;
  onClose: () => void;
  title?: string;
  /** Show the "download original" button. Off for AI reference sketches. */
  allowDownload?: boolean;
  /** Stack above another modal (e.g. the commission form overlay). */
  elevated?: boolean;
}

export default function ReferenceLightboxModal({
  url,
  onClose,
  title = 'Ảnh tham khảo gốc',
  allowDownload = true,
  elevated = false,
}: ReferenceLightboxModalProps) {
  useEffect(() => {
    if (!url) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 ${elevated ? 'z-[400]' : 'z-[70]'} flex items-center justify-center bg-[#F0E7D8]/90 p-4 backdrop-blur-md`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] max-w-[92vw] flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex w-full items-center justify-between gap-4">
          <span className="truncate text-xs font-semibold text-[#746A5F]">{title}</span>
          <div className="flex shrink-0 items-center gap-2">
            {allowDownload && (
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-[#F0E7D8] px-3 py-1.5 text-xs font-semibold text-[#241F1A] transition hover:bg-[#F0E7D8]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải ảnh gốc</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng xem ảnh"
              title="Đóng (Esc)"
              className="rounded-full bg-[#F0E7D8] p-1.5 text-[#241F1A] transition hover:bg-[#F0E7D8]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={title}
          className="max-h-[82vh] max-w-full rounded-xl border border-[#221E1A]/10 object-contain shadow-2xl"
          draggable={allowDownload}
          onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}
