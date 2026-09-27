'use client';

import React from 'react';
import {
  Gavel,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Shield,
} from 'lucide-react';
import {
  DisputeQueueItemDto,
  DisputeQueueMeta,
  DisputeStatus,
} from '@/features/admin/types/dispute-arbitration.types';

export interface DisputeQueueTableProps {
  items: DisputeQueueItemDto[];
  meta: DisputeQueueMeta;
  selectedDisputeId: string | null;
  isLoading: boolean;
  error: string | null;
  onInspect: (disputeId: string) => void;
  onPageChange: (page: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: DisputeStatus) {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
          <Clock className="w-3 h-3" />
          Pending Action
        </span>
      );
    case 'UnderReview':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
          <AlertTriangle className="w-3 h-3" />
          Under Review
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" />
          Resolved
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 text-[10px] font-bold">
          {status}
        </span>
      );
  }
}

function getResolutionBadge(resolution?: string | null) {
  if (!resolution) {
    return <span className="text-[11px] text-[#8A8FA9] italic">—</span>;
  }
  if (resolution === 'ClientWin100') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        100% Client Refund
      </span>
    );
  }
  if (resolution === 'ArtistWin100') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
        100% Creator Payout
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
      Split Compromise
    </span>
  );
}

export function DisputeQueueTable({
  items,
  meta,
  selectedDisputeId,
  isLoading,
  error,
  onInspect,
  onPageChange,
}: DisputeQueueTableProps) {
  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-red-400" />
          <h3 className="font-h1 font-bold text-white text-base">
            Dispute Arbitration Queue
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#A7ACD9] text-[10px] font-bold">
            {meta.totalCount} total cases
          </span>
        </div>
        <div className="text-[11px] text-[#8A8FA9] font-h1">
          Select any case to inspect workroom transcripts and execute escrow refunds
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Dispute ID</th>
              <th className="py-3 px-4">Commission Title</th>
              <th className="py-3 px-4">Dispute Parties</th>
              <th className="py-3 px-4">Raised By</th>
              <th className="py-3 px-4">Locked Escrow</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Resolution</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/90">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#8A8FA9] text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading dispute queue...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#8A8FA9] text-xs">
                  No dispute cases match the specified filters.
                </td>
              </tr>
            ) : (
              items.map((dispute) => {
                const isSelected = selectedDisputeId === dispute.disputeId;
                const shortId = dispute.disputeId.substring(0, 8).toUpperCase();

                return (
                  <tr
                    key={dispute.disputeId}
                    onClick={() => onInspect(dispute.disputeId)}
                    className={`transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-red-500/10 hover:bg-red-500/15'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* 1. Dispute Ticket ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-red-300">
                        #DSP-{shortId}
                      </div>
                      <span className="text-[10px] text-[#8A8FA9]">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* 2. Commission Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-white line-clamp-1">
                        {dispute.commissionTitle}
                      </div>
                      <p className="text-[10px] text-[#8A8FA9] line-clamp-1">
                        Reason: {dispute.reason}
                      </p>
                    </td>

                    {/* 3. Parties */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-medium text-[11px]">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span>@{dispute.clientName.replace(/\s+/g, '')}</span>
                          <span className="text-[9px] text-[#8A8FA9]">(Client)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sky-300 font-medium text-[11px]">
                          <User className="w-3 h-3 text-sky-400" />
                          <span>@{dispute.creatorName.replace(/\s+/g, '')}</span>
                          <span className="text-[9px] text-[#8A8FA9]">(Creator)</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Raised By */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          dispute.raisedByRole === 'Client'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {dispute.raisedByRole}: {dispute.raisedByName}
                      </span>
                    </td>

                    {/* 5. Locked Escrow */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-white">
                        <Lock className="w-3 h-3 text-red-400" />
                        <span>{formatCurrency(dispute.escrowHeldAmount)}</span>
                      </div>
                      <div className="text-[10px] text-[#8A8FA9]">
                        Total: {formatCurrency(dispute.finalPrice)}
                      </div>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(dispute.status)}
                    </td>

                    {/* 7. Resolution */}
                    <td className="py-3.5 px-4 text-center">
                      {getResolutionBadge(dispute.resolution)}
                    </td>

                    {/* 8. Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(dispute.disputeId);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                            : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                        }`}
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Arbitrating' : 'Arbitrate'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (Always visible with page size = 10) */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
        <div className="text-[#8A8FA9] text-[11px]">
          Showing page <span className="text-white font-bold">{meta.page}</span> of{' '}
          <span className="text-white font-bold">{Math.max(1, meta.totalPages)}</span>
          <span className="ml-1 text-[#8A8FA9]/70">({meta.totalCount} disputes)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-semibold text-xs">
            Page <span className="font-bold text-red-300">{meta.page}</span> of {Math.max(1, meta.totalPages)}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisputeQueueTable;
