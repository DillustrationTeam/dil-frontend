'use client';

import React from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { SubmissionDisputeDto } from '@/features/admin/types/dispute-arbitration.types';

export function formatDisputeCategory(category?: string | null): string {
  switch (category) {
    case 'AiArt':
      return 'AI Art';
    case 'Copyright':
      return 'Copyright';
    case 'VoteFraud':
      return 'Vote Fraud';
    case 'RuleViolation':
      return 'Rule Violation';
    case 'ScoreAppeal':
      return 'Score Appeal';
    default:
      return 'Other';
  }
}

export function formatDisputeCode(id: string): string {
  if (!id) return 'DSP-000';
  if (id.startsWith('dsp-')) return id.toUpperCase();
  const clean = id.replace(/-/g, '');
  return `DSP-${clean.slice(0, 4).toUpperCase()}`;
}

interface DisputeQueueTableProps {
  items: SubmissionDisputeDto[];
  selectedDisputeId?: string | null;
  isLoading: boolean;
  onInspect: (item: SubmissionDisputeDto) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function DisputeQueueTable({
  items,
  selectedDisputeId,
  isLoading,
  onInspect,
  page,
  totalPages,
  totalCount,
  onPageChange,
}: DisputeQueueTableProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const formatDisputeCategoryText = (category?: string | null) => {
    switch (category) {
      case 'AiArt':
        return isVie ? 'Tranh AI' : 'AI Art';
      case 'Copyright':
        return isVie ? 'Bản quyền' : 'Copyright';
      case 'VoteFraud':
        return isVie ? 'Gian lận vote' : 'Vote Fraud';
      case 'RuleViolation':
        return isVie ? 'Vi phạm thể lệ' : 'Rule Violation';
      case 'ScoreAppeal':
        return isVie ? 'Khiếu nại điểm' : 'Score Appeal';
      default:
        return isVie ? 'Khác' : 'Other';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40';
      case 'Medium':
        return 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40';
      case 'Low':
        return 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40';
      default:
        return 'bg-[#F0E7D8] text-[#746A5F] border-[#221E1A]/10';
    }
  };

  const formatPriorityText = (priority: string) => {
    switch (priority) {
      case 'High':
        return isVie ? 'Cao' : 'High';
      case 'Medium':
        return isVie ? 'Trung bình' : 'Medium';
      case 'Low':
        return isVie ? 'Thấp' : 'Low';
      default:
        return priority;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40';
      case 'UnderReview':
        return 'bg-[#2C5A86]/20 text-[#2C5A86] border-[#2C5A86]/40';
      case 'Resolved':
        return 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40';
      case 'Rejected':
        return 'bg-[#E5D8C2] text-[#746A5F] border-[#221E1A]/12';
      default:
        return 'bg-[#F0E7D8] text-[#746A5F] border-[#221E1A]/10';
    }
  };

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'Pending':
        return isVie ? 'Chờ xử lý' : 'Pending';
      case 'UnderReview':
        return isVie ? 'Đang duyệt' : 'Under Review';
      case 'Resolved':
        return isVie ? 'Đã giải quyết' : 'Resolved';
      case 'Rejected':
        return isVie ? 'Đã từ chối' : 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="glass-container rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-[#221E1A]/10 text-[11px] font-bold text-outline uppercase tracking-wider bg-[#F0E7D8]">
              <th className="py-3.5 px-4">{isVie ? 'Mã đơn' : 'Case ID'}</th>
              <th className="py-3.5 px-4">{isVie ? 'Tác phẩm' : 'Title'}</th>
              <th className="py-3.5 px-4">{isVie ? 'Cuộc thi' : 'Contest'}</th>
              <th className="py-3.5 px-4">{isVie ? 'Ưu tiên' : 'Priority'}</th>
              <th className="py-3.5 px-4">{isVie ? 'Trạng thái' : 'Status'}</th>
              <th className="py-3.5 px-4 text-right">{isVie ? 'Thao tác' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#746A5F]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-periwinkle border-t-transparent rounded-full animate-spin" />
                    <span>{isVie ? 'Đang tải hàng đợi tranh chấp...' : 'Loading dispute queue...'}</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#746A5F]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#2F6B63] mb-1" />
                    <span className="font-semibold text-[#241F1A]">{isVie ? 'Không có tranh chấp nào' : 'No Disputes In Queue'}</span>
                    <span className="text-[11px] text-[#6E6459]">
                      {isVie ? 'Tất cả tranh chấp cuộc thi đã được giải quyết.' : 'All contest disputes for this selection have been resolved.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedDisputeId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onInspect(item)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-brand-periwinkle/15 hover:bg-brand-periwinkle/20 border-l-4 border-l-brand-periwinkle'
                        : 'hover:bg-[#FFFCF6]'
                    }`}
                  >
                    {/* 1. Case ID & Created Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#241F1A] text-xs">
                          {formatDisputeCode(item.id)}
                        </span>
                        {item.priority === 'High' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#A8321C]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#6E6459] block mt-0.5">
                        {isVie ? 'Bởi' : 'By'} {item.raisedByName || (isVie ? 'Thí sinh' : 'Participant')}
                      </span>
                    </td>

                    {/* 2. Submission Artwork & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#221E1A]/10 bg-[#F0E7D8]">
                          {item.artworkImageUrl ? (
                            <Image
                              src={item.artworkImageUrl}
                              alt={item.submissionTitle || 'Artwork'}
                              fill
                              unoptimized
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#241F1A]">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[240px]">
                          <p className="font-semibold text-[#241F1A] truncate text-xs">
                            {item.submissionTitle || (isVie ? 'Chưa đặt tên' : 'Untitled Artwork')}
                          </p>
                          <span className="text-[10px] text-brand-periwinkle font-mono block mt-0.5">
                            {item.submissionId ? `SUB-${item.submissionId.slice(0, 8)}` : (isVie ? 'Đã rút bài' : 'Withdrawn entry')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Contest Event */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[200px]">
                        <p className="text-xs text-[#746A5F] font-medium truncate">
                          {item.eventTitle || (isVie ? 'Cuộc thi' : 'Contest Event')}
                        </p>
                        <span className="text-[10px] text-[#6E6459] block mt-0.5">
                          ID: {item.eventId.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* 4. Priority & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                            item.priority
                          )}`}
                        >
                          {formatPriorityText(item.priority)}
                        </span>
                        <span className="text-[10px] text-[#B24A26] font-medium">
                          {formatDisputeCategoryText(item.category)}
                        </span>
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {formatStatusText(item.status)}
                      </span>
                    </td>

                    {/* 6. Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(item);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[0_0_15px_rgba(167,172,217,0.3)]'
                            : 'border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isVie ? 'Kiểm tra' : 'Inspect Case'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[#221E1A]/10 text-xs text-[#6E6459] bg-[#F0E7D8]">
        <div>
          <span>
            {isVie ? 'Hiển thị' : 'Showing'} <strong className="text-[#241F1A]">{items.length}</strong> {isVie ? 'trên' : 'of'}{' '}
            <strong className="text-[#241F1A]">{totalCount}</strong> {isVie ? 'vụ tranh chấp' : 'dispute cases'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title={isVie ? 'Trang trước' : 'Previous page'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-[#241F1A] px-2">
            {isVie ? `Trang ${page} / ${Math.max(1, totalPages)}` : `Page ${page} of ${Math.max(1, totalPages)}`}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title={isVie ? 'Trang sau' : 'Next page'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
