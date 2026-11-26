'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import TopNavbar from '@/components/navigation/TopNavbar';
import { DEFAULT_ADMIN_NAV_SECTIONS, VerticalNavbar } from '../vertical-navbar';
import { AdminNavItem, AdminNavSection } from '../vertical-navbar/types';
import { adminDisputeService } from '../../services/dispute.service';
import { AccessDenied } from '@/components/feedback/access-denied';

export interface AdminLayoutProps {
  children: React.ReactNode;
  sidebarItems?: AdminNavItem[];
  sidebarSections?: AdminNavSection[];
  adminBadgeText?: string;
  adminName?: string;
  adminRole?: string;
  showScreenIds?: boolean;
  className?: string;
  contentClassName?: string;
}

export function AdminLayout({
  children,
  sidebarItems,
  sidebarSections,
  adminBadgeText,
  adminName,
  adminRole = 'Platform Control',
  showScreenIds = false,
  className = '',
  contentClassName = '',
}: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openEventDisputesCount, setOpenEventDisputesCount] = useState(0);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const roles = useAuthStore((state) => state.roles);
  const pathname = usePathname();
  const administrator = roles.some((role) => role.toLowerCase() === 'administrator');
  const moderator = roles.some((role) => role.toLowerCase() === 'moderator');
  const adminOnly = ['/admin/users', '/admin/fee-policy', '/admin/platform-config', '/admin/payouts'].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!authenticated || (!administrator && !moderator)) return;

    let ignore = false;
    const fetchOpenCount = async () => {
      try {
        const res = await adminDisputeService.getSubmissionDisputeQueue({ page: 1, pageSize: 100 });
        if (!ignore) {
          const count = (res.items || []).filter(
            (d) => d.status === 'Pending' || d.status === 'UnderReview'
          ).length;
          setOpenEventDisputesCount(count);
        }
      } catch {
        // Ignore if background count fails
      }
    };

    void fetchOpenCount();
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void fetchOpenCount();
      }
    };
    const handleDisputesUpdated = () => {
      void fetchOpenCount();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('dil:disputes-updated', handleDisputesUpdated);
    return () => {
      ignore = true;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('dil:disputes-updated', handleDisputesUpdated);
    };
  }, [authenticated, administrator, moderator]);

  const effectiveSidebarSections = useMemo(() => {
    if (sidebarSections) return sidebarSections;
    if (sidebarItems) return undefined;
    if (openEventDisputesCount <= 0) return DEFAULT_ADMIN_NAV_SECTIONS;

    return DEFAULT_ADMIN_NAV_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.map((item) =>
        item.id === 'event-operations'
          ? {
              ...item,
              badge: openEventDisputesCount,
              badgeVariant: 'warning' as const,
            }
          : item
      ),
    }));
  }, [sidebarSections, sidebarItems, openEventDisputesCount]);

  const toggleMobileNav = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

// Không đủ quyền: dùng chung khung báo lỗi của site thay vì một trang trắng.
  if (!authenticated || (!administrator && (!moderator || adminOnly))) {
    return <AccessDenied authenticated={authenticated} />;
  }

  const handleRoleChange = (role: 'client' | 'creator' | 'admin') => {
    if (role === 'creator') router.push('/creator/commissions');
    else if (role === 'client') router.push('/client/commissions');
    else router.push('/admin');
  };

  return (
    <div className={`min-h-screen bg-[#F7F2E9] text-[#241F1A] flex flex-col font-sora ${className}`}>
      {/* 1. TOP NAVBAR */}
      <TopNavbar
        currentRole="admin"
        showRoleSwitcher={false}
        adminBadgeText={adminBadgeText}
        onRoleChange={handleRoleChange}
        onToggleSidebar={toggleMobileNav}
      />

      {/* 2. MOBILE DRAWER */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden flex animate-fadeIn">
          <div
            className="fixed inset-0 bg-[#E5D8C2] backdrop-blur-sm transition-opacity"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
          <div className="relative w-[17rem] max-w-[85vw] h-full z-10 bg-[#F7F2E9] border-r border-[#221E1A]/10 shadow-2xl flex flex-col">
            <VerticalNavbar
              items={sidebarItems}
              sections={effectiveSidebarSections}
              adminName={adminName}
              adminRole={adminRole}
              showScreenIds={showScreenIds}
              onItemClick={closeMobileNav}
              onLogout={closeMobileNav}
              isCollapsed={false}
              className="h-full border-r-0 shadow-2xl border border-[#221E1A]/10"
            />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex w-full relative">
        <div className="hidden lg:flex">
          <VerticalNavbar
            items={sidebarItems}
            sections={effectiveSidebarSections}
            adminName={adminName}
            adminRole={adminRole}
            showScreenIds={showScreenIds}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <main className={`flex-1 min-w-0 overflow-x-hidden p-3 pb-10 sm:p-5 lg:p-8 overflow-y-auto ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export const AdminConsoleLayout = AdminLayout;
