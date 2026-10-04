'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import TopNavbar from '@/components/navigation/TopNavbar';
import { VerticalNavbar } from '../vertical-navbar';
import { AdminNavItem, AdminNavSection } from '../vertical-navbar/types';

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
  adminBadgeText = 'ADMIN CONSOLE',
  adminName,
  adminRole = 'Platform Control',
  showScreenIds = false,
  className = '',
  contentClassName = '',
}: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const roles = useAuthStore((state) => state.roles);
  const pathname = usePathname();
  const administrator = roles.some((role) => role.toLowerCase() === 'administrator');
  const moderator = roles.some((role) => role.toLowerCase() === 'moderator');
  const adminOnly = ['/admin/users', '/admin/fee-policy', '/admin/platform-config'].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const toggleMobileNav = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

if (!authenticated || (!administrator && (!moderator || adminOnly))) {
    return (
      <div className="min-h-screen bg-[#1F2335] px-6 py-24 text-center text-[#E4E1E5]">
        <h1 className="font-h1 text-2xl">
          {authenticated ? 'Bạn không có quyền truy cập trang này' : 'Đăng nhập để mở trang quản trị'}
        </h1>
        <Link href={authenticated ? '/' : '/login'} className="mt-6 inline-block text-[#A7ACD9] underline">
          {authenticated ? 'Về trang chủ' : 'Đăng nhập'}
        </Link>
      </div>
    );
  }

  const handleRoleChange = (role: 'client' | 'creator' | 'admin') => {
    if (role === 'creator') router.push('/creator/commissions');
    else if (role === 'client') router.push('/client/commissions');
    else router.push('/admin');
  };

  return (
    <div className={`min-h-screen bg-[#1F2335] text-[#e4e1e5] flex flex-col font-sora ${className}`}>
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
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 bg-[#1F2335] border-r border-white/10 shadow-2xl flex flex-col">
            <VerticalNavbar
              items={sidebarItems}
              sections={sidebarSections}
              adminName={adminName}
              adminRole={adminRole}
              showScreenIds={showScreenIds}
              onItemClick={closeMobileNav}
              onLogout={closeMobileNav}
              isCollapsed={false}
              className="h-full border-r-0 shadow-2xl border border-white/15"
            />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex w-full relative">
        <div className="hidden md:flex">
          <VerticalNavbar
            items={sidebarItems}
            sections={sidebarSections}
            adminName={adminName}
            adminRole={adminRole}
            showScreenIds={showScreenIds}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <main className={`flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export const AdminConsoleLayout = AdminLayout;
