'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface TradeAuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export default function TradeAuthRequiredModal({
  isOpen,
  onClose,
  redirectUrl = '/art-trades/create',
}: TradeAuthRequiredModalProps) {
  const [mounted, setMounted] = useState(false);
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const loginUrl = `/login?redirect=${encodeURIComponent(redirectUrl)}`;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#161926]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden z-10"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
          <ArrowLeftRight className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2 font-h1">
          {isVie ? 'Đăng nhập để Trao đổi tranh' : 'Sign In to Use Art Trade'}
        </h3>
        <p className="text-xs text-gray-300 mb-6 leading-relaxed max-w-sm mx-auto">
          {isVie
            ? 'Vui lòng đăng nhập tài khoản của bạn để tham gia tạo đề nghị và trao đổi tranh cùng các Creator khác dưới sự bảo vệ của hệ thống Escrow và watermark an toàn.'
            : 'Please sign in to your account to propose, participate in, and manage Art Trades with fellow Creators under zero-fee escrow protection.'}
        </p>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6 text-left p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {isVie
                ? 'Bảo vệ tranh nguyên tác bằng bản xem trước có watermark'
                : 'Watermarked preview protection for original artwork'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              {isVie
                ? 'Cơ chế xác nhận hai chiều, hoàn toàn không tính phí giao dịch'
                : 'Dual-confirmation escrow and zero transaction fees'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href={loginUrl}
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{isVie ? 'Đăng nhập để tiếp tục' : 'Sign In to Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/register"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            {isVie ? 'Chưa có tài khoản? Đăng ký ngay' : "Don't have an account? Sign Up"}
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
