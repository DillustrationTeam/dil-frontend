'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  MessageSquare,
  Ticket,
  Brush,
  Bot,
  ShieldCheck,
  Palette,
  LayoutGrid,
  ArrowDownRight,
  ArrowUpRight,
  History,
  TrendingUp,
  Gavel,
  User,
  UserPen,
  Settings,
  ArrowLeftRight,
  Sparkles,
  Send,
  X,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  role?: 'client' | 'creator';
  /**
   * `static`: cột cố định từ lg trở lên (được thu gọn còn icon).
   * `drawer`: bản trượt toàn màn hình cho dưới lg — luôn mở rộng, có nút đóng,
   * bấm link thì tự đóng qua `onNavigate`.
   */
  variant?: 'static' | 'drawer';
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
}

const CLIENT_NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Client Workspace',
    items: [
      { label: 'Tác phẩm đã sở hữu', href: '/client/owned-artworks', icon: Sparkles },
      { label: 'My Commissions', href: '/client/commissions', icon: FolderKanban },
      { label: 'Sent Requests', href: '/client/requests', icon: Send },
      { label: 'My Vouchers', href: '/vouchers', icon: Ticket },
      { label: 'My Auctions', href: '/my-auctions', icon: Gavel },
      { label: 'Workroom Chat', href: '/workroom', icon: MessageSquare },
      { label: 'Forensic Watermark', href: '/forensic', icon: ShieldCheck },
    ],
  },
  {
    title: 'Ví & Thanh toán',
    items: [
      { label: 'Ví của tôi', href: '/wallet', icon: Wallet },
      { label: 'Nạp tiền', href: '/deposit', icon: ArrowDownRight },
      { label: 'Rút tiền', href: '/payout', icon: ArrowUpRight },
      { label: 'Lịch sử giao dịch', href: '/wallet#wallet-history', icon: History },
    ],
  },
  {
    title: 'Cài đặt & Tài khoản',
    items: [
      { label: 'Hồ sơ của tôi', href: '/profile', icon: User },
      { label: 'Cài đặt hồ sơ', href: '/settings', icon: Settings },
    ],
  },
];

const CREATOR_NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Commissions',
    items: [
      { label: 'Studio Overview', href: '/creator/commissions', icon: LayoutDashboard },
      { label: 'Incoming Requests', href: '/creator/requests', icon: Clock },
      { label: 'Waitlist', href: '/creator/waitlist', icon: ListChecks },
      { label: 'Workroom Chat', href: '/workroom', icon: MessageSquare },
    ],
  },
  {
    title: 'Trade & Exchange',
    items: [
      { label: 'Trade', href: '/art-trades/create', icon: ArrowLeftRight },
      { label: 'My Trades', href: '/art-trades', icon: FolderKanban },
    ],
  },
  {
    title: 'Doanh thu & Rút tiền',
    items: [
      { label: 'Tổng quan doanh thu', href: '/creator/dashboard', icon: TrendingUp },
      { label: 'Yêu cầu rút tiền', href: '/payout', icon: ArrowUpRight },
    ],
  },
  {
    title: 'Workstation',
    items: [
      { label: 'Artworks Portfolio', href: '/creator/artworks', icon: Brush },
      { label: 'Rate Card & Services', href: '/creator/services', icon: LayoutGrid },
      { label: 'Creator Profile', href: '/creator/profile/edit', icon: UserPen },
      { label: 'Event Jury', href: '/creator/events/jury', icon: Gavel },
      { label: 'My Vouchers', href: '/creator/vouchers', icon: Ticket },
      { label: 'Terms & Licensing', href: '/creator/terms', icon: ShieldCheck },
      { label: 'Forensic Watermark', href: '/forensic', icon: ShieldCheck },
      { label: 'Auto-reply', href: '/creator/ai-rules', icon: Bot },
      { label: 'Asset & Presets', href: '/creator/assets', icon: Palette },
    ],
  },
  {
    title: 'Cài đặt & Tài khoản',
    items: [
      { label: 'Hồ sơ của tôi', href: '/profile', icon: User },
      { label: 'Cài đặt hồ sơ', href: '/settings', icon: Settings },
    ],
  },
];

