'use client';

import React, { useState } from 'react';
import { Search, RotateCw, Users, ShieldAlert } from 'lucide-react';
import { UserAccountStatus } from '@/features/admin/types/user-management.types';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
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
            <h1 className="text-2xl font-black text-[#241F1A] font-h1 tracking-tight">
              {isVie ? 'Quản lý Tài khoản & Xử lý Vi phạm' : 'User Account Management & Sanctions'}
            </h1>
          </div>
          <p className="text-xs text-[#6E6459] mt-1">
            {isVie
              ? 'Tìm kiếm tài khoản người dùng, chỉnh sửa phân quyền và áp dụng tạm khóa hoặc cấm vĩnh viễn.'
              : 'Search registered user accounts, edit permissions, and apply temporary suspensions or permanent bans.'}
          </p>
        </div>

        {/* Stats KPI Pills */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/30 text-[#2F6B63] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#2F6B63]/10 animate-pulse"></span>
            <span className="font-h1 font-bold">{activeCount}</span>
            <span className="text-[#2F6B63] font-normal">{isVie ? 'Hoạt động' : 'Active'}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/30 text-[#A8321C] text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="font-h1 font-bold">{lockedCount}</span>
            <span className="text-[#A8321C] font-normal">{isVie ? 'Tạm khóa / Bị cấm' : 'Locked / Suspended'}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#8C3718] text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-[#6E6459]" />
            <span className="font-h1 font-bold">{totalCount}</span>
            <span className="text-[#6E6459] font-normal">{isVie ? 'Tổng' : 'Total'}</span>
          </div>
        </div>
      </div>

      {/* 2. Searchbar on the Left, Followed by Dropdown Filters */}
      <div className="bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-3 flex flex-col md:flex-row items-center gap-3">
        {/* Search input on the left (NO Clear button) */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E6459]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={isVie ? 'Tìm theo username hoặc email...' : 'Search by username or email...'}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => {
              if (localSearch !== searchQuery) {
                onSearchChange(localSearch);
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#F0E7D8] rounded-xl border border-[#221E1A]/10 text-[#241F1A] placeholder-[#6E6459]/60 text-xs focus:outline-none focus:border-[#A8321C]/40 focus:ring-1 focus:ring-[#A8321C]/40 transition-colors"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="px-3.5 py-2 bg-[#F0E7D8] border border-[#221E1A]/10 rounded-xl text-[#241F1A] font-semibold text-xs focus:outline-none focus:border-[#A8321C]/40 cursor-pointer w-full md:w-auto"
          >
            <option value="All" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Tất cả vai trò' : 'All Roles'}</option>
            <option value="Client" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Chỉ khách hàng' : 'Client Only'}</option>
            <option value="Creator" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Chỉ họa sĩ' : 'Creator Only'}</option>
            <option value="Dual-Role" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Cả hai vai trò' : 'Dual-Role'}</option>
            <option value="Moderator" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Moderator' : 'Moderator'}</option>
            <option value="Administrator" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Administrator' : 'Administrator'}</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={activeStatus}
            onChange={(e) => onStatusChange(e.target.value as UserAccountStatus)}
            className="px-3.5 py-2 bg-[#F0E7D8] border border-[#221E1A]/10 rounded-xl text-[#241F1A] font-semibold text-xs focus:outline-none focus:border-[#A8321C]/40 cursor-pointer w-full md:w-auto"
          >
            <option value="All" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Tất cả trạng thái' : 'All Statuses'}</option>
            <option value="Active" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Đang hoạt động' : 'Active Accounts'}</option>
            <option value="LockedOut" className="bg-[#FFFCF6] text-[#241F1A]">{isVie ? 'Tạm khóa / Bị cấm' : 'Suspended / Locked'}</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-[#6E6459] hover:text-[#241F1A] transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50"
            title={isVie ? 'Làm mới danh sách' : 'Refresh Users'}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A8321C]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserHeader;
