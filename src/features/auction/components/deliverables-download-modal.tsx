'use client';

import Image from 'next/image';
import {
  Download,
  FileArchive,
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
  const isMasterPack = deliverable.hasMasterPack || deliverable.fileName?.toLowerCase().endsWith('.zip');

  const handleDownloadArtwork = () => {
    if (artworkDownloadUrl) {
      window.open(artworkDownloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadMasterPack = () => {
    if (deliverable.downloadUrl) {
      window.open(deliverable.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadAll = () => {
    if (artworkDownloadUrl) {
      window.open(artworkDownloadUrl, '_blank', 'noopener,noreferrer');
    }
    if (isMasterPack && deliverable.downloadUrl && deliverable.downloadUrl !== artworkDownloadUrl) {
      setTimeout(() => {
        window.open(deliverable.downloadUrl, '_blank', 'noopener,noreferrer');
      }, 500);
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
              Tải bàn giao tác phẩm độc quyền
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                <Sparkles size={11} /> 1-of-1 Package
              </span>
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Chứng chỉ: <strong className="text-amber-300/90 font-mono">{deliverable.certificateNumber || 'DIL-CERT-MASTER'}</strong>
            </p>
          </div>
        </div>

        {/* Danh sách tệp bàn giao */}
        <div className="space-y-3 pt-1">
          {/* 1. Tranh gốc độ phân giải cao */}
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
                  Bản vẽ gốc sắc nét, không gắn watermark, bảo toàn độ phân giải in ấn và hiển thị.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadArtwork}
              className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/40 bg-brand-periwinkle/15 px-3 py-2 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy transition"
            >
              <Download size={14} /> Tải ảnh gốc
            </button>
          </div>

          {/* 2. Master File Pack (.zip / .psd) */}
          {isMasterPack && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 hover:border-amber-400/40 transition">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <FileArchive size={26} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white truncate">
                      {deliverable.fileName || 'Master-File-Pack.zip'}
                    </p>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.2 rounded-full shrink-0">
                      Master Pack
                    </span>
                  </div>
                  <p className="text-[11px] text-outline mt-0.5">
                    {deliverable.fileSizeBytes
                      ? `${(deliverable.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB • `
                      : ''}
                    Tệp nén bảo mật chứa PSD phân layer, tài nguyên thiết kế độc quyền.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadMasterPack}
                className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/20 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400 hover:text-brand-navy transition"
              >
                <Download size={14} /> Tải .zip
              </button>
            </div>
          )}
        </div>

        {/* Cam kết bản quyền */}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2.5 text-[11px] text-outline">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            Các tệp trên được bảo hộ độc quyền theo Hợp đồng chuyển giao quyền thương mại 1-of-1.
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

          {isMasterPack && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-brand-periwinkle px-5 py-2 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 transition"
            >
              <Download size={15} /> Tải tất cả (Ảnh gốc + File nén)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
