'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  House,
  Landmark,
  LockKeyhole,
  Wallet,
} from 'lucide-react';

export const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-periwinkle';

/** Bốn màn hình dùng chung khung này, mỗi màn hình là một mục đang mở. */
export type AccountSection = 'wallet' | 'deposit' | 'payout' | 'revenue';

const sections: {
  key: AccountSection;
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; 'aria-hidden'?: boolean }>;
}[] = [
  { key: 'wallet', href: '/wallet', label: 'Ví của tôi', icon: Wallet },
  { key: 'deposit', href: '/checkout', label: 'Nạp tiền', icon: ArrowDownLeft },
  { key: 'payout', href: '/payout', label: 'Rút tiền', icon: Landmark },
  { key: 'revenue', href: '/creator/dashboard', label: 'Doanh thu', icon: ArrowUpRight },
];

/**
 * Khung chung cho nhóm màn hình tài khoản: sidebar "Tài khoản của bạn"
 * và vùng nội dung. Nhờ vậy Nạp tiền / Rút tiền / Doanh thu hiển thị cùng một
 * bố cục với trang Ví, không nhảy sang một giao diện khác.
 *
 * Header (logo, điều hướng, tìm kiếm, chuông, menu tài khoản) do `SiteHeader`
 * ở layout gốc đảm nhiệm — không lặp lại ở đây.
 */
export function AccountShell({
  active,
  children,
}: {
  active: AccountSection;
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

      <div className="mx-auto grid max-w-[1600px] gap-7 px-5 py-7 md:px-10 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-9 lg:py-10">
        <aside className="flex flex-col gap-8 lg:pr-3">
          <div>
            <p className="mb-4 hidden px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-outline lg:block">
              Tài khoản của bạn
            </p>
            <nav aria-label="Điều hướng ví" className="flex gap-2 overflow-x-auto lg:flex-col">
              {sections.map(({ key, href, label, icon: Icon }) => {
                const isActive = key === active;
                return (
                  <Link
                    key={key}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3.5 text-sm ${
                      isActive
                        ? `border border-brand-periwinkle/20 bg-brand-periwinkle/10 font-medium text-brand-periwinkle ${focusClass}`
                        : `text-on-surface-variant hover:bg-white/5 ${focusClass}`
                    }`}
                  >
                    <Icon size={19} aria-hidden />
                    {label}
                    {isActive && <ChevronRight size={15} className="ml-auto hidden lg:block" aria-hidden />}
                  </Link>
                );
              })}

              <Link
                href="/"
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-on-surface-variant hover:bg-white/5 ${focusClass}`}
              >
                <House size={19} aria-hidden />Về trang chủ
              </Link>
            </nav>
          </div>

          <div className="mt-auto hidden border-t border-white/10 px-4 pt-6 lg:block">
            <LockKeyhole size={19} className="mb-3 text-brand-periwinkle" aria-hidden />
            <p className="text-sm font-medium">Theo dõi từng giao dịch</p>
            <p className="mt-2 text-xs leading-6 text-outline">
              Số dư và lịch sử giúp bạn đối chiếu các khoản tiền vào, tiền ra trong ví.
            </p>
          </div>
        </aside>

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
