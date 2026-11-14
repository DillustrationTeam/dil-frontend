'use client';

import React, { useState } from 'react';
import { Palette, Gavel, ArrowLeftRight } from 'lucide-react';
import {
  AdminAuctionMetricsDto,
  AdminCommissionMetricsDto,
  AdminTradeMetricsDto,
} from '@/features/admin/types/admin.types';

interface LifecycleBreakdownCardProps {
  totalCommissions?: number;
  completedCommissions?: number;
  inProgressCommissions?: number;
  disputedCommissions?: number;
  pendingCommissions?: number;
  commissionMetrics?: AdminCommissionMetricsDto;
  auctionMetrics?: AdminAuctionMetricsDto;
  tradeMetrics?: AdminTradeMetricsDto;
}

export function CommissionBreakdownCard({
  totalCommissions = 0,
  completedCommissions = 0,
  inProgressCommissions = 0,
  disputedCommissions = 0,
  pendingCommissions = 0,
  commissionMetrics,
  auctionMetrics,
  tradeMetrics,
}: LifecycleBreakdownCardProps) {
  const [activeTab, setActiveTab] = useState<'commission' | 'auction' | 'trade'>('commission');

  // Use either nested object or direct numbers for Commissions
  const totalComm = commissionMetrics?.totalCommissions ?? totalCommissions;
  const completedComm = commissionMetrics?.completedCount ?? completedCommissions;
  const inProgressComm = commissionMetrics?.inProgressCount ?? inProgressCommissions;
  const disputedComm = commissionMetrics?.disputedCount ?? disputedCommissions;
  const pendingComm = commissionMetrics?.pendingAcceptanceCount ?? pendingCommissions;

  // Auction metrics
  const totalAuct = auctionMetrics?.totalAuctions ?? 0;
  const activeAuct = auctionMetrics?.activeCount ?? 0;
  const completedAuct = auctionMetrics?.completedSettledCount ?? 0;
  const scheduledAuct = auctionMetrics?.scheduledCount ?? 0;
  const disputedAuct = auctionMetrics?.disputedCount ?? 0;
  const cancelledAuct = auctionMetrics?.cancelledExpiredCount ?? 0;

  // Trade metrics
  const totalTr = tradeMetrics?.totalTrades ?? 0;
  const inProgressTr = tradeMetrics?.inProgressCount ?? 0;
  const completedTr = tradeMetrics?.completedCount ?? 0;
  const proposedTr = tradeMetrics?.proposedCount ?? 0;
  const disputedTr = tradeMetrics?.disputedCount ?? 0;
  const cancelledTr = tradeMetrics?.cancelledRejectedCount ?? 0;

  const calcPct = (val: number, total: number) =>
    total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="glass-container bg-[#161926]/85 border border-white/10 rounded-[28px] p-6 space-y-6 shadow-xl">
      {/* Header with Title and Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="font-h1 font-bold text-white text-base">
            Phân bổ trạng thái giao dịch
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">Lifecycle stage distribution</p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('commission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'commission'
                ? 'bg-brand-periwinkle text-brand-navy shadow-md'
                : 'text-[#919099] hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Commission</span>
            <span className="text-[10px] opacity-80 font-mono">({totalComm})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auction'
                ? 'bg-brand-periwinkle text-brand-navy shadow-md'
                : 'text-[#919099] hover:text-white hover:bg-white/5'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Auction</span>
            <span className="text-[10px] opacity-80 font-mono">({totalAuct})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trade'
                ? 'bg-brand-periwinkle text-brand-navy shadow-md'
                : 'text-[#919099] hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trade</span>
            <span className="text-[10px] opacity-80 font-mono">({totalTr})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: COMMISSION BREAKDOWN */}
      {activeTab === 'commission' && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Completed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đã hoàn tất & Giải ngân (<strong className="font-h1 font-bold text-emerald-400">{completedComm}</strong>)
              </span>
              <span className="text-emerald-400 font-h1 font-extrabold text-sm">
                {calcPct(completedComm, totalComm)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(completedComm, totalComm)}%` }}
                className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* In Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đang thực hiện ký quỹ Escrow (<strong className="font-h1 font-bold text-amber-300">{inProgressComm}</strong>)
              </span>
              <span className="text-amber-300 font-h1 font-extrabold text-sm">
                {calcPct(inProgressComm, totalComm)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(inProgressComm, totalComm)}%` }}
                className="bg-amber-400 h-full rounded-full shadow-[0_0_8px_rgba(251,191,36,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Pending Acceptance */}
          {pendingComm > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white">
                  Chờ họa sĩ nhận đơn (<strong className="font-h1 font-bold text-blue-300">{pendingComm}</strong>)
                </span>
                <span className="text-blue-300 font-h1 font-extrabold text-sm">
                  {calcPct(pendingComm, totalComm)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${calcPct(pendingComm, totalComm)}%` }}
                  className="bg-blue-400 h-full rounded-full shadow-[0_0_8px_rgba(96,165,250,0.3)] transition-all duration-500"
                />
              </div>
            </div>
          )}

          {/* Disputed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Tranh chấp cần phân xử (<strong className="font-h1 font-bold text-red-400">{disputedComm}</strong>)
              </span>
              <span className="text-red-400 font-h1 font-extrabold text-sm">
                {calcPct(disputedComm, totalComm)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(disputedComm, totalComm)}%` }}
                className="bg-red-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AUCTION BREAKDOWN */}
      {activeTab === 'auction' && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Active Bidding */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đang diễn ra (Active Bidding) (<strong className="font-h1 font-bold text-emerald-400">{activeAuct}</strong>)
              </span>
              <span className="text-emerald-400 font-h1 font-extrabold text-sm">
                {calcPct(activeAuct, totalAuct)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(activeAuct, totalAuct)}%` }}
                className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Settled / Completed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đã chốt & Hoàn tất (<strong className="font-h1 font-bold text-purple-300">{completedAuct}</strong>)
              </span>
              <span className="text-purple-300 font-h1 font-extrabold text-sm">
                {calcPct(completedAuct, totalAuct)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(completedAuct, totalAuct)}%` }}
                className="bg-purple-400 h-full rounded-full shadow-[0_0_8px_rgba(192,132,252,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Scheduled / Upcoming */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Sắp diễn ra (Scheduled) (<strong className="font-h1 font-bold text-blue-400">{scheduledAuct}</strong>)
              </span>
              <span className="text-blue-400 font-h1 font-extrabold text-sm">
                {calcPct(scheduledAuct, totalAuct)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(scheduledAuct, totalAuct)}%` }}
                className="bg-blue-400 h-full rounded-full shadow-[0_0_8px_rgba(96,165,250,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Disputed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Tranh chấp bưu phẩm (<strong className="font-h1 font-bold text-red-400">{disputedAuct}</strong>)
              </span>
              <span className="text-red-400 font-h1 font-extrabold text-sm">
                {calcPct(disputedAuct, totalAuct)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(disputedAuct, totalAuct)}%` }}
                className="bg-red-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Cancelled / Expired */}
          {cancelledAuct > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white">
                  Đã huỷ / Quá hạn (<strong className="font-h1 font-bold text-slate-400">{cancelledAuct}</strong>)
                </span>
                <span className="text-slate-400 font-h1 font-extrabold text-sm">
                  {calcPct(cancelledAuct, totalAuct)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${calcPct(cancelledAuct, totalAuct)}%` }}
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ART TRADE BREAKDOWN */}
      {activeTab === 'trade' && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* In Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đang vẽ & Nộp bài (Accepted / BothSubmitted) (<strong className="font-h1 font-bold text-sky-400">{inProgressTr}</strong>)
              </span>
              <span className="text-sky-400 font-h1 font-extrabold text-sm">
                {calcPct(inProgressTr, totalTr)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(inProgressTr, totalTr)}%` }}
                className="bg-sky-400 h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Completed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Hoàn tất thành công (<strong className="font-h1 font-bold text-emerald-400">{completedTr}</strong>)
              </span>
              <span className="text-emerald-400 font-h1 font-extrabold text-sm">
                {calcPct(completedTr, totalTr)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(completedTr, totalTr)}%` }}
                className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Proposed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Chờ xác nhận đề xuất (Proposed) (<strong className="font-h1 font-bold text-amber-300">{proposedTr}</strong>)
              </span>
              <span className="text-amber-300 font-h1 font-extrabold text-sm">
                {calcPct(proposedTr, totalTr)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(proposedTr, totalTr)}%` }}
                className="bg-amber-400 h-full rounded-full shadow-[0_0_8px_rgba(251,191,36,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Disputed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white">
                Đang tranh chấp khiếu nại (<strong className="font-h1 font-bold text-red-400">{disputedTr}</strong>)
              </span>
              <span className="text-red-400 font-h1 font-extrabold text-sm">
                {calcPct(disputedTr, totalTr)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${calcPct(disputedTr, totalTr)}%` }}
                className="bg-red-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-500"
              />
            </div>
          </div>

          {/* Cancelled / Rejected */}
          {cancelledTr > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white">
                  Đã huỷ / Từ chối (<strong className="font-h1 font-bold text-slate-400">{cancelledTr}</strong>)
                </span>
                <span className="text-slate-400 font-h1 font-extrabold text-sm">
                  {calcPct(cancelledTr, totalTr)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${calcPct(cancelledTr, totalTr)}%` }}
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Alias for backwards compatibility
export const LifecycleBreakdownCard = CommissionBreakdownCard;
