'use client';

import React from 'react';
import { Check, CheckCircle2, Clock } from 'lucide-react';
import type { WinnerApprovalItem } from '../../types/jury.types';

interface HeadJuryApproveTabProps {
  finalWinnersList: WinnerApprovalItem[];
  isAwardAllocationsConfirmed: boolean;
  isContestResultsApproved: boolean;
  handleApproveAwardAllocations: () => void;
  handleApproveContestResults: () => void;
}

export function HeadJuryApproveTab({
  finalWinnersList,
  isAwardAllocationsConfirmed,
  isContestResultsApproved,
  handleApproveAwardAllocations,
  handleApproveContestResults,
}: HeadJuryApproveTabProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-6 items-start">
      {/* Final Results Table */}
      <div className="p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold font-sora text-white">Final Contest Results</h2>
            <p className="text-xs text-[#9695a1] mt-0.5">
              Official ranking and award allocations for AURA 2026.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isAwardAllocationsConfirmed
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {isAwardAllocationsConfirmed ? 'Award Allocations Confirmed' : 'Pending Award Approval'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-left min-w-[500px] text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[#858694] uppercase font-semibold text-[10px]">
                <th className="py-3 px-3.5">Award Category</th>
                <th className="py-3 px-3.5">Winning Entry</th>
                <th className="py-3 px-3.5">Score / Votes</th>
                <th className="py-3 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-[#c8c6cf]">
              {finalWinnersList.map((w, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3.5 font-sora font-bold text-amber-300">{w.awardName}</td>
                  <td className="py-3 px-3.5 font-semibold text-white">
                    <span className="block">{w.title}</span>
                    <span className="block text-[10px] text-[#9695a1] font-mono mt-0.5">{w.code}</span>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[#A7ACD9] font-bold">{w.scoreOrVotes}</td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAwardAllocationsConfirmed
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {isAwardAllocationsConfirmed ? (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Bar under Final Results Table */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-[#9695a1]">
            {isAwardAllocationsConfirmed
              ? '✓ Award allocations confirmed and officially locked.'
              : 'Click Approve Results to confirm award allocations.'}
          </span>
          <button
            type="button"
            onClick={handleApproveAwardAllocations}
            disabled={isAwardAllocationsConfirmed}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] hover:brightness-110 text-white font-sora font-extrabold text-xs shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAwardAllocationsConfirmed ? 'Award Allocations Confirmed' : 'Approve Results'}</span>
          </button>
        </div>
      </div>

      {/* Checklist Sidebar */}
      <aside className="p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-4 lg:sticky lg:top-36">
        <h2 className="text-xl font-bold font-sora text-white">Approval Checklist</h2>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-white font-medium">All Jury Evaluations Completed</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              Completed
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-white font-medium">Disputes & Arbitrations Resolved</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              Completed
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-white font-medium">Award Allocations Confirmed</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                isAwardAllocationsConfirmed
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              {isAwardAllocationsConfirmed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApproveContestResults}
          disabled={isContestResultsApproved}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] text-white font-sora font-extrabold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isContestResultsApproved ? 'Contest Results Approved' : 'Approve Contest Results'}
        </button>

        <div className="p-3 rounded-xl border-l-4 border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs text-[#c7c5cf] leading-relaxed">
          Approval generates an immutable snapshot of contest results and transfers release permissions to Moderators.
        </div>
      </aside>
    </section>
  );
}
