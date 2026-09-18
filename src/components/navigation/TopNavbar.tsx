'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Bell,
  PlusCircle,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Palette,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';

interface TopNavbarProps {
  currentRole?: 'client' | 'creator';
  onRoleChange?: (role: 'client' | 'creator') => void;
  onOpenCreateModal?: () => void;
  onToggleSidebar?: () => void;
}

export default function TopNavbar({
  currentRole = 'client',
  onRoleChange,
  onOpenCreateModal,
}: TopNavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, roles, clearAuth } = useAuthStore();
  const router = useRouter();

  const isCreator = roles.includes('Creator') || roles.includes('creator');

  const handleSignOut = () => {
    clearAuth();
    setShowProfileMenu(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#1F2335]/80 backdrop-blur-[20px] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Brand Logo & Search */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A7ACD9] to-[#c2c7f6] p-[1px] shadow-[0_0_20px_rgba(167,172,217,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#1b1b1e] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#A7ACD9] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div>
            <span className="font-space-grotesk font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
              DIL <span className="text-[10px] uppercase font-normal px-2 py-0.5 rounded-full bg-[#A7ACD9]/20 text-[#A7ACD9] border border-[#A7ACD9]/30">STUDIO</span>
            </span>
          </div>
        </Link>

        {/* Quick Search Input */}
        <div className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
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
          <div className="bg-[#161926] p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => onRoleChange && onRoleChange('client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'client'
                  ? 'bg-[#A7ACD9] text-[#1F2335] shadow-md shadow-[#A7ACD9]/20'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Client Mode
            </button>
            <button
              onClick={() => onRoleChange && onRoleChange('creator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium flex items-center gap-1.5 transition-all ${currentRole === 'creator'
                  ? 'bg-[#c2c7f6] text-[#1F2335] shadow-md shadow-[#c2c7f6]/20'
                  : 'text-[#919099] hover:text-white'
                }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Creator Studio
            </button>
          </div>
        )}

        {/* Quick Create Commission Button */}
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-sora font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Commission
          </button>
        )}

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#c2c7f6]/10 transition-colors">
          <Bell className="w-4 h-4" />
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
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1F2335] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl">
              <div className="p-3 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-white">{user?.fullName || 'Guest'}</p>
                <p className="text-[11px] text-slate-400">{user?.email || 'No email'}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Escrow Verified
                </span>
              </div>
              <Link
                href="/client/commissions"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-[#A7ACD9]" /> My Commissions
              </Link>
              {isCreator && (
                <Link
                  href="/creator/commissions"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e4e1e5] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Palette className="w-4 h-4 text-[#c2c7f6]" /> Creator Dashboard
                </Link>
              )}
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Account Settings
              </Link>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
