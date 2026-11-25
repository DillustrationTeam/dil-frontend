'use client';

import React from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  Eye,
  Bot,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  ModerationQueueItemDto,
  ModerationQueueMeta,
} from '@/features/admin/types/moderation.types';
import { useLanguage } from '@/context/language-context';

interface ModerationQueueTableProps {
  items: ModerationQueueItemDto[];
  meta: ModerationQueueMeta;
  selectedArtworkId?: string | null;
  isLoading: boolean;
  error?: string | null;
  onInspect: (artworkId: string) => void;
  onPageChange: (page: number) => void;
}

export function ModerationQueueTable({
  items,
  meta,
  selectedArtworkId,
  isLoading,
  error,
  onInspect,
  onPageChange,
}: ModerationQueueTableProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const formatShortId = (id: string) => {
    if (!id) return '#ART-0000';
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    return `#ART-${lastPart.substring(lastPart.length - 4).toUpperCase()}`;
  };

  const renderSafeScoreBadge = (score?: number | null) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-[#F0E7D8] text-[#241F1A]/70 font-bold text-[10px] uppercase">
          {isVie ? 'Chờ quét' : 'Scan Pending'}
        </span>
      );
    }

    const percent = (score * 100).toFixed(1);

    if (score >= 0.9) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-[#2F6B63]/20 text-[#2F6B63] font-bold text-[10px] border border-[#2F6B63]/40">
          {percent}% {isVie ? 'AN TOÀN' : 'SAFE'}
        </span>
      );
    }

    if (score >= 0.7) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-[#8A6A1F]/20 text-[#8A6A1F] font-bold text-[10px] border border-[#8A6A1F]/40">
          {percent}% {isVie ? 'CẦN XEM XÉT' : 'BORDERLINE'}
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded bg-[#A8321C]/20 text-[#A8321C] font-bold text-[10px] border border-[#A8321C]/40">
        {percent}% {isVie ? 'RỦI RO NSFW' : 'NSFW RISK'}
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40">
            {isVie ? 'Đã duyệt' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#A8321C]/20 text-[#A8321C] border border-[#A8321C]/40">
            {isVie ? 'Đã từ chối' : 'Rejected'}
          </span>
        );
      case 'hidden':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F0E7D8] text-[#241F1A]/70 border border-[#221E1A]/20">
            {isVie ? 'Đang ẩn' : 'Hidden'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40">
            {isVie ? 'Chờ duyệt' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-h1 text-base font-bold text-[#241F1A] flex items-center gap-2">
          <span>{isVie ? 'Hàng đợi Tác phẩm Cảnh báo' : 'Flagged Artwork Queue'}</span>
          <span className="text-xs font-mono font-normal text-[#6E6459]">
            {isVie ? `(Tổng ${meta.totalCount} tác phẩm)` : `(${meta.totalCount} total)`}
          </span>
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/40 text-[#A8321C] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body">
          <thead className="text-[10px] uppercase font-bold text-[#6E6459] border-b border-[#221E1A]/10">
            <tr>
              <th className="py-3 px-4">{isVie ? 'Mã tác phẩm' : 'Artwork ID'}</th>
              <th className="py-3 px-4">{isVie ? 'Tên tranh & Tác giả' : 'Title & Creator'}</th>
              <th className="py-3 px-4">{isVie ? 'Quét AI NSFW' : 'AI NSFW Scan'}</th>
              <th className="py-3 px-4">{isVie ? 'Lý do cảnh báo' : 'Flag Reason'}</th>
              <th className="py-3 px-4">{isVie ? 'Trạng thái' : 'Status'}</th>
              <th className="py-3 px-4 text-right">{isVie ? 'Thao tác' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-[#241F1A]/90">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#6E6459]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#A8321C]/40 border-t-red-400 rounded-full animate-spin"></div>
                    <p className="text-xs">{isVie ? 'Đang tải hàng đợi kiểm duyệt...' : 'Loading moderation queue...'}</p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#6E6459]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-[#6E6459]" />
                    <p className="font-bold text-[#241F1A]">{isVie ? 'Không có tác phẩm trong hàng đợi' : 'No Artworks in Queue'}</p>
                    <p className="text-[11px] text-[#6E6459]">
                      {isVie
                        ? 'Tất cả tác phẩm tải lên đều đáp ứng tiêu chuẩn an toàn AI hoặc bộ lọc tìm kiếm.'
                        : 'All uploaded artworks have satisfied AI safety checks or matching filters.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedArtworkId === item.artworkId;

                return (
                  <tr
                    key={item.artworkId}
                    onClick={() => onInspect(item.artworkId)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#A8321C]/15 border-l-4 border-l-red-500'
                        : 'hover:bg-[#FFFCF6]'
                    }`}
                  >
                    {/* Artwork ID & Thumbnail */}
                    <td className="py-3.5 px-4 font-mono text-[#8C3718]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#E5D8C2] border border-[#221E1A]/10 shrink-0 relative">
                          {item.imageUrl ? (
                            <Image
                              src={item.thumbnailUrl || item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8C3718]">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold block">
                            {formatShortId(item.artworkId)}
                          </span>
                          {item.isAiGenerated && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#5F3F86] font-semibold">
                              <Bot className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Title & Creator */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold block text-[#241F1A] line-clamp-1">
                        {item.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#6E6459]">
                          By @{item.creatorUsername || item.creatorName}
                        </span>
                        {(item.categoryName || item.style) && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#B24A26]/15 text-[#8C3718] border border-[#B24A26]/25 text-[9px] font-semibold">
                            {item.categoryName || item.style}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AI NSFW Scan Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderSafeScoreBadge(item.safeScore)}
                    </td>

                    {/* Flag Reason */}
                    <td className="py-3.5 px-4 text-[#6E6459] text-[11px] max-w-xs truncate">
                      {item.flagReason ? (
                        <span className="text-[#8A6A1F]">{item.flagReason}</span>
                      ) : (
                        <span className="text-[#4A423A] italic">None</span>
                      )}
                    </td>

                    {/* Moderation Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(item.moderationStatus)}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(item.artworkId);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition-all text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                            : 'bg-[#A8321C]/20 text-[#A8321C] hover:bg-[#A8321C]/20 border border-[#A8321C]/40'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {isSelected
                            ? (isVie ? 'Đang kiểm tra' : 'Inspecting')
                            : (isVie ? 'Kiểm tra' : 'Inspect Item')}
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
          {isVie ? (
            <> Hiển thị trang <span className="text-[#241F1A] font-bold">{meta.page}</span> trên{' '}
              <span className="text-[#241F1A] font-bold">{Math.max(1, meta.totalPages)}</span>
              <span className="ml-1 text-[#6E6459]/70">({meta.totalCount} tác phẩm)</span>
            </>
          ) : (
            <>
              Showing page <span className="text-[#241F1A] font-bold">{meta.page}</span> of{' '}
              <span className="text-[#241F1A] font-bold">{Math.max(1, meta.totalPages)}</span>
              <span className="ml-1 text-[#6E6459]/70">({meta.totalCount} artworks)</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isVie ? 'Trước' : 'Previous'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-[#F0E7D8] border border-[#221E1A]/10 text-[#241F1A] font-semibold text-xs">
            {isVie ? (
              <>
                Trang <span className="font-bold text-[#A8321C]">{meta.page}</span> / {Math.max(1, meta.totalPages)}
              </>
            ) : (
              <>
                Page <span className="font-bold text-[#A8321C]">{meta.page}</span> of {Math.max(1, meta.totalPages)}
              </>
            )}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <span>{isVie ? 'Sau' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
