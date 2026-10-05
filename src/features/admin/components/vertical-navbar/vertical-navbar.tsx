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
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { AdminNavItem, AdminNavSection, AdminVerticalNavbarProps } from './types';

export const DEFAULT_ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Platform Overview',
    items: [
      {
        id: 'system-overview',
        label: 'System Overview KPIs',
        href: '/admin',
        icon: <BarChart3 className="w-4 h-4 shrink-0" />,
        materialIcon: 'equalizer',
        exact: true,
      },
      {
        id: 'platform-fee-config',
        label: 'Platform Fee Config',
        href: '/admin/fee-policy',
        icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
        materialIcon: 'tune',
      },
    ],
  },
  {
    title: 'User Management',
    items: [
      {
        id: 'user-management',
        label: 'User Accounts',
        href: '/admin/users',
        icon: <Users className="w-4 h-4 shrink-0" />,
        materialIcon: 'group',
      },
      {
        id: 'creator-verifications',
        label: 'Creator Verifications',
        href: '/admin/creator-verifications',
        icon: <UserCheck className="w-4 h-4 shrink-0" />,
        materialIcon: 'how_to_reg',
      },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      {
        id: 'content-moderation',
        label: 'Content & AI Moderation',
        href: '/admin/moderation',
        icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
        materialIcon: 'shield',
      },
      {
        id: 'dispute-arbitration',
        label: 'Dispute Arbitration',
        href: '/admin/disputes',
        icon: <Gavel className="w-4 h-4 shrink-0" />,
        materialIcon: 'gavel',
      },
    ],
  },
];

export const DEFAULT_ADMIN_NAV_ITEMS: AdminNavItem[] = DEFAULT_ADMIN_NAV_SECTIONS.flatMap(
  (sec) => sec.items
);

function getInitials(name?: string | null): string {
  if (!name) return 'ADM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 3).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function VerticalNavbar({
  items,
  sections,
  activeHref,
  adminName,
  adminRole = 'Platform Control',
  avatarText,
  showProfile = true,
  showFooter = true,
  footerContent,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  onItemClick,
  onLogout,
}: AdminVerticalNavbarProps) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const displayName = adminName || user?.fullName || 'System Admin';
  const displayInitials = avatarText || getInitials(displayName);

  // Normalize sections
  const navSections: AdminNavSection[] =
    sections ||
    (items ? [{ title: 'Admin Console', items }] : DEFAULT_ADMIN_NAV_SECTIONS);

  const isItemActive = (item: AdminNavItem) => {
    if (activeHref !== undefined) {
      return activeHref === item.href;
    }

    if (!pathname) return false;

    if (item.exact || item.href === '/admin') {
      return (
        pathname === item.href ||
        pathname === '/admin/overview' ||
        pathname === '/admin/dashboard'
      );
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
      className={`relative sticky top-16 h-[calc(100vh-4rem)] bg-[#1F2335]/90 backdrop-blur-[20px] border-r border-white/10 transition-all duration-300 flex flex-col justify-between z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Toggle Collapse Button (matching CollapsibleSidebar) */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-6 w-7 h-7 rounded-full bg-[#1b1b1e] border border-white/20 text-slate-300 hover:text-white hover:border-[#A7ACD9]/50 flex items-center justify-center shadow-lg transition-all z-40 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Top Section: Admin Profile + Navigation Sections */}
      <div className="p-3 space-y-4 overflow-y-auto">
        {/* Admin Header / Profile Banner */}
        {showProfile && (
          <div
            className={`p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#A7ACD9]/20 text-[#A7ACD9] font-bold flex items-center justify-center font-sora text-xs border border-[#A7ACD9]/30 shrink-0 select-none shadow-[0_0_12px_rgba(167,172,217,0.15)]">
              {displayInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-xs truncate font-sora">
                  {displayName}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-3 h-3 text-[#A7ACD9]" />
                  <span className="text-[10px] text-[#A7ACD9] font-medium tracking-wide truncate">
                    {adminRole}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grouped Navigation Links (matching CollapsibleSidebar structure) */}
        {navSections.map((section, sectionIdx) => (
          <div key={section.title || sectionIdx} className="space-y-1">
            {/* Section Header */}
            {section.title && (
              <div className="px-3 pt-2 pb-1">
                {!isCollapsed ? (
                  <p className="text-[10px] font-space-grotesk tracking-widest uppercase font-bold text-[#919099]">
                    {section.title}
                  </p>
                ) : (
                  sectionIdx > 0 && (
                    <div className="h-[1px] bg-white/10 w-full my-2" />
                  )
                )}
              </div>
            )}

            {/* Nav Link List */}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isItemActive(item);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onItemClick?.(item)}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-sora font-medium transition-all group ${
                      active
                        ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-[0_0_15px_rgba(167,172,217,0.2)]'
                        : 'text-[#919099] hover:text-white hover:bg-white/5 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    {/* Icon Rendering */}
                    {item.icon ? (
                      <span
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-[#A7ACD9]'
                            : 'text-[#919099] group-hover:text-white'
                        }`}
                      >
                        {item.icon}
                      </span>
                    ) : item.materialIcon ? (
                      <span
                        className={`material-symbols-outlined text-lg transition-colors ${
                          active
                            ? 'text-[#A7ACD9]'
                            : 'text-[#919099] group-hover:text-white'
                        }`}
                      >
                        {item.materialIcon}
                      </span>
                    ) : null}

                    {/* Label */}
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {/* Badge / Screen ID (only when expanded) */}
                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.badgeVariant === 'danger'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : item.badgeVariant === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-[#A7ACD9]/20 text-[#A7ACD9] border-[#A7ACD9]/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Badge (only when expanded) */}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Footer Section (matching CollapsibleSidebar) */}
      {showFooter && (
        <div className="p-3 border-t border-white/10 space-y-1.5">
          {footerContent ? (
            footerContent
          ) : (
            <>
              {/* Return to Marketplace */}
              <Link
                href="/"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sora text-[#919099] hover:text-white hover:bg-white/5 transition-colors group ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title={isCollapsed ? 'Return to Marketplace' : undefined}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {!isCollapsed && (
                  <span className="truncate flex-1 font-medium">Marketplace</span>
                )}
                {!isCollapsed && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#919099] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sora text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title={isCollapsed ? 'Exit Console' : undefined}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                {!isCollapsed && <span className="font-medium">Exit Console</span>}
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
