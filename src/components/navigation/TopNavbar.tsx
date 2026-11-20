'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Palette,
  Briefcase,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { NotificationBell } from '@/features/notification';
import { AccountMenu } from '@/components/navigation/account-menu';

interface TopNavbarProps<T extends string = string> {
  currentRole?: 'client' | 'creator' | 'admin';
  onRoleChange?: (role: T) => void;
  onToggleSidebar?: () => void;
  showRoleSwitcher?: boolean;
  adminBadgeText?: string;
  className?: string;
}

export default function TopNavbar<T extends string = string>({
  currentRole = 'client',
  onRoleChange,
  onToggleSidebar,
  showRoleSwitcher = true,
  adminBadgeText,
  className = '',
}: TopNavbarProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, roles } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();

  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isAdmin = roles.some((r) => r.toLowerCase() === 'admin') || currentRole === 'admin';

  return (
    <header className={`sticky top-0 z-40 w-full h-16 bg-[#1F2335]/80 backdrop-blur-[20px] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between transition-all ${className}`}>
      {/* Left: Brand Logo & Optional Mobile Sidebar Toggle */}
      <div className="flex items-center gap-4 lg:gap-6">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-[#919099] hover:text-white hover:bg-white/5 border border-white/10 transition-colors focus:outline-none cursor-pointer"
            aria-label={t('Toggle navigation menu')}
          >
            <Menu className="w-5 h-5 shrink-0" />
          </button>
        )}
        <Link href="/" className="flex items-center group">
          <Image
            src="/studiologo.png"
            alt="Dillustration Studio Logo"
            width={180}
            height={48}
            priority
            style={{ width: 'auto', height: 'auto' }}
            className="h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Quick Search Input */}
        <div className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#A7ACD9]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`); }}
            aria-label={t('Tìm tác phẩm hoặc tác giả')}
            placeholder={t('Search artworks, creators...')}
            className="w-full h-9 pl-9 pr-4 bg-[#1b1b1e] border border-white/10 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A7ACD9] focus:border-[#A7ACD9] transition-all"
          />
        </div>
      </div>

      {/* Right: Role Switcher, Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-3.5">
        {/* Role Switcher Pill */}
        {showRoleSwitcher && (isCreator || isAdmin) && (
          <div className="hidden sm:flex bg-[#161926] p-1 rounded-xl border border-white/10 items-center gap-1">
            <button
              onClick={() => onRoleChange ? onRoleChange('client' as T) : router.push('/client/commissions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'client'
                  ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Briefcase className="h-3.5 w-3.5 text-[#A7ACD9]" />
              {t('Client Mode')}
            </button>
            {isCreator && (
              <button
                onClick={() => onRoleChange ? onRoleChange('creator' as T) : router.push('/creator/commissions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'creator'
                    ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                    : 'text-[#919099] hover:text-white'
                  }`}
              >
                <Palette className="h-3.5 w-3.5 text-[#A7ACD9]" />
                {t('Creator Studio')}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onRoleChange ? onRoleChange('admin' as T) : router.push('/admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'admin'
                    ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                    : 'text-[#919099] hover:text-white'
                  }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#A7ACD9]" />
                {t('Admin Console')}
              </button>
            )}
          </div>
        )}

        {/* Administrator Console Badge */}
        {adminBadgeText && (
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase tracking-wider">
            {adminBadgeText}
          </span>
        )}

        {/* Notifications */}
        <NotificationBell
          userId={user?.id ?? null}
          triggerClassName="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7ACD9] hover:text-white hover:bg-[#c2c7f6]/10 transition-colors"
        />

        <AccountMenu variant="app" />
      </div>
    </header>
  );
}
