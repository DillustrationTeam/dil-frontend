'use client';

import React from 'react';

interface CommissionBreakdownCardProps {
  totalCommissions: number;
  completedCommissions: number;
  inProgressCommissions: number;
  disputedCommissions: number;
}

export function CommissionBreakdownCard({
  totalCommissions,
  completedCommissions,
  inProgressCommissions,
  disputedCommissions,
}: CommissionBreakdownCardProps) {
  // Percentage calculations
  const completedPct =
    totalCommissions > 0
      ? Math.round((completedCommissions / totalCommissions) * 100)
      : 0;
  const inProgressPct =
    totalCommissions > 0
      ? Math.round((inProgressCommissions / totalCommissions) * 100)
      : 0;
  const disputedPct =
    totalCommissions > 0
      ? Math.round((disputedCommissions / totalCommissions) * 100)
      : 0;

  return (
    <div className="glass-container bg-[#161926]/85 border border-white/10 rounded-[28px] p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="font-h1 font-bold text-white text-base">
            Commission Orders Breakdown
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">Lifecycle stage distribution</p>
        </div>
        <span className="text-[10px] font-h1 font-bold px-2.5 py-0.5 rounded bg-white/10 text-white/90">
          <span className="font-h1 font-extrabold text-white">{totalCommissions}</span> Total Requests
        </span>
      </div>

      <div className="space-y-4 pt-2">
        {/* Completed & Settled */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-white">
              Completed & Settled (<span className="font-h1 font-bold">{completedCommissions}</span>)
            </span>
            <span className="text-emerald-400 font-h1 font-extrabold text-sm">{completedPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              style={{ width: `${completedPct}%` }}
              className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)]"
            ></div>
          </div>
        </div>

        {/* In Production Escrow */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-white">
              In Production Escrow (<span className="font-h1 font-bold">{inProgressCommissions}</span>)
            </span>
            <span className="text-amber-300 font-h1 font-extrabold text-sm">{inProgressPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              style={{ width: `${inProgressPct}%` }}
              className="bg-amber-400 h-full rounded-full shadow-[0_0_8px_rgba(251,191,36,0.3)]"
            ></div>
          </div>
        </div>

        {/* In Dispute Arbitration */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-white">
              Dispute Arbitration (<span className="font-h1 font-bold">{disputedCommissions}</span>)
            </span>
            <span className="text-red-400 font-h1 font-extrabold text-sm">{disputedPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              style={{ width: `${disputedPct}%` }}
              className="bg-red-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)]"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
