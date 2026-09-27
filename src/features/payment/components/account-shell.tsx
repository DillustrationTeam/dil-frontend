'use client';

import { ChevronRight } from 'lucide-react';

export const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-periwinkle';

export type AccountSection = 'wallet' | 'deposit' | 'payout' | 'revenue';

/**
 * Khung chung cho nhóm màn hình tài khoản: sidebar "Tài khoản của bạn"
 * và vùng nội dung. Nhờ vậy Nạp tiền / Rút tiền / Doanh thu hiển thị cùng một
 * bố cục với trang Ví, không nhảy sang một giao diện khác.
 *
 * Header (logo, điều hướng, tìm kiếm, chuông, menu tài khoản) do `SiteHeader`
 * ở layout gốc đảm nhiệm — không lặp lại ở đây.
 */
export function AccountShell({
  children,
}: {
  active?: AccountSection;
  children: React.ReactNode;
}) {
  return (
    <div lang="vi" className="min-h-screen bg-brand-navy font-body text-on-surface">
      <a
        href="#wallet-content"
        className={`sr-only z-50 rounded-xl bg-brand-periwinkle p-3 text-brand-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4 ${focusClass}`}
      >
        Đến nội dung chính
      </a>

      <div className="mx-auto max-w-[1600px] px-2 py-4 sm:px-4 md:px-6">
        <main id="wallet-content" className="min-w-0 scroll-mt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Khối tiêu đề đầu mỗi màn hình tài khoản — dùng chung để 4 trang trông đồng nhất. */
export function AccountPageHeading({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs text-outline">
          Tài khoản
          <ChevronRight size={12} aria-hidden />
          <span className="text-on-surface-variant">{breadcrumb}</span>
        </p>
        <h1 className="font-h1 text-3xl font-semibold tracking-tight md:text-[40px] md:leading-tight">
          {title}
          <span className="text-brand-periwinkle">.</span>
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant">{description}</p>
      </div>
      {actions}
    </div>
  );
}

/** Chân trang chung của nhóm màn hình tài khoản. */
export function AccountPageFooter({ right }: { right: string }) {
  return (
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 py-5 text-[11px] text-outline">
      <span>Dillustration · Không gian cho sáng tạo</span>
      <span>{right}</span>
    </footer>
  );
}
