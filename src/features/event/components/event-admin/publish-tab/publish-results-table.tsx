'use client';

import React from 'react';
import { Trophy, Award, Medal, HeartHandshake, Check, CheckCircle2, Clock } from 'lucide-react';

export interface WinnerApprovalItem {
  awardName: string;
  submissionId: string;
  title: string;
  code?: string;
  submitterName?: string;
  artworkImageUrl?: string;
  scoreOrVotes: string;
  status: string;
  badgeType: 'gold' | 'silver' | 'bronze' | 'community' | 'standard';
}

interface PublishResultsTableProps {
  eventTitle: string;
  finalWinnersList: WinnerApprovalItem[];
  isAwardAllocationsConfirmed: boolean;
  isContestResultsPublished: boolean;
  handleApproveAwardAllocations: () => void;
  isLoading?: boolean;
}

export function PublishResultsTable({
  eventTitle,
  finalWinnersList,
  isAwardAllocationsConfirmed,
  isContestResultsPublished,
  handleApproveAwardAllocations,
  isLoading = false,
}: PublishResultsTableProps) {
  return (
    <div className="p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold font-sora text-white">Final Contest Results</h2>
          <p className="text-xs text-[#9695a1] mt-0.5">
            Official ranking and award allocations for <span className="text-white font-medium">{eventTitle}</span>.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isContestResultsPublished
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : isAwardAllocationsConfirmed
              ? 'bg-brand-periwinkle/15 border-brand-periwinkle/30 text-brand-periwinkle'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          {isContestResultsPublished
            ? 'Results Officially Published'
            : isAwardAllocationsConfirmed
            ? 'Award Allocations Confirmed'
            : 'Pending Award Approval'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left min-w-[550px] text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[#858694] uppercase font-semibold text-[10px]">
              <th className="py-3 px-3.5">Award Category</th>
              <th className="py-3 px-3.5">Winning Entry</th>
              <th className="py-3 px-3.5">Score / Votes</th>
              <th className="py-3 px-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[#c8c6cf]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-brand-periwinkle border-t-transparent" />
                    <span>Loading final contest results from backend...</span>
                  </div>
                </td>
              </tr>
            ) : finalWinnersList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400">
                  No submissions or leaderboard data found for this event yet.
                </td>
              </tr>
            ) : (
              finalWinnersList.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-sora ${
                        item.badgeType === 'gold'
                          ? 'bg-amber-950/70 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                          : item.badgeType === 'silver'
                          ? 'bg-slate-900 border border-slate-400/40 text-slate-200'
                          : item.badgeType === 'bronze'
                          ? 'bg-amber-950/40 border border-amber-600/30 text-amber-400'
                          : item.badgeType === 'community'
                          ? 'bg-cyan-950/50 border border-cyan-400/30 text-cyan-300'
                          : 'bg-white/5 border border-white/10 text-[#c8c6cf]'
                      }`}
                    >
                      {item.badgeType === 'gold' ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      ) : item.badgeType === 'silver' ? (
                        <Award className="w-3.5 h-3.5 text-slate-300" />
                      ) : item.badgeType === 'bronze' ? (
                        <Medal className="w-3.5 h-3.5 text-amber-500" />
                      ) : item.badgeType === 'community' ? (
                        <HeartHandshake className="w-3.5 h-3.5 text-cyan-300" />
                      ) : (
                        <Trophy className="w-3.5 h-3.5 text-[#A7ACD9]" />
                      )}
                      <span>{item.awardName}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      {item.artworkImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.artworkImageUrl}
                          alt={item.title}
                          className="size-9 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      )}
                      <div>
                        <span className="font-semibold text-white block">{item.title}</span>
                        <span className="text-[11px] text-[#9695a1] block">
                          {item.submitterName ? `by @${item.submitterName}` : ''}
                          {item.code ? ` • ${item.code}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[#A7ACD9] font-bold text-xs">
                    {item.scoreOrVotes}
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isContestResultsPublished || isAwardAllocationsConfirmed
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {isContestResultsPublished ? (
                        <>
                          <Check className="w-3 h-3" />
                          Published
                        </>
                      ) : isAwardAllocationsConfirmed ? (
                        <>
                          <Check className="w-3 h-3" />
                          Finalized
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          Pending
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Bar under Final Results Table */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-[#9695a1]">
          {isContestResultsPublished
            ? '✓ Final results officially published and visible on public Wall of Fame.'
            : isAwardAllocationsConfirmed
            ? '✓ Award allocations confirmed and officially locked by jury panel.'
            : 'Click Approve Results to confirm award allocations.'}
        </span>
        <button
          type="button"
          onClick={handleApproveAwardAllocations}
          disabled={isAwardAllocationsConfirmed || isContestResultsPublished || finalWinnersList.length === 0}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] hover:brightness-110 text-white font-sora font-extrabold text-xs shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isContestResultsPublished
              ? 'Results Published'
              : isAwardAllocationsConfirmed
              ? 'Award Allocations Confirmed'
              : 'Approve Results'}
          </span>
        </button>
      </div>
    </div>
  );
}
