'use client';

import React from 'react';

interface FeeRateSliderCardProps {
  feePercent: number;
  onChange: (value: number) => void;
}

export function FeeRateSliderCard({
  feePercent,
  onChange,
}: FeeRateSliderCardProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(Number(val.toFixed(1)));
  };

  return (
    <div className="space-y-4 bg-black/40 p-6 lg:p-7 rounded-2xl border border-white/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label htmlFor="platform-fee-slider" className="font-bold text-white text-sm font-h1">
              Global Platform Fee Rate Percentage
            </label>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80">
              5.0% - 15.0%
            </span>
          </div>
          <p className="text-[11px] text-[#8A8FA9] font-body">
            Applies to all newly created commission milestone escrow disbursements.
          </p>
        </div>

        {/* Rate Display Badge */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-xs text-[#8A8FA9] uppercase font-semibold tracking-wider">
            Current Rate:
          </span>
          <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-extrabold text-xl shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            {feePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Slider track */}
      <div className="space-y-2 pt-2">
        <input
          id="platform-fee-slider"
          type="range"
          min="5.0"
          max="15.0"
          step="0.5"
          value={feePercent}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-[#1F2335] rounded-lg appearance-none cursor-pointer accent-emerald-400 transition-all"
        />

        {/* Slider scale markers */}
        <div className="flex justify-between text-[10px] text-[#8A8FA9] font-mono px-1">
          <span>5.0% (Min)</span>
          <span>7.5%</span>
          <span className="text-white/60 font-bold">10.0% (Default)</span>
          <span>12.5%</span>
          <span>15.0% (Max)</span>
        </div>
      </div>
    </div>
  );
}
