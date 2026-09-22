'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  UserCheck,
  ShieldAlert,
  Gavel,
  SlidersHorizontal,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { AdminNavItem, AdminVerticalNavbarProps } from './types';

export const DEFAULT_ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'system-overview',
    label: 'System Overview KPIs',
    href: '/admin',
    screenId: 'SCR-24',
    icon: <BarChart3 className="w-5 h-5 shrink-0" />,
    materialIcon: 'equalizer',
    exact: true,
  },
  {
    id: 'user-management',
    label: 'User Management',
    href: '/admin/users',
    screenId: 'SCR-23',
    icon: <Users className="w-5 h-5 shrink-0" />,
    materialIcon: 'group',
  },
  {
    id: 'creator-verifications',
    label: 'Creator Verifications',
    href: '/admin/creator-applications',
    screenId: 'SCR-21',
    icon: <UserCheck className="w-5 h-5 shrink-0" />,
    materialIcon: 'how_to_reg',
  },
  {
    id: 'content-moderation',
    label: 'Content & AI Moderation',
    href: '/admin/moderation',
    screenId: 'SCR-20',
    icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
    materialIcon: 'shield',
  },
  {
    id: 'dispute-arbitration',
    label: 'Dispute Arbitration',
    href: '/admin/disputes',
    screenId: 'SCR-22',
    icon: <Gavel className="w-5 h-5 shrink-0" />,
    materialIcon: 'gavel',
  },
  {
    id: 'platform-fee-config',
    label: 'Platform Fee Config',
    href: '/admin/fee-policy',
    screenId: 'SCR-18',
    icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
    materialIcon: 'tune',
  },
];

function getInitials(name?: string | null): string {
  if (!name) return 'ADM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 3).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function VerticalNavbar({
  items = DEFAULT_ADMIN_NAV_ITEMS,
  activeHref,
  adminName,
  adminRole = 'Platform Control',
  avatarText,
  showProfile = true,
  showScreenIds = false,
  showFooter = true,
  footerContent,
  className = '',
  onItemClick,
  onLogout,
}: AdminVerticalNavbarProps) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const displayName = adminName || user?.fullName || 'System Admin';
  const displayInitials = avatarText || getInitials(displayName);

  const isItemActive = (item: AdminNavItem) => {
    if (activeHref !== undefined) {
      return activeHref === item.href;
    }

    if (!pathname) return false;

    if (item.exact || item.href === '/admin') {
      return pathname === item.href || pathname === '/admin/overview' || pathname === '/admin/dashboard';
    }

    if (item.id === 'platform-fee-config') {
      return (
        pathname === '/admin/fee-policy' ||
        pathname.startsWith('/admin/fee-policy/') ||
        pathname === '/admin/platform-config' ||
        pathname.startsWith('/admin/platform-config/')
      );
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAuth();
    }
  };

  return (
    <aside
      className={`glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6 flex flex-col justify-between h-fit w-full ${className}`}
    >
      <div className="space-y-6">
        {/* Admin Header / Profile Banner */}
        {showProfile && (
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 font-extrabold flex items-center justify-center font-h1 text-sm border border-red-500/40 shrink-0 select-none shadow-[0_0_12px_rgba(239,68,68,0.2)]">
              {displayInitials}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-white text-xs truncate font-h1">
                {displayName}
              </h4>
              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                {adminRole}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5 text-xs font-body" aria-label="Admin Navigation">
          {items.map((item) => {
            const active = isItemActive(item);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onItemClick?.(item)}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 outline-none select-none ${
                  active
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'text-[#8A8FA9] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon Rendering: supports Lucide React icon or Material Symbol */}
                  {item.icon ? (
                    <span
                      className={`transition-colors duration-200 ${
                        active ? 'text-red-300' : 'text-[#8A8FA9] group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                  ) : item.materialIcon ? (
                    <span
                      className={`material-symbols-outlined text-lg transition-colors duration-200 ${
                        active ? 'text-red-300' : 'text-[#8A8FA9] group-hover:text-white'
                      }`}
                    >
                      {item.materialIcon}
                    </span>
                  ) : null}

                  <span className="truncate">{item.label}</span>
                </div>

                {/* Right side: Badge / Screen ID */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.badgeVariant === 'danger' || active
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : item.badgeVariant === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : item.badgeVariant === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/10 text-white/80 border-white/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {showScreenIds && item.screenId && (
                    <span className="text-[9px] font-mono font-medium text-white/40 group-hover:text-white/70 px-1.5 py-0.5 rounded bg-white/5">
                      {item.screenId}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Utilities */}
      {showFooter && (
        <div className="pt-4 border-t border-white/10 space-y-2">
          {footerContent ? (
            footerContent
          ) : (
            <>
              {/* Return to Marketplace */}
              <Link
                href="/"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8FA9] hover:text-white hover:bg-white/5 transition-all duration-200 group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Return to Marketplace
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#8A8FA9] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Exit Console</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

// Named alias for convenience
export const AdminVerticalNavbar = VerticalNavbar;
export const AdminSidebar = VerticalNavbar;
