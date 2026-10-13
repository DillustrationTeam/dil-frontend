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
import type { SubmissionDisputeDto } from '@/features/admin/types/dispute-arbitration.types';

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
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-[#e598ad]/20 text-[#f2b3c4] border-[#e598ad]/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-white/10 text-slate-300 border-white/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'UnderReview':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Rejected':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-white/10 text-slate-300 border-white/10';
    }
  };

  return (
    <div className="glass-container rounded-2xl border border-white/10 bg-[#161926]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-bold text-outline uppercase tracking-wider bg-black/20">
              <th className="py-3.5 px-4">Case ID</th>
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4">Contest</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-periwinkle border-t-transparent rounded-full animate-spin" />
                    <span>Loading dispute queue...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mb-1" />
                    <span className="font-semibold text-white">No Disputes In Queue</span>
                    <span className="text-[11px] text-[#8A8FA9]">All contest disputes for this selection have been resolved.</span>
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
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* 1. Case ID & Created Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {formatDisputeCode(item.id)}
                        </span>
                        {item.priority === 'High' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#f2b3c4]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#8A8FA9] block mt-0.5">
                        By {item.raisedByName || 'Participant'}
                      </span>
                    </td>

                    {/* 2. Submission Artwork & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
                          {item.artworkImageUrl ? (
                            <Image
                              src={item.artworkImageUrl}
                              alt={item.submissionTitle || 'Artwork'}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[240px]">
                          <p className="font-semibold text-white truncate text-xs">
                            {item.submissionTitle || 'Untitled Artwork'}
                          </p>
                          <span className="text-[10px] text-brand-periwinkle font-mono block mt-0.5">
                            SUB-{item.submissionId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Contest Event */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[200px]">
                        <p className="text-xs text-slate-300 font-medium truncate">
                          {item.eventTitle || 'Contest Event'}
                        </p>
                        <span className="text-[10px] text-[#8A8FA9] block mt-0.5">
                          Event ID: {item.eventId.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* 4. Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
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
                            ? 'bg-brand-periwinkle text-brand-navy shadow-[0_0_15px_rgba(167,172,217,0.3)]'
                            : 'border border-white/10 bg-white/5 hover:bg-white/15 text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Case</span>
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-white/10 text-xs text-[#8A8FA9] bg-black/20">
        <div>
          <span>
            Showing <strong className="text-white">{items.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> dispute cases
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-white px-2">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
