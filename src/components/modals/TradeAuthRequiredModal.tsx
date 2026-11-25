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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-in fade-in duration-200"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden z-10"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3B4C86]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#5F3F86]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 text-[#746A5F] hover:text-[#241F1A] rounded-full hover:bg-[#FFFCF6] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B4C86] to-[#5F3F86] border border-[#3B4C86]/40 text-[#3B4C86] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3B4C86]">
          <ArrowLeftRight className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-[#241F1A] tracking-tight mb-2 font-h1">
          {isVie ? 'Đăng nhập để Trao đổi tranh' : 'Sign In to Use Art Trade'}
        </h3>
        <p className="text-xs text-[#746A5F] mb-6 leading-relaxed max-w-sm mx-auto">
          {isVie
            ? 'Vui lòng đăng nhập tài khoản của bạn để tham gia tạo đề nghị và trao đổi tranh cùng các họa sĩ khác dưới sự bảo vệ của hệ thống ký quỹ và dấu chìm an toàn.'
            : 'Please sign in to your account to propose, participate in, and manage Art Trades with fellow Creators under zero-fee escrow protection.'}
        </p>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6 text-left p-3.5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10">
          <div className="flex items-center gap-2.5 text-xs text-[#746A5F]">
            <ShieldCheck className="w-4 h-4 text-[#3B4C86] shrink-0" />
            <span>
              {isVie
                ? 'Bảo vệ tranh nguyên tác bằng bản xem trước có dấu chìm'
                : 'Watermarked preview protection for original artwork'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#746A5F]">
            <Sparkles className="w-4 h-4 text-[#5F3F86] shrink-0" />
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
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#3B4C86] to-[#5F3F86] hover:from-[#3B4C86] hover:to-[#5F3F86] text-[#241F1A] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#3B4C86] transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{isVie ? 'Đăng nhập để tiếp tục' : 'Sign In to Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/register"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-xs font-semibold text-[#746A5F] hover:text-[#241F1A] transition flex items-center justify-center cursor-pointer"
          >
            {isVie ? 'Chưa có tài khoản? Đăng ký ngay' : "Don't have an account? Sign Up"}
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
