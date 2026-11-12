'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { normalizeEventStatus, type EventListItemDto } from '@/features/event/types/event.types';
import type { MarketplaceArtwork } from '../services/marketplace.service';

interface SpotlightArtwork extends MarketplaceArtwork {
  eventId?: string;
  eventTitle?: string;
}

function EventStatusPill({ status }: { status: string | number }) {
  const s = normalizeEventStatus(status);
  if (s === 'Upcoming')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-950/70 px-2.5 py-0.5 text-xs font-medium text-sky-300">
        Chờ mở nộp bài
      </span>
    );
  if (s === 'Open')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/70 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Đang diễn ra
      </span>
    );
  if (s === 'Judging')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-950/70 px-2.5 py-0.5 text-xs font-medium text-amber-300">
        Chấm điểm
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#919099]">
      Đã kết thúc
    </span>
  );
}

export function SectionEventSpotlight() {
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
        <div className="mb-6 h-7 w-56 animate-pulse rounded-xl bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-white/5" />
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Events &amp; Art</p>
          <h2 id="event-spotlight-title" className="mt-1 font-h1 text-2xl font-bold text-white">
            Sự kiện nổi bật &amp; Tuyển chọn
          </h2>
          <p className="mt-1 text-sm text-[#C7C5CF]">
            Những tác phẩm &amp; cuộc thi nghệ thuật đang thu hút cộng đồng.
          </p>
        </div>
        <Link href="/events" className="text-sm text-[#A7ACD9] hover:underline">
          Tất cả sự kiện →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Events column */}
        <div className="space-y-4 lg:col-span-2">
          {events.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#919099]">
              Chưa có sự kiện nào.
            </p>
          )}
          {events.map((evt) => (
            <Link
              key={evt.id}
              href={`/events/${evt.id}`}
              className="group relative flex overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:border-[#A7ACD9]/50"
            >
              {evt.bannerUrl && (
                <div className="relative h-28 w-28 shrink-0 bg-[#131624]">
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
                  <EventStatusPill status={evt.status} />
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-white">{evt.title}</h3>
                </div>
                <p className="text-xs text-[#919099]">
                  {evt.submissionCount} bài dự thi ·{' '}
                  {new Date(evt.submissionEndAt) > new Date()
                    ? `Hết hạn ${new Date(evt.submissionEndAt).toLocaleDateString('vi-VN')}`
                    : 'Đã kết thúc nhận bài'}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/events"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-4 text-sm text-[#A7ACD9] hover:border-[#A7ACD9]/40 hover:bg-white/[.02]"
          >
            Xem tất cả sự kiện →
          </Link>
        </div>

        {/* Featured artworks grid */}
        <div className="lg:col-span-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#919099]">Tác phẩm tuyển chọn</p>
          {artworks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#919099]">
              Chưa có tác phẩm.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {artworks.map((art, i) => (
                <Link
                  key={art.id}
                  href={`/artworks/${art.id}`}
                  scroll={false}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[#131624] transition hover:border-[#A7ACD9]/50 ${
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-1 text-xs font-semibold text-white">{art.title}</p>
                    <p className="text-[10px] text-white/70">{art.creatorName || 'Dillustration Creator'}</p>
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
