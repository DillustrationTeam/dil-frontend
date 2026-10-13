'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ShieldCheck } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#11131d]/90 backdrop-blur-xl shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-sora font-semibold text-lg">{title}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#A7ACD9]/15 text-[#A7ACD9] border border-[#A7ACD9]/30">
                {code}
              </span>
              {category && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-[#9695a1] border border-white/10">
                  {category}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9695a1] mt-0.5">Anonymous Candidate</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {aiScanPassed && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mr-2">
              <ShieldCheck className="w-4 h-4" />
              <span>AI Scan Passed</span>
            </div>
          )}

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="p-1.5 text-[#9695a1] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#c7c5cf] font-mono px-2 min-w-[3.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="p-1.5 text-[#9695a1] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="p-1.5 text-[#9695a1] hover:text-white hover:bg-white/10 rounded-lg transition-colors border-l border-white/10"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#9695a1] hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-2"
            title="Close (Esc)"
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
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-white/15"
          />
        </div>
      </div>

      {/* Bottom Hint Bar */}
      <div className="text-center py-2 text-[11px] text-[#9695a1] bg-[#11131d]/60 border-t border-white/5">
        Click image or use +/- to zoom into brushwork details · Press ESC to close
      </div>
    </div>
  );
}
