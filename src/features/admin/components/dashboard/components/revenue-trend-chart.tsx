'use client';

import React, { useMemo } from 'react';
import { AdminDailyRevenueDto } from '@/features/admin/types/admin.types';

interface RevenueTrendChartProps {
  revenueTrend?: AdminDailyRevenueDto[];
}

export function RevenueTrendChart({ revenueTrend }: RevenueTrendChartProps) {
  // Process Platform Revenue Trend: 100% REAL DATA aggregated from backend daily revenue
  const monthlyRevenueTrend = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    if (revenueTrend && revenueTrend.length > 0) {
      for (const item of revenueTrend) {
        const monthKey = item.date.slice(0, 7); // "yyyy-MM"
        const rev = item.platformRevenue ?? 0;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + rev);
      }
    }

    // Determine the 4 consecutive months ending at latest backend month or current month
    let latestYear: number;
    let latestMonth: number; // 1-12

    const sortedBackendKeys = Array.from(monthlyMap.keys()).sort();
    if (sortedBackendKeys.length > 0) {
      const latestKey = sortedBackendKeys[sortedBackendKeys.length - 1];
      const [y, m] = latestKey.split('-');
      latestYear = parseInt(y, 10);
      latestMonth = parseInt(m, 10);
    } else {
      const now = new Date();
      latestYear = now.getFullYear();
      latestMonth = now.getMonth() + 1;
    }

    const displayKeys: string[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(latestYear, latestMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      displayKeys.push(`${y}-${m}`);
    }

    const revenues = displayKeys.map((k) => monthlyMap.get(k) ?? 0);
    const maxRevenue = Math.max(...revenues, 0);

    return displayKeys.map((key, idx, arr) => {
      const rev = monthlyMap.get(key) ?? 0;
      const dateObj = new Date(`${key}-01T00:00:00`);
      const monthLabel = isNaN(dateObj.getTime())
        ? key
        : dateObj.toLocaleString('en-US', { month: 'short' });
      const isLast = idx === arr.length - 1;
      const heightPx =
        maxRevenue > 0
          ? Math.max(8, Math.min(155, Math.round((rev / maxRevenue) * 155)))
          : 8; // flat 8px indicator if revenue is 0
      const formattedVal =
        rev >= 1000 ? `$${(rev / 1000).toFixed(1)}k` : `$${rev.toLocaleString()}`;

      return {
        month: monthLabel,
        value: formattedVal,
        heightPx,
        active: isLast,
      };
    });
  }, [revenueTrend]);

  return (
    <div className="glass-container bg-[#161926]/85 border border-white/10 rounded-[28px] p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="font-h1 font-bold text-white text-base">
            Platform Revenue Trend ($USD)
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">Monthly revenue trend (max 4 months)</p>
        </div>
        <span className="text-[10px] font-h1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
          Last 4 Months
        </span>
      </div>

      {/* Bar Chart Visualizer — Limited to at most 4 months with bars placed closer together */}
      <div className="h-52 flex items-end justify-center gap-5 sm:gap-7 pt-6 px-4">
        {monthlyRevenueTrend.map((bar, idx) => (
          <div 
            key={idx} 
            className="flex-1 max-w-[64px] flex flex-col items-center gap-2 group cursor-pointer"
          >
            {/* Number on top of the bar */}
            <span
              className={`text-xs font-h1 transition-colors ${
                bar.active
                  ? 'text-emerald-400 font-extrabold'
                  : 'text-[#8A8FA9] font-bold group-hover:text-white'
              }`}
            >
              {bar.value}
            </span>

            {/* The Bar */}
            <div
              style={{ height: `${bar.heightPx}px` }}
              className={`w-10 sm:w-11 max-w-[44px] rounded-t-lg transition-all duration-300 ${
                bar.active
                  ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-[#C5C9F8]/40 group-hover:bg-[#C5C9F8]'
              }`}
            />

            {/* Month label below the bar */}
            <span
              className={`text-xs font-h1 font-bold transition-colors ${
                bar.active ? 'text-white font-extrabold' : 'text-[#8A8FA9] group-hover:text-white'
              }`}
            >
              {bar.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}