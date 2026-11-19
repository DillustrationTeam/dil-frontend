'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FastForward } from 'lucide-react';
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
import { eventStatusBadgeStyles, getEventStatusLabel, normalizeEventStatus } from '../../types/event.types';
import { EventSubmissionModal } from './event-submission-modal';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';

import { EventDetailHero } from './detail/event-detail-hero';
import { EventDetailTabNav, TabType } from './detail/event-detail-tab-nav';
import { EventTabArtworks } from './detail/event-tab-artworks';
import { EventTabMySubmission } from './detail/event-tab-my-submission';
import { EventTabLeaderboard } from './detail/event-tab-leaderboard';
import { EventRulesModal } from './detail/event-rules-modal';
import { SubmissionWithdrawModal } from './detail/submission-withdraw-modal';
import { AdvancePeriodModal } from './advance-period-modal';

interface EventDetailScreenProps {
  id: string;
  userId?: string | null;
  isAdmin?: boolean;
}

export function EventDetailScreen({ id, userId, isAdmin }: EventDetailScreenProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [submissions, setSubmissions] = useState<EventSubmissionDto[]>([]);
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardItemDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('artworks');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Filter & Search states for Artworks tab
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  // Wall of fame sort
  const [wallSort, setWallSort] = useState<'votes' | 'score'>('votes');

  // Modal dialog states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

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
      setLoadError(null);
      try {
        const eventData = await eventService.detail(id);
        const [subData, leadData, juriesData, profileData] = await Promise.all([
          eventSubmissionService.getSubmissions(id).catch(() => ({ items: [], totalCount: 0 })),
          eventSubmissionService.getLeaderboard(id, wallSort).catch(() => []),
          juryService.getEventJuries(id).catch(() => []),
          effectiveUserId ? creatorProfileService.getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);
        setEvent(eventData);
        setSubmissions(subData.items || []);
        setLeaderboard(leadData || []);
        setJuries(juriesData || []);
        setMyCreatorProfile(profileData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load contest details.';
        setEvent(null);
        setLoadError(message);
        toast.error(message);
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
      toast.error(isVie ? 'Vui lòng đăng nhập để nộp bài dự thi.' : 'Please sign in to submit artwork.');
      return;
    }
    if (isJuryMember) {
      toast.error(
        isVie
          ? 'Thành viên ban giám khảo không được phép nộp bài dự thi cho sự kiện này.'
          : 'Jury members are not eligible to submit entries for this event.'
      );
      return;
    }
    if (!isCreator) {
      toast.error(
        isVie
          ? 'Chỉ có họa sĩ (creator) mới có thể tham gia cuộc thi. Vui lòng thiết lập hồ sơ Creator của bạn.'
          : 'Only creators can participate in this contest. Please set up your creator profile.'
      );
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleVote = async (submissionId: string, hasVoted?: boolean) => {
    if (!effectiveUserId) {
      toast.error(isVie ? 'Vui lòng đăng nhập để bình chọn bài dự thi.' : 'Please sign in to vote for artworks.');
      return;
    }

    setVotingId(submissionId);
    try {
      if (hasVoted) {
        await eventVoteService.unvoteSubmission(submissionId);
        toast.success(isVie ? 'Đã hủy bình chọn.' : 'Vote removed.');
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, voteCount: Math.max(0, s.voteCount - 1), hasVoted: false } : s)),
        );
      } else {
        await eventVoteService.voteSubmission(submissionId);
        toast.success(isVie ? 'Bình chọn thành công!' : 'Vote submitted successfully!');
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, voteCount: s.voteCount + 1, hasVoted: true } : s)),
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isVie ? 'Lỗi khi gửi bình chọn.' : 'Error submitting vote.'));
    } finally {
      setVotingId(null);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      void navigator.clipboard.writeText(window.location.href);
      toast.success(isVie ? 'Đã sao chép liên kết cuộc thi.' : 'Contest link copied to clipboard.');
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

  const handleWithdrawSubmission = (submissionId: string) => {
    setWithdrawTargetId(submissionId);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawTargetId) return;
    setIsWithdrawing(true);
    try {
      await eventSubmissionService.withdrawSubmission(withdrawTargetId);
      toast.success(isVie ? 'Rút bài dự thi thành công.' : 'Your submission has been withdrawn successfully.');
      setSubmissions((prev) => prev.filter((s) => s.id !== withdrawTargetId));
      setWithdrawTargetId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Không thể rút bài dự thi.' : 'Failed to withdraw submission.');
      toast.error(msg);
    } finally {
      setIsWithdrawing(false);
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
    if (normalizeEventStatus(event.status) === 'Ended') return true;
    return countdown.phase === 'Ended';
  }, [event, countdown.phase]);

  const maxRubricScore = useMemo(() => {
    const rawCriteria = event?.criteria || event?.eventCriteria || [];
    const sum = rawCriteria.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);
    return sum > 0 ? sum : 100;
  }, [event]);

  const formatScore = useCallback(
    (val?: number | null): string | null => {
      if (val === null || val === undefined) return null;
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(num) || num <= 0) return null;
      return `${num.toFixed(1)} / ${maxRubricScore}`;
    },
    [maxRubricScore]
  );

  if (loading && !event) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-periwinkle border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl py-24 text-center px-4">
        <h2 className="font-h1 text-2xl font-bold text-white">
          {loadError ? (isVie ? 'Không thể tải cuộc thi' : 'Unable to Load Contest') : (isVie ? 'Không tìm thấy cuộc thi' : 'Contest Not Found')}
        </h2>
        <p className="mt-2 text-sm text-[#8A8FA9]">
          {loadError || (isVie ? 'Sự kiện này có thể đã bị xóa hoặc không còn khả dụng.' : 'This event may have been removed or is no longer available.')}
        </p>
        <Link
          href="/events"
          className="mt-6 inline-flex rounded-2xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-brand-navy cursor-pointer"
        >
          {isVie ? 'Quay lại danh sách cuộc thi' : 'Back to Contests'}
        </Link>
      </div>
    );
  }

  const statusStr = normalizeEventStatus(event.status);
  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-outline';
  const statusLabel = getEventStatusLabel(statusStr, isVie);

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

      {/* Demo Period Testing Bar for Admins */}
      {effectiveIsAdmin && (
        <div className="mb-6 p-4 rounded-2xl border border-purple-500/35 bg-purple-500/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <FastForward className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                  DEMO CONTROLS
                </span>
                <span className="text-[11px] text-purple-200/80">
                  {isVie ? 'Công cụ kiểm thử từng giai đoạn sự kiện' : 'Event Period Testing Tool'}
                </span>
              </div>
              <p className="text-xs font-semibold text-white mt-0.5">
                {isVie ? 'Giai đoạn hiện tại:' : 'Current Period:'}{' '}
                <span className="text-purple-300 font-bold">{isVie ? countdown.phaseLabelVie : countdown.phaseLabel}</span>
                <span className="ml-2 font-mono text-[11px] text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">
                  {isVie ? countdown.formattedVie : countdown.formatted}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdvanceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-950/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{isVie ? 'Kết thúc / Chuyển giai đoạn' : 'End / Advance Period'}</span>
          </button>
        </div>
      )}

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

      {/* Withdraw Submission Confirmation Modal */}
      <SubmissionWithdrawModal
        isOpen={Boolean(withdrawTargetId)}
        onClose={() => !isWithdrawing && setWithdrawTargetId(null)}
        onConfirm={handleConfirmWithdraw}
        isSubmitting={isWithdrawing}
        artworkTitle={
          submissions.find((s) => s.id === withdrawTargetId)?.title ||
          mySubmission?.title
        }
      />

      {/* Advance Period (Demo Testing) Modal */}
      {isAdvanceModalOpen && (
        <AdvancePeriodModal
          event={event}
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          onSuccess={(updated) => setEvent(updated)}
        />
      )}
    </div>
  );
}
