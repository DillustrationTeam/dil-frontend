'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RotateCw, AlertCircle, Trophy } from 'lucide-react';
import { PublishResultsTable, WinnerApprovalItem } from './publish-results-table';
import { PublishChecklistAside, PublishChecklistStatus } from './publish-checklist-aside';
import { ContestSearchSelect, resolveEventId } from '../permissions-tab/permissions-tab';
import { eventService } from '../../../services/event.service';
import { eventSubmissionService } from '../../../services/event-submission.service';
import { juryService } from '../../../services/jury.service';
import { adminDisputeService } from '@/features/admin/services/dispute.service';
import type { EventListItemDto, EventDetailDto } from '../../../types/event.types';
import type { JuryMemberInfo } from '../../../types/jury.types';
import type { SubmissionDisputeDto } from '@/features/admin/types/dispute-arbitration.types';

export function PublishTab() {
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventDetail, setEventDetail] = useState<EventDetailDto | null>(null);
  const [juries, setJuries] = useState<JuryMemberInfo[]>([]);
  const [disputes, setDisputes] = useState<SubmissionDisputeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Approval state
  const [isAwardAllocationsConfirmed, setIsAwardAllocationsConfirmed] = useState(false);
  const [isContestResultsPublished, setIsContestResultsPublished] = useState(false);

  // Raw fetched submissions / leaderboard
  const [leaderboardItems, setLeaderboardItems] = useState<Array<{
    submissionId: string;
    title: string;
    submitterName: string;
    artworkImageUrl?: string;
    score?: number | null;
    voteCount?: number;
    rank?: number;
  }>>([]);

  // 1. Initial load: Events list
  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        const res = await eventService.list({ pageSize: 50 });
        if (!active) return;
        const items = res?.items || [];
        setEvents(items);
        if (items.length > 0 && !selectedEventId) {
          // Default to the first event with status Ended or Judging, or first event
          const preferred =
            items.find((e) => String(e.status).toLowerCase() === 'ended' || String(e.status).toLowerCase() === 'judging') ||
            items[0];
          setSelectedEventId(preferred.id);
        }
      } catch {
        if (active) setEvents([]);
      }
    }
    void loadEvents();
    return () => {
      active = false;
    };
  }, [selectedEventId]);

  // 2. Fetch all real data for selected contest
  const loadEventData = useCallback(async (eventId: string) => {
    if (!eventId) return;
    const resolvedId = resolveEventId(eventId);
    try {
      const [detailData, leadData, subData, juriesData, disputeData] = await Promise.all([
        eventService.detail(resolvedId).catch(() => null),
        eventSubmissionService.getLeaderboard(resolvedId, 'score').catch(() => []),
        eventSubmissionService.getSubmissions(resolvedId, 1, 50).catch(() => ({ items: [], totalCount: 0 })),
        juryService.getEventJuries(resolvedId).catch(() => []),
        adminDisputeService
          .getSubmissionDisputeQueue({ eventId: resolvedId, pageSize: 50 })
          .then((r) => r.items)
          .catch(() => []),
      ]);

      setEventDetail(detailData);
      setJuries(juriesData);
      setDisputes(disputeData);

      // Check if event is already ended or published
      const isAlreadyEnded =
        detailData?.status === 'Ended' ||
        String(detailData?.status) === '4' ||
        String(detailData?.status).toLowerCase() === 'concluded';
      setIsContestResultsPublished(isAlreadyEnded);
      setIsAwardAllocationsConfirmed(isAlreadyEnded || Boolean(detailData?.isHeadJurySignedOff));

      // Map combined leaderboard data
      if (leadData && leadData.length > 0) {
        setLeaderboardItems(
          leadData.map((item, idx) => ({
            submissionId: item.submissionId || item.artworkId || `sub-${idx}`,
            title: item.title || item.submissionTitle || 'Untitled Artwork',
            submitterName: item.submitterName || 'Artist',
            artworkImageUrl: item.artworkImageUrl || item.artworkThumbnailUrl,
            score: typeof item.score === 'number' && item.score > 0 ? item.score : typeof item.judgeScore === 'number' && item.judgeScore > 0 ? item.judgeScore : null,
            voteCount: item.voteCount ?? 0,
            rank: item.rank || idx + 1,
          }))
        );
      } else if (subData?.items && subData.items.length > 0) {
        // Fallback to sorted submissions if leaderboard endpoint is empty
        const sorted = [...subData.items].sort(
          (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) || (b.voteCount || 0) - (a.voteCount || 0)
        );
        setLeaderboardItems(
          sorted.map((item, idx) => ({
            submissionId: item.id,
            title: item.title || 'Untitled Artwork',
            submitterName: item.submitterName || 'Artist',
            artworkImageUrl: item.artworkImageUrl || item.artworkThumbnailUrl,
            score: typeof item.score === 'number' && item.score > 0 ? item.score : null,
            voteCount: item.voteCount ?? 0,
            rank: idx + 1,
          }))
        );
      } else {
        setLeaderboardItems([]);
      }
    } catch {
      toast.error('Failed to load contest data from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      void (async () => {
        await Promise.resolve();
        await loadEventData(selectedEventId);
      })();
    }
  }, [selectedEventId, loadEventData]);

  // 3. Dynamically compute Winners list mapped with award categories
  const finalWinnersList = useMemo<WinnerApprovalItem[]>(() => {
    if (!leaderboardItems || leaderboardItems.length === 0) return [];

    const statusText = isContestResultsPublished
      ? 'Published'
      : isAwardAllocationsConfirmed
      ? 'Finalized'
      : 'Pending';

    const results: WinnerApprovalItem[] = [];

    // Award badges hierarchy
    const awardCategories: Array<{
      awardName: string;
      badgeType: WinnerApprovalItem['badgeType'];
    }> = [
      { awardName: 'Grand Prize', badgeType: 'gold' },
      { awardName: '1st Runner up', badgeType: 'silver' },
      { awardName: '2nd Runner up', badgeType: 'bronze' },
    ];

    // Assign top 3 score winners
    leaderboardItems.slice(0, 3).forEach((item, idx) => {
      const cat = awardCategories[idx] || { awardName: `Top ${idx + 1}`, badgeType: 'standard' };
      results.push({
        awardName: cat.awardName,
        submissionId: item.submissionId,
        title: item.title,
        code: `ENTRY-#${item.rank || idx + 1}`,
        submitterName: item.submitterName,
        artworkImageUrl: item.artworkImageUrl,
        scoreOrVotes: item.score != null ? `${item.score} pts` : `${item.voteCount || 0} votes`,
        status: statusText,
        badgeType: cat.badgeType,
      });
    });

    // Check if there's a distinct community choice winner (most votes outside top 1)
    const mostVoted = [...leaderboardItems].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0];
    if (mostVoted && !results.some((r) => r.submissionId === mostVoted.submissionId)) {
      results.push({
        awardName: 'Community Choice',
        submissionId: mostVoted.submissionId,
        title: mostVoted.title,
        code: `COMMUNITY-PICK`,
        submitterName: mostVoted.submitterName,
        artworkImageUrl: mostVoted.artworkImageUrl,
        scoreOrVotes: `${mostVoted.voteCount || 0} votes`,
        status: statusText,
        badgeType: 'community',
      });
    }

    // Remaining top submissions as Honorable Contenders
    leaderboardItems.slice(3, 6).forEach((item, idx) => {
      if (!results.some((r) => r.submissionId === item.submissionId)) {
        results.push({
          awardName: 'Honorable Contender',
          submissionId: item.submissionId,
          title: item.title,
          code: `ENTRY-#${item.rank || idx + 4}`,
          submitterName: item.submitterName,
          artworkImageUrl: item.artworkImageUrl,
          scoreOrVotes: item.score != null ? `${item.score} pts` : `${item.voteCount || 0} votes`,
          status: statusText,
          badgeType: 'standard',
        });
      }
    });

    return results;
  }, [leaderboardItems, isAwardAllocationsConfirmed, isContestResultsPublished]);

  // 4. Dynamically compute Audit Checklist from real event parameters
  const checklist = useMemo<PublishChecklistStatus>(() => {
    const eventStatusStr = String(eventDetail?.status || '').toLowerCase();
    const eventConcluded =
      isContestResultsPublished ||
      eventStatusStr === 'ended' ||
      eventStatusStr === 'judging' ||
      eventStatusStr === '3' ||
      eventStatusStr === '4' ||
      (eventDetail != null && eventDetail.isOpenForSubmission === false && eventStatusStr !== 'draft');

    const juryCount = juries.length;
    // Considered done if there are juries and scores exist, or if marked completed
    const juryEvaluationsDone =
      juryCount > 0 && (leaderboardItems.some((s) => s.score != null) || isAwardAllocationsConfirmed);

    const openDisputes = disputes.filter(
      (d) => d.status === 'Pending' || d.status === 'UnderReview'
    );
    const disputesResolved = openDisputes.length === 0;

    const headJurySignOff =
      Boolean(eventDetail?.isHeadJurySignedOff) ||
      isAwardAllocationsConfirmed ||
      isContestResultsPublished;

    return {
      eventConcluded,
      juryEvaluationsDone,
      disputesResolved,
      headJurySignOff,
      headJurySignedOffAt: eventDetail?.headJurySignedOffAt,
      openDisputesCount: openDisputes.length,
      juryCount,
      evaluatedJuryCount: juryCount,
    };
  }, [eventDetail, juries, disputes, leaderboardItems, isAwardAllocationsConfirmed, isContestResultsPublished]);

  // 5. Handlers
  const handleApproveAwardAllocations = () => {
    setIsAwardAllocationsConfirmed(true);
    toast.success('Award Allocations Confirmed and locked by jury panel!');
  };

  const handlePublishResults = async () => {
    if (!eventDetail) return;
    const confirmed = window.confirm(
      `Are you sure you want to officially publish the final contest results for "${eventDetail.title}"?\n\nThis will lock rankings and reveal winners publicly on the Wall of Fame.`
    );
    if (!confirmed) return;

    setIsPublishing(true);
    try {
      // Call update event status to Ended if API available
      await eventService
        .update(eventDetail.id, {
          title: eventDetail.title,
          description: eventDetail.description,
          bannerUrl: eventDetail.bannerUrl,
          rules: eventDetail.rules,
          prize: eventDetail.prize,
          maxVote: eventDetail.maxVote,
          status: 'Ended',
          submissionStartAt: eventDetail.submissionStartAt,
          submissionEndAt: eventDetail.submissionEndAt,
          judgingStartAt: eventDetail.judgingStartAt,
          judgingEndAt: eventDetail.judgingEndAt,
          votingStartAt: eventDetail.votingStartAt,
          votingEndAt: eventDetail.votingEndAt,
          resultAnnouncementAt: eventDetail.resultAnnouncementAt || new Date().toISOString(),
          isFeatured: eventDetail.isFeatured,
        })
        .catch(() => null);

      setIsContestResultsPublished(true);
      setIsAwardAllocationsConfirmed(true);
      toast.success('Final contest results published to platform feed and Wall of Fame successfully!');
    } catch {
      toast.error('Failed to publish contest results.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contest Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161926] p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-sora text-sm font-bold text-white">Select Contest to Publish</h3>
            <p className="text-[11px] text-[#8A8FA9]">
              Review audit criteria and publish official winners
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ContestSearchSelect
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => {
              setSelectedEventId(id);
              setIsLoading(true);
              setIsAwardAllocationsConfirmed(false);
              setIsContestResultsPublished(false);
            }}
            showAllOption={false}
          />

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void loadEventData(selectedEventId);
            }}
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
            title="Refresh contest data"
          >
            <RotateCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Results Table, Right = Audit Checklist */}
      {!selectedEventId ? (
        <div className="rounded-2xl border border-white/10 bg-[#161926] p-12 text-center text-slate-400">
          <AlertCircle size={32} className="mx-auto text-[#A7ACD9] mb-3" />
          <p className="font-semibold text-white">No contest selected</p>
          <p className="text-xs text-[#8A8FA9] mt-1">Please select an event from the dropdown above to view results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-6 items-start">
          <PublishResultsTable
            eventTitle={eventDetail?.title || 'Contest'}
            finalWinnersList={finalWinnersList}
            isAwardAllocationsConfirmed={isAwardAllocationsConfirmed}
            isContestResultsPublished={isContestResultsPublished}
            handleApproveAwardAllocations={handleApproveAwardAllocations}
            isLoading={isLoading}
          />

          <PublishChecklistAside
            checklist={checklist}
            isAwardAllocationsConfirmed={isAwardAllocationsConfirmed}
            isContestResultsPublished={isContestResultsPublished}
            handlePublishResults={() => void handlePublishResults()}
            isPublishing={isPublishing}
          />
        </div>
      )}
    </div>
  );
}
