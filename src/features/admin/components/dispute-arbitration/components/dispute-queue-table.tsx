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
import { useLanguage } from '@/context/language-context';

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
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: DisputeStatus, isVie: boolean) {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8A6A1F]/15 text-[#8A6A1F] border border-[#8A6A1F]/40 text-[10px] font-bold">
          <Clock className="w-3 h-3" />
          {isVie ? 'Cần xử lý' : 'Pending Action'}
        </span>
      );
    case 'UnderReview':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2C6A86]/15 text-[#2C6A86] border border-[#2C6A86]/40 text-[10px] font-bold">
          <AlertTriangle className="w-3 h-3" />
          {isVie ? 'Đang xem xét' : 'Under Review'}
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2F6B63]/15 text-[#2F6B63] border border-[#2F6B63]/40 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" />
          {isVie ? 'Đã phân xử' : 'Resolved'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0E7D8] text-[#241F1A] border border-[#221E1A]/10 text-[10px] font-bold">
          {status}
        </span>
      );
  }
}

function getResolutionBadge(resolution: string | null | undefined, isVie: boolean) {
  if (!resolution) {
    return <span className="text-[11px] text-[#6E6459] italic">—</span>;
  }
  if (resolution === 'ClientWin100') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40">
        {isVie ? 'Hoàn 100% cho Khách' : '100% Client Refund'}
      </span>
    );
  }
  if (resolution === 'ArtistWin100') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2C6A86]/20 text-[#2C6A86] border border-[#2C6A86]/40">
        {isVie ? 'Trả 100% cho Họa sĩ' : '100% Creator Payout'}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#5F3F86]/20 text-[#5F3F86] border border-[#5F3F86]/40">
      {isVie ? 'Chia thỏa thuận' : 'Split Compromise'}
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  return (
    <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#221E1A]/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#A8321C]" />
          <h3 className="font-h1 font-bold text-[#241F1A] text-base">
            Dispute Arbitration Queue
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-[#F0E7D8] text-[#B24A26] text-[10px] font-bold">
            {meta.totalCount} total cases
          </span>
        </div>
        <div className="text-[11px] text-[#6E6459] font-h1">
          Select any case to inspect workroom transcripts and execute escrow refunds
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/40 text-xs text-[#A8321C]">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-bold text-[#6E6459] border-b border-[#221E1A]/10">
            <tr>
              <th className="py-3 px-4">{isVie ? 'Mã khiếu nại' : 'Dispute ID'}</th>
              <th className="py-3 px-4">{isVie ? 'Tên đơn đặt vẽ' : 'Commission Title'}</th>
              <th className="py-3 px-4">{isVie ? 'Các bên tranh chấp' : 'Dispute Parties'}</th>
              <th className="py-3 px-4">{isVie ? 'Người khiếu nại' : 'Raised By'}</th>
              <th className="py-3 px-4">{isVie ? 'Tiền ký quỹ' : 'Locked Escrow'}</th>
              <th className="py-3 px-4 text-center">{isVie ? 'Trạng thái' : 'Status'}</th>
              <th className="py-3 px-4 text-center">{isVie ? 'Phán quyết' : 'Resolution'}</th>
              <th className="py-3 px-4 text-right">{isVie ? 'Thao tác' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-[#241F1A]/90">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#6E6459] text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#A8321C]/30 border-t-transparent rounded-full animate-spin" />
                    <span>Loading dispute queue...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#6E6459] text-xs">
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
                        ? 'bg-[#A8321C]/10 hover:bg-[#A8321C]/15'
                        : 'hover:bg-[#FFFCF6]'
                    }`}
                  >
                    {/* 1. Dispute Ticket ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#A8321C]">
                        #DSP-{shortId}
                      </div>
                      <span className="text-[10px] text-[#6E6459]">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* 2. Commission Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#241F1A] line-clamp-1">
                        {dispute.commissionTitle}
                      </div>
                      <p className="text-[10px] text-[#6E6459] line-clamp-1">
                        Reason: {dispute.reason}
                      </p>
                    </td>

                    {/* 3. Parties */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#2F6B63] font-medium text-[11px]">
                          <User className="w-3 h-3 text-[#2F6B63]" />
                          <span>@{dispute.clientName.replace(/\s+/g, '')}</span>
                          <span className="text-[9px] text-[#6E6459]">(Client)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#2C6A86] font-medium text-[11px]">
                          <User className="w-3 h-3 text-[#2C6A86]" />
                          <span>@{dispute.creatorName.replace(/\s+/g, '')}</span>
                          <span className="text-[9px] text-[#6E6459]">(Creator)</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Raised By */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          dispute.raisedByRole === 'Client'
                            ? 'bg-[#2F6B63]/10 text-[#2F6B63] border-[#2F6B63]/40'
                            : 'bg-[#2C6A86]/10 text-[#2C6A86] border-[#2C6A86]/40'
                        }`}
                      >
                        {dispute.raisedByRole}: {dispute.raisedByName}
                      </span>
                    </td>

                    {/* 5. Locked Escrow */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-[#241F1A]">
                        <Lock className="w-3 h-3 text-[#A8321C]" />
                        <span>{formatCurrency(dispute.escrowHeldAmount)}</span>
                      </div>
                      <div className="text-[10px] text-[#6E6459]">
                        Total: {formatCurrency(dispute.finalPrice)}
                      </div>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(dispute.status, isVie)}
                    </td>

                    {/* 7. Resolution */}
                    <td className="py-3.5 px-4 text-center">
                      {getResolutionBadge(dispute.resolution, isVie)}
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
                            ? 'bg-[#A8321C]/12 text-[#241F1A] border-[#A8321C]/30 shadow-md shadow-[#A8321C]'
                            : 'bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A]/90 border-[#221E1A]/10'
                        }`}
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>
                          {isVie
                            ? isSelected
                              ? 'Đang phân xử'
                              : 'Phân xử'
                            : isSelected
                            ? 'Arbitrating'
                            : 'Arbitrate'}
                        </span>
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
      <div className="flex items-center justify-between pt-4 border-t border-[#221E1A]/10 text-xs">
        <div className="text-[#6E6459] text-[11px]">
          Showing page <span className="text-[#241F1A] font-bold">{meta.page}</span> of{' '}
          <span className="text-[#241F1A] font-bold">{Math.max(1, meta.totalPages)}</span>
          <span className="ml-1 text-[#6E6459]/70">({meta.totalCount} disputes)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-[#F0E7D8] border border-[#221E1A]/10 text-[#241F1A] font-semibold text-xs">
            Page <span className="font-bold text-[#A8321C]">{meta.page}</span> of {Math.max(1, meta.totalPages)}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
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
