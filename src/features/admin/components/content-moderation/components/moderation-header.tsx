'use client';

import React, { useState } from 'react';
import {
  Search,
  RotateCw,
  Shield,
  AlertTriangle,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { ModerationStatus } from '@/features/admin/types/moderation.types';
import { useLanguage } from '@/context/language-context';

interface ModerationHeaderProps {
  pendingCount: number;
  activeStatus: ModerationStatus;
  searchQuery: string;
  isLoading: boolean;
  onStatusChange: (status: ModerationStatus) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
}

export function ModerationHeader({
  pendingCount,
  activeStatus,
  searchQuery,
  isLoading,
  onStatusChange,
  onSearchChange,
  onRefresh,
}: ModerationHeaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const STATUS_OPTIONS: { label: string; value: ModerationStatus }[] = [
    { label: isVie ? 'Chờ xem xét' : 'Pending Review', value: 'Pending' },
    { label: isVie ? 'Tác phẩm bị cảnh báo' : 'Flagged Artworks', value: 'Flagged' },
    { label: isVie ? 'Đã phê duyệt' : 'Approved', value: 'Approved' },
    { label: isVie ? 'Đã từ chối' : 'Rejected', value: 'Rejected' },
    { label: isVie ? 'Đã ẩn' : 'Hidden', value: 'Hidden' },
    { label: isVie ? 'Tất cả tác phẩm' : 'All Items', value: 'All' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A8321C]/20 text-[#A8321C] flex items-center justify-center border border-[#A8321C]/40 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="font-h1 text-2xl font-extrabold text-[#241F1A]">
              {isVie ? 'Hàng đợi kiểm duyệt nội dung & AI' : 'Content & AI Moderation Queue'}
            </h1>
          </div>
          <p className="text-xs text-[#6E6459] mt-1 font-body">
            {isVie
              ? 'Đánh giá kết quả quét AI Cloud NSFW, phân loại tag và các tác phẩm bị người dùng báo cáo.'
              : 'Evaluate AI Cloud NSFW scan results, tag classifications, and user-flagged artworks.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending count badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8A6A1F]/20 text-[#8A6A1F] text-xs font-bold rounded-full border border-[#8A6A1F]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {isVie ? `${pendingCount} Tác phẩm chờ xem xét` : `${pendingCount} Items Pending Review`}
            </span>
          </span>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[#241F1A] text-xs font-bold transition-all border border-[#221E1A]/10 disabled:opacity-50 cursor-pointer"
            title={isVie ? 'Làm mới hàng đợi' : 'Refresh queue'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A8321C]' : ''}`} />
            <span className="hidden sm:inline">{isVie ? 'Làm mới' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Searchbar on the Left, followed by Dropdown for filtering based on status */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* 1. Search Bar on the Left */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isVie ? 'Tìm theo tiêu đề, tác giả hoặc ID...' : 'Search by title, creator, or ID...'}
              className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 text-[#241F1A] text-xs placeholder:text-[#6E6459] focus:outline-none focus:border-[#A8321C]/30 transition-colors font-body shadow-inner"
            />
            <Search className="w-4 h-4 text-[#6E6459] absolute left-3 top-3" />
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[10px] text-[#241F1A] font-bold transition-colors cursor-pointer"
            >
              {isVie ? 'Tìm' : 'Find'}
            </button>
          </form>

          {/* 2. Dropdown for filtering based on status */}
          <div className="relative min-w-[210px]">
            <div className="absolute left-3.5 top-3 pointer-events-none text-[#6E6459] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#A8321C]" />
            </div>
            <select
              value={activeStatus}
              onChange={(e) => onStatusChange(e.target.value as ModerationStatus)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#E5D8C2] border border-[#221E1A]/10 text-[#241F1A] text-xs font-bold appearance-none focus:outline-none focus:border-[#A8321C]/30 transition-colors cursor-pointer shadow-inner"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#FFFCF6] text-[#241F1A] py-1.5">
                  {isVie ? `Lọc: ${opt.label}` : `Filter: ${opt.label}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6E6459] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Current status pill indication */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#6E6459]">
          <span className="text-[11px]">{isVie ? 'Đang lọc theo:' : 'Filtered by:'}</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#A8321C]/20 text-[#A8321C] font-bold border border-[#A8321C]/40 text-[11px]">
            {activeStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
