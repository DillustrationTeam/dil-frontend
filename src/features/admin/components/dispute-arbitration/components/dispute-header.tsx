'use client';

import React, { useState } from 'react';
import {
  Gavel,
  RotateCw,
  Search,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DisputeStatus } from '@/features/admin/types/dispute-arbitration.types';
import { useLanguage } from '@/context/language-context';

export interface DisputeHeaderProps {
  pendingCount: number;
  underReviewCount: number;
  resolvedCount: number;
  totalLockedEscrow: number;
  activeStatus: DisputeStatus;
  searchQuery: string;
  isLoading: boolean;
  onStatusChange: (status: DisputeStatus) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
}

const STATUS_TABS: { labelVi: string; labelEn: string; value: DisputeStatus }[] = [
  { labelVi: 'Tất cả hồ sơ', labelEn: 'All Cases', value: 'All' },
  { labelVi: 'Chờ phân xử', labelEn: 'Pending', value: 'Pending' },
  { labelVi: 'Đang xem xét', labelEn: 'Under Review', value: 'UnderReview' },
  { labelVi: 'Đã giải quyết', labelEn: 'Resolved', value: 'Resolved' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DisputeHeader({
  pendingCount,
  underReviewCount,
  resolvedCount,
  totalLockedEscrow,
  activeStatus,
  searchQuery,
  isLoading,
  onStatusChange,
  onSearchChange,
  onRefresh,
}: DisputeHeaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchChange(localSearch);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title & System Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A8321C]/20 border border-[#A8321C]/40 flex items-center justify-center text-[#A8321C] shadow-lg shadow-[#A8321C]">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-[#241F1A] font-h1 tracking-tight">
                  {isVie ? 'Phân xử Tranh chấp & Ký quỹ' : 'Dispute Resolution & Escrow Arbitration'}
                </h1>
              </div>
              <p className="text-xs text-[#6E6459] mt-0.5">
                {isVie
                  ? 'Thẩm tra lịch sử trao đổi phòng làm việc, đánh giá yêu cầu hai bên và thực thi quyết toán hoàn tiền ký quỹ.'
                  : 'Investigate workroom chat transcripts, review party claims, and execute atomic escrow refund settlements.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A]/90 border border-[#221E1A]/10 transition-all cursor-pointer disabled:opacity-50"
            title={isVie ? 'Làm mới hàng đợi' : 'Refresh dispute queue'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A8321C]' : ''}`} />
            <span>{isVie ? 'Đồng bộ hàng đợi' : 'Sync Live Queue'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Locked Escrow */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6E6459] font-bold">
              {isVie ? 'Tổng tiền đang ký quỹ' : 'Total Locked Escrow'}
            </span>
            <div className="text-lg font-black font-h1 text-[#241F1A]">
              {formatCurrency(totalLockedEscrow)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#A8321C]/15 border border-[#A8321C]/40 flex items-center justify-center text-[#A8321C]">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Adjudication */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6E6459] font-bold">
              {isVie ? 'Chờ phân xử' : 'Pending Adjudication'}
            </span>
            <div className="text-lg font-black font-h1 text-[#8A6A1F]">
              {pendingCount} {isVie ? 'hồ sơ' : 'cases'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#8A6A1F]/15 border border-[#8A6A1F]/40 flex items-center justify-center text-[#8A6A1F]">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Under Review */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6E6459] font-bold">
              {isVie ? 'Đang xem xét' : 'Under Review'}
            </span>
            <div className="text-lg font-black font-h1 text-[#2C6A86]">
              {underReviewCount} {isVie ? 'hồ sơ' : 'cases'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2C6A86]/15 border border-[#2C6A86]/40 flex items-center justify-center text-[#2C6A86]">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6E6459] font-bold">
              {isVie ? 'Đã giải quyết & Quyết toán' : 'Resolved & Settled'}
            </span>
            <div className="text-lg font-black font-h1 text-[#2F6B63]">
              {resolvedCount} {isVie ? 'hồ sơ' : 'cases'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2F6B63]/15 border border-[#2F6B63]/40 flex items-center justify-center text-[#2F6B63]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar: Status Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-md shadow-[#A8321C]'
                    : 'text-[#6E6459] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
                }`}
              >
                {isVie ? tab.labelVi : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6E6459] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isVie ? 'Tìm mã tranh chấp, khách hàng, họa sĩ...' : 'Search dispute ID, client, creator...'}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-[#F0E7D8] border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] placeholder-[#6E6459]/60 focus:outline-none focus:border-[#A8321C]/40 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default DisputeHeader;
