'use client';
import { normalizeEventStatus, getEventStatusLabel } from '@/features/event/types/event.types';

import Link from 'next/link';
import Image from 'next/image';

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
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type {  EventListItemDto, EventFilters, EventSortOption, EventStatsDto } from '../../types/event.types';
import { eventService, isFeaturedCarouselEvent, sortEventItems } from '../../services/event.service';
import { EventCard } from './event-card';
import { EventSpotlightHero } from './event-spotlight-hero';
import { EventSearchFilterBar } from './event-search-filter-bar';
import { useLanguage } from '@/context/language-context';

interface EventListScreenProps {
  userId?: string | null;
}

export function EventListScreen({}: EventListScreenProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

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
      // Only fetch the top 5 latest featured contests that have not ended
      const res = await eventService.list({
        isFeatured: true,
        excludeEnded: true,
        sortBy: 'latest',
        pageSize: 5,
      });
      const activeFeatured = sortEventItems(res.items.filter(isFeaturedCarouselEvent), 'latest').slice(0, 5);
      setFeaturedEvents(activeFeatured);
    } catch {
      // Keep existing featured events on transient failure
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

  // Display at most the top 5 latest featured events that have not ended
  const displayFeaturedEvents = useMemo(() => {
    return sortEventItems(featuredEvents.filter(isFeaturedCarouselEvent), 'latest').slice(0, 5);
  }, [featuredEvents]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (contestGridRef.current) {
      contestGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12 text-[#241F1A]">
      {/* 1. Header */}
      <header className="page-head">
        <div>
          <p className="eyebrow">{isVie ? 'Cuộc thi & sự kiện' : 'Competitions & events'}</p>
          <h1>{isVie ? 'Sân chơi minh hoạ' : 'Illustration contests'}</h1>
          <p className="page-head__sub">
            {isVie
              ? 'Nộp tác phẩm nguyên bản, nhận đánh giá từ hội đồng và tranh giải. Mỗi sự kiện là một căn phòng mở.'
              : 'Submit original work, get jury feedback, compete for prizes. Every event is an open room.'}
          </p>
        </div>
        <div className="page-head__actions">
          <button
            type="button"
            onClick={() => { void loadEvents(); void loadFeaturedEvents(); void loadStats(); }}
            disabled={loading}
            className="btn btn--outline btn--sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden />
            {isVie ? 'Làm mới' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* 2. Quick Highlight Ticker */}
      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-[var(--r-md)] border border-[var(--hair)] bg-[var(--ink-2)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 text-[var(--lumen)]">
            <Award size={14} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              {isVie ? 'Tổng giải thưởng' : 'Total prize pool'}
            </span>
          </div>
          <p className="font-h1 mt-2 text-xl text-[var(--ivory)] sm:text-2xl">{stats.formattedTotalPrizePool}</p>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--ash-dim)]">
            {isVie ? 'Tiền mặt & hợp đồng độc quyền' : 'Cash prizes & exclusive contracts'}
          </span>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--hair)] bg-[var(--ink-2)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 text-[var(--lumen)]">
            <Flame size={14} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              {isVie ? 'Đang mở nộp bài' : 'Open for submissions'}
            </span>
          </div>
          <p className="font-h1 mt-2 text-xl text-[var(--ivory)] sm:text-2xl">
            {stats.openEventsCount} <span className="text-[var(--ash)]">{isVie ? 'cuộc thi' : 'contests'}</span>
          </p>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--ash-dim)]">
            {isVie ? 'Trong thời hạn nhận bài' : 'Active submission windows'}
          </span>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--hair)] bg-[var(--ink-2)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 text-[var(--petrol)]">
            <Sparkles size={14} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              {isVie ? 'Bài dự thi' : 'Submitted artworks'}
            </span>
          </div>
          <p className="font-h1 mt-2 text-xl text-[var(--ivory)] sm:text-2xl">
            {stats.totalSubmissionsCount.toLocaleString('en-US')}{' '}
            <span className="text-[var(--ash)]">{isVie ? 'tác phẩm' : 'artworks'}</span>
          </p>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--ash-dim)]">
            {isVie ? 'Đã quét kiểm bản quyền AI' : 'AI copyright screened'}
          </span>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--hair)] bg-[var(--ink-2)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 text-[var(--petrol)]">
            <ShieldCheck size={14} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              {isVie ? 'Minh bạch & công bằng' : 'Fair & transparent'}
            </span>
          </div>
          <p className="font-h1 mt-2 text-xl text-[var(--ivory)] sm:text-2xl">
            {isVie ? '100% nguyên bản' : '100% original'}
          </p>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--ash-dim)]">
            {isVie ? 'Giám khảo chấm + cộng đồng bình chọn' : 'Jury scoring + public voting'}
          </span>
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
        searchPlaceholder={isVie ? 'Tìm kiếm cuộc thi...' : 'Search contests'}
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
        <div role="alert" className="mb-8 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}

      {/* 6. Event Cards Grid */}
      {loading ? (
        <ul className="ev-index">
          {(events.length ? events : []).map((item) => (
            <li key={item.id}>
              <Link href={`/events/${item.id}`}>
                <span className="ev-index__thumb">
                  {item.bannerUrl ? (
                    <Image src={item.bannerUrl} alt={item.title} fill unoptimized sizes="90px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="ev-index__title block">{item.title}</span>
                  <span className="ev-index__meta">
                    <span>{item.submissionCount} {isVie ? 'bài dự thi' : 'entries'}</span>
                    <span>{isVie ? 'Hạn nộp' : 'Closes'} {new Date(item.submissionEndAt).toLocaleDateString('vi-VN')}</span>
                    {item.prize ? <span>{item.prize}</span> : null}
                  </span>
                </span>
                <span className={`badge ${normalizeEventStatus(item.status) === 'Open' ? 'badge--live' : normalizeEventStatus(item.status) === 'Judging' ? 'badge--soon' : 'badge--done'}`}>
                  {getEventStatusLabel(item.status, isVie)}
                </span>
                <span className="ev-index__arrow" aria-hidden="true"><ArrowRight size={16} /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : error && events.length === 0 ? (
        <div className="my-12 rounded-3xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-10 text-center">
          <Trophy size={42} className="mx-auto text-[#A8321C] mb-3" />
          <h3 className="font-h1 text-xl font-bold text-[#241F1A]">
            {isVie ? 'Không thể tải danh sách cuộc thi' : 'Unable to Load Contests'}
          </h3>
          <p className="mt-1 text-sm text-[#A8321C] max-w-lg mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => void loadEvents()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#A8321C]/20 border border-[#A8321C]/40 px-6 py-2.5 text-xs font-bold text-[#241F1A] cursor-pointer transition hover:bg-[#A8321C]/20"
          >
            <RefreshCw size={14} />
            <span>{isVie ? 'Thử tải lại' : 'Retry Loading'}</span>
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="my-16 rounded-3xl border border-dashed border-[#221E1A]/10 p-12 text-center">
          <Trophy size={42} className="mx-auto text-outline/50 mb-3" />
          <h3 className="font-h1 text-xl font-bold text-[#241F1A]">
            {isVie ? 'Không tìm thấy cuộc thi phù hợp' : 'No matching contests found'}
          </h3>
          <p className="mt-1 text-sm text-[#6E6459] max-w-md mx-auto">
            {isVie
              ? 'Hiện không có sự kiện nào khớp với tiêu chí tìm kiếm. Hãy thử chuyển sang "Tất cả" hoặc xóa từ khóa tìm kiếm.'
              : 'There are currently no events matching your criteria. Try switching to "All (Default)" or clearing your search query.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setKeyword('');
              setPage(1);
            }}
            className="mt-5 rounded-2xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-[#FFFCF6] cursor-pointer transition hover:opacity-90"
          >
            {isVie ? 'Xem tất cả cuộc thi' : 'View All Contests'}
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
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#221E1A]/10 pt-6">
          <p className="text-xs text-[#6E6459]">
            {isVie ? (
              <> Hiển thị <span className="font-semibold text-[#241F1A]">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> -{' '}
                <span className="font-semibold text-[#241F1A]">{Math.min(page * pageSize, totalCount)}</span> trên{' '}
                <span className="font-semibold text-[#241F1A]">{totalCount}</span> cuộc thi </>
            ) : (
              <>
                Showing <span className="font-semibold text-[#241F1A]">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> -{' '}
                <span className="font-semibold text-[#241F1A]">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                <span className="font-semibold text-[#241F1A]">{totalCount}</span> contests
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 text-xs font-semibold text-[#6E6459] transition hover:border-[#221E1A]/20 hover:bg-[#F0E7D8] hover:text-[#241F1A] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>{isVie ? 'Trước' : 'Previous'}</span>
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
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#6E6459]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => handlePageChange(Number(item))}
                      className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition cursor-pointer ${
                        page === item
                          ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[0_4px_15px_rgba(167,172,217,0.3)]'
                          : 'border border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#221E1A]/20 hover:bg-[#F0E7D8] hover:text-[#241F1A]'
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
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 text-xs font-semibold text-[#6E6459] transition hover:border-[#221E1A]/20 hover:bg-[#F0E7D8] hover:text-[#241F1A] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <span>{isVie ? 'Tiếp' : 'Next'}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 8. Information & Rules Guide Section */}
      <section className="mt-20 rounded-[2.5rem] border border-[#221E1A]/10 bg-gradient-to-r from-[#FFFCF6]/90 via-[#F7F2E9]/90 to-[#FFFCF6]/90 p-8 sm:p-12 backdrop-blur-2xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-periwinkle flex items-center gap-1.5">
              <HelpCircle size={15} /> {isVie ? 'Hướng dẫn tham gia cho Họa sĩ' : 'Artist Participation Guide'}
            </span>
            <h2 className="font-h1 text-2xl sm:text-3xl font-extrabold text-[#241F1A]">
              {isVie ? 'Quy chế, Thể lệ & Hệ thống Đánh giá' : 'Rules, Guidelines & Evaluation System'}
            </h2>
            <p className="text-xs text-[#6E6459] leading-relaxed">
              {isVie
                ? 'Các cuộc thi Dillustration được tổ chức thường xuyên nhằm tôn vinh sự sáng tạo, trao quyền cho họa sĩ và kết nối các nhà sáng tạo với nhà sưu tập và các dự án thương mại lớn.'
                : 'Dillustration competitions are hosted regularly to celebrate creativity, empower artists, and connect creators with collectors and major commercial projects.'}
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#241F1A] text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-brand-periwinkle/20 text-brand-periwinkle font-mono text-xs">1</span>
                {isVie ? 'Chỉ chấp nhận tác phẩm nguyên bản' : 'Original Artworks Only'}
              </div>
              <p className="text-[#6E6459] leading-relaxed">
                {isVie
                  ? 'Bài dự thi phải là 100% tác phẩm do chính bạn sáng tác. Các tác phẩm được tự động xác minh tính xác thực bản quyền và ngưỡng can thiệp của AI.'
                  : 'Your submission must be 100% your own creation. Works are automatically verified for copyright authenticity and AI intervention thresholds.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#241F1A] text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#8A6A1F]/20 text-[#8A6A1F] font-mono text-xs">2</span>
                {isVie ? 'Đánh giá chuyên môn BGK' : 'Jury Technical Review'}
              </div>
              <p className="text-[#6E6459] leading-relaxed">
                {isVie
                  ? 'Hội đồng giám khảo chuyên môn chấm điểm bài thi dựa trên tính sáng tạo, kỹ thuật thực hiện, bố cục màu sắc và tính độc bản.'
                  : 'Our professional jury panel evaluates submissions across creativity, technical execution, color composition, and originality.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#241F1A] text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#2F6B63]/20 text-[#2F6B63] font-mono text-xs">3</span>
                {isVie ? 'Bình chọn cộng đồng' : 'Community Voting'}
              </div>
              <p className="text-[#6E6459] leading-relaxed">
                {isVie
                  ? 'Mỗi thành viên cộng đồng đã xác minh nhận được lượt bình chọn cố định để ủng hộ nghệ sĩ yêu thích cho giải thưởng Bình chọn Cộng đồng.'
                  : 'Every verified community member receives fixed votes to support their favorite artists for the Community Choice Award.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#241F1A] text-sm">
                <span className="flex size-6 items-center justify-center rounded-lg bg-brand-periwinkle/20 text-brand-periwinkle font-mono text-xs">4</span>
                {isVie ? 'Giải thưởng & Hợp đồng' : 'Awards & Contracts'}
              </div>
              <p className="text-[#6E6459] leading-relaxed">
                {isVie
                  ? 'Giải thưởng được giải ngân trực tiếp vào ví Dillustration hoặc tài khoản ngân hàng liên kết của bạn, kèm chứng nhận bản quyền có thể xác thực.'
                  : 'Prizes are disbursed directly into your Dillustration wallet or linked bank account, accompanied by verifiable copyright certificates.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
