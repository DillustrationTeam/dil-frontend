'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { AdminDailyRevenueDto } from '@/features/admin/types/admin.types';

interface RevenueTrendChartProps {
  revenueTrend?: AdminDailyRevenueDto[];
}

export function RevenueTrendChart({ revenueTrend }: RevenueTrendChartProps) {
  // Navigation offset: 0 = latest window, 1 = shifted 1 month back, 2 = shifted 2 months back, etc.
  const [offsetMonths, setOffsetMonths] = useState(0);

  // Process Platform Revenue Trend: REAL DATA aggregated from backend daily revenue
  const { monthlyBars, periodLabel, totalPeriodRevenue } = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    if (revenueTrend && revenueTrend.length > 0) {
      for (const item of revenueTrend) {
        const monthKey = item.date.slice(0, 7); // "yyyy-MM"
        const rev = item.platformRevenue ?? 0;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + rev);
      }
    }

    // Determine the anchor latest month
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

    // Apply offset (shift backwards in time by offsetMonths)
    const targetEndDate = new Date(latestYear, latestMonth - 1 - offsetMonths, 1);
    const endY = targetEndDate.getFullYear();
    const endM = targetEndDate.getMonth() + 1;

    // Generate 4 consecutive months ending at targetEndDate
    const displayKeys: string[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(endY, endM - 1 - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      displayKeys.push(`${y}-${m}`);
    }

    const revenues = displayKeys.map((k) => monthlyMap.get(k) ?? 0);
    const maxRevenue = Math.max(...revenues, 0);
    const periodSum = revenues.reduce((acc, v) => acc + v, 0);

    const firstDate = new Date(`${displayKeys[0]}-01T00:00:00`);
    const lastDate = new Date(`${displayKeys[3]}-01T00:00:00`);
    const formatMonthYear = (d: Date) =>
      isNaN(d.getTime())
        ? ''
        : `T${d.getMonth() + 1}/${d.getFullYear()}`;

    const label = `${formatMonthYear(firstDate)} - ${formatMonthYear(lastDate)}`;

    const bars = displayKeys.map((key, idx, arr) => {
      const rev = monthlyMap.get(key) ?? 0;
      const dateObj = new Date(`${key}-01T00:00:00`);
      const monthLabel = isNaN(dateObj.getTime())
        ? key
        : `Tháng ${dateObj.getMonth() + 1}`;
      const yearLabel = isNaN(dateObj.getTime()) ? '' : `'${String(dateObj.getFullYear()).slice(2)}`;
      const isLast = idx === arr.length - 1;
      const heightPx =
        maxRevenue > 0
          ? Math.max(10, Math.min(150, Math.round((rev / maxRevenue) * 150)))
          : 10; // flat 10px indicator if revenue is 0
      const formattedVal =
        rev >= 1_000_000
          ? `${(rev / 1_000_000).toFixed(1)}M ₫`
          : rev >= 1_000
          ? `${(rev / 1_000).toFixed(0)}k ₫`
          : `${rev.toLocaleString('vi-VN')} ₫`;

      return {
        month: monthLabel,
        year: yearLabel,
        value: formattedVal,
        rawRev: rev,
        heightPx,
        active: isLast,
      };
    });

    return {
      monthlyBars: bars,
      periodLabel: label,
      totalPeriodRevenue: periodSum,
    };
  }, [revenueTrend, offsetMonths]);

  const handlePrevPeriod = () => {
    setOffsetMonths((prev) => prev + 1);
  };

  const handleNextPeriod = () => {
    setOffsetMonths((prev) => Math.max(0, prev - 1));
  };

  const handleResetLatest = () => {
    setOffsetMonths(0);
  };

  return (
    <div className="glass-container bg-[#161926]/85 border border-white/10 rounded-[28px] p-6 space-y-5 shadow-xl">
      {/* Header with Title and Period Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-h1 font-bold text-white text-base">
              Xu hướng doanh thu sàn
            </h3>
          </div>
          <p className="text-[11px] text-[#8A8FA9] mt-0.5">
            Tổng thu giai đoạn:{' '}
            <strong className="text-emerald-400 font-h1 font-bold">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPeriodRevenue)}
            </strong>
          </p>
        </div>

        {/* Period Selector / Navigator */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {offsetMonths > 0 && (
            <button
              type="button"
              onClick={handleResetLatest}
              title="Về giai đoạn gần nhất"
              className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#C7C5CF] hover:text-white transition cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Lùi 1 tháng"
              className="p-1 rounded-lg hover:bg-white/10 text-[#C7C5CF] hover:text-white transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-h1 font-bold text-white select-none whitespace-nowrap min-w-[110px] text-center flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-[#A7ACD9]" />
              {periodLabel}
            </span>

            <button
              type="button"
              onClick={handleNextPeriod}
              disabled={offsetMonths <= 0}
              title="Tiến 1 tháng"
              className="p-1 rounded-lg hover:bg-white/10 text-[#C7C5CF] hover:text-white transition cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualizer — Always 4 months span */}
      <div className="h-52 flex items-end justify-center gap-5 sm:gap-7 pt-4 px-2">
        {monthlyBars.map((bar, idx) => (
          <div
            key={idx}
            className="flex-1 max-w-[68px] flex flex-col items-center gap-2 group cursor-pointer"
          >
            {/* Number on top of the bar */}
            <span
              className={`text-[11px] font-h1 transition-colors ${
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
              className={`w-10 sm:w-11 max-w-[46px] rounded-t-xl transition-all duration-300 ${
                bar.active
                  ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-[#C5C9F8]/35 group-hover:bg-[#C5C9F8]'
              }`}
            />

            {/* Month & Year label below the bar */}
            <div className="text-center">
              <p
                className={`text-xs font-h1 font-bold transition-colors leading-tight ${
                  bar.active ? 'text-white font-extrabold' : 'text-[#8A8FA9] group-hover:text-white'
                }`}
              >
                {bar.month}
              </p>
              <span className="text-[10px] text-[#696D85] font-mono">
                {bar.year}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}