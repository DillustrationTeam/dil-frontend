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

interface ModerationHeaderProps {
  pendingCount: number;
  activeStatus: ModerationStatus;
  searchQuery: string;
  isLoading: boolean;
  onStatusChange: (status: ModerationStatus) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: { label: string; value: ModerationStatus }[] = [
  { label: 'Pending Review', value: 'Pending' },
  { label: 'Flagged Artworks', value: 'Flagged' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Hidden', value: 'Hidden' },
  { label: 'All Items', value: 'All' },
];

export function ModerationHeader({
  pendingCount,
  activeStatus,
  searchQuery,
  isLoading,
  onStatusChange,
  onSearchChange,
  onRefresh,
}: ModerationHeaderProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

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
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="font-h1 text-2xl font-extrabold text-white">
              Content & AI Moderation Queue (SCR-20)
            </h1>
          </div>
          <p className="text-xs text-[#8A8FA9] mt-1 font-body">
            Evaluate AI Cloud NSFW scan results, tag classifications, and user-flagged artworks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending count badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{pendingCount} Items Pending Review</span>
          </span>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            title="Refresh queue"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
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
              placeholder="Search by title, creator, or ID..."
              className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-[#8A8FA9] focus:outline-none focus:border-red-400 transition-colors font-body shadow-inner"
            />
            <Search className="w-4 h-4 text-[#8A8FA9] absolute left-3 top-3" />
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white font-bold transition-colors cursor-pointer"
            >
              Find
            </button>
          </form>

          {/* 2. Dropdown for filtering based on status */}
          <div className="relative min-w-[210px]">
            <div className="absolute left-3.5 top-3 pointer-events-none text-[#8A8FA9] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-red-400" />
            </div>
            <select
              value={activeStatus}
              onChange={(e) => onStatusChange(e.target.value as ModerationStatus)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-bold appearance-none focus:outline-none focus:border-red-400 transition-colors cursor-pointer shadow-inner"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#161926] text-white py-1.5">
                  Filter: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#8A8FA9] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Current status pill indication */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#8A8FA9]">
          <span className="text-[11px]">Filtered by:</span>
          <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold border border-red-500/30 text-[11px]">
            {activeStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
