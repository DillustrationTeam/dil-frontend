'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { EventDetailDto, EventSubmissionDto, EventLeaderboardItemDto } from '../../types/event.types';
import type { JuryMemberInfo } from '../../types/jury.types';
import type { CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { eventService } from '../../services/event.service';
import { eventSubmissionService } from '../../services/event-submission.service';
import { eventVoteService } from '../../services/event-vote.service';
import { juryService } from '../../services/jury.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { useEventCountdown } from '../../hooks/use-event-countdown';
import { eventStatusBadgeStyles, eventStatusLabels } from '../../types/event.types';
import { EventSubmissionModal } from './event-submission-modal';
import { useAuthStore } from '@/store/use-auth-store';

import { EventDetailHero } from './detail/event-detail-hero';
import { EventDetailTabNav, TabType } from './detail/event-detail-tab-nav';
import { EventTabArtworks } from './detail/event-tab-artworks';
import { EventTabMySubmission } from './detail/event-tab-my-submission';
import { EventTabLeaderboard } from './detail/event-tab-leaderboard';
import { EventRulesModal } from './detail/event-rules-modal';

interface EventDetailScreenProps {
  id: string;
  userId?: string | null;
  isAdmin?: boolean;
}

function formatScore(val?: number | null): string | null {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || num <= 0) return null;
  if (num <= 10) {
    return `${num.toFixed(1)} / 10`;
  }
  return `${num.toFixed(1)} / 100`;
}

