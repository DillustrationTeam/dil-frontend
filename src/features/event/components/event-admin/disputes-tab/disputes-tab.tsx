'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  RotateCw,
  AlertTriangle,
  Scale,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DisputesStats } from './disputes-stats';
import { DisputeQueueTable, formatDisputeCode } from './dispute-queue-table';
import { DisputeInspectionPanel } from './dispute-inspection-panel';
import {
  ContestSearchSelect,
  matchesEventId,
  resolveEventId,
} from '../permissions-tab/permissions-tab';
import { adminDisputeService } from '@/features/admin/services/dispute.service';
import { eventService } from '../../../services/event.service';
import type { EventListItemDto } from '../../../types/event.types';
import type {
  SubmissionDisputeDto,
  SubmissionDisputeStatus,
} from '@/features/admin/types/dispute-arbitration.types';

export function DisputesTab() {
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  // Default to 'all' so admin initially sees the queue-wide disputes
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [disputes, setDisputes] = useState<SubmissionDisputeDto[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter States: Search bar + Status only
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionDisputeStatus>('All');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const inspectionRef = useRef<HTMLDivElement>(null);

  const ALL_CONTESTS_ITEM: EventListItemDto = {
    id: 'all',
    title: 'All Contests (Queue-wide)',
    status: 'All',
  } as EventListItemDto;

  // Real backend events
  const allEvents = [ALL_CONTESTS_ITEM, ...events];
  const selectedEvent =
    selectedEventId === 'all'
      ? ALL_CONTESTS_ITEM
      : allEvents.find((e) => matchesEventId(e.id, selectedEventId));

  // Check if judging phase has started / active
  const isJudgingPhaseActive =
    selectedEvent && selectedEvent.id !== 'all'
      ? selectedEvent.status === 'Judging' ||
        selectedEvent.status === 'Ended' ||
        (selectedEvent.judgingStartAt ? new Date() >= new Date(selectedEvent.judgingStartAt) : false)
      : false;

  // 1. Fetch available events for contest selection
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await eventService.list({ pageSize: 50 });
        if (res.items && res.items.length > 0) {
          setEvents(res.items);
        }
      } catch (err) {
        console.error('Failed to load events list:', err);
      }
    }
    void fetchEvents();
  }, []);

  // 2. Load disputes from backend API
  const loadDisputes = useCallback(
    async (eventId?: string) => {
      setIsLoading(true);
      const targetEventId = eventId !== undefined ? eventId : selectedEventId;
      const resolvedGuid = resolveEventId(targetEventId);
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedGuid || '');
      try {
        const res = await adminDisputeService.getSubmissionDisputeQueue({
          // If targetEventId is 'all', query all disputes across all contests
          eventId: isGuid && targetEventId !== 'all' ? resolvedGuid : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          page: 1,
          pageSize: 50,
        });

        if (res.items) {
          setDisputes(res.items);
        }
      } catch (err: unknown) {
        console.error('Failed to load disputes from backend:', err);
        const msg = err instanceof Error ? err.message : 'Failed to load disputes from backend';
        toast.error(msg);
        setDisputes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedEventId, statusFilter]
  );

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadDisputes(selectedEventId);
    })();
  }, [selectedEventId, statusFilter, loadDisputes]);

  // 1. Contest-scoped disputes (for KPI stats & filtering)
  const contestDisputes = useMemo(() => {
    if (!selectedEventId || selectedEventId === 'all') {
      return disputes;
    }
    return disputes.filter((item) => matchesEventId(item.eventId, selectedEventId));
  }, [disputes, selectedEventId]);

  // 2. Filter computation for Table (applies status filter & search query)
  const filteredDisputes = useMemo(() => {
    return contestDisputes.filter((item) => {
      // 1. Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = formatDisputeCode(item.id).toLowerCase().includes(q);
        const matchTitle = (item.submissionTitle || '').toLowerCase().includes(q);
        const matchEvent = (item.eventTitle || '').toLowerCase().includes(q);
        const matchReason = (item.reason || '').toLowerCase().includes(q);
        const matchReporter = (item.raisedByName || '').toLowerCase().includes(q);
        return matchCode || matchTitle || matchEvent || matchReason || matchReporter;
      }
      return true;
    });
  }, [contestDisputes, statusFilter, searchQuery]);

  // Derive the active dispute ID: If selectedDisputeId is in filteredDisputes, keep it; otherwise default to filteredDisputes[0]?.id
  const effectiveSelectedDisputeId =
    selectedDisputeId && filteredDisputes.some((d) => d.id === selectedDisputeId)
      ? selectedDisputeId
      : filteredDisputes[0]?.id ?? null;

  // Pagination calculation
  const totalCount = filteredDisputes.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDisputes.slice(start, start + pageSize);
  }, [filteredDisputes, page, pageSize]);

  // Currently selected dispute for deep inspection
  const selectedDispute = useMemo(() => {
    if (!effectiveSelectedDisputeId) return null;
    return disputes.find((d) => d.id === effectiveSelectedDisputeId) || null;
  }, [disputes, effectiveSelectedDisputeId]);

  const handleInspect = (item: SubmissionDisputeDto) => {
    setSelectedDisputeId(item.id);
    if (inspectionRef.current) {
      inspectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Execute ruling handler
  const handleExecuteRuling = async (
    disputeId: string,
    resolution: 'Dismiss' | 'Disqualify' | 'RequestReEvaluation',
    note: string
  ) => {
    setIsSubmitting(true);
    try {
      await adminDisputeService.resolveSubmissionDispute(disputeId, {
        resolution,
        note,
      });

      const caseCode = formatDisputeCode(disputeId);
      const actionName =
        resolution === 'RequestReEvaluation'
          ? 'Re-evaluation Requested'
          : resolution;
      toast.success(`Ruling executed: Case ${caseCode} marked as ${actionName}!`);

      // Reload disputes from backend to ensure state is synchronized
      await loadDisputes(selectedEventId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute arbitration ruling.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Statistics - Strictly derived from contestDisputes to ensure 100% sync with table!
  const openCount = contestDisputes.filter((d) => d.status === 'Pending' || d.status === 'UnderReview').length;
  const highPriorityCount = contestDisputes.filter((d) => d.priority === 'High').length;
  const resolvedCount = contestDisputes.filter((d) => d.status === 'Resolved').length;
  const overdueCount = 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Live Refresh Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-periwinkle/20 text-brand-periwinkle flex items-center justify-center border border-brand-periwinkle/30 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="font-h1 text-2xl font-extrabold text-white">
              Contest Dispute Resolution Queue
            </h1>
          </div>
          <p className="text-xs text-[#8A8FA9] mt-1 font-body">
            Investigate reported contest submissions, score variance appeals, AI artwork flags, and execute arbitrator rulings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending Count Pill */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{openCount} Cases Under Review</span>
          </span>

          {/* Sync Live Queue Button */}
          <button
            type="button"
            onClick={() => void loadDisputes(selectedEventId)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            title="Refresh queue"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-periwinkle' : ''}`} />
            <span className="hidden sm:inline">Sync Live Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Target Contest Selector & Status Banner (Identical to Jury Permissions) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-[#161926]/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-[#A7ACD9] uppercase tracking-wider shrink-0">
            Target Contest:
          </label>
          <ContestSearchSelect
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => {
              setSelectedEventId(id);
              setPage(1);
            }}
            showAllOption={true}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline">Judging Phase Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              selectedEventId === 'all'
                ? 'bg-brand-periwinkle/20 text-brand-periwinkle border border-brand-periwinkle/30'
                : isJudgingPhaseActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}
          >
            {selectedEventId === 'all'
              ? '🌐 Global Queue Active'
              : isJudgingPhaseActive
              ? '🔒 Judging Started (Locked)'
              : '🔓 Open for Jury Assignments'}
          </span>
        </div>
      </div>

      {/* 3. KPI Summary Badges */}
      <DisputesStats
        openCount={openCount}
        highPriorityCount={highPriorityCount}
        resolvedCount={resolvedCount}
        overdueCount={overdueCount}
      />

      {/* 4. Searchbar & Status Filter Toolbar (All Categories and All Priorities removed) */}
      <div className="glass-container rounded-2xl p-4 border border-white/10 bg-[#161926]/80 backdrop-blur-xl flex flex-wrap items-center gap-3">
        {/* Search Bar on the Left */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search dispute by case ID, title, or reason..."
            className="w-full h-10 pl-10 pr-9 bg-[#090b12]/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all font-body"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Status */}
        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SubmissionDisputeStatus);
              setPage(1);
            }}
            className="w-full h-10 px-3 pr-8 bg-[#090b12]/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all cursor-pointer font-medium"
          >
            <option value="All" className="bg-[#161926]">All Statuses</option>
            <option value="Pending" className="bg-[#161926]">Pending</option>
            <option value="UnderReview" className="bg-[#161926]">Under Review</option>
            <option value="Resolved" className="bg-[#161926]">Resolved</option>
            <option value="Rejected" className="bg-[#161926]">Rejected</option>
          </select>
        </div>
      </div>

      {/* 5. Flagged Contest Dispute Queue Table */}
      <DisputeQueueTable
        items={paginatedItems}
        selectedDisputeId={effectiveSelectedDisputeId}
        isLoading={isLoading}
        onInspect={handleInspect}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      {/* 6. Detailed Inspection & Ruling Console (Below the Table) */}
      <div ref={inspectionRef}>
        <DisputeInspectionPanel
          dispute={selectedDispute}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onExecuteRuling={handleExecuteRuling}
          onClose={selectedDispute ? () => setSelectedDisputeId(null) : undefined}
        />
      </div>
    </div>
  );
}
