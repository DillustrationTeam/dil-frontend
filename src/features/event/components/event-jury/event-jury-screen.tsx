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
import { normalizeEventStatus, getEventStatusLabel } from '../../types/event.types';
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
import { computeIsJudgingPhase, getJudgingLockMessage, getRubricMaxTotal } from '../../utils/jury-phase';
import { JuryArtworkLightbox } from './jury-artwork-lightbox';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';
import { PrizeList } from '../event/prize-list';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [nowMs, setNowMs] = useState(() => Date.now());
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
  const statusStr = event?.status != null ? normalizeEventStatus(event.status) : 'Judging';
  const statusLabel = getEventStatusLabel(statusStr, isVie);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Check whether the contest is in the official Judging Phase
  const isJudgingPhase = useMemo(() => computeIsJudgingPhase(event, nowMs), [event, nowMs]);
  const judgingLockMessage = useMemo(() => getJudgingLockMessage(event, nowMs), [event, nowMs]);
  const maxTotalScore = useMemo(() => getRubricMaxTotal(criteria), [criteria]);

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
        const eventData = await eventService.detail(eventId);
        const [criteriaData, juriesData, profileData] = await Promise.all([
          juryService.getEventCriteria(eventId).catch(() => []),
          juryService.getEventJuries(eventId).catch(() => []),
          effectiveUserId ? creatorProfileService.getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setJuries(juriesData || []);
        setMyCreatorProfile(profileData);

        setEvent(eventData || null);
        setCriteria(criteriaData || []);

        const eventTitle = eventData?.title || 'Contest';
        const subItems = await juryService.getAssignedSubmissions(eventId, eventTitle);

        if (!isMounted) return;
        setSubmissions(subItems);

        if (subItems.length > 0) {
          const firstPending = subItems.find((s) => !s.isGraded);
          setSelectedSubmissionId(firstPending ? firstPending.id : subItems[0].id);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to load Jury workspace data.');
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
      toast.error(isVie ? 'Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.' : 'The score for this submission is locked and cannot be edited.');
      return;
    }
    if (!isJudgingPhase) {
      toast.error(judgingLockMessage);
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
      toast.error(isVie ? 'Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.' : 'The score for this submission is locked and cannot be edited.');
      return;
    }
    if (!isJudgingPhase) {
      toast.error(judgingLockMessage);
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

    toast.success(
      isVie
        ? `Đã lưu bản nháp cho #${activeSubmission.code} (${totalScore} điểm)`
        : `Draft saved for #${activeSubmission.code} (${totalScore} pts)`
    );
  };

  const handleSubmitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSubmission) return;

    if (activeSubmission.isLocked) {
      toast.error(isVie ? 'Điểm của bài dự thi này đã được khóa và không thể chỉnh sửa.' : 'The score for this submission is locked and cannot be edited.');
      return;
    }

    if (!isJuryMember) {
      toast.error(isVie ? 'Bạn không có quyền chấm điểm vì không được phân công làm Giám khảo cho sự kiện này.' : 'You do not have grading permissions because you are not assigned as a Jury member for this event.');
      return;
    }

    if (!isJudgingPhase) {
      toast.error(judgingLockMessage);
      return;
    }

    if (!noConflict) {
      toast.error(isVie ? 'Vui lòng xác nhận rằng bạn không có xung đột lợi ích trước khi gửi.' : 'Please confirm that you have no conflict of interest before submitting.');
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

      toast.success(
        isVie
          ? `Gửi điểm đánh giá thành công: ${totalScore} / ${maxTotalScore} điểm!`
          : `Evaluation submitted successfully: ${totalScore} / ${maxTotalScore} points!`
      );

      const nextPending = submissions.find(
        (s) => s.id !== activeSubmission.id && !s.isGraded
      );
      if (nextPending) {
        setSelectedSubmissionId(nextPending.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isVie ? 'Có lỗi khi gửi điểm đánh giá.' : 'Error submitting score.'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = submissions.findIndex((s) => s.id === activeSubmission?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#B24A26] animate-spin" />
        <p className="text-sm text-[#746A5F]">
          {isVie ? 'Đang tải không gian chấm thi của Giám khảo...' : 'Loading Jury Evaluation Workspace...'}
        </p>
      </div>
    );
  }

  if (!isJuryMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
        <div className="size-16 rounded-2xl bg-[#A8321C]/10 border border-[#A8321C]/30 text-[#A8321C] flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#241F1A]">
          {isVie ? 'Truy cập bị từ chối' : 'Access Denied'}
        </h2>
        <p className="mt-2 text-sm text-[#746A5F] max-w-md mx-auto leading-relaxed">
          {isVie
            ? 'Bạn không được phân công làm Giám khảo cho sự kiện này. Chỉ những giám khảo được bổ nhiệm chính thức mới có quyền truy cập không gian chấm thi.'
            : 'You are not assigned as a Jury member for this event. Only officially appointed jury members have access to the evaluation workspace.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/events/${eventId}`}
            className="commission-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs transition shadow-lg"
          >
            <ChevronLeft size={16} />
            <span>{isVie ? 'Quay lại chi tiết sự kiện' : 'Back to Event Details'}</span>
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-2.5 text-xs font-semibold text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition"
          >
            <span>{isVie ? 'Tất cả cuộc thi' : 'All Events'}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
        <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#241F1A]">
          {isVie ? 'Không tìm thấy sự kiện' : 'Event Not Found'}
        </h2>
        <p className="mt-2 text-sm text-[#746A5F] max-w-md mx-auto leading-relaxed">
          {isVie
            ? 'Sự kiện này không tồn tại hoặc đã bị xóa khỏi hệ thống.'
            : 'This event does not exist or has been removed from the platform.'}
        </p>
        <div className="mt-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F0E7D8] hover:bg-[#F0E7D8] px-6 py-2.5 text-xs font-semibold text-[#241F1A] transition"
          >
            <span>{isVie ? 'Tất cả cuộc thi' : 'All Events'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const deadlineFormatted = formatDisplayDate(event.judgingEndAt);
  const eventTitle = event.title;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:pt-8 min-h-screen text-[#241F1A] relative">
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
        <div className="flex items-center gap-2 text-xs text-[#746A5F]">
          <Link href="/creator/commissions" className="hover:text-[#241F1A] transition-colors">
            Creator Studio
          </Link>
          <span>/</span>
          <Link href="/creator/events/jury" className="hover:text-[#241F1A] transition-colors">
            Event Jury
          </Link>
          <span>/</span>
          <span className="text-[#B24A26] font-medium">{eventTitle}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs font-semibold text-[#B24A26] transition hover:border-[#221E1A]/20 hover:text-[#241F1A] cursor-pointer"
          >
            <FileText size={14} />
            <span>{isVie ? 'Thể lệ & Quy chế' : 'Rules & Guidelines'}</span>
          </button>

          <Link
            href={`/creator/events/${eventId}/head-jury`}
            className="px-3 py-1.5 rounded-xl border border-[#B24A26]/30 hover:border-[#B24A26] bg-[#B24A26]/10 text-xs font-semibold text-[#B24A26] hover:text-[#241F1A] transition-colors flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-[var(--lumen)]" />
            <span>{isVie ? 'Phòng Trưởng BGK' : 'Head Jury Room'}</span>
          </Link>

          <Link
            href={`/events/${eventId}`}
            className="px-3 py-1.5 rounded-xl border border-[#221E1A]/10 hover:border-[#221E1A]/20 bg-[#FFFCF6] text-xs text-[#241F1A] transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#B24A26]" />
            <span>{isVie ? 'Trang cuộc thi' : 'Public Event Page'}</span>
          </Link>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="ev-hero mb-8">
        <div className="detail__frame">
          <div className="relative aspect-[21/9] max-h-[360px] min-h-[210px] w-full overflow-hidden bg-[var(--ink-3)]">
            {event?.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.bannerUrl} alt={eventTitle} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[var(--lumen)]/25">
                <Sparkles size={44} aria-hidden />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--ink)]/85 to-transparent" />

            <div className="ev-hero__badges">
              <span
                className={`badge ${
                  statusStr === 'Open' ? 'badge--live' : statusStr === 'Judging' ? 'badge--soon' : 'badge--done'
                }`}
              >
                {statusLabel}
              </span>
              {event?.isFeatured && (
                <span className="badge badge--soon">
                  <Flame size={12} aria-hidden />
                  {isVie ? 'Nổi bật' : 'Featured'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="ev-hero__meta">
            <span>
              <CheckCircle2 aria-hidden />
              <b>{event?.createdByAdminName || (isVie ? 'Ban tổ chức Dillustration' : 'Dillustration Committee')}</b>
            </span>
            <span>
              <Calendar aria-hidden />
              {isVie ? 'Bắt đầu' : 'Started'}{' '}
              {event?.submissionStartAt
                ? new Date(event.submissionStartAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '01/10/2026'}
            </span>
            <span className="text-[var(--lumen)]">
              {isVie ? 'Hạn chót chấm điểm:' : 'Jury due:'} <b>{deadlineFormatted}</b>
            </span>
          </div>

          <h1 className="ev-hero__title">{eventTitle}</h1>

          <p className="page-head__sub">
            {event?.description ||
              (isVie
                ? 'Cuộc thi minh hoạ và nghệ thuật thị giác thường niên trên Dillustration.'
                : 'Annual visual arts and illustration competition on Dillustration.')}
          </p>
        </div>

        <div className="pane ev-hero__prize mt-6">
          <p className="eyebrow">{isVie ? 'Cơ cấu giải thưởng & vinh danh' : 'Prize pool & honours'}</p>
          {event?.prize ? (
            <PrizeList prize={event.prize} size="md" />
          ) : (
            <p className="ev-hero__prize-value">
              {isVie ? '50.000.000 VNĐ + Kỷ niệm chương vinh danh' : '50,000,000 VND + certified honour trophy'}
            </p>
          )}
          <p className="ev-hero__note">
            <span>{isVie ? 'Cam kết trao giải đầy đủ' : 'Guaranteed distribution'}</span>
            <span className="badge badge--ok">{isVie ? 'Đã công bố' : 'Announced'}</span>
          </p>
        </div>
      </section>

      {/* Events Jury Workspace Section */}
      <section id="jury-workspace" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#221E1A]/10">
          <div>
            <p className="eyebrow">
              <Gavel size={15} aria-hidden />
              {isVie ? 'Không gian ban giám khảo' : 'Events jury workspace'}
            </p>
            <h2 className="text-xl sm:text-2xl text-[var(--ivory)]">
              {isVie ? 'Đánh giá & chấm điểm bài dự thi' : 'Submission evaluation & scoring'}
            </h2>
            <p className="page-head__sub">
              {isVie
                ? 'Độc lập chấm điểm các bài thi được phân công theo bảng tiêu chí chuẩn.'
                : 'Grade assigned entries independently using standardized rubric criteria.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!isJudgingPhase && (
            <div className="p-4 border border-[rgba(138,106,31,0.28)] rounded-2xl bg-[var(--gold-soft)] text-xs sm:text-sm text-[var(--ivory)] flex items-start gap-3">
              <Lock className="w-5 h-5 text-[var(--lumen-hi)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--lumen-hi)] font-semibold block sm:inline">
                  {isVie ? 'Chấm điểm tạm thời bị khóa: ' : 'Grading Temporarily Locked: '}
                </strong>
                {isVie
                  ? `Cuộc thi chưa bước vào giai đoạn Chấm điểm (trạng thái hiện tại: ${statusLabel}). Chức năng chấm bài sẽ kích hoạt khi cuộc thi chính thức sang vòng Chấm điểm.`
                  : `This contest has not reached the Judging phase yet (current status: ${statusLabel}). Evaluation controls will activate once the contest officially enters the Judging round.`}
              </div>
            </div>
          )}

          <div className="p-4 border border-[rgba(178,74,38,0.22)] rounded-2xl bg-[var(--lumen-soft)] text-xs sm:text-sm text-[var(--ivory)] flex items-start gap-3">
            <Info className="w-5 h-5 text-[var(--lumen)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--lumen-hi)]">{isVie ? 'Thông báo Bảo mật:' : 'Confidentiality Notice:'}</strong>{' '}
              {isVie
                ? 'Bạn chỉ có thể xem các bài thi được phân công và điểm do chính bạn chấm. Điểm số tổng hợp và kết quả thảo luận của hội đồng được bảo mật tuyệt đối cho đến khi kết thúc vòng chấm điểm.'
                : 'You can only view assigned entries and scores submitted by yourself. Aggregated leaderboard and jury deliberations remain confidential until the evaluation phase is officially concluded.'}
            </div>
          </div>
        </div>

        <div className="statsline">
          <span>
            <b>{stats.totalAssigned}</b>
            {isVie ? 'bài được phân công' : 'assigned'}
          </span>
          <span>
            <b>{stats.gradedCount}</b>
            {isVie ? 'đã chấm' : 'graded'}
          </span>
          <span>
            <b>{stats.remainingCount}</b>
            {isVie ? 'chưa chấm' : 'pending'}
          </span>
          <span>
            <b>{stats.progressPercent}%</b>
            {isVie ? 'tiến độ' : 'progress'}
          </span>
        </div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[var(--ink-3)]">
          <div
            className="h-full rounded-full bg-[var(--lumen)] transition-all duration-300"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>

        {/* Main 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Assigned Queue */}
          <aside className="glass-container p-4 rounded-2xl lg:col-span-4 xl:col-span-4 flex flex-col">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#221E1A]/10 mb-3">
              <div>
                <h2 className="font-sora font-semibold text-[#241F1A] text-base">
                  {isVie ? 'Danh sách phân công' : 'Assigned Queue'}
                </h2>
                <span className="text-xs text-[#746A5F]">
                  {stats.remainingCount} {isVie ? 'bài chờ đánh giá' : 'pending evaluation'}
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#6E6459]">
                {submissions.length} {isVie ? 'tổng số' : 'total'}
              </span>
            </div>

            <EventSearchFilterBar
              variant="stacked"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={isVie ? 'Tìm theo tiêu đề hoặc mã bài thi...' : 'Search title or entry code...'}
              statusValue={filterTab}
              onStatusChange={(val: string) => setFilterTab(val as FilterTab)}
              statusOptions={[
                { value: 'all', label: isVie ? 'Tất cả bài thi (Mặc định)' : 'All Submissions (Default)' },
                { value: 'pending', label: isVie ? 'Chờ đánh giá' : 'Pending Evaluation' },
                { value: 'graded', label: isVie ? 'Đã chấm điểm' : 'Graded' },
              ]}
            />

            <div className="rows ev-queue">
              {filteredSubmissions.length === 0 ? (
                <p className="py-8 text-center text-[0.8125rem] text-[var(--ash-dim)]">
                  {isVie ? 'Không tìm thấy bài dự thi phù hợp.' : 'No matching submissions found.'}
                </p>
              ) : (
                filteredSubmissions.map((entry) => {
                  const isActive = entry.id === activeSubmission?.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedSubmissionId(entry.id)}
                      aria-current={isActive}
                      className="rows__row"
                    >
                      <span className="min-w-0">
                        <span className="ev-queue__title">{entry.title}</span>
                        <span className="ev-queue__sub">
                          {entry.code} · {entry.category || (isVie ? 'Tranh minh hoạ' : 'Illustration')}
                        </span>
                      </span>

                      <span className="shrink-0">
                        {entry.isLocked ? (
                          <span className="badge badge--ok" title={isVie ? 'Điểm đã khoá' : 'Score locked'}>
                            <Lock size={11} aria-hidden />
                            {entry.gradedScore != null ? entry.gradedScore : '—'}
                          </span>
                        ) : entry.isGraded ? (
                          <span className="badge badge--ok">
                            <Check size={11} aria-hidden />
                            {entry.gradedScore != null ? entry.gradedScore : '—'}
                          </span>
                        ) : (
                          <span className="badge badge--soon">{isVie ? 'Chưa chấm' : 'Pending'}</span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Column: Scoring Form */}
          {activeSubmission ? (
            <form onSubmit={handleSubmitScore} className="glass-container p-5 sm:p-6 rounded-2xl space-y-6 lg:col-span-8 xl:col-span-8">
              {activeSubmission.isLocked && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/40 text-[#2F6B63] text-xs">
                  <Lock className="w-4 h-4 text-[#2F6B63] shrink-0" />
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{isVie ? 'Điểm đã được khóa:' : 'Score Locked:'}</strong>{' '}
                      {isVie
                        ? 'Bài dự thi này đã hoàn tất đánh giá và được khóa điểm. Điểm số không thể chỉnh sửa trừ khi có yêu cầu tái thẩm định từ Trưởng ban giám khảo.'
                        : 'This submission has been graded and locked. Scores cannot be edited unless a re-evaluation is requested by the Head Jury.'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] font-mono text-[11px] font-bold">
                      {activeSubmission.gradedScore ?? totalScore} {isVie ? 'điểm' : 'pts'}
                    </span>
                  </div>
                </div>
              )}

              {!isJudgingPhase && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--gold-soft)] border border-[rgba(138,106,31,0.28)] text-[var(--ivory)] text-xs">
                  <Lock className="w-4 h-4 text-[var(--lumen-hi)] shrink-0" />
                  <span>{judgingLockMessage}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#221E1A]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#241F1A]">{activeSubmission.title}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#B24A26]/15 text-[#B24A26] border border-[#B24A26]/30">
                      {activeSubmission.code}
                    </span>
                  </div>
                  <span className="text-xs text-[#746A5F] mt-1 flex items-center gap-1.5">
                    <EyeOff className="w-3 h-3 text-[#B24A26]" />
                    <span>
                      {isVie ? 'Thí sinh ẩn danh' : 'Anonymous Candidate'} · {activeSubmission.category || (isVie ? 'Minh họa' : 'Illustration')}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#746A5F] uppercase tracking-wider block font-semibold">
                      {isVie ? 'Tổng điểm' : 'Total Score'}
                    </span>
                    <strong className="text-2xl sm:text-3xl font-sora font-extrabold text-[#B24A26] block">
                      {activeSubmission.isGraded || totalScore > 0 ? (
                        <>
                          {totalScore} <span className="text-sm font-normal text-[#746A5F]">/ {maxTotalScore}</span>
                        </>
                      ) : (
                        <span className="text-lg sm:text-xl font-medium text-[#746A5F]">
                          {isVie ? 'Chờ chấm' : 'Pending'}
                        </span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="relative group rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeSubmission.artworkImageUrl} alt={activeSubmission.title} className="max-h-[500px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {activeSubmission.aiScanPassed && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E5D8C2] backdrop-blur-md border border-[#2F6B63]/40 text-[#2F6B63] text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isVie ? 'Đạt kiểm tra AI' : 'AI Scan Passed'}</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5D8C2] hover:bg-[#F0E7D8]/90 backdrop-blur-md border border-[#221E1A]/20 text-[#241F1A] text-xs transition-all shadow-lg cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#B24A26]" />
                  <span>{isVie ? 'Soi chi tiết nét vẽ' : 'Inspect Brushwork'}</span>
                </button>
              </div>

              {activeSubmission.description && (
                <div className="p-3.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-xs text-[#6E6459]">
                  <strong className="block text-[#746A5F] mb-1 uppercase tracking-wider text-[10px]">
                    {isVie ? 'Tuyên ngôn / Thông điệp tác giả' : 'Artist Statement'}
                  </strong>
                  <p className="leading-relaxed">{activeSubmission.description}</p>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-sora font-semibold text-[#241F1A] text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#B24A26]" />
                    <span>{isVie ? 'Tiêu chí chấm điểm' : 'Evaluation Rubric'}</span>
                  </h3>
                  <span className="text-xs text-[#746A5F]">
                    {isVie ? 'Kéo thanh trượt hoặc nhập số điểm' : 'Adjust sliders or enter score points'}
                  </span>
                </div>

                <div className="space-y-4">
                  {criteria.map((crit) => {
                    const currentScore = scores[crit.id] ?? 0;
                    return (
                      <div key={crit.id} className="p-4 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-sora text-sm font-semibold text-[#241F1A] block">{crit.name}</span>
                            {crit.description && <p className="text-xs text-[#746A5F] mt-0.5">{crit.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={crit.maxScore}
                              value={currentScore}
                              disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                              onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                              className={`w-16 px-2 py-1 bg-[#FFFCF6] border rounded-lg text-right text-xs font-mono font-bold text-[#241F1A] focus:outline-none ${Boolean(activeSubmission.isLocked) || !isJudgingPhase
                                ? 'border-[#221E1A]/10 opacity-60 cursor-not-allowed text-[#746A5F]'
                                : 'border-[#221E1A]/10 focus:border-[#B24A26]'
                                }`}
                            />
                            <span className="text-xs text-[#746A5F] font-mono">/ {crit.maxScore}</span>
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
                            className={`w-full accent-[#B24A26] ${Boolean(activeSubmission.isLocked) || !isJudgingPhase ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-sora font-semibold text-[#241F1A] text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B24A26]" />
                  <span>{isVie ? 'Ghi chú & Nhận xét của Giám khảo' : 'Jury Deliberation Notes'}</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isVie ? 'Đưa ra nhận xét cụ thể về kỹ thuật, nét vẽ, bố cục, màu sắc...' : 'Provide structured notes on execution, technique, or composition...'}
                  className={`w-full p-3 text-xs bg-[#FFFCF6] border rounded-xl text-[#241F1A] placeholder-[#746A5F] focus:outline-none leading-relaxed ${Boolean(activeSubmission.isLocked) || !isJudgingPhase
                    ? 'border-[#221E1A]/10 opacity-60 cursor-not-allowed'
                    : 'border-[#221E1A]/10 focus:border-[#B24A26]'
                    }`}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className={`flex items-start gap-2.5 text-xs text-[#6E6459] ${Boolean(activeSubmission.isLocked) || !isJudgingPhase ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={noConflict}
                    disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    onChange={(e) => setNoConflict(e.target.checked)}
                    className="mt-0.5 rounded border-[#221E1A]/20 bg-[#FFFCF6] text-[#B24A26] focus:ring-0 accent-[#B24A26] disabled:cursor-not-allowed"
                  />
                  <span>
                    {isVie
                      ? 'Tôi cam kết không có bất kỳ xung đột lợi ích cá nhân hay tài chính nào liên quan đến tác phẩm này.'
                      : 'I declare no personal or financial conflict of interest regarding this artwork.'}
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#221E1A]/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) setSelectedSubmissionId(submissions[currentIndex - 1].id);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{isVie ? 'Bài trước' : 'Previous'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex >= submissions.length - 1}
                    onClick={() => {
                      if (currentIndex < submissions.length - 1) setSelectedSubmissionId(submissions[currentIndex + 1].id);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isVie ? 'Bài tiếp' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    className="px-4 py-2.5 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs font-semibold text-[#241F1A] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 text-[#B24A26]" />
                    <span>{isVie ? 'Lưu bản nháp' : 'Save Draft'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || Boolean(activeSubmission.isLocked) || !isJudgingPhase}
                    className={`px-5 py-2.5 rounded-xl font-sora text-xs shadow-lg transition-all flex items-center gap-2 ${Boolean(activeSubmission.isLocked)
                      ? 'bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] font-extrabold cursor-not-allowed opacity-90'
                      : 'commission-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                      }`}
                  >
                    {activeSubmission.isLocked ? <Lock className="w-4 h-4 text-[#2F6B63]" /> : <Send className="w-4 h-4" />}
                    <span>
                      {activeSubmission.isLocked
                        ? (isVie ? 'Điểm đã khóa' : 'Score Locked')
                        : (isVie ? 'Gửi điểm chấm thi' : 'Submit Evaluation Score')}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="glass-container p-12 text-center rounded-2xl text-[#746A5F] lg:col-span-8 xl:col-span-8">
              {isVie ? 'Chọn một bài dự thi từ danh sách để bắt đầu đánh giá.' : 'Select a submission from the queue to start evaluation.'}
            </div>
          )}
        </div>
      </section>

      {/* Rules Modal */}
      {isRulesModalOpen && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-[#B24A26]" size={20} />
                <h3 className="font-sora text-lg font-bold text-[#241F1A]">
                  {isVie ? 'Thể lệ & Quy chế cuộc thi' : 'Contest Rules & Guidelines'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-[rgba(178,74,38,0.22)] bg-[var(--lumen-soft)] p-5">
              <h4 className="font-sora text-sm font-bold text-[var(--lumen-hi)] mb-2 flex items-center gap-2">
                <Trophy size={16} /> {isVie ? 'Cơ cấu giải thưởng chính thức' : 'Official Prizes & Rewards'}
              </h4>
              {event.prize ? (
                <PrizeList prize={event.prize} size="sm" />
              ) : (
                <p className="font-sora text-base font-semibold text-[var(--ivory)] leading-relaxed">
                  {isVie ? 'Cơ cấu giải thưởng chi tiết sẽ do ban tổ chức thông báo.' : 'Official prize breakdown will be announced by the organizing committee.'}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
              <h4 className="font-sora text-sm font-bold text-[#B24A26] mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> {isVie ? 'Thể lệ & Quy định chính thức' : 'Official Rules & Guidelines'}
              </h4>
              <p className="text-xs sm:text-sm text-[#B24A26] leading-relaxed whitespace-pre-line break-words">
                {event.rules ||
                  (isVie
                    ? 'Tất cả các tác phẩm tham gia phải là sáng tác nguyên bản của chính thí sinh nộp bài. Đạo nhái, vi phạm bản quyền hoặc sử dụng AI trái phép sẽ bị truất quyền thi đấu ngay lập tức.'
                    : 'All entries must be original works created by the submitter. Plagiarism, copyright infringement, or unauthorized AI generation will lead to immediate disqualification.')}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="rounded-xl bg-[#B24A26] px-6 py-2.5 text-xs font-bold text-[#F7F2E9] cursor-pointer hover:brightness-110"
              >
                {isVie ? 'Đã hiểu' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
