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

const STATUS_TABS: { label: string; value: DisputeStatus }[] = [
  { label: 'All Cases', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Under Review', value: 'UnderReview' },
  { label: 'Resolved', value: 'Resolved' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white font-h1 tracking-tight">
                  Dispute Resolution & Escrow Arbitration
                </h1>
              </div>
              <p className="text-xs text-[#8A8FA9] mt-0.5">
                Investigate workroom chat transcripts, review party claims, and execute atomic escrow refund settlements.
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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh dispute queue"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            <span>Sync Live Queue</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Locked Escrow */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8FA9] font-bold">
              Total Locked Escrow
            </span>
            <div className="text-lg font-black font-h1 text-white">
              {formatCurrency(totalLockedEscrow)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Adjudication */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8FA9] font-bold">
              Pending Adjudication
            </span>
            <div className="text-lg font-black font-h1 text-amber-300">
              {pendingCount} cases
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Under Review */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8FA9] font-bold">
              Under Review
            </span>
            <div className="text-lg font-black font-h1 text-sky-400">
              {underReviewCount} cases
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8FA9] font-bold">
              Resolved & Settled
            </span>
            <div className="text-lg font-black font-h1 text-emerald-400">
              {resolvedCount} cases
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar: Status Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'text-[#8A8FA9] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8A8FA9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dispute ID, client, creator..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#8A8FA9]/60 focus:outline-none focus:border-red-400/80 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default DisputeHeader;
