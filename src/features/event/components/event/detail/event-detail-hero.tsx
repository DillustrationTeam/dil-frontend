'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
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
import { PrizeList } from '../prize-list';
import { useLanguage } from '@/context/language-context';

interface EventDetailHeroProps {
  event: EventDetailDto;
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

/** Trạng thái sự kiện → modifier của `.badge` trong hệ Ink & Vermilion. */
function statusBadgeClass(statusStr: string): string {
  if (statusStr === 'Open') return 'badge badge--live';
  if (statusStr === 'Judging') return 'badge badge--soon';
  return 'badge badge--done';
}

export function EventDetailHero({
  event,
  statusLabel,
  statusStr,
  countdown,
  isJuryMember,
  onOpenRulesModal,
  onCopyLink,
}: EventDetailHeroProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const organizer =
    event.createdByAdminName || (isVie ? 'Ban tổ chức Dillustration' : 'Dillustration Committee');
  const startedLabel = new Date(event.submissionStartAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US');
  const countdownText = isVie ? countdown.formattedVie || countdown.formatted : countdown.formatted;
  const countdownLabel = isVie ? countdown.phaseLabelVie || countdown.phaseLabel : countdown.phaseLabel;

  return (
    <>
      <div className="ev-hero__bar">
        <Link href="/events" className="btn btn--ghost btn--sm">
          <ArrowLeft size={15} aria-hidden />
          <span>{isVie ? 'Tất cả cuộc thi' : 'All contests'}</span>
        </Link>

        <div className="ev-hero__actions">
          {isJuryMember && (
            <Link href={`/events/${event.id}/jury`} className="btn btn--primary btn--sm">
              <Gavel size={15} aria-hidden />
              <span>{isVie ? 'Không gian giám khảo' : 'Jury workspace'}</span>
            </Link>
          )}
          <button type="button" onClick={onOpenRulesModal} className="btn btn--outline btn--sm">
            <FileText size={15} aria-hidden />
            <span>{isVie ? 'Thể lệ & quy chế' : 'Rules & guidelines'}</span>
          </button>
          <button type="button" onClick={onCopyLink} className="btn btn--outline btn--sm">
            <Share2 size={15} aria-hidden />
            <span>{isVie ? 'Chia sẻ' : 'Share'}</span>
          </button>
        </div>
      </div>

      <section className="ev-hero">
        <div className="detail__frame">
          <div className="relative aspect-[21/9] min-h-[210px] w-full overflow-hidden bg-[var(--ink-3)]">
            {event.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.bannerUrl} alt={event.title} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[var(--lumen)]/25">
                <Sparkles size={44} aria-hidden />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--ink)]/85 to-transparent" />

            <div className="ev-hero__badges">
              <span className={statusBadgeClass(statusStr)}>{statusLabel}</span>
              {event.isFeatured && (
                <span className="badge badge--soon">
                  <Flame size={12} aria-hidden />
                  {isVie ? 'Nổi bật' : 'Featured'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="ev-hero__meta">
            <span>
              <CheckCircle2 aria-hidden />
              <b>{organizer}</b>
            </span>
            <span>
              <Calendar aria-hidden />
              {isVie ? `Bắt đầu ${startedLabel}` : `Started ${startedLabel}`}
            </span>
          </div>

          <h1 className="ev-hero__title">{event.title}</h1>

          {event.description ? <p className="page-head__sub">{event.description}</p> : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
          <div className="pane ev-hero__prize">
            <p className="eyebrow">
              {isVie ? 'Cơ cấu giải thưởng & danh hiệu' : 'Prize pool & honours'}
            </p>
            {event.prize ? (
              <PrizeList prize={event.prize} size="md" />
            ) : (
              <p className="ev-hero__prize-value">
                {isVie
                  ? 'Cúp & giải thưởng tiền mặt chính thức (sắp công bố)'
                  : 'Trophy & official cash rewards (to be announced)'}
              </p>
            )}
            <p className="ev-hero__note">
              <span>{isVie ? 'Đảm bảo trao giải' : 'Guaranteed distribution'}</span>
              <span className="badge badge--ok">{isVie ? 'Đã công bố' : 'Announced'}</span>
            </p>
          </div>

          <div className="statsline">
            <span>
              <b>{event.submissionCount}</b>
              {isVie ? 'bài dự thi' : 'entries'}
            </span>
            <span>
              <b>{(event.totalVoteCount ?? 0).toLocaleString('en-US')}</b>
              {isVie ? 'lượt bình chọn' : 'votes'}
            </span>
            <span>
              <b>{countdownText}</b>
              {countdownLabel}
            </span>
          </div>
        </div>
      </section>

      {isJuryMember && (countdown.phase === 'Judging' || statusStr === 'Judging') && (
        <div className="pane mt-6 ev-hero__note">
          <div>
            <p className="pane__title">
              {isVie ? 'Không gian đánh giá của ban giám khảo' : 'Official jury evaluation workspace'}
            </p>
            <p className="pane__sub">
              {isVie
                ? 'Chấm điểm độc lập theo tiêu chí và biểu điểm chuẩn hoá.'
                : 'Independent scoring against the published rubric.'}
            </p>
          </div>
          <Link href={`/events/${event.id}/jury`} className="btn btn--primary btn--sm">
            <span>{isVie ? 'Vào chấm thi' : 'Enter workspace'}</span>
            <ExternalLink size={13} aria-hidden />
          </Link>
        </div>
      )}

      <div className="mt-10">
        <EventStageProgress event={event} />
      </div>
    </>
  );
}
