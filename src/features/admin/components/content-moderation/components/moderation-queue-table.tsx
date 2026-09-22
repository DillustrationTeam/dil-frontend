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
  const formatShortId = (id: string) => {
    if (!id) return '#ART-0000';
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    return `#ART-${lastPart.substring(lastPart.length - 4).toUpperCase()}`;
  };

  const renderSafeScoreBadge = (score?: number | null) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-white/10 text-white/70 font-bold text-[10px] uppercase">
          Scan Pending
        </span>
      );
    }

    const percent = (score * 100).toFixed(1);

    if (score >= 0.9) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
          {percent}% SAFE
        </span>
      );
    }

    if (score >= 0.7) {
      return (
        <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
          {percent}% BORDERLINE
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[10px] border border-red-500/30">
        {percent}% NSFW RISK
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            Rejected
          </span>
        );
      case 'hidden':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/70 border border-white/20">
            Hidden
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-h1 text-base font-bold text-white flex items-center gap-2">
          <span>Flagged Artwork Queue</span>
          <span className="text-xs font-mono font-normal text-[#8A8FA9]">
            ({meta.totalCount} total)
          </span>
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body">
          <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Artwork ID</th>
              <th className="py-3 px-4">Title & Creator</th>
              <th className="py-3 px-4">AI NSFW Scan</th>
              <th className="py-3 px-4">Flag Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/90">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8A8FA9]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin"></div>
                    <p className="text-xs">Loading moderation queue...</p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8A8FA9]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-[#8A8FA9]/40" />
                    <p className="font-bold text-white">No Artworks in Queue</p>
                    <p className="text-[11px] text-[#8A8FA9]">
                      All uploaded artworks have satisfied AI safety checks or matching filters.
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
                        ? 'bg-red-500/15 border-l-4 border-l-red-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Artwork ID & Thumbnail */}
                    <td className="py-3.5 px-4 font-mono text-[#C5C9F8]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 relative">
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
                            <div className="w-full h-full flex items-center justify-center text-[#C5C9F8]">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold block">
                            {formatShortId(item.artworkId)}
                          </span>
                          {item.isAiGenerated && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-purple-300 font-semibold">
                              <Bot className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Title & Creator */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold block text-white line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-[#8A8FA9] block">
                        By @{item.creatorUsername || item.creatorName}
                      </span>
                    </td>

                    {/* AI NSFW Scan Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderSafeScoreBadge(item.safeScore)}
                    </td>

                    {/* Flag Reason */}
                    <td className="py-3.5 px-4 text-[#8A8FA9] text-[11px] max-w-xs truncate">
                      {item.flagReason ? (
                        <span className="text-amber-300/90">{item.flagReason}</span>
                      ) : (
                        <span className="text-white/40 italic">None</span>
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
                            ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Inspecting' : 'Inspect Item'}</span>
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
          <span className="ml-1 text-[#8A8FA9]/70">({meta.totalCount} artworks)</span>
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
