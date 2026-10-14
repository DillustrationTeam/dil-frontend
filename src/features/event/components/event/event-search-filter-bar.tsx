'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface EventSearchFilterBarProps {
  // Search state & handlers
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Status Filter state & options
  statusValue?: string;
  onStatusChange?: (val: string) => void;
  statusOptions?: FilterOption[];

  // Sort Filter state & options
  sortValue?: string;
  onSortChange?: (val: string) => void;
  sortOptions?: FilterOption[];

  // Variant & Layout
  variant?: 'horizontal' | 'stacked' | 'compact' | 'inline';
  className?: string;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All (Default)' },
  { value: 'Open', label: 'Open for Submission' },
  { value: 'Judging', label: 'Judging And Voting' },
  { value: 'Ended', label: 'Ended' },
];

export const DEFAULT_SORT_OPTIONS: FilterOption[] = [
  { value: 'latest', label: 'Latest (Default)' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'most_submissions', label: 'Most Submissions' },
  { value: 'most_votes', label: 'Most Votes' },
];

export function EventSearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  statusValue,
  onStatusChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  sortValue,
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  variant = 'horizontal',
  className = '',
  containerRef,
}: EventSearchFilterBarProps) {
  const isInline = variant === 'inline';
  const isStacked = variant === 'stacked' || variant === 'compact';

  if (isInline) {
    return (
      <div ref={containerRef} className={`flex items-center gap-2.5 mb-3 ${className}`}>
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#919099]" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || 'Search...'}
              className="w-full rounded-2xl border border-white/10 bg-[#161926] py-2 pl-10 pr-9 text-xs text-white placeholder-[#919099] transition focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#919099] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {onStatusChange !== undefined && (
          <div className="relative shrink-0 min-w-[130px] sm:min-w-[150px]">
            <select
              value={statusValue || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-[#161926] py-2 pl-3.5 pr-8 text-xs font-semibold text-white transition hover:border-white/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle cursor-pointer truncate"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1F2335] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#919099]">
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isStacked) {
    return (
      <div ref={containerRef} className={`space-y-2 mb-3 ${className}`}>
        {onSearchChange !== undefined && (
          <div className="relative w-full">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#919099]" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || 'Search title or entry code...'}
              className="w-full rounded-2xl border border-white/10 bg-[#161926] py-2 pl-10 pr-9 text-xs text-white placeholder-[#919099] transition focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#919099] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {onStatusChange !== undefined && (
          <div className="relative w-full">
            <select
              value={statusValue || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-[#161926] py-2 pl-4 pr-10 text-xs font-semibold text-white transition hover:border-white/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1F2335] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919099]">
              <ChevronDown size={15} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-y border-white/10 py-5 ${className}`}
    >
      {/* Left: Searchbar */}
      {onSearchChange !== undefined && (
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#919099]" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search contests'}
            className="w-full rounded-2xl border border-white/10 bg-[#161926] py-2.5 pl-11 pr-10 text-sm text-white placeholder-[#919099] transition focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#919099] hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Right: Status Dropdown + Sort Dropdown */}
      {(onStatusChange || onSortChange) && (
        <div className="flex flex-wrap items-center gap-3">
          {onStatusChange !== undefined && (
            <div className="relative min-w-[190px]">
              <select
                value={statusValue || ''}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-[#161926] py-2.5 pl-4 pr-10 text-xs font-semibold text-white transition hover:border-white/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1F2335] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919099]">
                <ChevronDown size={15} />
              </div>
            </div>
          )}

          {onSortChange !== undefined && (
            <div className="relative min-w-[170px]">
              <select
                value={sortValue || ''}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-[#161926] py-2.5 pl-4 pr-10 text-xs font-semibold text-white transition hover:border-white/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1F2335] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919099]">
                <ChevronDown size={15} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
