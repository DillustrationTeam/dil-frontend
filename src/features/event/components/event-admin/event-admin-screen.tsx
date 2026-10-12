'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Trophy,
  RefreshCw,
  PlusCircle,
  Search,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import type { EventListItemDto, EventFilters, EventSortOption, EventStatsDto } from '../../types/event.types';
import { eventService } from '../../services/event.service';
import { EventCard } from '../event/event-card';

import { PermissionsTab } from './permissions-tab/permissions-tab';
import { PublishTab } from './publish-tab/publish-tab';

export type AdminEventsTab = 'create' | 'permissions' | 'publish';

const mockEventsList: EventListItemDto[] = [
  {
    id: 'aur-2026',
    title: 'AURA 2026: Beyond the Visible',
    bannerUrl:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    description: 'Digital illustration contest themed Beyond the Visible.',
    prize: '120,000,000 VND · 6 Categories',
    rules: 'Each artist may submit up to 2 original artworks.',
    maxVote: 5,
    status: 'Open',
    submissionStartAt: '2026-10-01T09:00:00Z',
    submissionEndAt: '2026-11-30T20:00:00Z',
    judgingStartAt: '2026-12-01T09:00:00Z',
    judgingEndAt: '2026-12-15T20:00:00Z',
    votingStartAt: '2026-10-01T09:00:00Z',
    votingEndAt: '2026-11-30T20:00:00Z',
    resultAnnouncementAt: '2026-12-20T18:00:00Z',
    submissionCount: 248,
    totalVoteCount: 1420,
    createdAt: '2026-09-15T00:00:00Z',
    isFeatured: true,
  },
  {
    id: 'cyber-2026',
    title: 'CYBERPUNK 2026: Neo Illustrators',
    bannerUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    description: 'Futuristic sci-fi and cyberpunk character design challenge.',
    prize: '80,000,000 VND · 4 Categories',
    rules: 'High-tech neo theme. Max 3 submissions per creator.',
    maxVote: 3,
    status: 'Judging',
    submissionStartAt: '2026-08-01T09:00:00Z',
    submissionEndAt: '2026-09-30T20:00:00Z',
    judgingStartAt: '2026-10-01T09:00:00Z',
    judgingEndAt: '2026-10-20T20:00:00Z',
    votingStartAt: '2026-08-01T09:00:00Z',
    votingEndAt: '2026-09-30T20:00:00Z',
    resultAnnouncementAt: '2026-10-25T18:00:00Z',
    submissionCount: 182,
    totalVoteCount: 980,
    createdAt: '2026-07-10T00:00:00Z',
    isFeatured: false,
  },
  {
    id: 'fantasy-2026',
    title: 'FANTASY WORLDS: Mythic Realms',
    bannerUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    description: 'Enchanted environments and epic fantasy concept art contest.',
    prize: '50,000,000 VND · 3 Categories',
    rules: 'Original fantasy worlds only. AI generation strictly prohibited.',
    maxVote: 3,
    status: 'Draft',
    submissionStartAt: '2026-11-01T09:00:00Z',
    submissionEndAt: '2026-12-31T20:00:00Z',
    judgingStartAt: '2027-01-01T09:00:00Z',
    judgingEndAt: '2027-01-15T20:00:00Z',
    votingStartAt: '2026-11-01T09:00:00Z',
    votingEndAt: '2026-12-31T20:00:00Z',
    resultAnnouncementAt: '2027-01-20T18:00:00Z',
    submissionCount: 0,
    totalVoteCount: 0,
    createdAt: '2026-09-28T00:00:00Z',
    isFeatured: false,
  },
];

const emptySubscribe = () => () => {};

