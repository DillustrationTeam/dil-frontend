'use client';

import React from 'react';
import { Megaphone, Lock, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface PublishChecklistStatus {
  eventConcluded: boolean;
  juryEvaluationsDone: boolean;
  disputesResolved: boolean;
  headJurySignOff: boolean;
  headJurySignedOffAt?: string | null;
  openDisputesCount: number;
  juryCount: number;
  evaluatedJuryCount: number;
}

interface PublishChecklistAsideProps {
  checklist: PublishChecklistStatus;
  isAwardAllocationsConfirmed: boolean;
  isContestResultsPublished: boolean;
  handlePublishResults: () => void;
  isPublishing?: boolean;
}

export function PublishChecklistAside({
  checklist,
  isAwardAllocationsConfirmed,
  isContestResultsPublished,
  handlePublishResults,
  isPublishing = false,
}: PublishChecklistAsideProps) {
  const canPublish =
    !isContestResultsPublished &&
    !isPublishing &&
    checklist.disputesResolved &&
    (checklist.headJurySignOff || isAwardAllocationsConfirmed);

  return (
    <aside className="p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sora text-white">Release Audit Checklist</h2>
        <span className="text-xs text-[#9695a1] font-mono">
          {Object.values(checklist).filter((v) => v === true).length}/4 Verified
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* 1. Event Period Concluded */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">Event Period Concluded</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.eventConcluded
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {checklist.eventConcluded ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> In Progress
              </span>
            )}
          </span>
        </div>

        {/* 2. Jury Evaluations Completed */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">All Jury Evaluations Completed</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.juryEvaluationsDone
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {checklist.juryEvaluationsDone ? (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={11} /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {checklist.juryCount > 0 ? `${checklist.juryCount} Juries` : 'Pending'}
              </span>
            )}
          </span>
        </div>

        {/* 3. Disputes & Arbitrations Resolved */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">Disputes & Arbitrations Resolved</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.disputesResolved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {checklist.disputesResolved ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle size={11} /> {checklist.openDisputesCount} Open
              </span>
            )}
          </span>
        </div>

        {/* 4. Head Jury Sign-Off Complete */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">Head Jury Sign-Off Complete</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.headJurySignOff || isAwardAllocationsConfirmed
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {checklist.headJurySignOff || isAwardAllocationsConfirmed ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} />{' '}
                {checklist.headJurySignedOffAt
                  ? `Signed Off (${new Date(checklist.headJurySignedOffAt).toLocaleDateString()})`
                  : 'Signed Off'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> Pending Sign-Off
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Main Publish Action Button */}
      <button
        type="button"
        onClick={handlePublishResults}
        disabled={!canPublish}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] text-white font-sora font-extrabold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Megaphone className="w-4 h-4" />
        <span>
          {isContestResultsPublished
            ? 'Results Officially Published'
            : isPublishing
            ? 'Publishing Results...'
            : 'Publish Official Results'}
        </span>
      </button>

      <div className="p-3 rounded-xl border-l-4 border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs text-[#c7c5cf] leading-relaxed flex items-start gap-2">
        <Lock className="w-4 h-4 text-[#A7ACD9] shrink-0 mt-0.5" />
        <span>
          Publishing generates an immutable snapshot of contest results and officially reveals winners on the public Wall of Fame and Leaderboard.
        </span>
      </div>
    </aside>
  );
}
