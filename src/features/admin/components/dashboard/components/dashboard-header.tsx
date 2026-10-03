'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface DashboardHeaderProps {
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
}

export function DashboardHeader({ loading, error, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Overview & Financial KPIs
          </h1>
          <p className="text-xs text-[#8A8FA9] mt-1.5 max-w-2xl">
            Real-time operational metrics, total GMV, escrow liquidity, platform revenue, and live administrative audit trails.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/fee-policy"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
            title="Configure Platform Fee & Policies"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#A7ACD9]" />
            <span>Fee Policy</span>
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
            title="Refresh dashboard metrics"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#A7ACD9]' : 'text-[#A7ACD9]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Error Notice Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Backend connection error:</strong> {error} (Hãy đảm bảo backend API .NET đang chạy và bạn đã đăng nhập tài khoản có quyền Admin).
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors cursor-pointer shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
