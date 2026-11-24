'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
  BellRing,
  ArrowRight,
} from 'lucide-react';
import type { EventListItemDto, EventFilters, EventSortOption, EventStatsDto } from '../../types/event.types';
import { eventService } from '../../services/event.service';
import { adminDisputeService } from '@/features/admin/services/dispute.service';
import { EventCard } from '../event/event-card';
import { AdvancePeriodModal } from '../event/advance-period-modal';

import { PermissionsTab } from './permissions-tab/permissions-tab';
import { DisputesTab } from './disputes-tab/disputes-tab';
import { PublishTab } from './publish-tab/publish-tab';
import { useLanguage } from '@/context/language-context';

export type AdminEventsTab = 'create' | 'permissions' | 'disputes' | 'publish';



const emptySubscribe = () => () => {};

export function EventAdminScreen() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeTab, setActiveTab] = useState<AdminEventsTab>('create');
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDisputesCount, setOpenDisputesCount] = useState(0);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'create' || tabParam === 'permissions' || tabParam === 'disputes' || tabParam === 'publish') {
      setActiveTab(tabParam);
    }
  }, []);

  const refreshOpenDisputesCount = useCallback(async () => {
    try {
      const res = await adminDisputeService.getSubmissionDisputeQueue({ page: 1, pageSize: 100 });
      const count = (res.items || []).filter(
        (d) => d.status === 'Pending' || d.status === 'UnderReview'
      ).length;
      setOpenDisputesCount(count);
    } catch {
      // Ignore if endpoint is temporarily unavailable
    }
  }, []);

  useEffect(() => {
    void refreshOpenDisputesCount();
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshOpenDisputesCount();
      }
    };
    const handleDisputesUpdated = () => {
      void refreshOpenDisputesCount();
    };
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener('dil:disputes-updated', handleDisputesUpdated);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('dil:disputes-updated', handleDisputesUpdated);
    };
  }, [refreshOpenDisputesCount]);

  // Delete Event Modal state
  const [eventToDelete, setEventToDelete] = useState<EventListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Advance Period (Demo Testing) Modal state
  const [eventToAdvance, setEventToAdvance] = useState<EventListItemDto | null>(null);

  // Filters & Pagination
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<EventSortOption>('latest');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(9);

  const contestGridRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<EventStatsDto>({
    totalPrizePool: 0,
    formattedTotalPrizePool: '0 đ',
    openEventsCount: 0,
    totalSubmissionsCount: 0,
    totalEventsCount: 0,
  });

  const refreshEvents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const filters: EventFilters = {
        status: status || undefined,
        includeDrafts: true,
        sortBy,
        search: keyword.trim() || undefined,
        page,
        pageSize,
      };
      const [res, statsData] = await Promise.all([
        eventService.list(filters),
        eventService.getStats().catch(() => null),
      ]);
      if (res?.items) {
        setEvents(res.items);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sự kiện.';
      setLoadError(msg);
      setEvents([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setLoadError(null);
      try {
        const filters: EventFilters = {
          status: status || undefined,
          includeDrafts: true,
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
          if (res?.items) {
            setEvents(res.items);
          }
          if (statsData) {
            setStats(statsData);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sự kiện.';
          setLoadError(msg);
          setEvents([]);
          toast.error(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
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
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 text-[#241F1A]">
      {/* 1. Header Title Section */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#221E1A]/10 pb-6">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
            <Trophy size={13} className="text-[#8A6A1F]" />
            <span>Admin Center · Event Operations</span>
          </div>

          <h1 className="font-h1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#241F1A] leading-tight">
            Illustration Contests & Events
          </h1>

          <p className="mt-2 text-sm text-[#B24A26] leading-relaxed max-w-3xl">
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
            className="flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 py-2 text-xs font-semibold text-[#241F1A] transition hover:border-[#221E1A]/20 hover:bg-[#F0E7D8] active:scale-95 cursor-pointer"
            title="Refresh contest list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-periwinkle' : 'text-brand-periwinkle'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Overview KPI Cards (Consistent with System Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {/* Card 1: Total Events */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              TOTAL CONTESTS & EVENTS
            </span>
            <div className="p-1.5 rounded-lg bg-[#8C3718]/10 text-[#8C3718]">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#8C3718] tracking-tight">
            {stats.totalEventsCount || events.length}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            <span className="font-h1 font-bold text-[#241F1A]/90">{stats.openEventsCount}</span> Đang mở nhận bài thi </p>
        </div>

        {/* Card 2: Open Submissions */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              TOTAL SUBMISSIONS
            </span>
            <div className="p-1.5 rounded-lg bg-[#2F6B63]/10 text-[#2F6B63]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#2F6B63] tracking-tight">
            {stats.totalSubmissionsCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]"> Bài dự thi đã nộp trên toàn sàn </p>
        </div>

        {/* Card 3: Prize Pool */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              TOTAL PRIZE POOL
            </span>
            <div className="p-1.5 rounded-lg bg-[#8A6A1F]/10 text-[#8A6A1F]">
              <Trophy className="w-4 h-4 text-[#8A6A1F]" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#8A6A1F] tracking-tight">
            {stats.formattedTotalPrizePool || '0 ₫'}
          </h3>
          <p className="text-[11px] text-[#8A6A1F] font-medium"> Quỹ giải thưởng cam kết bảo chứng </p>
        </div>

        {/* Card 4: Open Disputes / Jury Pending */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              DISPUTES & FLAGS
            </span>
            <div className="p-1.5 rounded-lg bg-[#A8321C]/10 text-[#A8321C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#A8321C] tracking-tight">
            {openDisputesCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {openDisputesCount > 0 ? (
              <span className="text-[#A8321C] font-medium">Khiếu nại bài thi cần phân xử</span>
            ) : (
              <span className="text-[#2F6B63] font-medium">Không có tranh chấp tồn đọng</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar (Directly under Illustration Contests & Events title) */}
      <nav className="glass-container rounded-2xl p-1.5 backdrop-blur-xl bg-[#FFFCF6]/90 flex gap-1.5 overflow-x-auto mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
          }`}
        >
          Event Management
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
          }`}
        >
          Jury Permissions
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
          }`}
        >
          <span>Dispute Resolution</span>
          {openDisputesCount > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-none ${
                activeTab === 'disputes'
                  ? 'bg-brand-navy/20 text-[#241F1A] border border-brand-navy/30'
                  : 'bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40 animate-pulse'
              }`}
              title={`${openDisputesCount} open submission dispute(s) awaiting review`}
            >
              {openDisputesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('publish')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'publish'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
          }`}
        >
          Publish Results
        </button>
      </nav>

      {/* Pending Disputes Signal Banner (visible on other tabs so admins never miss new disputes) */}
      {openDisputesCount > 0 && activeTab !== 'disputes' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-4 py-3 text-xs text-[#8A6A1F]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#8A6A1F]/20 text-[#8A6A1F] shrink-0">
              <BellRing className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-[#8A6A1F]">
                {isVie
                  ? `Có ${openDisputesCount} khiếu nại bài dự thi đang chờ quản trị viên xử lý`
                  : `${openDisputesCount} pending submission dispute${openDisputesCount > 1 ? 's' : ''} require admin moderation`}
              </p>
              <p className="text-[11px] text-[#8A6A1F]">
                {isVie
                  ? 'Báo cáo mới hoặc chưa giải quyết từ người dùng đã được đưa vào hàng đợi tab Xử lý khiếu nại.'
                  : 'New or unresolved client reports have been queued in the Dispute Resolution tab.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('disputes')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8A6A1F]/10 px-3.5 py-2 text-xs font-bold text-[#241F1A] transition hover:bg-[#8A6A1F]/10 cursor-pointer shrink-0"
          >
            <span>{isVie ? 'Mở hàng đợi khiếu nại' : 'Open Dispute Queue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Active Tab Content */}
      <div ref={contestGridRef}>
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Filter Bar - ONLY present in Event Management Tab */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]/80 backdrop-blur-xl mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-periwinkle" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search contests..."
                  className="w-full h-10 pl-9 pr-4 bg-[#E5D8C2]/70 border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-brand-periwinkle"
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
                  className="h-10 px-3.5 bg-[#E5D8C2]/70 border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] focus:outline-none focus:border-brand-periwinkle cursor-pointer"
                >
                  <option value="" className="bg-[#F7F2E9]">All Statuses</option>
                  <option value="Upcoming" className="bg-[#F7F2E9]">Waiting to Open</option>
                  <option value="Open" className="bg-[#F7F2E9]">Open</option>
                  <option value="Judging" className="bg-[#F7F2E9]">Judging</option>
                  <option value="Ended" className="bg-[#F7F2E9]">Ended</option>
                  <option value="Draft" className="bg-[#F7F2E9]">Draft</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as EventSortOption);
                    setPage(1);
                  }}
                  className="h-10 px-3.5 bg-[#E5D8C2]/70 border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] focus:outline-none focus:border-brand-periwinkle cursor-pointer"
                >
                  <option value="latest" className="bg-[#F7F2E9]">Latest Created</option>
                  <option value="title_asc" className="bg-[#F7F2E9]">Title (A-Z)</option>
                  <option value="most_submissions" className="bg-[#F7F2E9]">Most Submissions</option>
                  <option value="ending_soon" className="bg-[#F7F2E9]">Ending Soon</option>
                </select>

                {/* "+ Create Event" Button - Navigates to /admin/events/create */}
                <button
                  type="button"
                  onClick={() => router.push('/admin/events/create')}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#B24A26] to-[#2F6B63] text-[#241F1A] font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isVie ? '+ Tạo sự kiện' : '+ Create Event'}</span>
                </button>
              </div>
            </div>

            {/* Event Cards Grid */}
            {loadError ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-8 text-center"
              >
                <AlertTriangle className="mx-auto h-10 w-10 text-[#A8321C] mb-3" />
                <p className="text-base font-bold text-[#241F1A]">Không thể tải danh sách sự kiện</p>
                <p className="mt-1 text-xs text-[#A8321C] max-w-xl mx-auto">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void refreshEvents()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#A8321C]/20 border border-[#A8321C]/40 px-4 py-2 text-xs font-bold text-[#241F1A] hover:bg-[#A8321C]/20 transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Thử tải lại</span>
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]/50 p-12 text-center text-outline">
                <Layers className="mx-auto h-12 w-12 text-brand-periwinkle/40 mb-3" />
                <p className="text-base font-semibold text-[#241F1A]">No contests found</p>
                <p className="mt-1 text-xs text-[#6E6459]">Try adjusting your search query or filter options.</p>
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
                      onAdvancePeriod: () => setEventToAdvance(evt),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'disputes' && <DisputesTab />}
        {activeTab === 'publish' && <PublishTab />}
      </div>

      {/* Delete Event Confirmation Modal */}
      {mounted && eventToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#E5D8C2] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-[#A8321C]/40 bg-[#FFFCF6] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-[#A8321C]/10 border border-[#A8321C]/30 text-[#A8321C]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#241F1A] font-h1">Delete Event</h3>
                <p className="text-xs text-[#A8321C] font-medium">Irreversible Action</p>
              </div>
            </div>
            <p className="text-xs text-[#746A5F] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#241F1A]">&ldquo;{eventToDelete.title}&rdquo;</span>? All associated submissions, votes, and panel assignments will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#221E1A]/10 text-xs font-semibold text-[#746A5F] hover:bg-[#FFFCF6] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#A8321C]/12 hover:bg-[#A8321C]/12 text-[#241F1A] text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Advance Period (Demo Testing) Modal */}
      {mounted && eventToAdvance && (
        <AdvancePeriodModal
          event={eventToAdvance}
          isOpen={Boolean(eventToAdvance)}
          onClose={() => setEventToAdvance(null)}
          onSuccess={() => void refreshEvents()}
        />
      )}
    </div>
  );
}

