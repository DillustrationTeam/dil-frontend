'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Sparkles,
  Share2,
  CheckCircle2,
  ThumbsUp,
  AlertCircle,
  Flame,
  Crown,
  Palette,
  UserCheck,
  Search,
  UploadCloud,
  FileText,
  X,
  LogIn,
  ExternalLink,
  Medal,
  Clock,
  Lock,
  FolderHeart,
  MonitorUp,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { EventDetailDto, EventSubmissionDto, EventLeaderboardItemDto } from '../types/event.types';
import { eventService } from '../services/event.service';
import { useEventCountdown } from '../hooks/use-event-countdown';
import { eventStatusBadgeStyles, eventStatusLabels } from '../types/event.types';
import { EventStageProgress } from './event-stage-progress';
import { EventSubmissionModal } from './event-submission-modal';
import { useAuthStore } from '@/store/use-auth-store';

interface EventDetailScreenProps {
  id: string;
  userId?: string | null;
}

type TabType = 'artworks' | 'my-submission' | 'wall-of-fame';

function formatScore(val?: number | null): string | null {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return null;
  if (num <= 10) {
    return `${num.toFixed(1)} / 10`;
  }
  return `${num.toFixed(1)} / 100`;
}

export function EventDetailScreen({ id, userId }: EventDetailScreenProps) {
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

  const countdown = useEventCountdown(event);
  const currentUser = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const effectiveUserId = userId || currentUser?.id || null;

  const handleOpenSubmitModal = () => {
    if (!effectiveUserId) {
      toast.error('Please sign in to submit artwork.');
      return;
    }
    if (!isCreator) {
      toast.error('Only creators can participate in this contest. Please set up your creator profile.');
      return;
    }
    setIsSubmitModalOpen(true);
  };

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const [eventData, subData, leadData] = await Promise.all([
          eventService.detail(id),
          eventService.getSubmissions(id),
          eventService.getLeaderboard(id, wallSort),
        ]);
        setEvent(eventData);
        setSubmissions(subData.items);
        setLeaderboard(leadData);
      } catch {
        toast.error('Failed to load contest details.');
      } finally {
        setLoading(false);
      }
    }
    void loadDetail();
  }, [id, wallSort]);

  const handleVote = async (submissionId: string, hasVoted?: boolean) => {
    if (!effectiveUserId) {
      toast.error('Please sign in to vote for artworks.');
      return;
    }

    setVotingId(submissionId);
    try {
      if (hasVoted) {
        await eventService.unvoteSubmission(submissionId);
        toast.success('Vote removed.');
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, voteCount: Math.max(0, s.voteCount - 1), hasVoted: false } : s)),
        );
      } else {
        await eventService.voteSubmission(submissionId);
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
      {/* Top Bar Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft size={15} />
          <span>All Contests</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <FileText size={15} />
            <span>Rules & Guidelines</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161926] shadow-2xl">
        {/* Banner image */}
        <div className="relative aspect-[21/9] w-full min-h-[260px] overflow-hidden bg-black/50">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerUrl} alt={event.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-r from-[#1b1f36] to-[#121420]">
              <Sparkles size={48} className="text-brand-periwinkle/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161926] via-[#161926]/60 to-black/30" />

          {/* Badges on Banner */}
          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 text-xs font-bold backdrop-blur-md ${statusColor}`}>
              {statusLabel}
            </span>
            {event.isFeatured && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <Flame size={13} className="text-amber-400" />
                Featured Contest
              </span>
            )}
          </div>
        </div>

        {/* Content Details Below Banner */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-8 -mt-16 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#8A8FA9]">
              <span className="flex items-center gap-1 font-semibold text-white">
                <CheckCircle2 size={15} className="text-brand-periwinkle" />
                {event.createdByAdminName || 'Dillustration Committee'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Started {new Date(event.submissionStartAt).toLocaleDateString('en-US')}
              </span>
            </div>

            <h1 className="font-h1 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>

            <p className="text-sm sm:text-base text-[#A7ACD9] leading-relaxed max-w-4xl">
              {event.description}
            </p>
          </div>

          {/* Prestigious Prize Pool Showcase Box (Full & Unclipped) */}
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_30px_rgba(251,191,36,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                <Trophy size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
                    Official Prize Pool & Honors
                  </span>
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-amber-300/80 font-medium">Guaranteed Distribution</span>
                </div>
                <div className="font-h1 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-relaxed break-words whitespace-pre-line">
                  {event.prize || 'Trophy & Official Cash Rewards (To Be Announced)'}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">Submissions</span>
              <p className="mt-1 font-h1 text-lg sm:text-xl font-bold text-white">{event.submissionCount} entries</p>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Total Community Votes</span>
              <p className="mt-1 font-h1 text-lg sm:text-xl font-bold text-white">
                {(event.totalVoteCount ?? 0).toLocaleString('en-US')}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                {countdown.phaseLabel}
              </span>
              <p className="mt-1 font-mono text-base sm:text-lg font-bold text-white">{countdown.formatted}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar with Dual Endpoints for Each Stage (Thanh progress với mốc biểu thị 2 đầu của stage) */}
      <div className="mt-10">
        <EventStageProgress event={event} />
      </div>

      {/* 3 Primary Tabs Navigation: Event Artworks | My Submission | Wall Of Fame */}
      <div className="mt-12 flex border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('artworks')}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'artworks'
              ? 'border-brand-periwinkle text-brand-periwinkle'
              : 'border-transparent text-[#8A8FA9] hover:text-white'
          }`}
        >
          <Palette size={17} />
          <span>Event Artworks ({submissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-submission')}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'my-submission'
              ? 'border-brand-periwinkle text-brand-periwinkle'
              : 'border-transparent text-[#8A8FA9] hover:text-white'
          }`}
        >
          <UserCheck size={17} />
          <span>My Submission</span>
          {mySubmission && (
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wall-of-fame')}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'wall-of-fame'
              ? isAnnounced
                ? 'border-amber-400 text-amber-300'
                : 'border-brand-periwinkle text-brand-periwinkle'
              : 'border-transparent text-[#8A8FA9] hover:text-white'
          }`}
        >
          {isAnnounced ? <Crown size={17} /> : <Lock size={15} className="text-[#8A8FA9]" />}
          <span>Wall Of Fame</span>
          {isAnnounced ? (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-300">
              Top {leaderboard.length || 0}
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#A7ACD9]">
              Pending Announcement
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-8">
        {/* ============================================================== */}
        {/* TAB 1: EVENT ARTWORKS */}
        {/* ============================================================== */}
        {activeTab === 'artworks' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161926] p-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8FA9]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artworks or artists..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8A8FA9]">Sort:</span>
                  <button
                    type="button"
                    onClick={() => setSortBy('votes')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      sortBy === 'votes'
                        ? 'bg-brand-periwinkle text-brand-navy'
                        : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
                    }`}
                  >
                    Most Votes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      sortBy === 'newest'
                        ? 'bg-brand-periwinkle text-brand-navy'
                        : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
                    }`}
                  >
                    Newest
                  </button>
                </div>
              </div>
            </div>

            {/* Artworks Grid */}
            {filteredArtworks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center">
                <Palette size={40} className="mx-auto text-outline/50 mb-3" />
                <h3 className="font-h1 text-lg font-bold text-white">No submissions found</h3>
                <p className="mt-1 text-xs text-[#8A8FA9] max-w-md mx-auto">
                  {searchQuery
                    ? 'No artworks matched your search criteria. Try a different query.'
                    : 'Be the pioneer creator to submit your original artwork for this competition! Go to My Submission tab to enter.'}
                </p>
                {isSubmissionOpen && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-submission')}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-brand-periwinkle/30 bg-brand-periwinkle/15 px-6 py-2.5 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle/25 transition cursor-pointer"
                  >
                    <UserCheck size={16} />
                    <span>Go to My Submission</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArtworks.map((sub) => {
                  const isMine = effectiveUserId && sub.submitterId === effectiveUserId;
                  const artworkLink = sub.artworkId ? `/artworks/${sub.artworkId}` : '#';

                  return (
                    <article
                      key={sub.id}
                      className={`group overflow-hidden rounded-3xl border bg-[#161926] shadow-lg transition duration-200 hover:-translate-y-1 ${
                        isMine
                          ? 'border-brand-periwinkle/50 ring-1 ring-brand-periwinkle/30'
                          : 'border-white/10 hover:border-brand-periwinkle/30'
                      }`}
                    >
                      <Link
                        href={artworkLink}
                        className="relative aspect-[4/3] w-full block overflow-hidden bg-black/40 group/img cursor-pointer"
                      >
                        {sub.artworkImageUrl || sub.artworkThumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.artworkImageUrl || sub.artworkThumbnailUrl || ''}
                            alt={sub.title}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-outline">
                            No preview available
                          </div>
                        )}

                        {isMine && (
                          <div className="absolute left-3 top-3 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/90 px-3 py-1 text-[11px] font-extrabold text-brand-navy shadow-md backdrop-blur-md">
                            My Entry
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-white backdrop-blur-[2px]">
                          <ExternalLink size={14} />
                          <span>View Artwork</span>
                        </div>
                      </Link>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#A7ACD9] font-medium">@{sub.submitterName || 'Artist'}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                            <Trophy size={13} /> {sub.voteCount} votes
                          </span>
                        </div>

                        <Link href={artworkLink} className="block group/title cursor-pointer">
                          <h4 className="font-h1 text-base font-bold text-white line-clamp-1 group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                            {sub.title}
                          </h4>
                        </Link>

                        {sub.description && (
                          <p className="line-clamp-2 text-xs text-[#8A8FA9]">{sub.description}</p>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVote(sub.id, sub.hasVoted)}
                            disabled={votingId === sub.id}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
                              sub.hasVoted
                                ? 'border border-brand-periwinkle bg-brand-periwinkle/20 text-brand-periwinkle'
                                : 'bg-white/10 hover:bg-brand-periwinkle hover:text-brand-navy text-white'
                            }`}
                          >
                            <ThumbsUp size={14} className={sub.hasVoted ? 'fill-current' : ''} />
                            <span>{sub.hasVoted ? 'Voted' : 'Vote'}</span>
                          </button>

                          <Link
                            href={artworkLink}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
                            title="View artwork details"
                          >
                            <ExternalLink size={13} />
                            <span className="hidden sm:inline">Details</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MY SUBMISSION */}
        {/* ============================================================== */}
        {activeTab === 'my-submission' && (
          <div className="space-y-6">
            {!effectiveUserId ? (
              // Case: Not logged in
              <div className="rounded-3xl border border-white/10 bg-[#161926] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mx-auto mb-4">
                  <LogIn size={32} />
                </div>
                <h3 className="font-h1 text-xl font-bold text-white">Sign In to View Your Submission</h3>
                <p className="mt-2 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
                  Connect your Dillustration account to submit your contest entry, check real-time community votes, and track your standing on the Wall of Fame.
                </p>
                <Link
                  href={`/login?redirect=/events/${id}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-8 py-3 text-xs font-bold text-brand-navy shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Sign In Now</span>
                </Link>
              </div>
            ) : !isCreator && !mySubmission ? (
              // Case: Logged in but NOT a Creator
              <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[#161926] to-[#161926] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 mx-auto mb-4">
                  <Palette size={32} />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 mb-3">
                  <Sparkles size={13} />
                  <span>Creator Exclusive</span>
                </div>
                <h3 className="font-h1 text-xl sm:text-2xl font-bold text-white">
                  Only Creators Can Participate in Contests
                </h3>
                <p className="mt-3 text-sm text-[#A7ACD9] leading-relaxed max-w-md mx-auto">
                  Event submissions are reserved exclusively for registered Creators on Dillustration. Complete your Creator Profile to showcase your portfolio, submit artworks, and compete for community awards.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/creator-setup"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-xs font-bold text-brand-navy shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <Palette size={16} />
                    <span>Become a Creator</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab('artworks')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    <span>Browse & Vote Artworks</span>
                  </button>
                </div>
              </div>
            ) : mySubmission ? (
              // Case: User has submitted an artwork
              <div className="rounded-3xl border border-brand-periwinkle/30 bg-gradient-to-br from-brand-periwinkle/10 via-[#161926] to-[#161926] p-6 sm:p-10 shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left: Artwork Preview */}
                  <Link
                    href={mySubmission.artworkId ? `/artworks/${mySubmission.artworkId}` : '#'}
                    className="w-full lg:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-inner block relative group cursor-pointer"
                  >
                    {mySubmission.artworkImageUrl || mySubmission.artworkThumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mySubmission.artworkImageUrl || mySubmission.artworkThumbnailUrl || ''}
                        alt={mySubmission.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-outline">
                        Preview not available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-white backdrop-blur-[2px]">
                      <ExternalLink size={15} />
                      <span>View Artwork Page</span>
                    </div>
                  </Link>

                  {/* Right: Submission Info & Performance */}
                  <div className="w-full lg:w-1/2 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-300">
                          Active Entry
                        </span>
                        {mySubmission.aiScanPassed && (
                          <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-1 text-xs font-bold text-brand-periwinkle">
                            Originality Verified
                          </span>
                        )}
                      </div>

                      <Link
                        href={mySubmission.artworkId ? `/artworks/${mySubmission.artworkId}` : '#'}
                        className="block group/title cursor-pointer"
                      >
                        <h2 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                          {mySubmission.title}
                        </h2>
                      </Link>
                      <p className="mt-1 text-xs text-[#8A8FA9]">
                        Submitted by @{mySubmission.submitterName || currentUser?.fullName || 'You'} •{' '}
                        {new Date(mySubmission.submittedAt).toLocaleDateString('en-US')}
                      </p>
                    </div>

                    {mySubmission.description && (
                      <p className="text-sm text-[#A7ACD9] leading-relaxed whitespace-pre-line bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                        {mySubmission.description}
                      </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Community Votes
                        </span>
                        <p className="mt-1 font-h1 text-2xl font-extrabold text-white">
                          {mySubmission.voteCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">
                          Jury Evaluation
                        </span>
                        <p className="mt-1 font-h1 text-2xl font-extrabold text-white">
                          {mySubmission.score ? `${mySubmission.score} / 100` : 'Pending Review'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      {mySubmission.artworkId && (
                        <Link
                          href={`/artworks/${mySubmission.artworkId}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-5 py-2.5 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                        >
                          <ExternalLink size={15} />
                          <span>View Artwork Page</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Share2 size={15} />
                        <span>Share My Artwork</span>
                      </button>

                      {mySubmission.artworkImageUrl && (
                        <a
                          href={mySubmission.artworkImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          <ExternalLink size={15} />
                          <span>View Full Resolution</span>
                        </a>
                      )}

                      {isSubmissionOpen && (
                        <button
                          type="button"
                          onClick={handleOpenSubmitModal}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-5 py-2.5 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                        >
                          <Edit3 size={15} />
                          <span>Edit Submission</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Case: Logged in but has not submitted yet
              <div className="rounded-3xl border border-white/10 bg-[#161926] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 mx-auto mb-4">
                  <UploadCloud size={32} />
                </div>
                <h3 className="font-h1 text-xl sm:text-2xl font-bold text-white">
                  You Haven&apos;t Submitted an Entry Yet
                </h3>
                <p className="mt-2 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
                  {isSubmissionOpen
                    ? 'Submissions are currently open! You can submit an existing artwork from your portfolio or upload a new creation from your PC.'
                    : 'The submission window for this contest is currently closed. Stay tuned for the next competition stage!'}
                </p>

                {isSubmissionOpen ? (
                  <div className="mt-8 space-y-6">
                    {/* Visual cards showing the 2 choices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3.5">
                        <div className="size-10 rounded-xl bg-brand-periwinkle/15 text-brand-periwinkle flex items-center justify-center shrink-0">
                          <FolderHeart size={20} />
                        </div>
                        <div>
                          <h4 className="font-h1 text-xs font-bold text-white">Option 1: From My Artworks</h4>
                          <p className="text-[11px] text-[#8A8FA9] mt-1 leading-relaxed">
                            Select directly from your published artworks on Dillustration.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3.5">
                        <div className="size-10 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                          <MonitorUp size={20} />
                        </div>
                        <div>
                          <h4 className="font-h1 text-xs font-bold text-white">Option 2: Upload from PC</h4>
                          <p className="text-[11px] text-[#8A8FA9] mt-1 leading-relaxed">
                            Upload a digital artwork file directly from your local computer storage.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSubmitModal}
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-8 py-3.5 text-xs font-bold text-brand-navy shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
                    >
                      <UploadCloud size={16} />
                      <span>Submit Artwork</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs text-[#A7ACD9]">
                    <Clock size={15} />
                    <span>Submission deadline has passed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: WALL OF FAME */}
        {/* ============================================================== */}
        {activeTab === 'wall-of-fame' && (
          <div className="space-y-10">
            {!isAnnounced ? (
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#161926] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
                <div className="absolute -right-20 -top-20 size-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 size-60 rounded-full bg-brand-periwinkle/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
                    <Lock size={36} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 mb-4">
                    <Clock size={13} /> Official Results Sealed
                  </span>

                  <h3 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white">
                    The Wall of Fame is Locked
                  </h3>

                  <p className="mt-3 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
                    The Hall of Laureates, Grand Prix champions, and official jury marks will only open after the Announcement stage. Until then, final rankings and scores remain confidential.
                  </p>

                  {event.resultAnnouncementAt && (
                    <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs">
                      <span className="text-[#8A8FA9]">Official Announcement scheduled for:</span>
                      <span className="font-h1 font-bold text-white text-sm">
                        {new Date(event.resultAnnouncementAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('artworks')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-6 py-3 text-xs font-bold text-brand-navy shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
                    >
                      <Palette size={16} />
                      <span>Explore Submissions & Vote</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRulesModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <Trophy size={16} className="text-amber-400" />
                      <span>View Prize Pool Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header & Sorter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown size={22} className="text-amber-400" />
                      <h2 className="font-h1 text-xl sm:text-2xl font-bold text-white">
                        The Wall Of Fame
                      </h2>
                    </div>
                    <p className="text-xs text-[#8A8FA9] mt-1">
                      Honoring the grand champions, laureates, and highest-ranking creations of this competition
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8A8FA9]">Rank by:</span>
                    <button
                      type="button"
                      onClick={() => setWallSort('votes')}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        wallSort === 'votes'
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
                      }`}
                    >
                      Community Votes
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallSort('score')}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        wallSort === 'score'
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
                      }`}
                    >
                      Jury Score
                    </button>
                  </div>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center">
                    <Trophy size={40} className="mx-auto text-amber-400/40 mb-3" />
                    <h3 className="font-h1 text-lg font-bold text-white">Wall of Fame Awaiting Champions</h3>
                    <p className="mt-1 text-xs text-[#8A8FA9]">
                      As community votes and jury evaluations accumulate, the top artists will be immortalized here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Podium Top 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      {/* #2 Silver Laureate */}
                      {podiumTop3[1] && (
                        <div className="order-2 md:order-1 rounded-3xl border border-slate-300/30 bg-gradient-to-b from-slate-400/10 via-[#161926] to-[#161926] p-6 text-center shadow-xl space-y-4">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/40 bg-slate-300/20 px-3.5 py-1 text-xs font-bold text-slate-200">
                            <Medal size={14} className="text-slate-300" />
                            <span>#2 Silver Laureate</span>
                          </div>

                          <Link
                            href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
                            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer"
                          >
                            {podiumTop3[1].artworkImageUrl || podiumTop3[1].artworkThumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={podiumTop3[1].artworkImageUrl || podiumTop3[1].artworkThumbnailUrl || ''}
                                alt={podiumTop3[1].title}
                                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-outline">
                                Artwork Preview
                              </div>
                            )}
                          </Link>

                          <div>
                            <Link
                              href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
                              className="font-h1 text-base font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
                            >
                              {podiumTop3[1].title}
                            </Link>
                            <p className="text-xs text-[#8A8FA9] mt-0.5">@{podiumTop3[1].submitterName}</p>
                          </div>

                          <div className="border-t border-white/10 pt-3 flex items-center justify-around text-xs">
                            {wallSort === 'score' ? (
                              <>
                                <div>
                                  <span className="text-brand-periwinkle block text-[10px] font-bold uppercase tracking-wider">
                                    Jury Score
                                  </span>
                                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                                    {formatScore(podiumTop3[1].score ?? podiumTop3[1].judgeScore) ?? 'Pending'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                                  <span className="font-bold text-slate-300 text-sm">
                                    {podiumTop3[1].voteCount}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                                    Total Votes
                                  </span>
                                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                                    {podiumTop3[1].voteCount}
                                  </span>
                                </div>
                                {(podiumTop3[1].score || podiumTop3[1].judgeScore) && (
                                  <div>
                                    <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                                    <span className="font-bold text-brand-periwinkle text-sm">
                                      {formatScore(podiumTop3[1].score ?? podiumTop3[1].judgeScore)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* #1 Champion Grand Prix (Gold) */}
                      {podiumTop3[0] && (
                        <div className="order-1 md:order-2 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 via-[#161926] to-[#161926] p-7 text-center shadow-[0_0_50px_rgba(251,191,36,0.25)] space-y-4 md:-translate-y-4">
                          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg">
                            <Crown size={15} />
                            <span>#1 GRAND PRIX CHAMPION</span>
                          </div>

                          <Link
                            href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
                            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-black/40 shadow-inner cursor-pointer"
                          >
                            {podiumTop3[0].artworkImageUrl || podiumTop3[0].artworkThumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={podiumTop3[0].artworkImageUrl || podiumTop3[0].artworkThumbnailUrl || ''}
                                alt={podiumTop3[0].title}
                                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-outline">
                                Artwork Preview
                              </div>
                            )}
                          </Link>

                          <div>
                            <Link
                              href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
                              className="font-h1 text-lg font-extrabold text-white line-clamp-1 hover:text-amber-300 transition cursor-pointer"
                            >
                              {podiumTop3[0].title}
                            </Link>
                            <p className="text-xs text-amber-300 font-semibold mt-0.5">@{podiumTop3[0].submitterName}</p>
                          </div>

                          <div className="border-t border-amber-400/20 pt-3 flex items-center justify-around text-xs">
                            {wallSort === 'score' ? (
                              <>
                                <div>
                                  <span className="text-amber-200/90 block text-[10px] uppercase font-bold tracking-wider">
                                    Jury Rating
                                  </span>
                                  <span className="font-h1 font-extrabold text-amber-300 text-xl sm:text-2xl">
                                    {formatScore(podiumTop3[0].score ?? podiumTop3[0].judgeScore) ?? 'Pending'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-amber-200/80 block text-[10px] uppercase font-bold">
                                    Total Votes
                                  </span>
                                  <span className="font-h1 font-bold text-white text-base sm:text-lg">
                                    {podiumTop3[0].voteCount}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span className="text-amber-200/80 block text-[10px] uppercase font-bold tracking-wider">
                                    Total Votes
                                  </span>
                                  <span className="font-h1 font-extrabold text-amber-300 text-xl sm:text-2xl">
                                    {podiumTop3[0].voteCount}
                                  </span>
                                </div>
                                {(podiumTop3[0].score || podiumTop3[0].judgeScore) && (
                                  <div>
                                    <span className="text-amber-200/80 block text-[10px] uppercase font-bold">
                                      Jury Rating
                                    </span>
                                    <span className="font-h1 font-extrabold text-white text-lg">
                                      {formatScore(podiumTop3[0].score ?? podiumTop3[0].judgeScore)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* #3 Bronze Laureate */}
                      {podiumTop3[2] && (
                        <div className="order-3 rounded-3xl border border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-[#161926] to-[#161926] p-6 text-center shadow-xl space-y-4">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-700/30 px-3.5 py-1 text-xs font-bold text-amber-200">
                            <Medal size={14} className="text-amber-500" />
                            <span>#3 Bronze Laureate</span>
                          </div>

                          <Link
                            href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
                            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer"
                          >
                            {podiumTop3[2].artworkImageUrl || podiumTop3[2].artworkThumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={podiumTop3[2].artworkImageUrl || podiumTop3[2].artworkThumbnailUrl || ''}
                                alt={podiumTop3[2].title}
                                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-outline">
                                Artwork Preview
                              </div>
                            )}
                          </Link>

                          <div>
                            <Link
                              href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
                              className="font-h1 text-base font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
                            >
                              {podiumTop3[2].title}
                            </Link>
                            <p className="text-xs text-[#8A8FA9] mt-0.5">@{podiumTop3[2].submitterName}</p>
                          </div>

                          <div className="border-t border-white/10 pt-3 flex items-center justify-around text-xs">
                            {wallSort === 'score' ? (
                              <>
                                <div>
                                  <span className="text-amber-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Jury Score
                                  </span>
                                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                                    {formatScore(podiumTop3[2].score ?? podiumTop3[2].judgeScore) ?? 'Pending'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                                  <span className="font-semibold text-slate-300 text-xs">
                                    {podiumTop3[2].voteCount}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                                    Total Votes
                                  </span>
                                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                                    {podiumTop3[2].voteCount}
                                  </span>
                                </div>
                                {(podiumTop3[2].score || podiumTop3[2].judgeScore) && (
                                  <div>
                                    <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                                    <span className="font-bold text-amber-300 text-sm">
                                      {formatScore(podiumTop3[2].score ?? podiumTop3[2].judgeScore)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Honor Roll List for #4 and above with artwork image previews */}
                    {restLeaderboard.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <h3 className="font-h1 text-sm sm:text-base font-bold text-white flex items-center gap-2">
                            <Medal size={18} className="text-slate-400" />
                            <span>Honor Roll Contenders</span>
                          </h3>
                          <span className="text-xs text-[#8A8FA9]">
                            Ranks #{restLeaderboard[0]?.rank || 4} - #{restLeaderboard[restLeaderboard.length - 1]?.rank || (restLeaderboard.length + 3)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {restLeaderboard.map((item, idx) => {
                            const artworkLink = item.artworkId ? `/artworks/${item.artworkId}` : '#';
                            const scoreDisplay = formatScore(item.score ?? item.judgeScore);

                            return (
                              <article
                                key={item.submissionId}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#161926] p-5 shadow-lg transition duration-200 hover:-translate-y-1 hover:border-brand-periwinkle/40 space-y-4"
                              >
                                {/* Artwork Image preview like in top 3 */}
                                <Link
                                  href={artworkLink}
                                  className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 group-hover:border-brand-periwinkle/30 transition cursor-pointer"
                                >
                                  {item.artworkImageUrl || item.artworkThumbnailUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.artworkImageUrl || item.artworkThumbnailUrl || ''}
                                      alt={item.title}
                                      className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                    />
                                  ) : (
                                    <div className="flex size-full items-center justify-center text-xs text-outline">
                                      Artwork Preview
                                    </div>
                                  )}

                                  {/* Rank badge on image */}
                                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                                    <span>#{item.rank || idx + 4}</span>
                                  </div>
                                </Link>

                                {/* Details */}
                                <div>
                                  <Link
                                    href={artworkLink}
                                    className="block font-h1 text-sm font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
                                  >
                                    {item.title}
                                  </Link>
                                  <p className="text-xs text-[#8A8FA9] mt-0.5">@{item.submitterName}</p>
                                </div>

                                {/* Metrics display depending on wallSort */}
                                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                                  {wallSort === 'score' ? (
                                    <>
                                      <div>
                                        <span className="text-brand-periwinkle block text-[10px] font-bold uppercase tracking-wider">
                                          Jury Score
                                        </span>
                                        <span className="font-h1 font-extrabold text-white text-base">
                                          {scoreDisplay ?? 'Pending'}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                                        <span className="text-xs text-[#A7ACD9] font-medium">
                                          {item.voteCount} votes
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                                          Votes
                                        </span>
                                        <span className="font-h1 font-extrabold text-brand-periwinkle text-base">
                                          {item.voteCount}
                                        </span>
                                      </div>
                                      {scoreDisplay && (
                                        <div className="text-right">
                                          <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                                          <span className="text-xs text-slate-300 font-semibold">
                                            {scoreDisplay}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
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
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#161926] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                  <Trophy size={18} />
                </div>
                <h3 className="font-h1 text-lg font-bold text-white">Contest Rules & Prize Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Prize section */}
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-5">
              <h4 className="font-h1 text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                <Trophy size={16} /> Official Prizes & Rewards
              </h4>
              <p className="font-h1 text-base font-semibold text-white leading-relaxed whitespace-pre-line break-words">
                {event.prize || 'Official prize breakdown will be announced by the organizing committee.'}
              </p>
            </div>

            {/* Rules section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h4 className="font-h1 text-sm font-bold text-brand-periwinkle mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> Official Rules & Guidelines
              </h4>
              <p className="text-xs sm:text-sm text-[#A7ACD9] leading-relaxed whitespace-pre-line break-words">
                {event.rules ||
                  'All entries must be original works created by the submitter. Plagiarism, copyright infringement, or unauthorized AI generation will lead to immediate disqualification.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="rounded-xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-brand-navy cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
