'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Palette,
  Briefcase,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { NotificationBell } from '@/features/notification';

interface TopNavbarProps {
  currentRole?: 'client' | 'creator';
  onRoleChange?: (role: 'client' | 'creator') => void;
  onToggleSidebar?: () => void;
}

export default function TopNavbar({
  currentRole = 'client',
  onRoleChange,
}: TopNavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, roles, clearAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();

  const isCreator = roles.includes('Creator') || roles.includes('creator');
  const isAdmin = roles.some((r) => ['Administrator', 'Admin', 'Moderator'].includes(r));

  const handleSignOut = () => {
    clearAuth();
    setShowProfileMenu(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#1F2335]/80 backdrop-blur-[20px] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Brand Logo & Search */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center group">
          <Image
            src="/studiologo.png"
            alt="Dillustration Studio Logo"
            width={180}
            height={48}
            priority
            style={{ width: 'auto' }}
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
            placeholder="Search commissions, creators, artworks..."
            className="w-full h-9 pl-9 pr-4 bg-[#1b1b1e] border border-white/10 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A7ACD9] focus:border-[#A7ACD9] transition-all"
          />
        </div>
      </div>

      {/* Right: Role Switcher, Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-3.5">
        {/* Role Switcher Pill */}
        {isCreator && (
          <div className="hidden sm:flex bg-[#161926] p-1 rounded-xl border border-white/10 items-center gap-1">
            <button
              onClick={() => onRoleChange && onRoleChange('client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'client'
                  ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Briefcase className="h-3.5 w-3.5 text-[#A7ACD9]" />
              Client Mode
            </button>
            <button
              onClick={() => onRoleChange && onRoleChange('creator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'creator'
                  ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Palette className="h-3.5 w-3.5 text-[#A7ACD9]" />
              Creator Studio
            </button>
          </div>
        )}

        {/* Notifications */}
        <NotificationBell
          userId={user?.id ?? null}
          triggerClassName="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7ACD9] hover:text-white hover:bg-[#c2c7f6]/10 transition-colors"
        />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl hover:border-[#A7ACD9] transition-colors"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A7ACD9] text-xs font-bold text-[#1F2335]">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <ChevronDown className="mr-1 h-3.5 w-3.5 text-[#A7ACD9]" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-[#1F2335] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl">
              <div className="p-3 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-white">{user?.fullName || 'Guest'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'No email'}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3 text-[#A7ACD9]" /> Escrow Verified
                </span>
              </div>
              <Link
                href="/wallet"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Wallet className="w-4 h-4 text-[#A7ACD9]" /> Ví của tôi
              </Link>
              <Link
                href={isAdmin ? '/admin' : '/client/commissions'}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-[#A7ACD9]" /> {isAdmin ? 'Admin Center' : t('My Commissions')}
              </Link>
              {isCreator && (
                <Link
                  href="/creator/commissions"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Palette className="w-4 h-4 text-[#A7ACD9]" /> Creator Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/creator-verifications"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" /> Duyệt đơn Creator
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#A7ACD9]" /> Hồ sơ của tôi
              </Link>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#A7ACD9]" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
