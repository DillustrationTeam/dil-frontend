'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Crown, Sparkles, Vote, Award } from 'lucide-react';
import type { EventDetailDto } from '../../types/event.types';

interface EventStageProgressProps {
  event: EventDetailDto;
}

interface StageStep {
  id: string;
  name: string;
  rangeText: string;
  status: 'completed' | 'active' | 'upcoming';
  statusBadge: string;
  icon: React.ReactNode;
}

function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function EventStageProgress({ event }: EventStageProgressProps) {
  const [now] = useState(() => Date.now());

  const subStart = new Date(event.submissionStartAt).getTime();
  const subEnd = new Date(event.submissionEndAt).getTime();

  const judgeStart = new Date(event.judgingStartAt).getTime();
  const judgeEnd = new Date(event.judgingEndAt).getTime();

  const voteStart = new Date(event.votingStartAt).getTime();
  const voteEnd = new Date(event.votingEndAt).getTime();

  const announceDate = new Date(event.resultAnnouncementAt || event.votingEndAt).getTime();

  // 1. Submission stage
  let subStatus: 'completed' | 'active' | 'upcoming' = 'upcoming';
  let subRatio = 0;
  if (now > subEnd) {
    subStatus = 'completed';
    subRatio = 1;
  } else if (now >= subStart && now <= subEnd) {
    subStatus = 'active';
    const total = subEnd - subStart;
    subRatio = total > 0 ? (now - subStart) / total : 0.5;
  }

  // 2. Judging stage
  let judgeStatus: 'completed' | 'active' | 'upcoming' = 'upcoming';
  let judgeRatio = 0;
  if (now > judgeEnd) {
    judgeStatus = 'completed';
    judgeRatio = 1;
  } else if (now >= judgeStart && now <= judgeEnd) {
    judgeStatus = 'active';
    const total = judgeEnd - judgeStart;
    judgeRatio = total > 0 ? (now - judgeStart) / total : 0.5;
  }

  // 3. Voting stage
  let voteStatus: 'completed' | 'active' | 'upcoming' = 'upcoming';
  let voteRatio = 0;
  if (now > voteEnd) {
    voteStatus = 'completed';
    voteRatio = 1;
  } else if (now >= voteStart && now <= voteEnd) {
    voteStatus = 'active';
    const total = voteEnd - voteStart;
    voteRatio = total > 0 ? (now - voteStart) / total : 0.5;
  }

  // 4. Announcement stage
  let announceStatus: 'completed' | 'active' | 'upcoming' = 'upcoming';
  if (now >= announceDate) {
    announceStatus = 'completed';
  } else if (now > voteEnd && now < announceDate) {
    announceStatus = 'active';
  }

  // Overall visual progress along the straight line connecting the 4 milestones (0% to 100%)
  let overallPercent = 0;
  if (subStatus === 'active') {
    overallPercent = Math.min(33.33, Math.max(3, Math.round(subRatio * 33.33)));
  } else if (subStatus === 'completed' && judgeStatus === 'upcoming' && voteStatus === 'upcoming') {
    overallPercent = 33.33;
  } else if (judgeStatus === 'active') {
    overallPercent = Math.min(66.66, Math.max(35, Math.round(33.33 + judgeRatio * 33.33)));
  } else if (voteStatus === 'active') {
    overallPercent = Math.min(95, Math.max(68, Math.round(66.66 + voteRatio * 28)));
  } else if (announceStatus === 'active') {
    overallPercent = 95;
  } else if (announceStatus === 'completed') {
    overallPercent = 100;
  } else if (now < subStart) {
    overallPercent = 0;
  }

  const steps: StageStep[] = [
    {
      id: 'submission',
      name: 'Submission',
      rangeText: `(${formatShortDate(event.submissionStartAt)} - ${formatShortDate(event.submissionEndAt)})`,
      status: subStatus,
      statusBadge: subStatus === 'active' ? 'Live Now' : subStatus === 'completed' ? 'Completed' : 'Upcoming',
      icon: <Sparkles size={14} />,
    },
    {
      id: 'judging',
      name: 'Judging',
      rangeText: `(${formatShortDate(event.judgingStartAt)} - ${formatShortDate(event.judgingEndAt)})`,
      status: judgeStatus,
      statusBadge: judgeStatus === 'active' ? 'In Review' : judgeStatus === 'completed' ? 'Completed' : 'Upcoming',
      icon: <Award size={14} />,
    },
    {
      id: 'voting',
      name: 'Voting',
      rangeText: `(${formatShortDate(event.votingStartAt)} - ${formatShortDate(event.votingEndAt)})`,
      status: voteStatus,
      statusBadge: voteStatus === 'active' ? 'Voting Live' : voteStatus === 'completed' ? 'Completed' : 'Upcoming',
      icon: <Vote size={14} />,
    },
    {
      id: 'announcement',
      name: 'Announcement',
      rangeText: `(${formatShortDate(event.resultAnnouncementAt)})`,
      status: announceStatus,
      statusBadge: announceStatus === 'completed' ? 'Winners Crowned' : announceStatus === 'active' ? 'Deliberating' : 'Upcoming',
      icon: <Crown size={14} />,
    },
  ];

  const activeStage = steps.find((s) => s.status === 'active');

  return (
    <section className="rounded-3xl border border-white/10 bg-[#161926]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-brand-periwinkle" />
          <h2 className="font-h1 text-base sm:text-lg font-bold text-white">
            Contest Timeline & Stages
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeStage ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Stage: {activeStage.name} ({activeStage.statusBadge})</span>
            </span>
          ) : announceStatus === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-950/70 px-3.5 py-1 text-xs font-bold text-amber-300">
              <Crown size={13} className="text-amber-400" />
              <span>Contest Finalized</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs text-slate-300">
              <span>Upcoming Contest</span>
            </span>
          )}
        </div>
      </div>

      {/* The Straight Horizontal Timeline Line: |---------------|--------------|---------------| */}
      <div className="mt-8 pt-4 pb-2 overflow-x-auto">
        <div className="relative min-w-[560px] sm:min-w-full">
          {/* Base Horizontal Track connecting Point 1 (12.5%) to Point 4 (87.5%) */}
          <div className="absolute top-4 left-[12.5%] right-[12.5%] -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />

          {/* Active Glowing Progress Fill */}
          <div
            style={{ width: `${(overallPercent / 100) * 75}%` }}
            className="absolute top-4 left-[12.5%] -translate-y-1/2 h-1 bg-gradient-to-r from-brand-periwinkle via-purple-400 to-amber-400 rounded-full z-0 shadow-[0_0_12px_rgba(167,172,217,0.7)] transition-all duration-700"
          />

          {/* 4 Equidistant Columns: Each Point and its Content are strictly centered together */}
          <div className="grid grid-cols-4 relative z-10 w-full">
            {steps.map((step) => {
              const isActive = step.status === 'active';
              const isCompleted = step.status === 'completed';

              return (
                <div key={step.id} className="flex flex-col items-center text-center px-1 sm:px-2">
                  {/* The Milestone Point / Marker Node (exactly centered in this column) */}
                  <div className="h-8 flex items-center justify-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-brand-periwinkle bg-[#161926] text-brand-periwinkle shadow-[0_0_18px_rgba(167,172,217,0.9)] scale-110'
                          : isCompleted
                          ? 'border-emerald-400 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                          : 'border-white/30 bg-[#161926] text-white/40'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={15} />
                      ) : isActive ? (
                        <span className="size-2 rounded-full bg-brand-periwinkle animate-ping" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-white/40" />
                      )}
                    </div>
                  </div>

                  {/* Stage Name (Directly centered under the point) */}
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <span
                      className={`text-xs ${
                        isActive
                          ? 'text-brand-periwinkle'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.icon}
                    </span>
                    <h3
                      className={`font-h1 text-sm sm:text-base font-bold transition-colors ${
                        isActive
                          ? 'text-white'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-[#8A8FA9]'
                      }`}
                    >
                      {step.name}
                    </h3>
                  </div>

                  {/* Date Range: Uses the EXACT same font (font-h1 / Sora) as the point name */}
                  <p
                    className={`font-h1 text-xs sm:text-sm font-semibold mt-1 tracking-normal tabular-nums ${
                      isActive
                        ? 'text-brand-periwinkle'
                        : isCompleted
                        ? 'text-emerald-300'
                        : 'text-[#8A8FA9]'
                    }`}
                  >
                    {step.rangeText}
                  </p>

                  {/* Status Badge */}
                  <span
                    className={`font-h1 mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'border border-brand-periwinkle/50 bg-brand-periwinkle/20 text-brand-periwinkle animate-pulse'
                        : isCompleted
                        ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                        : 'border border-white/10 bg-white/5 text-[#8A8FA9]'
                    }`}
                  >
                    {step.statusBadge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
