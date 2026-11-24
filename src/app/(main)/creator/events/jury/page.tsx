'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Gavel,
  Clock,
  Trophy,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Users,
  Flame,
  Crown,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { eventService, juryService, eventStatusLabels, normalizeEventStatus, EventSearchFilterBar, getEventStatusLabel } from '@/features/event';
import type { EventListItemDto } from '@/features/event';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';

export default function CreatorJuryEventsListPage() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [headJuryMap, setHeadJuryMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const user = useAuthStore((state) => state.user);

  const loadEvents = useCallback(async () => {
    if (!user?.id) {
      setEvents([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      let myCreatorId: string | undefined;
      try {
        const profile = await creatorProfileService.getMyProfile();
        if (profile?.id) myCreatorId = profile.id;
      } catch {
        // ignore optional profile lookup
      }

      // Try fetching user's actual jury assignments by userId / creatorId first
      const myJuries = await juryService.getMyJuryAssignments(user.id, myCreatorId);

      if (myJuries && myJuries.length > 0) {
        const eventIds = Array.from(new Set(myJuries.map((j) => j.eventId)));
        const map: Record<string, boolean> = {};
        myJuries.forEach((j) => {
          if (j.isHeadJury) map[j.eventId] = true;
        });

        const eventList: EventListItemDto[] = [];
        await Promise.all(
          eventIds.map(async (eId) => {
            try {
              const detail = await eventService.detail(eId);
              if (detail) {
                eventList.push({
                  ...detail,
                  isHeadJury: map[detail.id] || false,
                });
              }
            } catch {
              // Ignore failure on individual removed event
            }
          })
        );

        setEvents(eventList);
        setHeadJuryMap(map);
      } else {
        // Fallback: Check event juries with STRICT id matching (never substring/loose name matching)
        const res = await eventService.list({ pageSize: 50 });
        const items = res.items || [];
        const assignedEvents: EventListItemDto[] = [];
        const map: Record<string, boolean> = {};

        await Promise.all(
          items.map(async (evt) => {
            try {
              const juries = await juryService.getEventJuries(evt.id);
              const matchingJury = juries.find((j) => {
                const jCreatorId = j.creatorId?.toLowerCase();
                const jUserId = (j.userId || j.creatorUserId)?.toLowerCase();
                const uId = user.id.toLowerCase();
                const cId = myCreatorId?.toLowerCase();

                if (jUserId && jUserId === uId) return true;
                if (cId && jCreatorId === cId) return true;
                if (jCreatorId === uId) return true;

                return false;
              });

              if (matchingJury) {
                assignedEvents.push(evt);
                if (matchingJury.isHeadJury) {
                  map[evt.id] = true;
                }
              }
            } catch {
              // Ignore network fallback for single event jury lookup
            }
          })
        );

        setEvents(assignedEvents);
        setHeadJuryMap(map);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Không thể tải danh sách cuộc thi được phân công chấm điểm.';
      setLoadError(message);
      setEvents([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const checkIsHeadJury = (evt: EventListItemDto): boolean => {
    if (typeof evt.isHeadJury === 'boolean') return evt.isHeadJury;
    if (headJuryMap[evt.id] !== undefined) return headJuryMap[evt.id];
    return false;
  };

  const filteredEvents = React.useMemo(() => {
    let list = [...events];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter) {
      const filterVal = statusFilter.toLowerCase();
      list = list.filter((e) => {
        const s = String(e.status).toLowerCase();
        if (filterVal === 'open') return s.includes('open') || s === '2';
        if (filterVal === 'judging') return s.includes('judging') || s === '3';
        if (filterVal === 'ended') return s.includes('ended') || s === '4';
        return true;
      });
    }

    // Sort
    if (sortBy === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'ending_soon') {
      list.sort((a, b) => {
        const tA = new Date(a.judgingEndAt || a.submissionEndAt || 0).getTime();
        const tB = new Date(b.judgingEndAt || b.submissionEndAt || 0).getTime();
        return tA - tB;
      });
    } else if (sortBy === 'most_submissions') {
      list.sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [events, searchQuery, statusFilter, sortBy]);

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#221E1A]/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#746A5F] mb-1">
            <Link href="/creator/commissions" className="hover:text-[#241F1A] transition-colors">
              Creator Studio
            </Link>
            <span>/</span>
            <span className="text-[#B24A26]">
              {isVie ? 'Không gian Giám khảo' : 'Jury Workspace'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#241F1A] font-sora flex items-center gap-3">
            <Gavel className="w-7 h-7 text-[#B24A26]" />
            <span>{isVie ? 'Không gian Giám khảo Sự kiện' : 'Event Jury Workspace'}</span>
          </h1>
          <p className="text-sm text-[#746A5F] mt-1">
            {isVie
              ? 'Danh sách các cuộc thi và sự kiện mỹ thuật bạn được mời hoặc phân công làm Thành viên Ban Giám khảo.'
              : 'List of art contests and events where you are invited or assigned as a Jury Member.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadEvents()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 py-2 text-xs font-semibold text-[#241F1A] hover:bg-[#F0E7D8] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#B24A26]' : 'text-[#B24A26]'} />
          <span>{isVie ? 'Làm mới' : 'Refresh'}</span>
        </button>
      </div>

      {/* Shared Filter & Search Bar */}
      {!loading && events.length > 0 && (
        <EventSearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={isVie ? 'Tìm kiếm cuộc thi được phân công...' : 'Search assigned contests...'}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          sortValue={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#746A5F]">
          <RefreshCw className="w-8 h-8 text-[#B24A26] animate-spin" />
          <p className="text-sm">{isVie ? 'Đang tải danh sách sự kiện giám khảo...' : 'Loading jury events...'}</p>
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="text-center py-14 px-6 rounded-2xl bg-[#A8321C]/10 border border-[#A8321C]/40 space-y-3"
        >
          <AlertTriangle className="w-11 h-11 text-[#A8321C] mx-auto" />
          <h3 className="text-lg font-bold text-[#241F1A] font-sora">
            {isVie ? 'Không thể tải danh sách sự kiện Jury' : 'Unable to load Jury events'}
          </h3>
          <p className="text-sm text-[#A8321C] max-w-lg mx-auto">{loadError}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => void loadEvents()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A8321C]/20 hover:bg-[#A8321C]/20 border border-[#A8321C]/40 text-xs font-bold text-[#241F1A] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isVie ? 'Thử tải lại' : 'Retry'}</span>
            </button>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-3">
          <Gavel className="w-12 h-12 text-[#746A5F] mx-auto opacity-50" />
          <h3 className="text-lg font-semibold text-[#241F1A] font-sora">
            {isVie ? 'Không tìm thấy sự kiện phù hợp' : 'No Matching Events Found'}
          </h3>
          <p className="text-sm text-[#746A5F] max-w-md mx-auto">
            {events.length === 0
              ? (isVie
                  ? 'Hiện tại bạn chưa được phân công làm giám khảo cho cuộc thi nào đang trong giai đoạn chấm điểm.'
                  : 'You do not currently have any active contests in the judging phase assigned to you.')
              : (isVie
                  ? 'Không có cuộc thi nào khớp với bộ lọc hiện tại. Hãy thử xóa tìm kiếm hoặc bộ lọc.'
                  : 'There are currently no assigned contests matching your filter criteria. Try clearing search or filter.')}
          </p>
          <div className="pt-2">
            {events.length === 0 ? (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs font-semibold text-[#241F1A] transition-colors"
              >
                <span>{isVie ? 'Khám phá các cuộc thi' : 'Explore Public Contests'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs font-semibold text-[#241F1A] transition-colors cursor-pointer"
              >
                <span>{isVie ? 'Đặt lại tìm kiếm & Bộ lọc' : 'Reset Search & Filters'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isHeadJury = checkIsHeadJury(evt);
            const targetUrl = isHeadJury ? `/creator/events/${evt.id}/head-jury` : `/creator/events/${evt.id}/jury`;
            const isJudging = String(evt.status).toLowerCase().includes('judging') || String(evt.status) === '3';
            const statusStr = normalizeEventStatus(evt.status);
            const statusLabel = getEventStatusLabel(statusStr, isVie);

            return (
              <div
                key={evt.id}
                className="glass-container group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
              >
                <div>
                  {/* Event Banner Container */}
                  <Link
                    href={targetUrl}
                    className="relative block aspect-[16/9] w-full overflow-hidden bg-[#F0E7D8] cursor-pointer"
                  >
                    {evt.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={evt.bannerUrl}
                        alt={evt.title}
                        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#F7F2E9] to-[#FFFCF6] text-xs text-[#746A5F]">
                        <Sparkles size={28} className="text-[#B24A26]/40" />
                      </div>
                    )}

                    {/* Gradient Scrim */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FFFCF6] via-[#FFFCF6]/60 to-transparent"
                      aria-hidden="true"
                    />

                    {/* Badges Overlay on Banner */}
                    <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="badge">
                          {isHeadJury ? (
                            <>
                              <Crown size={11} aria-hidden />
                              {isVie ? 'Trưởng ban' : 'Head jury'}
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={11} aria-hidden />
                              {isVie ? 'Giám khảo' : 'Jury'}
                            </>
                          )}
                        </span>

                        <span className={isJudging ? 'badge badge--soon' : 'badge'}>
                          {isJudging ? (isVie ? 'Giai đoạn chấm điểm' : 'Judging phase') : statusLabel}
                        </span>

                        {evt.isFeatured && (
                          <span className="badge badge--soon">
                            <Flame size={11} aria-hidden />
                            {isVie ? 'Nổi bật' : 'Featured'}
                          </span>
                        )}
                      </div>

                      <span className="badge">
                        <Users size={11} aria-hidden />
                        {evt.submissionCount || 0}
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5">
                    <Link href={targetUrl} className="block">
                      <h3 className="font-sora font-bold text-lg text-[#241F1A] group-hover:text-[#B24A26] transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-[#746A5F] mt-2 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#221E1A]/10 flex items-center justify-between text-xs text-[#6E6459]">
                      <span className="flex items-center gap-1.5 text-[#8A6A1F] font-medium">
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[130px]">{evt.prize || (isVie ? 'Cơ cấu giải thưởng hấp dẫn' : 'Attractive Prize Pool')}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#746A5F] shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isVie ? 'Hạn chót: ' : 'Due: '}{new Date(evt.judgingEndAt || evt.submissionEndAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-1">
                  <Link
                    href={targetUrl}
                    className="commission-primary w-full py-2.5 rounded-xl text-xs font-sora flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    {isHeadJury ? <Crown className="w-4 h-4 text-[#241F1A]" /> : <Gavel className="w-4 h-4" />}
                    <span>
                      {isHeadJury
                        ? (isVie ? 'Vào phòng điều hành Trưởng BGK' : 'Enter Head Jury Control Room')
                        : (isVie ? 'Vào Không gian Chấm thi' : 'Enter Jury Workspace')}
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