export function EventDetailScreen({ id, userId, isAdmin }: EventDetailScreenProps) {
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [submissions, setSubmissions] = useState<EventSubmissionDto[]>([]);
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardItemDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('artworks');
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Filter & Search states for Artworks tab
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  // Wall of fame sort
  const [wallSort, setWallSort] = useState<'votes' | 'score'>('votes');

  // Modal dialog states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Jury & Creator states
  const [juries, setJuries] = useState<JuryMemberInfo[]>([]);
  const [myCreatorProfile, setMyCreatorProfile] = useState<CreatorProfileDto | null>(null);

  const countdown = useEventCountdown(event);
  const currentUser = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isClient = roles.some((r) => r.toLowerCase() === 'client' || r.toLowerCase() === 'user');
  const isAdminFromRoles = roles.some(
    (r) =>
      r.toLowerCase().includes('admin') ||
      r.toLowerCase() === 'administrator' ||
      r.toLowerCase() === 'moderator'
  );
  const effectiveIsAdmin = typeof isAdmin === 'boolean' ? isAdmin : isAdminFromRoles;
  const effectiveUserId = userId || currentUser?.id || null;
  // Creator and client side: logged in user who is a Creator, Client, standard User, and not admin/moderator
  const isCreatorOrClient =
    Boolean(currentUser || effectiveUserId) &&
    !effectiveIsAdmin &&
    (isCreator || isClient || (!effectiveIsAdmin && roles.length === 0));

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const [eventData, subData, leadData, juriesData, profileData] = await Promise.all([
          eventService.detail(id).catch(() => null),
          eventSubmissionService.getSubmissions(id).catch(() => ({ items: [], totalCount: 0 })),
          eventSubmissionService.getLeaderboard(id, wallSort).catch(() => []),
          juryService.getEventJuries(id).catch(() => []),
          effectiveUserId ? creatorProfileService.getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);
        if (eventData) setEvent(eventData);
        setSubmissions(subData.items || []);
        setLeaderboard(leadData || []);
        setJuries(juriesData || []);
        setMyCreatorProfile(profileData);
      } catch {
        toast.error('Failed to load contest details.');
      } finally {
        setLoading(false);
      }
    }
    void loadDetail();
  }, [id, wallSort, effectiveUserId]);

  const currentJury = useMemo(() => {
    if (!juries || juries.length === 0 || !effectiveUserId) return null;
    const myCreatorId = myCreatorProfile?.id?.toLowerCase();
    const myUserId = effectiveUserId.toLowerCase();

    return (
      juries.find((j) => {
        const jCreatorId = j.creatorId?.toLowerCase();
        const jUserId = (j.userId || j.creatorUserId)?.toLowerCase();

        if (jUserId && jUserId === myUserId) return true;
        if (myCreatorId && jCreatorId === myCreatorId) return true;
        if (jCreatorId === myUserId) return true;

        return false;
      }) || null
    );
  }, [juries, effectiveUserId, myCreatorProfile]);

  const isJuryMember = Boolean(currentJury);

  const handleOpenSubmitModal = () => {
    if (!effectiveUserId) {
      toast.error('Please sign in to submit artwork.');
      return;
    }
    if (isJuryMember) {
      toast.error('Jury members are not eligible to submit entries for this event.');
      return;
    }
    if (!isCreator) {
      toast.error('Only creators can participate in this contest. Please set up your creator profile.');
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleVote = async (submissionId: string, hasVoted?: boolean) => {
    if (!effectiveUserId) {
      toast.error('Please sign in to vote for artworks.');
      return;
    }

    setVotingId(submissionId);
    try {
      if (hasVoted) {
        await eventVoteService.unvoteSubmission(submissionId);
        toast.success('Vote removed.');
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, voteCount: Math.max(0, s.voteCount - 1), hasVoted: false } : s)),
        );
      } else {
        await eventVoteService.voteSubmission(submissionId);
        toast.success('Vote submitted successfully!');
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, voteCount: s.voteCount + 1, hasVoted: true } : s)),
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error submitting vote.');
    } finally {
      setVotingId(null);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      void navigator.clipboard.writeText(window.location.href);
      toast.success('Contest link copied to clipboard.');
    }
  };

  const handleSubmissionSuccess = (savedSub: EventSubmissionDto) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex(
        (s) => s.id === savedSub.id || (effectiveUserId && s.submitterId === effectiveUserId)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...savedSub };
        return next;
      }
      return [savedSub, ...prev];
    });
    setActiveTab('my-submission');
  };

  const handleWithdrawSubmission = async (submissionId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to withdraw your submission from this contest? You can resubmit anytime before the submission deadline ends.'
    );
    if (!confirmed) return;

    try {
      await eventSubmissionService.withdrawSubmission(submissionId);
      toast.success('Your submission has been withdrawn successfully.');
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to withdraw submission.';
      toast.error(msg);
    }
  };

  // Find current user's submission
  const mySubmission = useMemo(() => {
    if (!effectiveUserId) return null;
    return submissions.find((s) => s.submitterId === effectiveUserId) || null;
  }, [submissions, effectiveUserId]);

  // Filtered and sorted artworks for "Event Artworks" tab
  const filteredArtworks = useMemo(() => {
    let result = [...submissions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.title.toLowerCase().includes(q) || (item.submitterName && item.submitterName.toLowerCase().includes(q)),
      );
    }

    if (sortBy === 'votes') {
      result.sort((a, b) => b.voteCount - a.voteCount);
    } else {
      result.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    return result;
  }, [submissions, searchQuery, sortBy]);

  // Top 3 Podium for "Wall Of Fame"
  const podiumTop3 = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const restLeaderboard = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  // Is submission window active?
  const isSubmissionOpen = countdown.phase === 'Submission' || Boolean(event?.isOpenForSubmission);

  // Wall of Fame only opens after official result announcement or event ended
  const isAnnounced = useMemo(() => {
    if (!event) return false;
    const status = String(event.status).toLowerCase();
    if (status === 'ended' || status === '4') return true;
    return countdown.phase === 'Ended';
  }, [event, countdown.phase]);

  if (loading && !event) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-periwinkle border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl py-24 text-center">
        <h2 className="font-h1 text-2xl font-bold text-white">Contest Not Found</h2>
        <p className="mt-2 text-sm text-[#8A8FA9]">This event may have been removed or is no longer available.</p>
        <Link
          href="/events"
          className="mt-6 inline-flex rounded-2xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-brand-navy cursor-pointer"
        >
          Back to Contests
        </Link>
      </div>
    );
  }

  const statusStr =
    typeof event.status === 'number'
      ? event.status === 2
        ? 'Open'
        : event.status === 3
        ? 'Judging'
        : event.status === 4
        ? 'Ended'
        : 'Draft'
      : String(event.status);
  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-outline';
  const statusLabel = eventStatusLabels[statusStr] || statusStr;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pt-8 text-[#e4e1e5]">
      {/* Hero Header & Metrics */}
      <EventDetailHero
        event={event}
        statusColor={statusColor}
        statusLabel={statusLabel}
        statusStr={statusStr}
        countdown={countdown}
        isCreator={isCreator}
        isJuryMember={isJuryMember}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onCopyLink={handleCopyLink}
      />

      {/* 3 Primary Tabs Navigation */}
      <EventDetailTabNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        submissionsCount={submissions.length}
        hasMySubmission={Boolean(mySubmission)}
        isAnnounced={isAnnounced}
        leaderboardCount={leaderboard.length || 0}
        isAdmin={effectiveIsAdmin}
      />

      {/* Tab Contents */}
      <div className="mt-8">
        {/* TAB 1: EVENT ARTWORKS */}
        {activeTab === 'artworks' && (
          <EventTabArtworks
            filteredArtworks={filteredArtworks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isSubmissionOpen={isSubmissionOpen}
            setActiveTab={setActiveTab}
            effectiveUserId={effectiveUserId}
            votingId={votingId}
            handleVote={handleVote}
            isCreatorOrClient={isCreatorOrClient}
          />
        )}

        {/* TAB 2: MY SUBMISSION */}
        {!effectiveIsAdmin && activeTab === 'my-submission' && (
          <EventTabMySubmission
            isAnnounced={isAnnounced}
            effectiveUserId={effectiveUserId}
            isJuryMember={isJuryMember}
            currentJury={currentJury}
            isCreator={isCreator}
            mySubmission={mySubmission}
            eventId={event.id}
            eventTitle={event.title}
            isSubmissionOpen={isSubmissionOpen}
            setActiveTab={setActiveTab}
            onOpenSubmitModal={handleOpenSubmitModal}
            onCopyLink={handleCopyLink}
            currentUserFullName={currentUser?.fullName}
            onWithdrawSubmission={handleWithdrawSubmission}
          />
        )}

        {/* TAB 3: WALL OF FAME */}
        {activeTab === 'wall-of-fame' && (
          <EventTabLeaderboard
            isAnnounced={isAnnounced}
            event={event}
            setActiveTab={setActiveTab}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            wallSort={wallSort}
            setWallSort={setWallSort}
            leaderboard={leaderboard}
            podiumTop3={podiumTop3}
            restLeaderboard={restLeaderboard}
            formatScore={formatScore}
          />
        )}
      </div>

      {/* Submission Modal Dialog */}
      <EventSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
        userName={currentUser?.fullName || 'Artist'}
        userId={effectiveUserId || ''}
        isCreator={isCreator}
        existingSubmission={mySubmission}
        onSuccess={handleSubmissionSuccess}
      />

      {/* Rules & Guidelines Modal Dialog */}
      <EventRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        event={event}
      />
    </div>
  );
}
