'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Sparkles,
  Share2,
  CheckCircle2,
  Flame,
  FileText,
  ExternalLink,
  Gavel,
} from 'lucide-react';
import type { EventDetailDto } from '@/features/event/types/event.types';
import { EventStageProgress } from '../event-stage-progress';
import { useLanguage } from '@/context/language-context';

interface EventDetailHeroProps {
  event: EventDetailDto;
  statusColor: string;
  statusLabel: string;
  statusStr: string;
  countdown: {
    phase: string;
    phaseLabel: string;
    phaseLabelVie?: string;
    formatted: string;
    formattedVie?: string;
  };
  isCreator: boolean;
  isJuryMember?: boolean;
  onOpenRulesModal: () => void;
  onCopyLink: () => void;
}

export function EventDetailHero({
  event,
  statusColor,
  statusLabel,
  statusStr,
  countdown,
  isCreator,
  isJuryMember,
  onOpenRulesModal,
  onCopyLink,
}: EventDetailHeroProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <>
      {/* Top Bar Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft size={15} />
          <span>{isVie ? 'Tất cả cuộc thi' : 'All Contests'}</span>
        </Link>

        <div className="flex items-center gap-3">
          {isJuryMember && (
            <Link
              href={`/events/${event.id}/jury`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#A7ACD9]/40 bg-[#A7ACD9]/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-[#A7ACD9]/25 hover:border-[#A7ACD9] shadow-sm"
            >
              <Gavel size={15} className="text-[#A7ACD9]" />
              <span>{isVie ? 'Không gian giám khảo' : 'Jury Workspace'}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenRulesModal}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <FileText size={15} />
            <span>{isVie ? 'Thể lệ & Quy chế' : 'Rules & Guidelines'}</span>
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <Share2 size={15} />
            <span>{isVie ? 'Chia sẻ' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161926] shadow-2xl">
        {/* Banner image */}
        <div className="relative aspect-[21/9] w-full min-h-[260px] overflow-hidden bg-black/50">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerUrl} alt={event.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-r from-[#1b1f36] to-[#121420]">
              <Sparkles size={48} className="text-brand-periwinkle/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161926] via-[#161926]/60 to-black/30" />

          {/* Badges on Banner */}
          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 text-xs font-bold backdrop-blur-md ${statusColor}`}>
              {statusLabel}
            </span>
            {event.isFeatured && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <Flame size={13} className="text-amber-400" />
                {isVie ? 'Cuộc thi Nổi bật' : 'Featured Contest'}
              </span>
            )}
          </div>
        </div>

        {/* Content Details Below Banner */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-8 -mt-16 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#8A8FA9]">
              <span className="flex items-center gap-1 font-semibold text-white">
                <CheckCircle2 size={15} className="text-brand-periwinkle" />
                {event.createdByAdminName || (isVie ? 'Ban tổ chức Dillustration' : 'Dillustration Committee')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />{' '}
                {isVie
                  ? `Bắt đầu ${new Date(event.submissionStartAt).toLocaleDateString('vi-VN')}`
                  : `Started ${new Date(event.submissionStartAt).toLocaleDateString('en-US')}`}
              </span>
            </div>

            <h1 className="font-h1 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>

            <p className="text-sm sm:text-base text-[#A7ACD9] leading-relaxed max-w-4xl">
              {event.description}
            </p>
          </div>

          {/* Prestigious Prize Pool Showcase Box */}
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_30px_rgba(251,191,36,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                <Trophy size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
                    {isVie ? 'Cơ cấu giải thưởng & Danh hiệu' : 'Official Prize Pool & Honors'}
                  </span>
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-amber-300/80 font-medium">
                    {isVie ? 'Đảm bảo trao giải' : 'Guaranteed Distribution'}
                  </span>
                </div>
                <div className="font-h1 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-relaxed break-words whitespace-pre-line">
                  {event.prize || (isVie ? 'Cúp & Giải thưởng tiền mặt chính thức (Sắp công bố)' : 'Trophy & Official Cash Rewards (To Be Announced)')}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">
                {isVie ? 'Bài dự thi' : 'Submissions'}
              </span>
              <p className="mt-1 font-h1 text-lg sm:text-xl font-bold text-white">
                {event.submissionCount} {isVie ? 'bài' : 'entries'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                {isVie ? 'Tổng lượt bình chọn' : 'Total Community Votes'}
              </span>
              <p className="mt-1 font-h1 text-lg sm:text-xl font-bold text-white">
                {(event.totalVoteCount ?? 0).toLocaleString('en-US')}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">
                {isVie ? (countdown.phaseLabelVie || countdown.phaseLabel) : countdown.phaseLabel}
              </span>
              <p className="mt-1 font-mono text-base sm:text-lg font-bold text-white">
                {isVie ? (countdown.formattedVie || countdown.formatted) : countdown.formatted}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jury Judging Callout Banner */}
      {isJuryMember && (countdown.phase === 'Judging' || statusStr === 'Judging') && (
        <div className="mt-8 rounded-2xl border border-[#A7ACD9]/30 bg-gradient-to-r from-[#A7ACD9]/15 via-[#A7ACD9]/5 to-transparent p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#A7ACD9]/20 text-[#A7ACD9] border border-[#A7ACD9]/30">
              <Gavel size={22} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-white text-sm sm:text-base">
                {isVie ? 'Không gian Đánh giá của Ban giám khảo' : 'Official Jury Evaluation Workspace'}
              </h4>
              <p className="text-xs text-[#A7ACD9] mt-0.5">
                {isVie
                  ? 'Tiến hành chấm điểm độc lập dựa trên tiêu chí và biểu điểm chuẩn hóa.'
                  : 'Conduct independent blind evaluations based on established criteria and rubrics.'}
              </p>
            </div>
          </div>
          <Link
            href={`/events/${event.id}/jury`}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#A7ACD9] to-[#7FD5E8] hover:brightness-110 text-[#1F2335] text-xs font-bold font-sora flex items-center gap-2 transition-all shadow-md"
          >
            <span>{isVie ? 'Vào không gian chấm thi' : 'Enter Jury Workspace'}</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      )}

      {/* Progress Bar with Dual Endpoints for Each Stage */}
      <div className="mt-10">
        <EventStageProgress event={event} />
      </div>
    </>
  );
}
