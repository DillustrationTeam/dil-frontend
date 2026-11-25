'use client';

import { Wordmark } from '@/components/brand/wordmark';
import Link from 'next/link';
import React from 'react';
import { useLanguage } from '@/context/language-context';

export const AUTH_LABEL_CLASS =
  'block text-[0.8125rem] font-medium text-[#6E6459]';

export const AUTH_INPUT_WRAP_CLASS =
  'relative flex items-center rounded-[14px] border border-[#221E1A]/12 bg-[#FFFCF6] transition-all duration-200 focus-within:border-[#B24A26] focus-within:ring-4 focus-within:ring-[#B24A26]/12';

export const AUTH_INPUT_CLASS =
  'h-12 w-full bg-transparent text-sm text-[#241F1A] placeholder:text-[#746A5F] focus:outline-none disabled:opacity-60';

export const AUTH_PRIMARY_BTN_CLASS =
  'flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#B24A26] px-5 text-[0.9375rem] font-semibold text-[#FFFCF6] shadow-[0_16px_28px_-18px_rgba(178,74,38,0.9)] transition-all duration-200 hover:bg-[#8C3718] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const AUTH_SECONDARY_BTN_CLASS =
  'flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#221E1A]/12 bg-[#FFFCF6] px-4 text-[0.9375rem] font-medium text-[#241F1A] transition-all hover:border-[#B24A26]/45 hover:text-[#8C3718] disabled:opacity-50';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Khung giao diện đồng bộ cho các màn hình xác thực (/login, /register, /forgot-password, /verify-otp):
 * dùng logo chữ (Wordmark) và bố cục hai cột như bản redesign.
 */
export function AuthShell({ children }: AuthShellProps) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  // Ảnh bìa: lấy tác phẩm mới nhất đã duyệt; không có thì dùng nền giấy.
  const [cover, setCover] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    import('@/features/marketplace/services/marketplace.service')
      .then(({ marketplaceService }) => marketplaceService.getArtworks())
      .then((items) => {
        if (!active) return;
        const approved = items.find((item) => item.moderationStatus === 'Approved' && item.imageUrl);
        if (approved) setCover(approved.thumbnailUrl || approved.imageUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="auth">
      {/* Cột trái: tranh + câu dẫn (ẩn dưới 960px) */}
      <aside className="auth__panel">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" aria-hidden="true" />
        ) : null}
        <div className="auth__panel-body">
          <p className="eyebrow">Phòng tranh dilillustration</p>
          <p className="auth__quote"> Một phòng tranh giữ <em>ánh sáng</em> cho tác phẩm của bạn. </p>
          <p className="auth__caption">
            {isEng
              ? 'Commissions, auctions and the workroom — one account.'
              : 'Đặt vẽ, đấu giá và phòng làm việc — trong một tài khoản.'}
          </p>
        </div>
      </aside>

      {/* Thanh trên: quay lại + wordmark */}
      <div className="authbar">
        <Link href="/" className="authbar__back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          {isEng ? 'Back to gallery' : 'Về phòng tranh'}
        </Link>
        <Wordmark size="lg" href="/" className="authbar__mark" />
      </div>

      <main className="auth__main">
        <div className="auth__card">
          {children}
          <p className="auth__alt text-center text-[0.8125rem] text-[#746A5F]">
            © 2026 DILLUSTRATION ·{' '}
            <Link href="/privacy" className="text-[#8C3718] hover:underline">
              {isEng ? 'Privacy' : 'Bảo mật'}
            </Link>{' '}
            ·{' '}
            <Link href="/guide" className="text-[#8C3718] hover:underline">
              {isEng ? 'Guide' : 'Hướng dẫn'}
            </Link>
          </p>
        </div>
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
          fill="#E5D8C2"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{label ?? 'Google'}</span>
    </button>
  );
}
