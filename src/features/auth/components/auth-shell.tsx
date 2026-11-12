'use client';

import Link from 'next/link';
import React from 'react';
import { useLanguage } from '@/context/language-context';

export const AUTH_LABEL_CLASS =
  'block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C7C5CF]';

export const AUTH_INPUT_WRAP_CLASS =
  'relative flex items-center rounded-xl border border-white/10 bg-[#141724]/90 transition-all duration-200 focus-within:border-[#A7ACD9] focus-within:ring-1 focus-within:ring-[#A7ACD9]';

export const AUTH_INPUT_CLASS =
  'h-12 w-full bg-transparent text-sm text-[#E4E1E5] placeholder:text-[#919099] focus:outline-none disabled:opacity-60';

export const AUTH_PRIMARY_BTN_CLASS =
  'flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#A7ACD9] px-5 text-sm font-bold text-[#1F2335] shadow-[0_8px_24px_rgba(167,172,217,0.22)] transition-all duration-200 hover:bg-[#c2c7f6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const AUTH_SECONDARY_BTN_CLASS =
  'flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-[#C7C5CF] transition-all hover:bg-white/10 hover:text-white disabled:opacity-50';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Khung giao diện đồng bộ cho các màn hình xác thực (/login, /register, /forgot-password, /verify-otp):
 * dùng chung /weblogo.png, hiệu ứng nền glass-container và thanh chân trang tối giản.
 */
export function AuthShell({ children }: AuthShellProps) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#1F2335] px-4 py-10 text-[#E4E1E5] font-body sm:px-6">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[12%] -top-[14%] h-[48%] w-[48%] rounded-full bg-[#A7ACD9]/12 blur-[130px]" />
        <div className="absolute -bottom-[14%] -right-[10%] h-[44%] w-[44%] rounded-full bg-[#c2c7f6]/10 blur-[130px]" />
      </div>

      <main className="relative z-10 w-full max-w-[480px]">
        {/* Brand Logo đồng bộ weblogo.png */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="group inline-flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/weblogo.png"
              alt="dillustration"
              className="h-14 w-auto object-contain drop-shadow-[0_0_20px_rgba(194,199,246,0.28)] transition-transform duration-200 group-hover:scale-105 sm:h-16"
            />
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#919099]">
            {isEng ? 'Digital Art Commission & Auction' : 'Nền tảng Commission & Đấu giá tranh số'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-container rounded-[28px] p-7 shadow-2xl sm:p-9">
          {children}
        </div>

        {/* Minimal Footer */}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-[#919099]">
          <span>© 2026 DILLUSTRATION</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[#A7ACD9]">
              {isEng ? 'Privacy' : 'Bảo mật'}
            </Link>
            <Link href="/guide" className="transition-colors hover:text-[#A7ACD9]">
              {isEng ? 'Guide' : 'Hướng dẫn'}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function GoogleAuthButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={AUTH_SECONDARY_BTN_CLASS}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{label ?? 'Google'}</span>
    </button>
  );
}
