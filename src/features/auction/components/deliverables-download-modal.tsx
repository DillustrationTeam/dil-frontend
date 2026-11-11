'use client';

import Image from 'next/image';
import {
  Download,
  Image as ImageIcon,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { DeliverableDownloadDto } from '../types/auction.types';

interface DeliverablesDownloadModalProps {
  deliverable: DeliverableDownloadDto;
  onClose: () => void;
}

export function DeliverablesDownloadModal({ deliverable, onClose }: DeliverablesDownloadModalProps) {
  const artworkDownloadUrl = deliverable.artworkImageDownloadUrl || deliverable.artworkImageUrl;

  const handleDownloadArtwork = () => {
    if (artworkDownloadUrl) {
      window.open(artworkDownloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#1F2335]/95 p-6 shadow-2xl backdrop-blur-2xl space-y-5">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-outline hover:bg-white/10 hover:text-white transition"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/25">
            <PackageCheck size={22} />
          </div>
          <div>
            <h2 className="font-h1 text-lg font-bold text-white flex items-center gap-2">
              Tải bàn giao tranh độc quyền
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                <Sparkles size={11} /> Exclusive
              </span>
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Chứng chỉ: <strong className="text-amber-300/90 font-mono">{deliverable.certificateNumber || 'DIL-CERT'}</strong>
            </p>
          </div>
        </div>

        {/* Tệp bàn giao: chỉ tranh gốc */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4 hover:border-brand-periwinkle/30 transition">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
                {deliverable.artworkImageUrl ? (
                  <Image
                    src={deliverable.artworkImageUrl}
                    alt={deliverable.artworkTitle || 'Tranh gốc'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-periwinkle">
                    <ImageIcon size={22} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white truncate">
                    {deliverable.artworkTitle || 'Tranh gốc độ phân giải cao'}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full shrink-0">
                    Gốc HD
                  </span>
                </div>
                <p className="text-[11px] text-outline mt-0.5">
                  Bức tranh gốc sắc nét, không gắn watermark, bảo toàn độ phân giải in ấn và hiển thị.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadArtwork}
              className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/40 bg-brand-periwinkle/15 px-3 py-2 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy transition"
            >
              <Download size={14} /> Tải tranh gốc
            </button>
          </div>
        </div>

        {/* Cam kết bản quyền */}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2.5 text-[11px] text-outline">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            Bức tranh được bảo hộ độc quyền theo Hợp đồng chuyển giao quyền thương mại.
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-outline hover:text-white transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleDownloadArtwork}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-5 py-2 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 transition"
          >
            <Download size={15} /> Tải tranh gốc
          </button>
        </div>
      </div>
    </div>
  );
}
