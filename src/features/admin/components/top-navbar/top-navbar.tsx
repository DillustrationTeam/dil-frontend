'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export interface AdminTopNavbarProps {
  adminBadgeText?: string;

  isMobileMenuOpen?: boolean;

  onToggleMobileMenu?: () => void;

  showMarketplaceLink?: boolean;

  className?: string;
}

export function AdminTopNavbar({
  adminBadgeText = 'ADMINISTRATOR CONSOLE (/admin)',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}: AdminTopNavbarProps) {
  return (
    <header
      className={`w-full border-b border-white/10 bg-[#0f1017]/90 backdrop-blur-md px-4 sm:px-6 lg:pl-6 lg:pr-8 py-3.5 sticky top-0 z-40 transition-colors ${className}`}
    >
      <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-4">
        {/* Left Side: Mobile Menu Button (visible on mobile/tablet) + New Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-[#8A8FA9] hover:text-white hover:bg-white/5 border border-white/10 transition-colors focus:outline-none cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 shrink-0" />
              ) : (
                <Menu className="w-5 h-5 shrink-0" />
              )}
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group outline-none">
            <Image
              src="/studiologo.png"
              alt="dillustration"
              width={140}
              height={44}
              priority
              style={{ width: 'auto' }}
              className="h-9 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Right Side: Administrator Console Badge (matching SCR-24) */}
        <div className="flex items-center">
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase tracking-wider">
            {adminBadgeText}
          </span>
        </div>
      </div>
    </header>
  );
}

// Named alias
export const AdminHeader = AdminTopNavbar;
