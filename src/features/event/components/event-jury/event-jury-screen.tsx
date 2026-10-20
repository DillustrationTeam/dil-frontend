'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Gavel,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Save,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  FileText,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Crown,
  Check,
  Info,
  Flame,
  Trophy,
  Calendar,
  X,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import type { EventDetailDto } from '../../types/event.types';
import { eventStatusBadgeStyles, eventStatusLabels } from '../../types/event.types';
import type {
  JuryCriterion,
  JurySubmissionItem,
  JuryEvaluationDraft,
  JuryStats,
  JuryMemberInfo,
} from '../../types/jury.types';
import type { CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { eventService } from '../../services/event.service';
import { juryService } from '../../services/jury.service';
import { JuryArtworkLightbox } from './jury-artwork-lightbox';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';

interface EventJuryScreenProps {
  eventId: string;
}

type FilterTab = 'all' | 'pending' | 'graded';

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Nov 28, 2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Nov 28, 2026';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventJuryScreen({ eventId }: EventJuryScreenProps) {
  const [now] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [criteria, setCriteria] = useState<JuryCriterion[]>([]);
  const [submissions, setSubmissions] = useState<JurySubmissionItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for the currently selected submission
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [noConflict, setNoConflict] = useState(true);

  // Lightbox & Modal states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Status badge styling matching event-detail-screen
  const statusStr =
    typeof event?.status === 'number'
      ? event.status === 2
        ? 'Open'
        : event.status === 3
        ? 'Judging'
        : event.status === 4
        ? 'Ended'
        : 'Draft'
      : String(event?.status || 'Judging');
  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-[#9695a1]';
  const statusLabel = eventStatusLabels[statusStr] || statusStr;

  // Check whether the contest is in the official Judging Phase
  const isJudgingPhase = useMemo(() => {
    if (!event) return false;
    const statusVal = String(event.status).toLowerCase();
    if (statusVal === 'judging' || statusVal === '3') return true;

    // If event is in Draft or Ended, judging is strictly inactive
    if (statusVal === 'draft' || statusVal === '1' || statusVal === 'ended' || statusVal === '4') {
      return false;
    }

    // Check by judging stage dates if configured
    if (event.judgingStartAt) {
      const start = new Date(event.judgingStartAt).getTime();
      const end = event.judgingEndAt ? new Date(event.judgingEndAt).getTime() : Infinity;
      if (now >= start && now <= end) return true;
    }

    return false;
  }, [event, now]);

  const [juries, setJuries] = useState<JuryMemberInfo[]>([]);
  const [myCreatorProfile, setMyCreatorProfile] = useState<CreatorProfileDto | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const effectiveUserId = currentUser?.id ?? null;

  // Fetch event, criteria, and submissions
  useEffect(() => {
    let isMounted = true;

    async function loadJuryWorkspace() {
      setLoading(true);
      try {
        const [eventData, criteriaData, juriesData, profileData] = await Promise.all([
          eventService.detail(eventId).catch(() => null),
          juryService.getEventCriteria(eventId).catch(() => []),
          juryService.getEventJuries(eventId).catch(() => []),
          effectiveUserId ? creatorProfileService.getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setJuries(juriesData || []);
        setMyCreatorProfile(profileData);

        if (eventData) {
          setEvent(eventData);
        } else {
          setEvent({
            id: eventId,
            title: 'AURA 2026',
            description: 'Annual digital illustration and visual arts competition on Dillustration.',
            bannerUrl: null,
            maxVote: 1,
            status: 'Judging',
            submissionStartAt: '2026-10-01T00:00:00Z',
            submissionEndAt: '2026-11-15T23:59:59Z',
            judgingStartAt: '2026-11-16T00:00:00Z',
            judgingEndAt: '2026-11-28T23:59:59Z',
            votingStartAt: '2026-11-20T00:00:00Z',
            votingEndAt: '2026-11-28T23:59:59Z',
            resultAnnouncementAt: '2026-12-01T12:00:00Z',
            submissionCount: 24,
            createdAt: '2026-10-01T00:00:00Z',
          });
        }

        setCriteria(criteriaData);

        const eventTitle = eventData?.title || 'AURA 2026';
        const subItems = await juryService.getAssignedSubmissions(eventId, eventTitle);

        if (!isMounted) return;
        setSubmissions(subItems);

        if (subItems.length > 0) {
          const firstPending = subItems.find((s) => !s.isGraded);
          setSelectedSubmissionId(firstPending ? firstPending.id : subItems[0].id);
        }
      } catch {
        toast.error('Failed to load Jury workspace data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadJuryWorkspace();
    return () => {
      isMounted = false;
    };
  }, [eventId, effectiveUserId]);

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

  const activeSubmission = useMemo(() => {
    return submissions.find((s) => s.id === selectedSubmissionId) || submissions[0] || null;
  }, [submissions, selectedSubmissionId]);

  const [prevSubmissionId, setPrevSubmissionId] = useState<string | null>(null);

  if (activeSubmission && activeSubmission.id !== prevSubmissionId) {
    setPrevSubmissionId(activeSubmission.id);

    const draft = juryService.getDraft(eventId, activeSubmission.id);

    const initialScores: Record<string, number> = {};
    criteria.forEach((crit) => {
      if (draft?.criteriaScores && typeof draft.criteriaScores[crit.id] === 'number') {
        initialScores[crit.id] = draft.criteriaScores[crit.id];
      } else if (activeSubmission.criteriaScores && typeof activeSubmission.criteriaScores[crit.id] === 'number') {
        initialScores[crit.id] = activeSubmission.criteriaScores[crit.id];
      } else {
        initialScores[crit.id] = 0;
      }
    });

    setScores(initialScores);
    setNotes(draft?.notes ?? activeSubmission.notes ?? '');
    setNoConflict(draft?.noConflictOfInterest ?? activeSubmission.noConflictOfInterest ?? true);
  }

  const totalScore = useMemo(() => {
    return criteria.reduce((sum, crit) => {
      const val = scores[crit.id];
      return sum + (typeof val === 'number' && !isNaN(val) ? val : 0);
    }, 0);
  }, [scores, criteria]);

  const stats: JuryStats = useMemo(() => {
    return juryService.calculateStats(submissions);
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (filterTab === 'pending' && sub.isGraded) return false;
      if (filterTab === 'graded' && !sub.isGraded) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = sub.title.toLowerCase().includes(q);
        const matchesCode = sub.code.toLowerCase().includes(q);
        const matchesCategory = sub.category?.toLowerCase().includes(q);
        return matchesTitle || matchesCode || matchesCategory;
      }

      return true;
    });
  }, [submissions, filterTab, searchQuery]);

  const handleScoreChange = (criteriaId: string, val: number, maxScore: number) => {
    if (activeSubmission?.isLocked) {
      toast.error('Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.');
      return;
    }
    const clamped = Math.max(0, Math.min(maxScore, val));
    setScores((prev) => ({
      ...prev,
      [criteriaId]: clamped,
    }));
  };

  const handleSaveDraft = () => {
    if (!activeSubmission) return;
    if (activeSubmission.isLocked) {
      toast.error('Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.');
      return;
    }
    if (!isJudgingPhase) {
      toast.error('Evaluation is locked until the contest reaches the Judging phase.');
      return;
    }

    const draft: JuryEvaluationDraft = {
      submissionId: activeSubmission.id,
      totalScore,
      criteriaScores: scores,
      notes,
      noConflictOfInterest: noConflict,
      nominateSpecialAward: false,
      updatedAt: new Date().toISOString(),
      isLocked: false,
    };

    juryService.saveDraft(eventId, activeSubmission.id, draft);

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === activeSubmission.id
          ? {
              ...s,
              gradedScore: totalScore,
              notes,
              criteriaScores: scores,
              noConflictOfInterest: noConflict,
              nominateSpecialAward: false,
            }
          : s
      )
    );

    toast.success(`Draft saved for #${activeSubmission.code} (${totalScore} pts)`);
  };

  const handleSubmitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSubmission) return;

    if (activeSubmission.isLocked) {
      toast.error('Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.');
      return;
    }

    if (!isJuryMember) {
      toast.error('Bạn không có quyền chấm điểm vì không được phân công làm Giám khảo cho sự kiện này.');
      return;
    }

    if (!isJudgingPhase) {
      toast.error('Evaluation is locked until the contest reaches the Judging phase.');
      return;
    }

    if (!noConflict) {
      toast.error('Please confirm that you have no conflict of interest before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const criteriaList = criteria.map((c) => ({
        criteriaId: c.id,
        criteriaName: c.name,
        score: scores[c.id] || 0,
      }));

      await juryService.submitScore(eventId, activeSubmission.id, {
        submissionId: activeSubmission.id,
        totalScore,
        notes,
        noConflictOfInterest: noConflict,
        nominateSpecialAward: false,
        criteriaScores: criteriaList,
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === activeSubmission.id
            ? {
                ...s,
                isGraded: true,
                gradedScore: totalScore,
                notes,
                criteriaScores: scores,
                noConflictOfInterest: noConflict,
                nominateSpecialAward: false,
                isLocked: true,
              }
            : s
        )
      );

      toast.success(`Evaluation submitted successfully: ${totalScore} / 100 points!`);

      const nextPending = submissions.find(
        (s) => s.id !== activeSubmission.id && !s.isGraded
      );
      if (nextPending) {
        setSelectedSubmissionId(nextPending.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error submitting score.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = submissions.findIndex((s) => s.id === activeSubmission?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#A7ACD9] animate-spin" />
        <p className="text-sm text-[#9695a1]">Loading Jury Evaluation Workspace...</p>
      </div>
    );
  }

  if (!isJuryMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-sora text-xl sm:text-2xl font-bold text-white">
          Truy cập bị từ chối
        </h2>
        <p className="mt-2 text-sm text-[#9695a1] max-w-md mx-auto leading-relaxed">
          Bạn không được phân công làm Giám khảo (Jury) cho sự kiện này. Chỉ những giám khảo được bổ nhiệm chính thức mới có quyền truy cập không gian chấm thi.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:brightness-110 transition shadow-lg"
          >
            <ChevronLeft size={16} />
            <span>Quay lại chi tiết sự kiện</span>
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-semibold text-[#9695a1] hover:text-white hover:bg-white/10 transition"
          >
            <span>Tất cả sự kiện</span>
          </Link>
        </div>
      </div>
    );
  }

  const deadlineFormatted = formatDisplayDate(event?.judgingEndAt);
  const eventTitle = event?.title || 'AURA 2026';

  return (
    <div className="min-h-screen text-[#e4e1e5] relative pb-16">
      {/* Lightbox Modal */}
      {activeSubmission && (
        <JuryArtworkLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={activeSubmission.artworkImageUrl}
          title={activeSubmission.title}
          code={activeSubmission.code}
          category={activeSubmission.category}
          aiScanPassed={activeSubmission.aiScanPassed}
        />
      )}

      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 text-xs text-[#9695a1]">
          <Link href="/creator/commissions" className="hover:text-white transition-colors">
            Creator Studio
          </Link>
          <span>/</span>
          <Link href="/creator/events/jury" className="hover:text-white transition-colors">
            Event Jury
          </Link>
          <span>/</span>
          <span className="text-[#A7ACD9] font-medium">{eventTitle}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#A7ACD9] transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <FileText size={14} />
            <span>Rules & Guidelines</span>
          </button>

          <Link
            href={`/creator/events/${eventId}/head-jury`}
            className="px-3 py-1.5 rounded-xl border border-[#A7ACD9]/30 hover:border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs font-semibold text-[#A7ACD9] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Head Jury Room</span>
          </Link>

          <Link
            href={`/events/${eventId}`}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs text-white transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A7ACD9]" />
            <span>Public Event Page</span>
          </Link>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161926] shadow-2xl mb-8">
        <div className="relative aspect-[21/9] w-full min-h-[220px] sm:min-h-[260px] max-h-[360px] overflow-hidden bg-black/50">
          {event?.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerUrl} alt={eventTitle} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-r from-[#1b1f36] to-[#121420]">
              <Sparkles size={48} className="text-[#A7ACD9]/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161926] via-[#161926]/60 to-black/30" />

          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full border px-3.5 py-1 text-xs font-bold backdrop-blur-md ${statusColor}`}>
              {statusLabel}
            </span>
            {event?.isFeatured && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <Flame size={13} className="text-amber-400" />
                Featured Contest
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 space-y-6 -mt-14 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#8A8FA9]">
              <span className="flex items-center gap-1 font-semibold text-white">
                <CheckCircle2 size={15} className="text-[#A7ACD9]" />
                {event?.createdByAdminName || 'Dillustration Committee'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Started {event?.submissionStartAt ? new Date(event.submissionStartAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 1, 2026'}
              </span>
              <span>•</span>
              <span className="text-amber-300 font-medium">Jury Due: {deadlineFormatted}</span>
            </div>

            <h1 className="font-sora text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              {eventTitle}
            </h1>

            <p className="text-sm text-[#A7ACD9] leading-relaxed max-w-4xl">
              {event?.description || 'Annual visual arts and illustration competition on Dillustration.'}
            </p>
          </div>

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
                <div className="font-sora text-xl sm:text-2xl font-extrabold text-white leading-relaxed break-words whitespace-pre-line">
                  {event?.prize || '50,000,000 VND + Certified Art Honor Trophy'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Jury Workspace Section */}
      <section id="jury-workspace" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
              <Gavel className="w-4 h-4 text-[#A7ACD9]" />
              <span>Events Jury Workspace</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-sora mt-1">
              Submission Evaluation & Scoring
            </h2>
            <p className="text-xs sm:text-sm text-[#9695a1] mt-0.5">
              Grade assigned entries independently using standardized rubric criteria.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!isJudgingPhase && (
            <div className="p-4 border border-amber-500/30 rounded-2xl bg-amber-500/10 text-xs sm:text-sm text-amber-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-semibold block sm:inline">Grading Temporarily Locked: </strong>
                This contest has not reached the Judging phase yet (current status: <span className="font-semibold text-white">{statusLabel}</span>). Evaluation controls will activate once the contest officially enters the Judging round.
              </div>
            </div>
          )}

          <div className="p-4 border border-[#A7ACD9]/30 rounded-2xl bg-[#A7ACD9]/10 text-xs sm:text-sm text-[#c8cbed] flex items-start gap-3">
            <Info className="w-5 h-5 text-[#A7ACD9] shrink-0 mt-0.5" />
            <div>
              <strong>Confidentiality Notice:</strong> You can only view assigned entries and scores submitted by yourself. Aggregated leaderboard and jury deliberations remain confidential until the evaluation phase is officially concluded.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <article className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#A7ACD9] via-[#7FD5E8] to-transparent opacity-75" />
            <span className="text-[11px] uppercase tracking-wider text-[#9695a1] font-medium block">Assigned Entries</span>
            <strong className="block mt-1 text-2xl sm:text-3xl font-bold font-sora text-white">{stats.totalAssigned}</strong>
          </article>

          <article className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent opacity-75" />
            <span className="text-[11px] uppercase tracking-wider text-[#9695a1] font-medium block">Graded</span>
            <strong className="block mt-1 text-2xl sm:text-3xl font-bold font-sora text-emerald-400">{stats.gradedCount}</strong>
          </article>

          <article className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-300 to-transparent opacity-75" />
            <span className="text-[11px] uppercase tracking-wider text-[#9695a1] font-medium block">Pending</span>
            <strong className="block mt-1 text-2xl sm:text-3xl font-bold font-sora text-amber-400">{stats.remainingCount}</strong>
          </article>

          <article className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#A7ACD9] via-indigo-400 to-transparent opacity-75" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#9695a1] font-medium block">Progress</span>
              <span className="text-xs font-semibold text-[#A7ACD9]">{stats.progressPercent}%</span>
            </div>
            <strong className="block mt-1 text-2xl sm:text-3xl font-bold font-sora text-white">{stats.progressPercent}%</strong>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-[#A7ACD9] to-[#7FD5E8] h-full transition-all duration-300 rounded-full"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </article>
        </div>

        {/* Main 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          {/* Left Column: Assigned Queue */}
          <aside className="p-4 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl lg:sticky lg:top-24 max-h-none lg:max-h-[calc(100vh-7rem)] flex flex-col">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3">
              <div>
                <h2 className="font-sora font-semibold text-white text-base">Assigned Queue</h2>
                <span className="text-xs text-[#9695a1]">{stats.remainingCount} pending evaluation</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#c7c5cf]">
                {submissions.length} total
              </span>
            </div>

            <EventSearchFilterBar
              variant="stacked"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search title or entry code..."
              statusValue={filterTab}
              onStatusChange={(val: string) => setFilterTab(val as FilterTab)}
              statusOptions={[
                { value: 'all', label: 'All Submissions (Default)' },
                { value: 'pending', label: 'Pending Evaluation' },
                { value: 'graded', label: 'Graded' },
              ]}
            />

            <div className="space-y-2 overflow-y-auto max-h-[480px] lg:max-h-[calc(100vh-18rem)] pr-1.5 custom-scrollbar">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#9695a1]">No matching submissions found.</div>
              ) : (
                filteredSubmissions.map((entry) => {
                  const isActive = entry.id === activeSubmission?.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedSubmissionId(entry.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 shadow-md shadow-[#A7ACD9]/5'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <strong className={`block text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-[#e4e1e5]'}`}>
                          {entry.title}
                        </strong>
                        <small className="block text-[11px] text-[#9695a1] mt-0.5 truncate">
                          {entry.code} · {entry.category || 'Illustration'}
                        </small>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {entry.isLocked ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold" title="Điểm đã khóa">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                          </span>
                        ) : entry.isGraded ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                            <Check className="w-3 h-3" />
                            <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
                            Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Column: Scoring Form */}
          {activeSubmission ? (
            <form onSubmit={handleSubmitScore} className="p-5 sm:p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-6">
              {activeSubmission.isLocked && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>Điểm đã được khóa (Locked):</strong> Bài dự thi này đã hoàn tất đánh giá và được khóa điểm. Điểm số không thể chỉnh sửa trừ khi có yêu cầu tái thẩm định từ Trưởng ban giám khảo.
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                      {activeSubmission.gradedScore ?? totalScore} pts
                    </span>
                  </div>
                </div>
              )}

              {!isJudgingPhase && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Grading controls are temporarily locked. Submissions can only be scored once the contest officially reaches the <strong>Judging</strong> phase.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-sora text-white">{activeSubmission.title}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#A7ACD9]/15 text-[#A7ACD9] border border-[#A7ACD9]/30">
                      {activeSubmission.code}
                    </span>
                  </div>
                  <span className="text-xs text-[#9695a1] mt-1 flex items-center gap-1.5">
                    <EyeOff className="w-3 h-3 text-[#A7ACD9]" />
                    <span>Anonymous Candidate · {activeSubmission.category || 'Illustration'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#9695a1] uppercase tracking-wider block font-semibold">Total Score</span>
                    <strong className="text-2xl sm:text-3xl font-sora font-extrabold text-[#A7ACD9] block">
                      {activeSubmission.isGraded || totalScore > 0 ? (
                        <>
                          {totalScore} <span className="text-sm font-normal text-[#9695a1]">/ 100</span>
                        </>
                      ) : (
                        <span className="text-lg sm:text-xl font-medium text-[#9695a1]">Pending</span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#090b12] min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeSubmission.artworkImageUrl} alt={activeSubmission.title} className="max-h-[500px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {activeSubmission.aiScanPassed && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>AI Scan Passed</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs transition-all shadow-lg cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#A7ACD9]" />
                  <span>Inspect Brushwork</span>
                </button>
              </div>

              {activeSubmission.description && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-[#c7c5cf]">
                  <strong className="block text-[#9695a1] mb-1 uppercase tracking-wider text-[10px]">Artist Statement</strong>
                  <p className="leading-relaxed">{activeSubmission.description}</p>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-sora font-semibold text-white text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#A7ACD9]" />
                    <span>Evaluation Rubric</span>
                  </h3>
                  <span className="text-xs text-[#9695a1]">Adjust sliders or enter score points</span>
                </div>

                <div className="space-y-4">
                  {criteria.map((crit) => {
                    const currentScore = scores[crit.id] ?? 0;
                    return (
                      <div key={crit.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-sora text-sm font-semibold text-white block">{crit.name}</span>
                            {crit.description && <p className="text-xs text-[#9695a1] mt-0.5">{crit.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={crit.maxScore}
                              value={currentScore}
                              disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                              onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                              className={`w-16 px-2 py-1 bg-white/5 border rounded-lg text-right text-xs font-mono font-bold text-white focus:outline-none ${
                                Boolean(activeSubmission.isLocked) || !isJudgingPhase
                                  ? 'border-white/5 opacity-60 cursor-not-allowed text-[#9695a1]'
                                  : 'border-white/10 focus:border-[#A7ACD9]'
                              }`}
                            />
                            <span className="text-xs text-[#9695a1] font-mono">/ {crit.maxScore}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={crit.maxScore}
                            step={1}
                            value={currentScore}
                            disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                            onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                            className={`w-full accent-[#A7ACD9] ${
                              Boolean(activeSubmission.isLocked) || !isJudgingPhase ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-sora font-semibold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A7ACD9]" />
                  <span>Jury Deliberation Notes</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide structured notes on execution, technique, or composition..."
                  className={`w-full p-3 text-xs bg-white/5 border rounded-xl text-white placeholder-[#9695a1] focus:outline-none leading-relaxed ${
                    Boolean(activeSubmission.isLocked) || !isJudgingPhase
                      ? 'border-white/5 opacity-60 cursor-not-allowed'
                      : 'border-white/10 focus:border-[#A7ACD9]'
                  }`}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className={`flex items-start gap-2.5 text-xs text-[#c7c5cf] ${Boolean(activeSubmission.isLocked) || !isJudgingPhase ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={noConflict}
                    disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    onChange={(e) => setNoConflict(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-white/5 text-[#A7ACD9] focus:ring-0 accent-[#A7ACD9] disabled:cursor-not-allowed"
                  />
                  <span>I declare no personal or financial conflict of interest regarding this artwork.</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) setSelectedSubmissionId(submissions[currentIndex - 1].id);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex >= submissions.length - 1}
                    onClick={() => {
                      if (currentIndex < submissions.length - 1) setSelectedSubmissionId(submissions[currentIndex + 1].id);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 text-[#A7ACD9]" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    className={`px-5 py-2.5 rounded-xl font-sora font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 ${
                      Boolean(activeSubmission.isLocked)
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-not-allowed opacity-90'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] hover:brightness-110 text-white cursor-pointer hover:shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                  >
                    {activeSubmission.isLocked ? <Lock className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
                    <span>{activeSubmission.isLocked ? 'Điểm đã khóa' : 'Submit Evaluation Score'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#151926]/90 border border-white/10 text-[#9695a1]">
              Select a submission from the queue to start evaluation.
            </div>
          )}
        </div>
      </section>

      {/* Rules Modal */}
      {isRulesModalOpen && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#161926] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-[#A7ACD9]" size={20} />
                <h3 className="font-sora text-lg font-bold text-white">Contest Rules & Guidelines</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-5">
              <h4 className="font-sora text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                <Trophy size={16} /> Official Prizes & Rewards
              </h4>
              <p className="font-sora text-base font-semibold text-white leading-relaxed whitespace-pre-line break-words">
                {event.prize || 'Official prize breakdown will be announced by the organizing committee.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h4 className="font-sora text-sm font-bold text-[#A7ACD9] mb-2 flex items-center gap-2">
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
                className="rounded-xl bg-[#A7ACD9] px-6 py-2.5 text-xs font-bold text-[#1F2335] cursor-pointer hover:brightness-110"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
