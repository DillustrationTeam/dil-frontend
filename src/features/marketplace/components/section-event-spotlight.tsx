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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2C6A86]/40 bg-[#2C6A86]/20 px-2.5 py-0.5 text-xs font-medium text-[#2C6A86]">
        {isVie ? 'Chờ mở nộp bài' : 'Upcoming'}
      </span>
    );
  if (s === 'Open')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/20 px-2.5 py-0.5 text-xs font-medium text-[#2F6B63]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2F6B63]/10" />
        {isVie ? 'Đang diễn ra' : 'Submissions Open'}
      </span>
    );
  if (s === 'Judging')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 px-2.5 py-0.5 text-xs font-medium text-[#8A6A1F]">
        {isVie ? 'Chấm điểm' : 'Judging Phase'}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-0.5 text-xs font-medium text-[#746A5F]">
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
        <div className="mb-6 h-7 w-56 animate-pulse rounded-xl bg-[#F0E7D8]" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-[#FFFCF6]" />
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#B24A26]">Events &amp; Art</p>
          <h2 id="event-spotlight-title" className="mt-1 font-h1 text-2xl font-bold text-[#241F1A]">
            {isVie ? 'Sự kiện nổi bật & Tuyển chọn' : 'Featured Events & Curations'}
          </h2>
          <p className="mt-1 text-sm text-[#6E6459]">
            {isVie
              ? 'Những tác phẩm & cuộc thi nghệ thuật đang thu hút cộng đồng.'
              : 'Community-spotlighted art competitions and curated illustrations.'}
          </p>
        </div>
        <Link href="/events" className="text-sm text-[#B24A26] hover:underline">
          {isVie ? 'Tất cả sự kiện →' : 'All Events →'}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Events column */}
        <div className="space-y-4 lg:col-span-2">
          {events.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#221E1A]/10 p-8 text-center text-sm text-[#746A5F]">
              {isVie ? 'Chưa có sự kiện nào.' : 'No events available.'}
            </p>
          )}
          {events.map((evt) => (
            <Link
              key={evt.id}
              href={`/events/${evt.id}`}
              className="group relative flex overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] transition hover:border-[#B24A26]/50"
            >
              {evt.bannerUrl && (
                <div className="relative h-28 w-28 shrink-0 bg-[#FFFCF6]">
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
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[#241F1A]">{evt.title}</h3>
                </div>
                <p className="text-xs text-[#746A5F]">
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
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#221E1A]/10 py-4 text-sm text-[#B24A26] hover:border-[#B24A26]/40 hover:bg-[#FFFCF6]"
          >
            {isVie ? 'Xem tất cả sự kiện →' : 'Explore all events →'}
          </Link>
        </div>

        {/* Featured artworks grid */}
        <div className="lg:col-span-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#746A5F]">
            {isVie ? 'Tác phẩm tuyển chọn' : 'Featured Artworks'}
          </p>
          {artworks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#221E1A]/10 p-8 text-center text-sm text-[#746A5F]">
              {isVie ? 'Chưa có tác phẩm.' : 'No artworks available.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {artworks.map((art, i) => (
                <Link
                  key={art.id}
                  href={`/artworks/${art.id}`}
                  scroll={false}
                  className={`group relative overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] transition hover:border-[#B24A26]/50 ${
                    i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                  }`}
                >
                  <Image
                    src={art.thumbnailUrl || art.imageUrl}
                    alt={art.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#F7F2E9]/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-1 text-xs font-semibold text-[#241F1A]">{art.title}</p>
                    <p className="text-[10px] text-[#241F1A]/70">{art.creatorName || 'Dillustration Creator'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
