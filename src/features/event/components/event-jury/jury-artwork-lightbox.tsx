'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface JuryArtworkLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  code: string;
  category?: string;
  aiScanPassed?: boolean;
}

export function JuryArtworkLightbox({
  isOpen,
  onClose,
  imageUrl,
  title,
  code,
  category,
  aiScanPassed = true,
}: JuryArtworkLightboxProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [scale, setScale] = useState(1);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setScale(1);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(3, s + 0.25));
      if (e.key === '-' || e.key === '_') setScale((s) => Math.max(0.5, s - 0.25));
      if (e.key === '0') setScale(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#F0E7D8]/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-[#221E1A]/10 bg-[#FFFCF6]/90 backdrop-blur-xl shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[#241F1A] font-sora font-semibold text-lg">{title}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#B24A26]/15 text-[#B24A26] border border-[#B24A26]/30">
                {code}
              </span>
              {category && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#FFFCF6] text-[#746A5F] border border-[#221E1A]/10">
                  {category}
                </span>
              )}
            </div>
            <p className="text-xs text-[#746A5F] mt-0.5">
              {isVie ? 'Thí sinh ẩn danh' : 'Anonymous Candidate'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {aiScanPassed && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F6B63]/10 border border-[#2F6B63]/30 text-[#2F6B63] text-xs mr-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{isVie ? 'Đạt kiểm tra AI' : 'AI Scan Passed'}</span>
            </div>
          )}

          <div className="flex items-center bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="p-1.5 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] rounded-lg transition-colors"
              title={isVie ? 'Thu nhỏ (-)' : 'Zoom Out (-)'}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#6E6459] font-mono px-2 min-w-[3.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="p-1.5 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] rounded-lg transition-colors"
              title={isVie ? 'Phóng to (+)' : 'Zoom In (+)'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="p-1.5 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] rounded-lg transition-colors border-l border-[#221E1A]/10"
              title={isVie ? 'Đặt lại kích thước (0)' : 'Reset Zoom (0)'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] rounded-xl transition-colors ml-2"
            title={isVie ? 'Đóng (Esc)' : 'Close (Esc)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Artwork Canvas */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 select-none"
        onClick={onClose}
      >
        <div
          className="relative max-w-full max-h-full transition-transform duration-200 ease-out cursor-zoom-in"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => (s >= 2 ? 1 : s + 0.5));
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-[#221E1A]/10"
          />
        </div>
      </div>

      {/* Bottom Hint Bar */}
      <div className="text-center py-2 text-[11px] text-[#746A5F] bg-[#FFFCF6]/60 border-t border-[#221E1A]/10">
        {isVie
          ? 'Nhấp chuột vào ảnh hoặc nhấn +/- để soi chi tiết nét vẽ · Nhấn ESC để đóng'
          : 'Click image or use +/- to zoom into brushwork details · Press ESC to close'}
      </div>
    </div>
  );
}