export function EventAdminScreen() {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeTab, setActiveTab] = useState<AdminEventsTab>('create');
  const [events, setEvents] = useState<EventListItemDto[]>(mockEventsList);
  const [loading, setLoading] = useState(false);

  // Delete Event Modal state
  const [eventToDelete, setEventToDelete] = useState<EventListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Pagination
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<EventSortOption>('latest');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(9);

  const contestGridRef = useRef<HTMLDivElement>(null);

  const [, setStats] = useState<EventStatsDto>({
    totalPrizePool: 0,
    formattedTotalPrizePool: '0 đ',
    openEventsCount: 0,
    totalSubmissionsCount: 0,
    totalEventsCount: 0,
  });

  const refreshEvents = async () => {
    setLoading(true);
    try {
      const filters: EventFilters = {
        status: status || undefined,
        sortBy,
        search: keyword.trim() || undefined,
        page,
        pageSize,
      };
      const [res, statsData] = await Promise.all([
        eventService.list(filters),
        eventService.getStats().catch(() => null),
      ]);
      if (res?.items && res.items.length > 0) {
        setEvents(res.items);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const filters: EventFilters = {
          status: status || undefined,
          sortBy,
          search: keyword.trim() || undefined,
          page,
          pageSize,
        };
        const [res, statsData] = await Promise.all([
          eventService.list(filters),
          eventService.getStats().catch(() => null),
        ]);
        if (!ignore) {
          if (res?.items && res.items.length > 0) {
            setEvents(res.items);
          }
          if (statsData) {
            setStats(statsData);
          }
        }
      } catch {
        // Keep mock events if network request fails
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [status, sortBy, keyword, page, pageSize]);

  const handleDeleteEventClick = (evt: EventListItemDto) => {
    setEventToDelete(evt);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await eventService.delete(eventToDelete.id);
      toast.success(`Event "${eventToDelete.title}" deleted successfully.`);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      void eventService.getStats().then((data) => setStats(data)).catch(() => {});
      setEventToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 text-[#e4e1e5]">
      {/* 1. Header Title Section */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
            <Trophy size={13} className="text-amber-300" />
            <span>Admin Center · Event Operations</span>
          </div>

          <h1 className="font-h1 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Illustration Contests & Events
          </h1>

          <p className="mt-2 text-sm text-[#A7ACD9] leading-relaxed max-w-3xl">
            Manage platform illustration contests, configure submission rules, assign jury panel permissions, and publish verified contest results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void refreshEvents();
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-95 cursor-pointer"
            title="Refresh contest list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-periwinkle' : 'text-brand-periwinkle'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs Bar (Directly under Illustration Contests & Events title) */}
      <nav className="glass-container rounded-2xl p-1.5 backdrop-blur-xl bg-[#121620]/90 flex gap-1.5 overflow-x-auto mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-brand-periwinkle text-brand-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#aaa8b3] hover:text-white hover:bg-white/5'
          }`}
        >
          Event Management
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-brand-periwinkle text-brand-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#aaa8b3] hover:text-white hover:bg-white/5'
          }`}
        >
          Jury Permissions
        </button>
        <button
          onClick={() => setActiveTab('publish')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'publish'
              ? 'bg-brand-periwinkle text-brand-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#aaa8b3] hover:text-white hover:bg-white/5'
          }`}
        >
          Publish Results
        </button>
      </nav>

      {/* 3. Active Tab Content */}
      <div ref={contestGridRef}>
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Filter Bar - ONLY present in Event Management Tab */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-[#161926]/80 backdrop-blur-xl mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-periwinkle" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search contests..."
                  className="w-full h-10 pl-9 pr-4 bg-[#090b12]/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-periwinkle"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status Dropdown */}
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 px-3.5 bg-[#090b12]/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-periwinkle cursor-pointer"
                >
                  <option value="" className="bg-[#1f2335]">All Statuses</option>
                  <option value="Open" className="bg-[#1f2335]">Open</option>
                  <option value="Judging" className="bg-[#1f2335]">Judging</option>
                  <option value="Ended" className="bg-[#1f2335]">Ended</option>
                  <option value="Draft" className="bg-[#1f2335]">Draft</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as EventSortOption);
                    setPage(1);
                  }}
                  className="h-10 px-3.5 bg-[#090b12]/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-periwinkle cursor-pointer"
                >
                  <option value="latest" className="bg-[#1f2335]">Latest Created</option>
                  <option value="title_asc" className="bg-[#1f2335]">Title (A-Z)</option>
                  <option value="most_submissions" className="bg-[#1f2335]">Most Submissions</option>
                  <option value="ending_soon" className="bg-[#1f2335]">Ending Soon</option>
                </select>

                {/* "+ Create Event" Button - Navigates to /admin/events/create */}
                <button
                  type="button"
                  onClick={() => router.push('/admin/events/create')}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create Event</span>
                </button>
              </div>
            </div>

            {/* Event Cards Grid */}
            {events.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#161926]/50 p-12 text-center text-outline">
                <Layers className="mx-auto h-12 w-12 text-brand-periwinkle/40 mb-3" />
                <p className="text-base font-semibold text-white">No contests found</p>
                <p className="mt-1 text-xs text-[#8A8FA9]">Try adjusting your search query or filter options.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    adminActions={{
                      onViewDetails: () => router.push(`/events/${evt.id}`),
                      onUpdate: () => router.push(`/admin/events/edit/${evt.id}`),
                      onDelete: () => handleDeleteEventClick(evt),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'publish' && <PublishTab />}
      </div>

      {/* Delete Event Confirmation Modal */}
      {mounted && eventToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#161926] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-h1">Delete Event</h3>
                <p className="text-xs text-red-400 font-medium">Irreversible Action</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">&ldquo;{eventToDelete.title}&rdquo;</span>? All associated submissions, votes, and panel assignments will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

