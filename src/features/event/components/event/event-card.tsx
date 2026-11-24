'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Users, Sparkles, CheckCircle2, Flame, Eye, Edit3, Trash2, FastForward } from 'lucide-react';
import type { EventListItemDto } from '../../types/event.types';
import { getEventStatusLabel, normalizeEventStatus } from '../../types/event.types';
import { useEventCountdown } from '../../hooks/use-event-countdown';
import { PrizeList } from './prize-list';
import { useLanguage } from '@/context/language-context';

interface EventCardProps {
  event: EventListItemDto;
  adminActions?: {
    onViewDetails?: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
    onAdvancePeriod?: () => void;
  };
}

/** Trạng thái → modifier của `.badge` trong hệ Ink & Vermilion. */
function statusBadgeClass(status?: string | number | null): string {
  const norm = normalizeEventStatus(status);
  if (norm === 'Open') return 'badge badge--live';
  if (norm === 'Judging') return 'badge badge--soon';
  return 'badge badge--done';
}

export function EventCard({ event, adminActions }: EventCardProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const countdown = useEventCountdown(event);

  // Ảnh có thể 404 → ẩn <img> để không hiện alt text đè lên badge/tiêu đề
  const [imageFailed, setImageFailed] = useState(false);

  const statusStr = normalizeEventStatus(event.status);
  const statusLabel = getEventStatusLabel(statusStr, isVie);
  const organizer = event.createdByAdminName || (isVie ? 'Ban tổ chức Dillustration' : 'Dillustration Official');

  return (
    <article className="ev-card">
      <Link href={`/events/${event.id}`} className="ev-card__media" aria-label={event.title}>
        {event.bannerUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="ev-card__blank" aria-hidden="true">
            <b>{event.title.trim().charAt(0)}</b>
          </span>
        )}

        <span className="ev-card__head">
          <span className="ev-card__tags">
            <span className={statusBadgeClass(event.status)}>{statusLabel}</span>
            {event.isFeatured && (
              <span className="badge badge--soon">
                <Flame size={11} aria-hidden />
                {isVie ? 'Nổi bật' : 'Featured'}
              </span>
            )}
          </span>

          <span className="badge ev-card__clock" title={isVie ? 'Thời gian còn lại' : 'Time left'}>
            <Clock size={11} aria-hidden />
            <span className="tabular-nums">{isVie ? countdown.formattedVie : countdown.formatted}</span>
          </span>
        </span>
      </Link>

      <div className="ev-card__body">
        <div className="ev-card__who">
          <span>
            <CheckCircle2 aria-hidden />
            <span className="truncate">{organizer}</span>
          </span>
          {!adminActions && (
            <Link href={`/events/${event.id}`}>
              {isVie ? 'Chi tiết' : 'Details'}
              <ArrowUpRight size={13} aria-hidden />
            </Link>
          )}
        </div>

        <h3 className="ev-card__title">
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        {event.description ? <p className="ev-card__desc">{event.description}</p> : null}

        {event.prize && (
          <div className="ev-card__prize">
            <PrizeList prize={event.prize} size="sm" maxRows={4} />
          </div>
        )}
      </div>

      {adminActions ? (
        <div className="ev-card__foot justify-around">
          <button
            type="button"
            title={isVie ? 'Xem chi tiết' : 'View details'}
            onClick={() => adminActions.onViewDetails?.()}
            className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--lumen)] transition hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)]"
          >
            <Eye size={16} />
          </button>

          <button
            type="button"
            title={isVie ? 'Chỉnh sửa sự kiện' : 'Update event'}
            onClick={() => adminActions.onUpdate?.()}
            className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ash)] transition hover:border-[var(--hair-2)] hover:text-[var(--ivory)]"
          >
            <Edit3 size={16} />
          </button>

          {adminActions.onAdvancePeriod && (
            <button
              type="button"
              title={isVie ? 'Chuyển / kết thúc giai đoạn (demo)' : 'End / advance period (demo)'}
              onClick={() => adminActions.onAdvancePeriod?.()}
              className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--petrol)] transition hover:border-[var(--petrol)] hover:bg-[var(--petrol-soft)]"
            >
              <FastForward size={16} />
            </button>
          )}

          <button
            type="button"
            title={isVie ? 'Xoá sự kiện' : 'Delete event'}
            onClick={() => adminActions.onDelete?.()}
            className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--cinnabar-text)] transition hover:border-[var(--cinnabar)] hover:bg-[var(--cinnabar-soft)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="ev-card__foot">
          <span>
            <Users aria-hidden />
            <b>{event.submissionCount}</b>
            {isVie ? 'bài dự thi' : 'entries'}
          </span>
          <span>
            <Sparkles aria-hidden />
            <b>{(event.totalVoteCount ?? 0).toLocaleString('en-US')}</b>
            {isVie ? 'bình chọn' : 'votes'}
          </span>
        </div>
      )}
    </article>
  );
}
