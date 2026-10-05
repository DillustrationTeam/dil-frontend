'use client';

import React from 'react';
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
  CheckCircle,
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
  Settings,
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
}

const CLIENT_NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Client Workspace',
    items: [
      { label: 'My Commissions', href: '/client/commissions', icon: FolderKanban },
      { label: 'My Vouchers', href: '/vouchers', icon: Ticket },
      { label: 'My Auctions', href: '/my-auctions', icon: Gavel },
      { label: 'Workroom Chat', href: '/workroom', icon: MessageSquare },
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
      { label: 'Rate Card & Services', href: '/creator/rate-card', icon: LayoutGrid },
      { label: 'My Vouchers', href: '/creator/vouchers', icon: Ticket },
      { label: 'Terms & Licensing', href: '/creator/terms', icon: ShieldCheck },
      { label: 'AI Auto-reply', href: '/creator/ai-rules', icon: Bot },
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
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const sections = role === 'client' ? CLIENT_NAV_SECTIONS : CREATOR_NAV_SECTIONS;

  return (
    <aside
      className={`relative sticky top-16 h-[calc(100vh-4rem)] bg-[#1F2335]/90 backdrop-blur-[20px] border-r border-white/10 transition-all duration-300 hidden md:flex flex-col justify-between z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Collapse Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3.5 top-6 w-7 h-7 rounded-full bg-[#1b1b1e] border border-white/20 text-slate-300 hover:text-white hover:border-[#A7ACD9]/50 flex items-center justify-center shadow-lg transition-all z-40"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Top Section: Navigation Links */}
      <div className="p-3 space-y-4 overflow-y-auto">
        {sections.map((section, sectionIdx) => (
          <div key={section.title || sectionIdx} className="space-y-1">
            {/* Section Header */}
            {section.title && (
              <div className="px-3 pt-2 pb-1">
                {!isCollapsed ? (
                  <p className="text-[10px] font-space-grotesk tracking-widest uppercase font-bold text-[#919099]">
                    {t(section.title)}
                  </p>
                ) : (
                  sectionIdx > 0 && <div className="h-[1px] bg-white/10 w-full my-2" />
                )}
              </div>
            )}

            {/* Nav Link List */}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-sora font-medium transition-all group ${
                      isActive
                        ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-[0_0_15px_rgba(167,172,217,0.2)]'
                        : 'text-[#919099] hover:text-white hover:bg-white/5'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? t(item.label) : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#A7ACD9]' : 'text-[#919099] group-hover:text-white'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1">{t(item.label)}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-white/10">
        <div
          className={`p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 ${
            isCollapsed ? 'justify-center p-2' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#A7ACD9]/20 text-[#A7ACD9] flex items-center justify-center shrink-0 border border-[#A7ACD9]/30">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-white truncate">Wallet escrow</p>
              <p className="text-[10px] text-emerald-400 truncate">Released per milestone</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
