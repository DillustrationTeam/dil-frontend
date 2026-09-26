'use client';

import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, Layers } from 'lucide-react';

interface EscrowSimulationCardProps {
  feePercent: number;
}

export function EscrowSimulationCard({ feePercent }: EscrowSimulationCardProps) {
  // Live simulation: Example milestone disbursement of 2,000,000 VND
  const simulation = useMemo(() => {
    const totalAmount = 2000000;
    const feeRate = feePercent / 100;
    const platformFee = Math.round(totalAmount * feeRate);
    const creatorEarnings = totalAmount - platformFee;
    return {
      totalAmount,
      feeRate,
      platformFee,
      creatorEarnings,
    };
  }, [feePercent]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10 bg-white/[0.02] p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Real-time Milestone Escrow Simulation (Sample: {formatVND(simulation.totalAmount)})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300/70 block uppercase font-bold">
              Creator Net Payout ({(100 - feePercent).toFixed(1)}%)
            </span>
            <span className="font-mono font-bold text-emerald-300 text-sm">
              {formatVND(simulation.creatorEarnings)}
            </span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-300/70 block uppercase font-bold">
              Platform Retained Fee ({feePercent.toFixed(1)}%)
            </span>
            <span className="font-mono font-bold text-red-300 text-sm">
              {formatVND(simulation.platformFee)}
            </span>
          </div>
          <Layers className="w-4 h-4 text-red-400" />
        </div>
      </div>
    </div>
  );
}
