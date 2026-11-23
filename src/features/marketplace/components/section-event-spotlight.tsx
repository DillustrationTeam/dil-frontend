'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { normalizeEventStatus, type EventListItemDto } from '@/features/event/types/event.types';
import type { MarketplaceArtwork } from '../services/marketplace.service';

interface SpotlightArtwork extends MarketplaceArtwork {
  eventId?: string;
  eventTitle?: string;
}

function EventStatusPill({ status, isVie }: { status: string | number; isVie: boolean }) {
  const s = normalizeEventStatus(status);
  if (s === 'Upcoming')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
        {isVie ? 'Chờ mở nộp bài' : 'Upcoming'}
      </span>
    );
  if (s === 'Open')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        {isVie ? 'Đang diễn ra' : 'Submissions Open'}
      </span>
    );
  if (s === 'Judging')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        {isVie ? 'Chấm điểm' : 'Judging Phase'}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--ink-3)] px-2.5 py-0.5 text-xs font-medium text-[var(--ash)]">
      {isVie ? 'Đã kết thúc' : 'Ended'}
    </span>
  );
}

export function SectionEventSpotlight() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [artworks, setArtworks] = useState<SpotlightArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiClient
        .get<ApiResponse<{ items: EventListItemDto[]; totalCount: number }>>('/events', {
          params: { page: 1, pageSize: 4 },
        })
        .then((r) => {
          const list = r.data.data?.items ?? (Array.isArray(r.data.data) ? (r.data.data as unknown as EventListItemDto[]) : []);
          return list;
        })
        .catch(() => [] as EventListItemDto[]),

      apiClient
        .get<ApiResponse<MarketplaceArtwork[]>>('/artworks', { params: { page: 1, pageSize: 6 } })
        .then((r) => r.data.data ?? [])
        .catch(() => [] as MarketplaceArtwork[]),
    ]).then(([evts, arts]) => {
      if (!active) return;
      setEvents(evts.slice(0, 3));
      const approved = (arts as MarketplaceArtwork[]).filter((a) => a.moderationStatus === 'Approved' && a.imageUrl);
      setArtworks(approved.slice(0, 6));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-14">
        <div className="mb-6 h-7 w-56 animate-pulse rounded-xl bg-[var(--ink-2)]" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-[var(--ink-2)] border border-[var(--hair)]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-14" aria-labelledby="event-spotlight-title">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow">Events &amp; Art</p>
          <h2 id="event-spotlight-title" className="mt-1 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            {isVie ? 'Sự kiện nổi bật & Tuyển chọn' : 'Featured Events & Curations'}
          </h2>
          <p className="mt-1 text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
            {isVie
              ? 'Những tác phẩm & cuộc thi nghệ thuật đang thu hút cộng đồng.'
              : 'Community-spotlighted art competitions and curated illustrations.'}
          </p>
        </div>
        <Link href="/events" className="text-sm font-medium text-[var(--lumen)] hover:underline">
          {isVie ? 'Tất cả sự kiện →' : 'All Events →'}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Events column */}
        <div className="space-y-4 lg:col-span-2">
          {events.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
              {isVie ? 'Chưa có sự kiện nào.' : 'No events available.'}
            </p>
          )}
          {events.map((evt) => (
            <Link
              key={evt.id}
              href={`/events/${evt.id}`}
              className="group relative flex overflow-hidden rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] transition hover:border-[var(--hair-2)] hover:shadow-lg"
            >
              {evt.bannerUrl && (
                <div className="relative h-28 w-28 shrink-0 bg-[var(--ink-3)]">
                  <Image
                    src={evt.bannerUrl}
                    alt={evt.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-col justify-between gap-2 p-4">
                <div>
                  <EventStatusPill status={evt.status} isVie={isVie} />
                  <h3 className="mt-2 line-clamp-2 text-sm font-medium text-[var(--ivory)] group-hover:text-[var(--lumen)] transition-colors">
                    {evt.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--ash)]">
                  {isVie ? `${evt.submissionCount} bài dự thi` : `${evt.submissionCount} submissions`} ·{' '}
                  {new Date(evt.submissionEndAt) > new Date()
                    ? `${isVie ? 'Hết hạn' : 'Closes'} ${new Date(evt.submissionEndAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US')}`
                    : isVie ? 'Đã kết thúc nhận bài' : 'Submissions closed'}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/events"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--hair-2)] py-4 text-sm font-medium text-[var(--lumen)] hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)] transition"
          >
            {isVie ? 'Xem tất cả sự kiện →' : 'Explore all events →'}
          </Link>
        </div>

        {/* Featured artworks grid */}
        <div className="lg:col-span-3">
          <p className="eyebrow mb-3 text-xs tracking-widest">
            {isVie ? 'Tác phẩm tuyển chọn' : 'Featured Artworks'}
          </p>
          {artworks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
              {isVie ? 'Chưa có tác phẩm.' : 'No artworks available.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artworks.slice(0, 6).map((art) => (
                <article key={art.id} className="art-card">
                  <Link
                    href={`/artworks/${art.id}`}
                    scroll={false}
                    className="art-card__open block relative"
                    aria-label={`View ${art.title} by ${art.creatorName || (isVie ? 'Họa sĩ' : 'Creator')}`}
                  >
                    <span className="art-card__frame block aspect-square">
                      <span className="art-card__img relative block w-full h-full">
                        <Image
                          src={art.thumbnailUrl || art.imageUrl}
                          alt={art.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </span>
                      <span className="art-card__veil"></span>
                      <span className="art-card__quick">
                        <span className="art-card__zoom flex items-center justify-center" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </span>
                      </span>
                    </span>
                  </Link>
                  <div className="art-card__meta">
                    <h3 className="art-card__title font-[family-name:var(--font-display)] font-medium text-[var(--ivory)] truncate">
                      <Link href={`/artworks/${art.id}`} scroll={false} className="hover:text-[var(--lumen)] transition-colors">
                        {art.title}
                      </Link>
                    </h3>
                    <div className="art-card__sub text-xs text-[var(--ash)] flex items-center gap-1.5">
                      <span className="truncate">{art.creatorName || (isVie ? 'Họa sĩ Dillustration' : 'Dillustration Creator')}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
