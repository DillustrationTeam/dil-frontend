'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Bell,
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
  const { user, roles, clearAuth } = useAuthStore();
  const { t } = useLanguage();
  const router = useRouter();

  const isCreator = roles.includes('Creator') || roles.includes('creator');

  const handleSignOut = () => {
    clearAuth();
    setShowProfileMenu(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#1F2335]/80 backdrop-blur-[20px] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center group">
          <Image
            src="/studiologo.png"
            alt="Dillustration Studio Logo"
            width={180}
            height={48}
            priority
            className="h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
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
              {t('Client Mode')}
            </button>
            <button
              onClick={() => onRoleChange && onRoleChange('creator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'creator'
                  ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-md shadow-[#A7ACD9]/10'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Palette className="h-3.5 w-3.5 text-[#A7ACD9]" />
              {t('Creator Studio')}
            </button>
          </div>
        )}

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#c2c7f6]/10 transition-colors">
          <Bell className="h-4 w-4 text-[#A7ACD9]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A7ACD9] ring-2 ring-[#1F2335] animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A7ACD9] ring-2 ring-[#1F2335]" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl hover:border-[#A7ACD9] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#A7ACD9] to-[#c2c7f6] p-[1px]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover rounded-[7px]"
              />
            </div>
            <ChevronDown className="mr-1 h-3.5 w-3.5 text-[#A7ACD9]" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-[#1F2335] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl">
              <div className="p-3 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-white">{user?.fullName || 'Guest'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'No email'}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3 text-[#A7ACD9]" /> {t('Escrow Verified')}
                </span>
              </div>
              <Link
                href="/wallet"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Wallet className="w-4 h-4 text-[#A7ACD9]" /> {t('Ví của tôi')}
              </Link>
              <Link
                href="/client/commissions"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-[#A7ACD9]" /> {t('My Commissions')}
              </Link>
              {isCreator && (
                <Link
                  href="/creator/commissions"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Palette className="w-4 h-4 text-[#A7ACD9]" /> {t('Creator Dashboard')}
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#A7ACD9]" /> {t('Account Settings')}
              </Link>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#A7ACD9]" /> {t('Sign Out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
