'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { normalizeEventStatus, type EventListItemDto } from '@/features/event/types/event.types';

function EventStatusBadge({ status, isVie }: { status: string | number; isVie: boolean }) {
  const s = normalizeEventStatus(status);
  if (s === 'Upcoming') {
    return (
      <span className="badge badge--soon">
        {isVie ? 'Chờ mở nộp bài' : 'Upcoming'}
      </span>
    );
  }
  if (s === 'Open') {
    return (
      <span className="badge badge--live">
        <span className="dot dot--pulse" />
        {isVie ? 'Đang diễn ra' : 'Submissions Open'}
      </span>
    );
  }
  if (s === 'Judging') {
    return (
      <span className="badge badge--info">
        {isVie ? 'Chấm điểm' : 'Judging Phase'}
      </span>
    );
  }
  return (
    <span className="badge badge--done">
      {isVie ? 'Đã kết thúc' : 'Ended'}
    </span>
  );
}

function getEventEyebrow(status: string | number, isVie: boolean): string {
  const s = normalizeEventStatus(status);
  if (s === 'Open') return isVie ? 'Đang mở nhận bài' : 'Open call';
  if (s === 'Upcoming') return isVie ? 'Sắp diễn ra' : 'Upcoming call';
  if (s === 'Judging') return isVie ? 'Đang chấm điểm' : 'In judging';
  return isVie ? 'Sự kiện đã qua' : 'Past event';
}

export function SectionEventSpotlight() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiClient
      .get<ApiResponse<{ items: EventListItemDto[]; totalCount: number }>>('/events', {
        params: { page: 1, pageSize: 3 },
      })
      .then((r) => {
        if (!active) return;
        const list =
          r.data.data?.items ??
          (Array.isArray(r.data.data) ? (r.data.data as unknown as EventListItemDto[]) : []);
        setEvents(list.slice(0, 3));
      })
      .catch(() => {
        if (!active) return;
        setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-14">
        <div className="mb-6 h-7 w-56 animate-pulse rounded-xl bg-[var(--ink-2)]" />
        <div className="evt-grid">
          <div className="h-72 animate-pulse rounded-[var(--r-lg)] border border-[var(--hair)] bg-[var(--ink-2)]" />
          <div className="evt__side">
            <div className="h-72 animate-pulse rounded-[var(--r-lg)] border border-[var(--hair)] bg-[var(--ink-2)]" />
            <div className="h-72 animate-pulse rounded-[var(--r-lg)] border border-[var(--hair)] bg-[var(--ink-2)]" />
          </div>
        </div>
      </section>
    );
  }

  const primaryEvent = events[0];
  const secondaryEvents = events.slice(1, 3);

  return (
    <section className="py-14" aria-labelledby="event-spotlight-title">
      {/* Header */}
      <div className="section-head">
        <div>
          <p className="eyebrow">Events &amp; Art</p>
          <h2 id="event-spotlight-title" className="font-[family-name:var(--font-display)] font-medium text-[var(--ivory)]">
            {isVie ? 'Sự kiện nổi bật' : 'Featured Events'}
          </h2>
          <p className="font-[family-name:var(--font-ui)]">
            {isVie
              ? 'Các cuộc thi sáng tác và tuyển chọn cộng đồng đang diễn ra.'
              : 'Community-spotlighted art competitions and open calls.'}
          </p>
        </div>
        <Link href="/events" className="link-more">
          {isVie ? 'Tất cả sự kiện →' : 'All events →'}
        </Link>
      </div>

      {!primaryEvent ? (
        <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
          {isVie ? 'Chưa có sự kiện nào.' : 'No events available.'}
        </p>
      ) : (
        <div className={secondaryEvents.length > 0 ? 'evt-grid' : 'grid grid-cols-1'}>
          <article className="evt">
            <div className="evt__art bg-[var(--ink-3)]">
              {primaryEvent.bannerUrl ? (
                <div className="pic">
                  <Image
                    src={primaryEvent.bannerUrl}
                    alt={primaryEvent.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <EventStatusBadge status={primaryEvent.status} isVie={isVie} />
            </div>
            <div className="evt__body">
              <p className="eyebrow">{getEventEyebrow(primaryEvent.status, isVie)}</p>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[var(--ivory)]">
                {primaryEvent.title}
              </h3>
              {primaryEvent.description && (
                <p className="line-clamp-3">{primaryEvent.description}</p>
              )}
              <div className="evt__facts">
                <span className="tag">
                  {isVie ? `${primaryEvent.submissionCount} bài dự thi` : `${primaryEvent.submissionCount} entries`}
                </span>
                <span className="tag">
                  {new Date(primaryEvent.submissionEndAt) > new Date()
                    ? `${isVie ? 'Hết hạn' : 'Closes'} ${new Date(primaryEvent.submissionEndAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US')}`
                    : isVie
                      ? 'Đã đóng nhận bài'
                      : 'Submissions closed'}
                </span>
                {primaryEvent.prize && (
                  <span className="tag truncate max-w-[14rem]">{primaryEvent.prize}</span>
                )}
              </div>
              <Link className="btn btn--outline btn--sm" href={`/events/${primaryEvent.id}`}>
                {isVie ? 'Xem thể lệ →' : 'Read the brief →'}
              </Link>
            </div>
          </article>

          {secondaryEvents.length > 0 && (
            <div className="evt__side">
              {secondaryEvents.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/events/${evt.id}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--hair)] bg-[var(--ink-2)] transition hover:border-[var(--hair-2)] hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--ink-3)]">
                    {evt.bannerUrl && (
                      <Image
                        src={evt.bannerUrl}
                        alt={evt.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute left-3 top-3 z-[2]">
                      <EventStatusBadge status={evt.status} isVie={isVie} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-base font-medium leading-snug text-[var(--ivory)] transition-colors group-hover:text-[var(--lumen)]">
                        {evt.title}
                      </h3>
                    </div>
                    <div className="evt__facts">
                      <span className="tag">
                        {isVie ? `${evt.submissionCount} bài dự thi` : `${evt.submissionCount} entries`}
                      </span>
                      <span className="tag">
                        {new Date(evt.submissionEndAt) > new Date()
                          ? `${isVie ? 'Hết hạn' : 'Closes'} ${new Date(evt.submissionEndAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US')}`
                          : isVie
                            ? 'Đã đóng'
                            : 'Closed'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
