'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAdminDashboard } from '@/features/admin';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  FileCheck,
  CreditCard,
  Image,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    overview,
    financialKpis,
    userMetrics,
    commissionMetrics,
    actionRequiredQueue,
    revenueTrend,
    recentTransactions,
    loading,
    error,
    refresh,
  } = useAdminDashboard();

  // Currency formatting with font-h1 applied
  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  // Real KPI metrics directly from backend (defaults to 0 if loading / empty database)
  const totalGmv = financialKpis?.totalGmv ?? 0;
  const escrowLocked = financialKpis?.activeEscrowLocked ?? 0;
  const netRevenue = financialKpis?.netPlatformRevenue ?? 0;
  const totalUsers = userMetrics?.totalUsers ?? 0;
  const totalClients = userMetrics?.totalClients ?? 0;
  const totalCreators = userMetrics?.totalCreators ?? 0;
  const totalCommissions = commissionMetrics?.totalCommissions ?? 0;
  const completedCommissions = commissionMetrics?.completedCount ?? 0;
  const inProgressCommissions = commissionMetrics?.inProgressCount ?? 0;
  const disputedCommissions = commissionMetrics?.disputedCount ?? 0;
  const cancelledCommissions = commissionMetrics?.cancelledCount ?? 0;

  // Real percentage calculations
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
    <div className="space-y-8 animate-fadeIn font-body">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Overview & Financial KPIs
          </h1>
          <p className="text-xs text-[#8A8FA9] mt-1.5 max-w-2xl">
            Real-time operational metrics, total GMV, escrow liquidity, platform revenue, and live administrative audit trails.
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-all cursor-pointer disabled:opacity-50 text-xs font-semibold"
            title="Refresh dashboard metrics"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
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
            onClick={refresh}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors cursor-pointer shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Operational Action Required Queue */}
      {actionRequiredQueue && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            href="/admin/disputes"
            className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-red-500/30 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Disputes</p>
                <p className="font-h1 font-bold text-white text-sm">
                  <span className="font-h1 font-extrabold text-white">{actionRequiredQueue.pendingDisputesCount}</span> Pending
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/creator-applications"
            className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-purple-500/30 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Creators</p>
                <p className="font-h1 font-bold text-white text-sm">
                  <span className="font-h1 font-extrabold text-white">{actionRequiredQueue.pendingCreatorApplicationsCount}</span> Pending
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/moderation"
            className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Image className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">AI Flagged</p>
                <p className="font-h1 font-bold text-white text-sm">
                  <span className="font-h1 font-extrabold text-white">{actionRequiredQueue.flaggedArtworksCount}</span> Artworks
                </p>
              </div>
            </div>
          </Link>

          <div className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Payouts</p>
                <p className="font-h1 font-bold text-white text-sm">
                  <span className="font-h1 font-extrabold text-white">{actionRequiredQueue.pendingPayoutsCount}</span> In Queue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4 Executive KPI Cards (SCR-24 Core) — Numbers using font-h1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Platform GMV */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-[#C5C9F8] shadow-lg hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
              TOTAL PLATFORM GMV
            </span>
            <div className="p-1.5 rounded-lg bg-[#C5C9F8]/10 text-[#C5C9F8]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#C5C9F8] tracking-tight">
            {loading && !overview ? '...' : formatCurrency(totalGmv)}
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">
            <span className="font-h1 font-bold text-white/90">{completedCommissions.toLocaleString()}</span> Completed Commissions
          </p>
        </div>

        {/* Card 2: Active Escrow */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-amber-400 shadow-lg hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
              ACTIVE ESCROW LOCKED
            </span>
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-white tracking-tight">
            {loading && !overview ? '...' : formatCurrency(escrowLocked)}
          </h3>
          <p className="text-[11px] text-amber-400/90 font-medium">
            <span className="font-h1 font-bold">{inProgressCommissions}</span> Active Commissions
          </p>
        </div>

        {/* Card 3: Net Revenue */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-emerald-400 shadow-lg hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
              NET REVENUE (<span className="font-h1 font-bold">10%</span> FEE)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-emerald-400 tracking-tight">
            {loading && !overview ? '...' : formatCurrency(netRevenue)}
          </h3>
          <p className="text-[11px] text-emerald-400/80 font-medium">
            Platform 10% Commission Fee
          </p>
        </div>

        {/* Card 4: Registered Users */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-purple-400 shadow-lg hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
              REGISTERED USERS
            </span>
            <div className="p-1.5 rounded-lg bg-purple-400/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-white tracking-tight">
            {loading && !overview ? (
              '...'
            ) : (
              <>
                <span className="font-h1 font-extrabold">{totalUsers.toLocaleString()}</span>{' '}
                <span className="text-xl font-bold text-white/90">Users</span>
              </>
            )}
          </h3>
          <p className="text-[11px] text-purple-300 font-medium">
            <span className="font-h1 font-bold text-purple-200">{totalClients.toLocaleString()}</span> Clients •{' '}
            <span className="font-h1 font-bold text-purple-200">{totalCreators.toLocaleString()}</span> Creators
          </p>
        </div>
      </div>

      {/* 4. Analytics & Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue Visualizer (Max 4 Months) — 5 Cols */}
        <div className="lg:col-span-5 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6">
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
              <div key={idx} className="flex-1 max-w-[64px] flex flex-col items-center gap-2 group">
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
                      : 'bg-[#C5C9F8]/40 hover:bg-[#C5C9F8]'
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

        {/* Right: Commission Orders Breakdown (7 Cols) — Numbers using font-h1 */}
        <div className="lg:col-span-7 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6">
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
      </div>

      {/* 5. Live System Audit Log Table */}
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-[#A7ACD9]" />
            <h3 className="font-h1 font-bold text-white text-base">
              Recent System Audit Log (AuditLog Table)
            </h3>
          </div>
          <span className="text-[11px] text-[#8A8FA9] font-h1">Live Audit Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource Target / Note</th>
                <th className="py-3 px-4 text-center">Direction / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-h1 font-bold text-[#C5C9F8]">
                      #{tx.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-[#8A8FA9] font-h1">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-h1 font-bold text-[10px]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{tx.userName || tx.userEmail}</td>
                    <td className="py-3.5 px-4 text-white/70">
                      {tx.note || 'Platform Escrow/Fee'} • <span className="font-h1 font-bold text-white">{formatCurrency(tx.amount)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-h1 font-bold text-[10px] ${
                          tx.direction === 'In' || tx.direction === 'Deposit'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {tx.direction || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8A8FA9] text-xs">
                    {loading
                      ? 'Đang tải dữ liệu lịch sử giao dịch từ hệ thống...'
                      : 'Chưa có bản ghi giao dịch hoặc nhật ký hệ thống nào trong cơ sở dữ liệu.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
