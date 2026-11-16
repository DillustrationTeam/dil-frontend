'use client';

import React from 'react';
import { Megaphone, Lock, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const canPublish =
    !isContestResultsPublished &&
    !isPublishing &&
    checklist.disputesResolved &&
    (checklist.headJurySignOff || isAwardAllocationsConfirmed);

  return (
    <aside className="glass-container p-6 rounded-2xl space-y-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sora text-white">
          {isVie ? 'Danh mục kiểm toán công bố' : 'Release Audit Checklist'}
        </h2>
        <span className="text-xs text-[#9695a1] font-mono">
          {Object.values(checklist).filter((v) => v === true).length}/4 {isVie ? 'Đã xác minh' : 'Verified'}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* 1. Event Period Concluded */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">
            {isVie ? 'Thời gian sự kiện đã kết thúc' : 'Event Period Concluded'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.eventConcluded
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {checklist.eventConcluded ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> {isVie ? 'Hoàn thành' : 'Completed'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {isVie ? 'Đang diễn ra' : 'In Progress'}
              </span>
            )}
          </span>
        </div>

        {/* 2. Jury Evaluations Completed */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">
            {isVie ? 'Ban giám khảo đã chấm điểm xong' : 'All Jury Evaluations Completed'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.juryEvaluationsDone
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {checklist.juryEvaluationsDone ? (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={11} /> {isVie ? 'Hoàn thành' : 'Completed'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {checklist.juryCount > 0 ? (isVie ? `${checklist.juryCount} Giám khảo` : `${checklist.juryCount} Juries`) : (isVie ? 'Chờ chấm' : 'Pending')}
              </span>
            )}
          </span>
        </div>

        {/* 3. Disputes & Arbitrations Resolved */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">
            {isVie ? 'Tranh chấp & Khiếu nại đã giải quyết' : 'Disputes & Arbitrations Resolved'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              checklist.disputesResolved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {checklist.disputesResolved ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> {isVie ? 'Hoàn thành' : 'Completed'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle size={11} /> {checklist.openDisputesCount} {isVie ? 'Chưa xử lý' : 'Open'}
              </span>
            )}
          </span>
        </div>

        {/* 4. Head Jury Sign-Off Complete */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-white font-medium">
            {isVie ? 'Trưởng ban giám khảo đã ký duyệt' : 'Head Jury Sign-Off Complete'}
          </span>
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
                  ? (isVie ? `Đã ký (${new Date(checklist.headJurySignedOffAt).toLocaleDateString('vi-VN')})` : `Signed Off (${new Date(checklist.headJurySignedOffAt).toLocaleDateString()})`)
                  : (isVie ? 'Đã ký duyệt' : 'Signed Off')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {isVie ? 'Chờ ký duyệt' : 'Pending Sign-Off'}
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
        className="commission-primary w-full py-3 px-4 rounded-xl font-sora text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Megaphone className="w-4 h-4" />
        <span>
          {isContestResultsPublished
            ? (isVie ? 'Kết quả đã công bố chính thức' : 'Results Officially Published')
            : isPublishing
            ? (isVie ? 'Đang công bố kết quả...' : 'Publishing Results...')
            : (isVie ? 'Công bố kết quả chính thức' : 'Publish Official Results')}
        </span>
      </button>

      <div className="p-3 rounded-xl border-l-4 border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs text-[#c7c5cf] leading-relaxed flex items-start gap-2">
        <Lock className="w-4 h-4 text-[#A7ACD9] shrink-0 mt-0.5" />
        <span>
          {isVie
            ? 'Công bố sẽ tạo ảnh chụp bất biến kết quả cuộc thi và công bố người chiến thắng lên Bảng vinh danh và Bảng xếp hạng.'
            : 'Publishing generates an immutable snapshot of contest results and officially reveals winners on the public Wall of Fame and Leaderboard.'}
        </span>
      </div>
    </aside>
  );
}
