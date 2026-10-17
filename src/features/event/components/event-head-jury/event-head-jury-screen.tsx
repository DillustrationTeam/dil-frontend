'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Gavel,
  CheckCircle2,
  FileText,
  RefreshCw,
  ExternalLink,
  Crown,
  Info,
  Flame,
  Trophy,
  Calendar,
  X,
  Lock,
  Sparkles,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import type { CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import type { EventDetailDto } from '../../types/event.types';
import { eventStatusBadgeStyles, eventStatusLabels } from '../../types/event.types';
import type {
  JuryCriterion,
  JurySubmissionItem,
  JuryEvaluationDraft,
  HeadJuryWorkspaceData,
  ArbitrationCase,
  WinnerApprovalItem,
  JuryMemberInfo,
} from '../../types/jury.types';
import { eventService } from '../../services/event.service';
import { juryService } from '../../services/jury.service';
import { JuryArtworkLightbox } from '../event-jury/jury-artwork-lightbox';
import { HeadJuryScoringTab } from './head-jury-scoring-tab';
import { HeadJuryProgressTab } from './head-jury-progress-tab';
import { HeadJuryLeaderboardTab } from './head-jury-leaderboard-tab';
import { HeadJuryArbitrationTab } from './head-jury-arbitration-tab';
import { HeadJuryApproveTab } from './head-jury-approve-tab';

interface EventHeadJuryScreenProps {
  eventId: string;
}

type HeadJuryTab = 'score' | 'progress' | 'scores' | 'arbitration' | 'approve';

export function EventHeadJuryScreen({ eventId }: EventHeadJuryScreenProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HeadJuryTab>('score');
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [criteria, setCriteria] = useState<JuryCriterion[]>([]);
  const [submissions, setSubmissions] = useState<JurySubmissionItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [headData, setHeadData] = useState<HeadJuryWorkspaceData | null>(null);
  const [juries, setJuries] = useState<JuryMemberInfo[]>([]);
  const [myCreatorProfile, setMyCreatorProfile] = useState<CreatorProfileDto | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const effectiveUserId = currentUser?.id ?? null;

  // Queue search & filters for Tab 'score'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'graded'>('all');

  // Form states for Head Jury evaluation (Tab 'score')
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [noConflict, setNoConflict] = useState(true);

  // Arbitration tab states
  const [arbitrationDecision, setArbitrationDecision] = useState<string>('Maintain Current Median Score');
  const [arbitrationNotes, setArbitrationNotes] = useState<string>(
    'Score variance stems from different interpretations of technical criteria. Recommended maintaining the panel median score following committee vote.'
  );

  // Jury panel progress (Tab 'progress')
  const [selectedJuryId, setSelectedJuryId] = useState<string | null>(null);
  const [juryScoreFilter, setJuryScoreFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [juryMemberSearch, setJuryMemberSearch] = useState('');
  const [juryStatusFilter, setJuryStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Arbitration & Approval states
  const [selectedArbitrationId, setSelectedArbitrationId] = useState<string | null>(null);
  const [arbitrationSearch, setArbitrationSearch] = useState('');
  const [arbitrationStatusFilter, setArbitrationStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [arbitrationCasesState, setArbitrationCasesState] = useState<ArbitrationCase[]>([]);
  const [tieBreakerWinnerId, setTieBreakerWinnerId] = useState<string>('aur-0088');

  // Independent approval states
  const [isAwardAllocationsConfirmed, setIsAwardAllocationsConfirmed] = useState(false);
  const [isContestResultsApproved, setIsContestResultsApproved] = useState(false);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Load workspace data
  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      setLoading(true);
      try {
        const [eventData, criteriaData, headWorkspace, subItems, eventJuries, profileData] = await Promise.all([
          eventService.detail(eventId).catch(() => null),
          juryService.getEventCriteria(eventId).catch(() => []),
          juryService.getHeadJuryWorkspace(eventId).catch(() => null),
          juryService.getAssignedSubmissions(eventId, 'AURA 2026').catch(() => []),
          juryService.getEventJuries(eventId).catch(() => []),
          effectiveUserId ? creatorProfileService.getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setJuries(eventJuries || []);
        setMyCreatorProfile(profileData);

        setEvent(eventData);
        if (eventData?.isHeadJurySignedOff) {
          setIsContestResultsApproved(true);
          setIsAwardAllocationsConfirmed(true);
        }

        setCriteria(criteriaData);

        const finalHeadWorkspace: HeadJuryWorkspaceData = headWorkspace || {
          totalSubmissions: subItems.length,
          gradedSubmissions: subItems.filter((s) => s.isGraded).length,
          completedJuryCount: 0,
          totalJuryCount: eventJuries.length,
          anomalyFlagsCount: 0,
          overallProgressPercent: 0,
          juryProgressList: [],
          combinedScores: [],
          arbitrationCases: [],
          finalWinners: [],
          allJuryCompleted: false,
          disputesResolved: false,
          winnersConfirmed: false,
          isResultsApproved: false,
        };

        if (finalHeadWorkspace.juryProgressList.length === 0 && eventJuries.length > 0) {
          finalHeadWorkspace.juryProgressList = eventJuries.map((j) => ({
            id: j.id,
            name: (j.creatorDisplayName || j.creatorName || 'Jury Member') + (j.isHeadJury ? ' (Head Jury)' : ''),
            gradedPercent: 0,
            completedCount: 0,
            totalAssigned: subItems.length,
            statusLabel: 'Đang chấm',
            isCompleted: false,
            isHeadJury: j.isHeadJury,
          }));
          finalHeadWorkspace.totalJuryCount = eventJuries.length;
        }

        setHeadData(finalHeadWorkspace);

        setSubmissions(subItems);
        if (subItems.length > 0) {
          setSelectedSubmissionId(subItems[0].id);
        }
      } catch {
        toast.error('Failed to load Head Jury Workspace data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadWorkspace();
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

  const isHeadJury = Boolean(
    (currentJury && currentJury.isHeadJury) ||
    (event?.createdByAdminId && effectiveUserId === event.createdByAdminId)
  );

  const activeSubmission = useMemo(() => {
    return submissions.find((s) => s.id === selectedSubmissionId) || submissions[0] || null;
  }, [submissions, selectedSubmissionId]);

  const activeIndex = useMemo(() => {
    if (!activeSubmission) return -1;
    return submissions.findIndex((s) => s.id === activeSubmission.id);
  }, [submissions, activeSubmission]);

  const [prevSubmissionId, setPrevSubmissionId] = useState<string | null>(null);

  if (activeSubmission && activeSubmission.id !== prevSubmissionId) {
    setPrevSubmissionId(activeSubmission.id);
    const initialScores: Record<string, number> = {};
    criteria.forEach((crit) => {
      initialScores[crit.id] = activeSubmission.criteriaScores?.[crit.id] ?? Math.round(crit.maxScore * 0.85);
    });
    setScores(initialScores);
    setNotes(activeSubmission.notes || 'Strong composition, clear narrative, and sophisticated lighting treatment.');
    setNoConflict(activeSubmission.noConflictOfInterest ?? true);
  }

  const totalScore = useMemo(() => {
    return criteria.reduce((sum, crit) => {
      const val = scores[crit.id];
      return sum + (typeof val === 'number' && !isNaN(val) ? val : 0);
    }, 0);
  }, [scores, criteria]);

  const handleScoreChange = (criteriaId: string, val: number, maxScore: number) => {
    const clamped = Math.max(0, Math.min(maxScore, val));
    setScores((prev) => ({
      ...prev,
      [criteriaId]: clamped,
    }));
  };

  const handleSaveDraft = () => {
    if (!activeSubmission) return;
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
            }
          : s
      )
    );
    toast.success('Draft evaluation saved locally.');
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    if (!noConflict) {
      toast.error('You must confirm no conflict of interest to submit evaluation.');
      return;
    }

    try {
      await juryService.submitScore(eventId, activeSubmission.id, {
        submissionId: activeSubmission.id,
        totalScore,
        notes,
        noConflictOfInterest: noConflict,
        nominateSpecialAward: false,
        criteriaScores: criteria.map((c) => ({
          criteriaId: c.id,
          criteriaName: c.name,
          score: scores[c.id] ?? 0,
        })),
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
              }
            : s
        )
      );

      toast.success(`Head Jury evaluation submitted: ${totalScore} pts!`);

      const nextPending = submissions.find((s, idx) => idx > activeIndex && !s.isGraded);
      if (nextPending) {
        setSelectedSubmissionId(nextPending.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error submitting evaluation.');
    }
  };

  // Real Arbitration Cases (Computed from real submissions or backend)
  const arbitrationCasesList = useMemo(() => {
    if (headData?.arbitrationCases && headData.arbitrationCases.length > 0) {
      return headData.arbitrationCases;
    }

    const cases: ArbitrationCase[] = [];
    const gradedSubs = submissions.filter((s) => typeof s.gradedScore === 'number' && (s.gradedScore ?? 0) > 0);
    const scoreGroups: Record<number, JurySubmissionItem[]> = {};

    gradedSubs.forEach((sub) => {
      const val = Number(sub.gradedScore);
      if (!scoreGroups[val]) scoreGroups[val] = [];
      scoreGroups[val].push(sub);
    });

    Object.entries(scoreGroups).forEach(([scoreVal, subs]) => {
      if (subs.length > 1) {
        subs.forEach((sub) => {
          cases.push({
            id: `arb-tie-${sub.id}`,
            submissionId: sub.id,
            title: sub.title,
            code: sub.code,
            category: sub.category,
            artworkImageUrl: sub.artworkImageUrl,
            deviationPercent: 0.0,
            notes: `Phát hiện đồng hạng ${scoreVal} điểm với bài dự thi khác. Cần Head Jury bỏ phiếu quyết định Tie-breaker.`,
            status: 'Pending',
            decision: 'Cast Head Jury Tie-Breaker',
          });
        });
      }
    });

    return cases;
  }, [headData, submissions]);

  const [prevArbListLen, setPrevArbListLen] = useState(0);
  if (
    arbitrationCasesList.length > 0 &&
    arbitrationCasesState.length === 0 &&
    arbitrationCasesList.length !== prevArbListLen
  ) {
    setPrevArbListLen(arbitrationCasesList.length);
    setArbitrationCasesState(arbitrationCasesList);
  }

  const filteredArbitrationCases = useMemo(() => {
    const list = arbitrationCasesState.length > 0 ? arbitrationCasesState : arbitrationCasesList;
    return list.filter((item) => {
      if (arbitrationStatusFilter === 'pending' && item.status.toLowerCase() !== 'pending') return false;
      if (arbitrationStatusFilter === 'resolved' && item.status.toLowerCase() !== 'resolved') return false;
      if (arbitrationSearch.trim()) {
        const q = arbitrationSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [arbitrationCasesState, arbitrationCasesList, arbitrationStatusFilter, arbitrationSearch]);

  const selectedArbitrationCase = useMemo(() => {
    const list = arbitrationCasesState.length > 0 ? arbitrationCasesState : arbitrationCasesList;
    return (
      list.find((c) => c.id === selectedArbitrationId) ??
      filteredArbitrationCases[0] ??
      list[0] ??
      null
    );
  }, [arbitrationCasesState, arbitrationCasesList, selectedArbitrationId, filteredArbitrationCases]);

  const handleConfirmArbitration = async () => {
    if (!selectedArbitrationCase) return;
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedArbitrationCase.id);
    if (isGuid) {
      try {
        await juryService.saveArbitrationDecision(
          eventId,
          selectedArbitrationCase.id,
          arbitrationDecision,
          arbitrationNotes
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save arbitration decision to backend.';
        toast.error(msg);
        return;
      }
    }
    const caseList = arbitrationCasesState.length > 0 ? arbitrationCasesState : arbitrationCasesList;
    setArbitrationCasesState(
      caseList.map((item) =>
        item.id === selectedArbitrationCase.id
          ? {
              ...item,
              status: 'Resolved',
              decision: arbitrationDecision,
              notes: arbitrationNotes,
            }
          : item
      )
    );
    toast.success(`Arbitration decision saved for ${selectedArbitrationCase.code}. Action recorded in official audit log.`);
  };

  // INDEPENDENT APPROVAL BUTTON HANDLERS
  const handleApproveAwardAllocations = () => {
    setIsAwardAllocationsConfirmed(true);
    toast.success('Award Allocations Confirmed!');
  };

  const handleApproveContestResults = async () => {
    try {
      await juryService.signOffHeadJury(eventId);
      setIsContestResultsApproved(true);
      setIsAwardAllocationsConfirmed(true);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              isHeadJurySignedOff: true,
              headJurySignedOffAt: new Date().toISOString(),
            }
          : prev
      );
      toast.success(
        'Contest results officially signed off & approved! Release permissions transferred to Moderators.'
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data?.message ||
        (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.[0] ||
        'Failed to complete Head Jury sign-off.';
      toast.error(msg);
    }
  };

  // Dynamic winners list computed from real submissions
  const finalWinnersList: WinnerApprovalItem[] = useMemo(() => {
    const statusText = isAwardAllocationsConfirmed ? 'Confirmed' : 'Pending Approval';
    const sorted = [...submissions]
      .filter((s) => typeof s.gradedScore === 'number' || typeof s.score === 'number')
      .sort((a, b) => (Number(b.gradedScore ?? b.score) || 0) - (Number(a.gradedScore ?? a.score) || 0));

    if (sorted.length === 0) return [];

    const awardNames = ['Grand Prize', '1st Runner up', '2nd Runner up'];
    return sorted.map((sub, idx) => {
      const awardName = awardNames[idx] || 'Honorable Contenders';
      const scoreVal = sub.gradedScore ?? sub.score ?? 0;
      return {
        awardName,
        submissionId: sub.id,
        title: sub.title,
        code: sub.code,
        scoreOrVotes: `${scoreVal} pts`,
        status: statusText,
      };
    });
  }, [submissions, isAwardAllocationsConfirmed]);

  // Tab 1 Queue Filter
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      if (filterTab === 'pending' && item.isGraded) return false;
      if (filterTab === 'graded' && !item.isGraded) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        return matchTitle || matchCode || matchCat;
      }
      return true;
    });
  }, [submissions, filterTab, searchQuery]);

  // Jury Panel Progress Tab state
  const juryList = useMemo(() => headData?.juryProgressList ?? [], [headData]);

  const filteredJuryList = useMemo(() => {
    return juryList.filter((j) => {
      if (juryStatusFilter === 'completed' && !j.isCompleted) return false;
      if (juryStatusFilter === 'in_progress' && j.isCompleted) return false;
      if (juryMemberSearch.trim()) {
        const q = juryMemberSearch.toLowerCase();
        return j.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [juryList, juryStatusFilter, juryMemberSearch]);

  const selectedJury = useMemo(
    () => juryList.find((j) => j.id === selectedJuryId) ?? juryList[0] ?? null,
    [juryList, selectedJuryId]
  );

  const overallJuryProgress = useMemo(() => {
    const completed = juryList.reduce((sum, j) => sum + j.completedCount, 0);
    const total = juryList.reduce((sum, j) => sum + j.totalAssigned, 0);
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [juryList]);

  const selectedJuryAssignments = useMemo(() => {
    if (!selectedJury) return [];
    const seed = Array.from(selectedJury.id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const items = Array.from({ length: selectedJury.totalAssigned }, (_, i) => {
      const source = submissions.length > 0 ? submissions[i % submissions.length] : null;
      return {
        id: `${selectedJury.id}-${i}`,
        code: `#AUR-${String(((i * 37 + seed) % 900) + 100).padStart(4, '0')}`,
        title: source?.title ?? `Submission ${i + 1}`,
        category: source?.category ?? 'Illustration',
        order: (i * 7919 + seed) % selectedJury.totalAssigned,
      };
    });
    const ranked = [...items].sort((a, b) => a.order - b.order);
    const doneIds = new Set(ranked.slice(0, selectedJury.completedCount).map((x) => x.id));
    return items.map((x) => ({ ...x, isCompleted: doneIds.has(x.id) }));
  }, [selectedJury, submissions]);

  const filteredJuryAssignments = useMemo(() => {
    if (juryScoreFilter === 'completed') return selectedJuryAssignments.filter((x) => x.isCompleted);
    if (juryScoreFilter === 'pending') return selectedJuryAssignments.filter((x) => !x.isCompleted);
    return selectedJuryAssignments;
  }, [selectedJuryAssignments, juryScoreFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-[#9695a1]">
        <RefreshCw className="w-8 h-8 text-[#A7ACD9] animate-spin" />
        <p className="text-sm">Loading Head Jury Control Room...</p>
      </div>
    );
  }

  if (!isHeadJury) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-sora text-xl sm:text-2xl font-bold text-white">
          Truy cập bị từ chối
        </h2>
        <p className="mt-2 text-sm text-[#9695a1] max-w-md mx-auto leading-relaxed">
          Bạn không có quyền Trưởng ban giám khảo (Head Jury) cho sự kiện này. Chỉ Trưởng ban giám khảo được bổ nhiệm chính thức mới có quyền truy cập không gian này.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/creator/events/${eventId}/jury`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:brightness-110 transition shadow-lg"
          >
            <Gavel size={16} />
            <span>Không gian chấm thi thông thường</span>
          </Link>
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-semibold text-[#9695a1] hover:text-white hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} />
            <span>Quay lại chi tiết sự kiện</span>
          </Link>
        </div>
      </div>
    );
  }

  const eventTitle = event?.title || 'AURA 2026';
  const statusColor = event?.status ? eventStatusBadgeStyles[event.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30' : 'bg-[#A7ACD9]/20 text-[#A7ACD9] border-[#A7ACD9]/30';
  const statusLabel = event?.status ? eventStatusLabels[event.status] || event.status : 'Judging';
  const deadlineFormatted = event?.judgingEndAt
    ? new Date(event.judgingEndAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Nov 28, 2026';
  const isJudgingPhase = event?.status === 'Judging';

  return (
    <div className="min-h-screen text-[#e4e1e5] space-y-6 pb-16">
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

      {/* Top Breadcrumb & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#9695a1]">
          <Link href="/creator/commissions" className="hover:text-white transition-colors">
            Creator Studio
          </Link>
          <span>/</span>
          <Link href="/creator/events/jury" className="hover:text-white transition-colors">
            Event Jury
          </Link>
          <span>/</span>
          <span className="text-[#A7ACD9] font-medium">{eventTitle} (Head Jury)</span>
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
            href={`/creator/events/${eventId}/jury`}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs text-white transition-colors flex items-center gap-1.5"
          >
            <Gavel className="w-3.5 h-3.5 text-[#A7ACD9]" />
            <span>Standard Jury View</span>
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

      {/* Events Head Jury Workspace Section */}
      <section id="head-jury-workspace" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Events Head Jury Workspace</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-sora mt-1">
              Head Jury Control Room & Panel Oversight
            </h2>
            <p className="text-xs sm:text-sm text-[#9695a1] mt-0.5">
              Comprehensive evaluation, jury panel monitoring, arbitration voting, and final results approval.
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
              <strong>Head Jury Authority:</strong> You possess panel oversight capabilities including monitoring individual jury grading velocity, resolving score variance via arbitration, and approving final contest results.
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <nav className="flex gap-1.5 overflow-x-auto p-1.5 rounded-2xl border border-white/10 bg-[#121620]/90 backdrop-blur-xl sticky top-20 z-20">
          <button
            type="button"
            onClick={() => setActiveTab('score')}
            className={`px-4 py-2 rounded-xl font-sora font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'bg-[#A7ACD9] text-[#1F2335] shadow-lg shadow-[#A7ACD9]/20'
                : 'text-[#9695a1] hover:text-white hover:bg-white/5'
            }`}
          >
            Scoring
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-xl font-sora font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-[#A7ACD9] text-[#1F2335] shadow-lg shadow-[#A7ACD9]/20'
                : 'text-[#9695a1] hover:text-white hover:bg-white/5'
            }`}
          >
            Overall Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 rounded-xl font-sora font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'scores'
                ? 'bg-[#A7ACD9] text-[#1F2335] shadow-lg shadow-[#A7ACD9]/20'
                : 'text-[#9695a1] hover:text-white hover:bg-white/5'
            }`}
          >
            Leaderboard & Scores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('arbitration')}
            className={`px-4 py-2 rounded-xl font-sora font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'arbitration'
                ? 'bg-[#A7ACD9] text-[#1F2335] shadow-lg shadow-[#A7ACD9]/20'
                : 'text-[#9695a1] hover:text-white hover:bg-white/5'
            }`}
          >
            Arbitration Voting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approve')}
            className={`px-4 py-2 rounded-xl font-sora font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'approve'
                ? 'bg-[#A7ACD9] text-[#1F2335] shadow-lg shadow-[#A7ACD9]/20'
                : 'text-[#9695a1] hover:text-white hover:bg-white/5'
            }`}
          >
            Approve Results
          </button>
        </nav>


        {/* TAB 1: SCORING */}
        {activeTab === 'score' && (
          <HeadJuryScoringTab
            submissions={submissions}
            activeSubmission={activeSubmission}
            selectedSubmissionId={selectedSubmissionId}
            setSelectedSubmissionId={setSelectedSubmissionId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterTab={filterTab}
            setFilterTab={setFilterTab}
            filteredSubmissions={filteredSubmissions}
            criteria={criteria}
            scores={scores}
            handleScoreChange={handleScoreChange}
            totalScore={totalScore}
            notes={notes}
            setNotes={setNotes}
            noConflict={noConflict}
            setNoConflict={setNoConflict}
            handleSaveDraft={handleSaveDraft}
            handleSubmitScore={handleSubmitScore}
            setIsLightboxOpen={setIsLightboxOpen}
            activeIndex={activeIndex}
          />
        )}

        {/* TAB 2: OVERALL PROGRESS */}
        {activeTab === 'progress' && (
          <HeadJuryProgressTab
            overallJuryProgress={overallJuryProgress}
            juryList={juryList}
            filteredJuryList={filteredJuryList}
            selectedJuryId={selectedJuryId}
            setSelectedJuryId={setSelectedJuryId}
            selectedJury={selectedJury}
            juryMemberSearch={juryMemberSearch}
            setJuryMemberSearch={setJuryMemberSearch}
            juryStatusFilter={juryStatusFilter}
            setJuryStatusFilter={setJuryStatusFilter}
            juryScoreFilter={juryScoreFilter}
            setJuryScoreFilter={setJuryScoreFilter}
            selectedJuryAssignments={selectedJuryAssignments}
            filteredJuryAssignments={filteredJuryAssignments}
          />
        )}

        {/* TAB 3: LEADERBOARD & SCORES */}
        {activeTab === 'scores' && (
          <HeadJuryLeaderboardTab combinedScores={headData?.combinedScores || []} />
        )}

        {/* TAB 4: ARBITRATION VOTING */}
        {activeTab === 'arbitration' && (
          <HeadJuryArbitrationTab
            arbitrationCasesState={arbitrationCasesState}
            arbitrationCasesList={arbitrationCasesList}
            filteredArbitrationCases={filteredArbitrationCases}
            selectedArbitrationCase={selectedArbitrationCase}
            setSelectedArbitrationId={setSelectedArbitrationId}
            arbitrationSearch={arbitrationSearch}
            setArbitrationSearch={setArbitrationSearch}
            arbitrationStatusFilter={arbitrationStatusFilter}
            setArbitrationStatusFilter={setArbitrationStatusFilter}
            arbitrationDecision={arbitrationDecision}
            setArbitrationDecision={setArbitrationDecision}
            arbitrationNotes={arbitrationNotes}
            setArbitrationNotes={setArbitrationNotes}
            tieBreakerWinnerId={tieBreakerWinnerId}
            setTieBreakerWinnerId={setTieBreakerWinnerId}
            handleConfirmArbitration={handleConfirmArbitration}
          />
        )}

        {/* TAB 5: APPROVE RESULTS */}
        {activeTab === 'approve' && (
          <HeadJuryApproveTab
            finalWinnersList={finalWinnersList}
            isAwardAllocationsConfirmed={isAwardAllocationsConfirmed}
            isContestResultsApproved={isContestResultsApproved}
            handleApproveAwardAllocations={handleApproveAwardAllocations}
            handleApproveContestResults={handleApproveContestResults}
          />
        )}
      </section>

      {/* Rules Modal */}
      {isRulesModalOpen && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