export default function CollapsibleSidebar({
  isCollapsed,
  onToggleCollapse,
  role = 'client',
  variant = 'static',
  onNavigate,
  onClose,
  className = '',
}: CollapsibleSidebarProps) {
  const isDrawer = variant === 'drawer';
  // Trong drawer không bao giờ thu gọn: người dùng cần nhãn chữ để chọn mục.
  const collapsed = isDrawer ? false : isCollapsed;
  const pathname = usePathname();
  const { t } = useLanguage();
  const sections = role === 'client' ? CLIENT_NAV_SECTIONS : CREATOR_NAV_SECTIONS;

  const allNavHrefs = useMemo(() => {
    return sections.flatMap((section) => section.items.map((item) => item.href));
  }, [sections]);

  const isItemActive = (itemHref: string) => {
    if (!pathname) return false;

    const currentPath = pathname;
    const baseItemHref = itemHref.split('#')[0];

    // If itemHref has hash, only exact match if hash matches or treat as base
    if (currentPath === itemHref || currentPath === baseItemHref) {
      // Check if there is another item that matches more specifically (longer base href)
      const hasMoreSpecificMatch = allNavHrefs.some((otherHref) => {
        if (otherHref === itemHref) return false;
        const otherBase = otherHref.split('#')[0];
        return (
          otherBase.length > baseItemHref.length &&
          (currentPath === otherBase || currentPath.startsWith(`${otherBase}/`))
        );
      });

      if (hasMoreSpecificMatch) return false;

      // If this item has a hash, don't activate on the bare path if the bare path item exists
      if (itemHref.includes('#') && allNavHrefs.includes(baseItemHref)) {
        return false;
      }

      return true;
    }

    // Prefix match (for sub-routes like /art-trades/[id] under /art-trades)
    if (baseItemHref !== '/' && currentPath.startsWith(`${baseItemHref}/`)) {
      const hasMoreSpecificMatch = allNavHrefs.some((otherHref) => {
        if (otherHref === itemHref) return false;
        const otherBase = otherHref.split('#')[0];
        return (
          otherBase.length > baseItemHref.length &&
          (currentPath === otherBase || currentPath.startsWith(`${otherBase}/`))
        );
      });

      return !hasMoreSpecificMatch;
    }

    return false;
  };

  return (
    <aside
      className={
        isDrawer
          ? `side flex h-full w-full flex-col bg-[#F7F2E9] ${className}`
          : `side relative sticky top-[var(--header-h)] hidden h-[calc(100vh-var(--header-h))] shrink-0 flex-col transition-[width] duration-300 lg:flex z-30 ${
              isCollapsed ? 'w-20' : 'w-64'
            } ${className}`
      }
    >
      {isDrawer ? (
        <div className="flex items-center justify-between border-b border-[#221E1A]/10 px-4 py-3">
          <span className="side__label">{t('Điều hướng')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Đóng menu')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#221E1A]/15 text-[#746A5F] transition-colors hover:border-[#B24A26] hover:text-[#8C3718]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Nút thu gọn — chỉ dành cho cột cố định (>= lg) */
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-6 z-40 grid h-7 w-7 place-items-center rounded-full border border-[#221E1A]/20 bg-[#FFFCF6] text-[#746A5F] shadow-[0_6px_16px_-10px_rgba(74,52,30,0.9)] transition-all hover:border-[#B24A26] hover:text-[#8C3718]"
          title={isCollapsed ? t('Expand Sidebar') : t('Collapse Sidebar')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Top Section: Navigation Links */}
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
        {sections.map((section, sectionIdx) => (
          <div key={section.title || sectionIdx} className="side__group space-y-1">
            {/* Section Header */}
            {section.title && (
              <div className="px-3 pb-1 pt-2">
                {!collapsed ? (
                  <p className="side__label">{t(section.title)}</p>
                ) : (
                  sectionIdx > 0 && <div className="my-2 h-px w-full bg-[#221E1A]/10" />
                )}
              </div>
            )}

            {/* Nav Link List */}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={collapsed ? 'justify-center px-0' : ''}
                    title={collapsed ? t(item.label) : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className="h-4 w-4 shrink-0" />

                    {!collapsed && <span className="flex-1 truncate">{t(item.label)}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
