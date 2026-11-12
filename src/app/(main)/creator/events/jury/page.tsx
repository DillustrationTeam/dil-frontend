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
import { eventService, juryService, eventStatusBadgeStyles, eventStatusLabels, normalizeEventStatus, EventSearchFilterBar } from '@/features/event';
import type { EventListItemDto } from '@/features/event';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';

export default function CreatorJuryEventsListPage() {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9695a1] mb-1">
            <Link href="/creator/commissions" className="hover:text-white transition-colors">
              Creator Studio
            </Link>
            <span>/</span>
            <span className="text-[#A7ACD9]">Jury Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sora flex items-center gap-3">
            <Gavel className="w-7 h-7 text-[#A7ACD9]" />
            <span>Event Jury Workspace</span>
          </h1>
          <p className="text-sm text-[#9695a1] mt-1">
            List of art contests and events where you are invited or assigned as a Jury Member.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadEvents()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#A7ACD9]' : 'text-[#A7ACD9]'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Shared Filter & Search Bar */}
      {!loading && events.length > 0 && (
        <EventSearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search assigned contests..."
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          sortValue={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#9695a1]">
          <RefreshCw className="w-8 h-8 text-[#A7ACD9] animate-spin" />
          <p className="text-sm">Loading jury events...</p>
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="text-center py-14 px-6 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3"
        >
          <AlertTriangle className="w-11 h-11 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-white font-sora">Không thể tải danh sách sự kiện Jury</h3>
          <p className="text-sm text-red-200 max-w-lg mx-auto">{loadError}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => void loadEvents()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/25 hover:bg-red-500/35 border border-red-400/40 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử tải lại</span>
            </button>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <Gavel className="w-12 h-12 text-[#9695a1] mx-auto opacity-50" />
          <h3 className="text-lg font-semibold text-white font-sora">No Matching Events Found</h3>
          <p className="text-sm text-[#9695a1] max-w-md mx-auto">
            {events.length === 0
              ? 'You do not currently have any active contests in the judging phase assigned to you.'
              : 'There are currently no assigned contests matching your filter criteria. Try clearing search or filter.'}
          </p>
          <div className="pt-2">
            {events.length === 0 ? (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
              >
                <span>Explore Public Contests</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <span>Reset Search & Filters</span>
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
            const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-[#9695a1]';
            const statusLabel = eventStatusLabels[statusStr] || statusStr;

            return (
              <div
                key={evt.id}
                className="glass-container group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
              >
                <div>
                  {/* Event Banner Container */}
                  <Link
                    href={targetUrl}
                    className="relative block aspect-[16/9] w-full overflow-hidden bg-black/40 cursor-pointer"
                  >
                    {evt.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={evt.bannerUrl}
                        alt={evt.title}
                        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#1F2335] to-[#161926] text-xs text-[#9695a1]">
                        <Sparkles size={28} className="text-[#A7ACD9]/40" />
                      </div>
                    )}

                    {/* Gradient Scrim */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#151926] via-[#151926]/60 to-transparent"
                      aria-hidden="true"
                    />

                    {/* Badges Overlay on Banner */}
                    <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isHeadJury ? (
                          <span className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-md shadow-md">
                            <Crown size={12} className="text-amber-400" />
                            Head Jury
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-brand-periwinkle/40 bg-brand-navy/85 px-2.5 py-0.5 text-[10px] font-semibold text-brand-periwinkle backdrop-blur-md shadow-md">
                            <ShieldCheck size={12} className="text-brand-periwinkle" />
                            Jury
                          </span>
                        )}

                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-all shadow-md ${
                            isJudging
                              ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                              : statusColor
                          }`}
                        >
                          {isJudging ? 'Judging Phase' : statusLabel}
                        </span>
                        {evt.isFeatured && (
                          <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                            <Flame size={11} className="text-amber-400" />
                            Featured
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 rounded-full border border-white/15 bg-[#11131d]/85 px-2.5 py-0.5 font-mono text-[11px] text-white shadow-md backdrop-blur-md">
                        <Users className="w-3 h-3 text-[#A7ACD9]" />
                        <span>{evt.submissionCount || 0}</span>
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5">
                    <Link href={targetUrl} className="block">
                      <h3 className="font-sora font-bold text-lg text-white group-hover:text-[#A7ACD9] transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-[#9695a1] mt-2 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#c7c5cf]">
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[130px]">{evt.prize || 'Attractive Prize Pool'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#9695a1] shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Due: {new Date(evt.judgingEndAt || evt.submissionEndAt).toLocaleDateString('en-US', {
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
                    className={
                      isHeadJury
                        ? 'commission-primary w-full py-2.5 rounded-xl text-xs font-sora flex items-center justify-center gap-2 transition-all shadow-md'
                        : 'commission-primary w-full py-2.5 rounded-xl text-xs font-sora flex items-center justify-center gap-2 transition-all shadow-md'
                    }
                  >
                    {isHeadJury ? <Crown className="w-4 h-4 text-brand-navy" /> : <Gavel className="w-4 h-4" />}
                    <span>{isHeadJury ? 'Enter Head Jury Control Room' : 'Enter Jury Workspace'}</span>
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

