'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PolicyHeaderProps {
  loading: boolean;
  updating: boolean;
  onRefresh: () => void;
}

export function PolicyHeader({ loading, updating, onRefresh }: PolicyHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-h1 text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Platform Fee Rate & Policy Console
          </h1>
        </div>
        <p className="text-xs text-[#8A8FA9] mt-1 font-body">
          Configure global platform commission fee rates (5% - 15%), escrow release policies, and revision rules.
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || updating}
          className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-all cursor-pointer disabled:opacity-50"
          title="Refresh from server"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Policy Active</span>
        </div>
      </div>
    </div>
  );
}
