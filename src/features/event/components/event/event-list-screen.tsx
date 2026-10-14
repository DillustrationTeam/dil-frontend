'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Trophy,
  Sparkles,
  RefreshCw,
  Award,
  ShieldCheck,
  Flame,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { EventListItemDto, EventFilters, EventSortOption, EventStatsDto } from '../../types/event.types';
import { eventService, isEventInSubmissionStage } from '../../services/event.service';
import { EventCard } from './event-card';
import { EventSpotlightHero } from './event-spotlight-hero';
import { EventSearchFilterBar } from './event-search-filter-bar';

interface EventListScreenProps {
  userId?: string | null;
}

export function EventListScreen({}: EventListScreenProps) {
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination (Default status: All, Default page: 1, Default pageSize: 9)
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<EventSortOption>('latest');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(9);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const contestGridRef = useRef<HTMLDivElement>(null);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const filters: EventFilters = {
        status: status || undefined,
        sortBy,
        search: keyword.trim() || undefined,
        page,
        pageSize,
      };
      const res = await eventService.list(filters);
      setEvents(res.items);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || res.items.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load events list.');
    } finally {
      setLoading(false);
    }
  }

  const [featuredEvents, setFeaturedEvents] = useState<EventListItemDto[]>([]);

  // Overall event statistics for top ticker cards (independent of page/filters)
  const [stats, setStats] = useState<EventStatsDto>({
    totalPrizePool: 0,
    formattedTotalPrizePool: '0 đ',
    openEventsCount: 0,
    totalSubmissionsCount: 0,
    totalEventsCount: 0,
  });

  async function loadStats() {
    try {
      const data = await eventService.getStats();
      setStats(data);
    } catch {
      // Keep existing stats
    }
  }

  async function loadFeaturedEvents() {
    try {
      // Only fetch featured contests that are Open for submission
      const res = await eventService.list({ isFeatured: true, status: 'Open', pageSize: 5 });
      let list = res.items.filter(isEventInSubmissionStage);

      // If fewer than 5 featured submission contests returned, supplement with active open contests
      if (list.length < 5) {
        const fallbackRes = await eventService.list({ status: 'Open', pageSize: 5 });
        const existingIds = new Set(list.map((e: EventListItemDto) => e.id));
        const extras = fallbackRes.items
          .filter(isEventInSubmissionStage)
          .filter((e: EventListItemDto) => !existingIds.has(e.id));
        list = [...list, ...extras].slice(0, 5);
      }

      setFeaturedEvents(list.slice(0, 5));
    } catch {
      // Keep existing or fallback
    }
  }

  const loadEventsRef = useRef(loadEvents);
  const loadFeaturedEventsRef = useRef(loadFeaturedEvents);
  const loadStatsRef = useRef(loadStats);

  useEffect(() => {
    loadEventsRef.current = loadEvents;
    loadFeaturedEventsRef.current = loadFeaturedEvents;
    loadStatsRef.current = loadStats;
  });

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadFeaturedEventsRef.current();
      await loadStatsRef.current();
    })();
  }, []);

  // Reload events when status, sortBy, or page changes
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadEventsRef.current();
    })();
  }, [status, sortBy, page]);

  // Debounced search trigger (resets to page 1)
  const isSearchFirstMount = useRef(true);
  useEffect(() => {
    if (isSearchFirstMount.current) {
      isSearchFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void loadEventsRef.current();
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Display up to 5 featured events in carousel - ONLY contests currently in the submission stage
  const displayFeaturedEvents = useMemo(() => {
    const validFeatured = featuredEvents.filter(isEventInSubmissionStage);
    if (validFeatured.length > 0) return validFeatured.slice(0, 5);

    const explicitFeatured = events.filter((e) => e.isFeatured && isEventInSubmissionStage(e));
    if (explicitFeatured.length > 0) return explicitFeatured.slice(0, 5);

    return events.filter(isEventInSubmissionStage).slice(0, 5);
  }, [featuredEvents, events]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (contestGridRef.current) {
      contestGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12 text-[#e4e1e5]">
      {/* 1. Header & Page Intro */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
            <Trophy size={13} className="text-amber-300" />
            <span>Art Competitions & Creative Showcase</span>
          </div>

          <h1 className="font-h1 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Illustration Contests & Events
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#A7ACD9] leading-relaxed">
            Showcase your artistic talent with our premier creator community. Submit original artworks, receive professional jury reviews, and compete for prestigious prizes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void loadEvents();
              void loadFeaturedEvents();
              void loadStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-95 cursor-pointer"
            title="Refresh contest list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-periwinkle' : 'text-brand-periwinkle'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Highlight Ticker */}
      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5">
        <div className="glass-container rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Award size={16} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Prize Pool</span>
          </div>
          <p className="mt-2 font-h1 text-xl sm:text-2xl font-extrabold text-white">
            {stats.formattedTotalPrizePool}
          </p>
          <span className="mt-1 block text-[11px] text-[#8A8FA9]">Cash prizes & exclusive contracts</span>
        </div>

        <div className="glass-container rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-brand-periwinkle">
            <Flame size={16} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Open for Submissions</span>
          </div>
          <p className="mt-2 font-h1 text-xl sm:text-2xl font-extrabold text-white">
            {stats.openEventsCount} Contests
          </p>
          <span className="mt-1 block text-[11px] text-[#8A8FA9]">Active submission windows</span>
        </div>

        <div className="glass-container rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <Sparkles size={16} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Submitted Artworks</span>
          </div>
          <p className="mt-2 font-h1 text-xl sm:text-2xl font-extrabold text-white">
            {stats.totalSubmissionsCount.toLocaleString('en-US')} Artworks
          </p>
          <span className="mt-1 block text-[11px] text-[#8A8FA9]">Verified by AI scan</span>
        </div>

        <div className="glass-container rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-[#A7ACD9]">
            <ShieldCheck size={16} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Fair & Transparent</span>
          </div>
          <p className="mt-2 font-h1 text-xl sm:text-2xl font-extrabold text-white">100% Original</p>
          <span className="mt-1 block text-[11px] text-[#8A8FA9]">Jury evaluation + Public voting</span>
        </div>
      </div>

      {/* 3. Featured Art Contests Carousel Showcase (Up to 5) */}
      {displayFeaturedEvents.length > 0 && (
        <EventSpotlightHero events={displayFeaturedEvents} maxItems={5} />
      )}

      {/* 4. Filter & Search Controls Bar */}
      <EventSearchFilterBar
        containerRef={contestGridRef}
        searchQuery={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Search contests"
        statusValue={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        sortValue={sortBy}
        onSortChange={(val) => {
          setSortBy(val as EventSortOption);
          setPage(1);
        }}
      />

      {/* 5. Error Alert if any */}
      {error && (
        <div role="alert" className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* 6. Event Cards Grid */}
      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse rounded-[2rem] border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="aspect-[16/10] w-full rounded-2xl bg-white/10" />
              <div className="h-6 w-3/4 rounded-lg bg-white/10" />
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-10 w-full rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="my-16 rounded-3xl border border-dashed border-white/15 p-12 text-center">
          <Trophy size={42} className="mx-auto text-outline/50 mb-3" />
          <h3 className="font-h1 text-xl font-bold text-white">No matching contests found</h3>
          <p className="mt-1 text-sm text-[#8A8FA9] max-w-md mx-auto">
            There are currently no events matching your criteria. Try switching to &quot;All (Default)&quot; or clearing your search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setKeyword('');
              setPage(1);
            }}
            className="mt-5 rounded-2xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-brand-navy cursor-pointer transition hover:opacity-90"
          >
            View All Contests
          </button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((item) => (
            <EventCard key={item.id} event={item} />
          ))}
        </div>
      )}

      {/* 7. Pagination Controls (9 items per page default) */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-[#8A8FA9]">
            Showing <span className="font-semibold text-white">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> -{' '}
            <span className="font-semibold text-white">{Math.min(page * pageSize, totalCount)}</span> of{' '}
            <span className="font-semibold text-white">{totalCount}</span> contests
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-[#c7c5cf] transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#8A8FA9]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => handlePageChange(Number(item))}
                      className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition cursor-pointer ${
                        page === item
                          ? 'bg-brand-periwinkle text-brand-navy shadow-[0_4px_15px_rgba(167,172,217,0.3)]'
                          : 'border border-white/10 bg-white/5 text-[#c7c5cf] hover:border-white/20 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-[#c7c5cf] transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 8. Information & Rules Guide Section */}
      <section className="mt-20 rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-[#161926]/90 via-[#1F2335]/90 to-[#161926]/90 p-8 sm:p-12 backdrop-blur-2xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-periwinkle flex items-center gap-1.5">
              <HelpCircle size={15} /> Artist Participation Guide
            </span>
            <h2 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white">
              Rules, Guidelines & Evaluation System
            </h2>
            <p className="text-xs text-[#8A8FA9] leading-relaxed">
              Dillustration competitions are hosted regularly to celebrate creativity, empower artists, and connect creators with collectors and major commercial projects.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-brand-periwinkle/20 text-brand-periwinkle font-mono text-xs">1</span>
                Original Artworks Only
              </div>
              <p className="text-[#8A8FA9] leading-relaxed">
                Your submission must be 100% your own creation. Works are automatically verified for copyright authenticity and AI intervention thresholds.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 font-mono text-xs">2</span>
                Jury Technical Review
              </div>
              <p className="text-[#8A8FA9] leading-relaxed">
                Our professional jury panel evaluates submissions across creativity, technical execution, color composition, and originality.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-mono text-xs">3</span>
                Community Voting
              </div>
              <p className="text-[#8A8FA9] leading-relaxed">
                Every verified community member receives fixed votes to support their favorite artists for the Community Choice Award.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-purple-400/20 text-purple-300 font-mono text-xs">4</span>
                Awards & Contracts
              </div>
              <p className="text-[#8A8FA9] leading-relaxed">
                Prizes are disbursed directly into your Dillustration wallet or linked bank account, accompanied by verifiable copyright certificates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
