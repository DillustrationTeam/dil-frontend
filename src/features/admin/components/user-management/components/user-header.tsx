'use client';

import React, { useState } from 'react';
import { Search, RotateCw, Users, ShieldAlert } from 'lucide-react';
import { UserAccountStatus } from '@/features/admin/types/user-management.types';

export interface UserHeaderProps {
  activeCount: number;
  lockedCount: number;
  totalCount: number;
  activeStatus: UserAccountStatus;
  activeRole: string;
  searchQuery: string;
  isLoading: boolean;
  onStatusChange: (status: UserAccountStatus) => void;
  onRoleChange: (role: string) => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

export function UserHeader({
  activeCount,
  lockedCount,
  totalCount,
  activeStatus,
  activeRole,
  searchQuery,
  isLoading,
  onStatusChange,
  onRoleChange,
  onSearchChange,
  onRefresh,
}: UserHeaderProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchChange(localSearch);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Stats Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white font-h1 tracking-tight">
              User Account Management & Sanctions
            </h1>
          </div>
          <p className="text-xs text-[#8A8FA9] mt-1">
            Search registered user accounts, edit permissions, and apply temporary suspensions or permanent bans.
          </p>
        </div>

        {/* Stats KPI Pills */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-h1 font-bold">{activeCount}</span>
            <span className="text-emerald-400/80 font-normal">Active</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="font-h1 font-bold">{lockedCount}</span>
            <span className="text-red-400/80 font-normal">Locked / Suspended</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#C5C9F8] text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-[#8A8FA9]" />
            <span className="font-h1 font-bold">{totalCount}</span>
            <span className="text-[#8A8FA9] font-normal">Total</span>
          </div>
        </div>
      </div>

      {/* 2. Searchbar on the Left, Followed by Dropdown Filters */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center gap-3">
        {/* Search input on the left (NO Clear button) */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8FA9]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => {
              if (localSearch !== searchQuery) {
                onSearchChange(localSearch);
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-black/40 rounded-xl border border-white/10 text-white placeholder-[#8A8FA9]/60 text-xs focus:outline-none focus:border-red-400/80 focus:ring-1 focus:ring-red-400/40 transition-colors"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-red-400/80 cursor-pointer w-full md:w-auto"
          >
            <option value="All" className="bg-[#161926] text-white">All Roles</option>
            <option value="Client" className="bg-[#161926] text-white">Client Only</option>
            <option value="Creator" className="bg-[#161926] text-white">Creator Only</option>
            <option value="Dual-Role" className="bg-[#161926] text-white">Dual-Role</option>
            <option value="Moderator" className="bg-[#161926] text-white">Moderator</option>
            <option value="Administrator" className="bg-[#161926] text-white">Administrator</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={activeStatus}
            onChange={(e) => onStatusChange(e.target.value as UserAccountStatus)}
            className="px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-red-400/80 cursor-pointer w-full md:w-auto"
          >
            <option value="All" className="bg-[#161926] text-white">All Statuses</option>
            <option value="Active" className="bg-[#161926] text-white">Active Accounts</option>
            <option value="LockedOut" className="bg-[#161926] text-white">Suspended / Locked</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8A8FA9] hover:text-white transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50"
            title="Refresh Users"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserHeader;
