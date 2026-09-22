'use client';

import React, { useState } from 'react';
import { AdminTopNavbar } from '../top-navbar';
import { VerticalNavbar } from '../vertical-navbar';
import { AdminNavItem } from '../vertical-navbar/types';

export interface AdminLayoutProps {
  children: React.ReactNode;

  sidebarItems?: AdminNavItem[];

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
  adminBadgeText = 'ADMINISTRATOR CONSOLE (/admin)',
  adminName,
  adminRole = 'Platform Control',
  showScreenIds = false,
  className = '',
  contentClassName = '',
}: AdminLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#0d0e15] text-[#e4e1e5] relative selection:bg-red-500/30 selection:text-white ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 15%, #1d2133 0%, #0d0e15 100%)',
      }}
    >
      {/* 1. TOP NAVBAR */}
      <AdminTopNavbar
        adminBadgeText={adminBadgeText}
        isMobileMenuOpen={isMobileNavOpen}
        onToggleMobileMenu={toggleMobileNav}
      />

      {/* 2. MOBILE NAVIGATION DRAWER (Off-canvas for tablet / mobile viewports) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={closeMobileNav}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs sm:max-w-sm h-full p-4 overflow-y-auto z-10">
            <VerticalNavbar
              items={sidebarItems}
              adminName={adminName}
              adminRole={adminRole}
              showScreenIds={showScreenIds}
              onItemClick={closeMobileNav}
              onLogout={closeMobileNav}
              className="shadow-2xl h-full border border-white/15"
            />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER: LEFT VERTICAL NAVBAR + RIGHT CUSTOMIZABLE CONTENT */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:pl-6 lg:pr-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: VERTICAL NAVBAR (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <VerticalNavbar
            items={sidebarItems}
            adminName={adminName}
            adminRole={adminRole}
            showScreenIds={showScreenIds}
          />
        </div>

        {/* RIGHT COLUMN: DYNAMIC & CUSTOMIZABLE PAGE CONTENT */}
        <div className={`lg:col-span-9 space-y-6 min-w-0 w-full ${contentClassName}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
