'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Save,
  CheckCircle,
  Calendar,
  Sparkles,
  MonitorUp,
  ArrowLeft,
  Image as ImageIcon,
  Lock,
  Clock,
  Plus,
  Trash2,
  ListChecks,
} from 'lucide-react';
import type { EventStatus, EventListItemDto } from '../../../types/event.types';
import { eventService } from '../../../services/event.service';
import { eventCriteriaService } from '../../../services/event-criteria.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';

function formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

interface EventCreateFormProps {
  selectedEvent: EventListItemDto | null;
  onSaveSuccess: (savedEvent: EventListItemDto) => void;
  onCancelEdit: () => void;
  bannerUrl?: string;
  onBannerUrlChange?: (url: string) => void;
}

export function EventCreateForm({
  selectedEvent,
  onSaveSuccess,
  onCancelEdit,
  bannerUrl,
}: EventCreateFormProps) {
  const isEditing = Boolean(selectedEvent);

  const [title, setTitle] = useState(selectedEvent?.title || '');
  const [description, setDescription] = useState(selectedEvent?.description || '');
  const [rules, setRules] = useState(selectedEvent?.rules || '');
  const [prize, setPrize] = useState(selectedEvent?.prize || '');
  const [maxVote, setMaxVote] = useState(selectedEvent?.maxVote || 1);
  const [status, setStatus] = useState<EventStatus>((selectedEvent?.status as EventStatus) || 'Draft');
  const [isFeatured, setIsFeatured] = useState(Boolean(selectedEvent?.isFeatured ?? false));

  // Banner image file & preview state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>(
    bannerUrl || selectedEvent?.bannerUrl || ''
  );
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Timeline dates
  const [submissionStartAt, setSubmissionStartAt] = useState(() => formatDateForInput(selectedEvent?.submissionStartAt));
  const [submissionEndAt, setSubmissionEndAt] = useState(() => formatDateForInput(selectedEvent?.submissionEndAt));
  const [judgingStartAt, setJudgingStartAt] = useState(() => formatDateForInput(selectedEvent?.judgingStartAt));
  const [judgingEndAt, setJudgingEndAt] = useState(() => formatDateForInput(selectedEvent?.judgingEndAt));
  const [votingStartAt, setVotingStartAt] = useState(() => formatDateForInput(selectedEvent?.votingStartAt));
  const [votingEndAt, setVotingEndAt] = useState(() => formatDateForInput(selectedEvent?.votingEndAt));
  const [resultAnnouncementAt, setResultAnnouncementAt] = useState(() => formatDateForInput(selectedEvent?.resultAnnouncementAt));

  // Scoring Criteria State
  const [criteriaList, setCriteriaList] = useState<Array<{
    id?: string;
    name: string;
    description: string;
    maxScore: number | string;
    weight: number | string;
    displayOrder: number;
  }>>(() => {
    const existing = selectedEvent?.criteria || selectedEvent?.eventCriteria;
    if (existing && existing.length > 0) {
      return existing.map((c, i) => ({
        id: c.id,
        name: c.name || '',
        description: c.description || '',
        maxScore: c.maxScore ?? 10,
        weight: c.weight ?? 1,
        displayOrder: c.displayOrder ?? i + 1,
      }));
    }
    return [
      { name: '', description: '', maxScore: 10, weight: 1, displayOrder: 1 },
    ];
  });

  const [submitting, setSubmitting] = useState(false);

  // Synchronize state during render if selectedEvent prop changes
  const [prevEventId, setPrevEventId] = useState(selectedEvent?.id);
  if (selectedEvent?.id !== prevEventId) {
    setPrevEventId(selectedEvent?.id);
    setTitle(selectedEvent?.title || '');
    setDescription(selectedEvent?.description || '');
    setRules(selectedEvent?.rules || '');
    setPrize(selectedEvent?.prize || '');
    setMaxVote(selectedEvent?.maxVote || 1);
    setStatus((selectedEvent?.status as EventStatus) || 'Draft');
    setIsFeatured(Boolean(selectedEvent?.isFeatured));
    setBannerPreviewUrl(selectedEvent?.bannerUrl || '');
    setSubmissionStartAt(formatDateForInput(selectedEvent?.submissionStartAt));
    setSubmissionEndAt(formatDateForInput(selectedEvent?.submissionEndAt));
    setJudgingStartAt(formatDateForInput(selectedEvent?.judgingStartAt));
    setJudgingEndAt(formatDateForInput(selectedEvent?.judgingEndAt));
    setVotingStartAt(formatDateForInput(selectedEvent?.votingStartAt));
    setVotingEndAt(formatDateForInput(selectedEvent?.votingEndAt));
    setResultAnnouncementAt(formatDateForInput(selectedEvent?.resultAnnouncementAt));

    const existing = selectedEvent?.criteria || selectedEvent?.eventCriteria;
    if (existing && existing.length > 0) {
      setCriteriaList(existing.map((c, i) => ({
        id: c.id,
        name: c.name || '',
        description: c.description || '',
        maxScore: c.maxScore ?? 10,
        weight: c.weight ?? 1,
        displayOrder: c.displayOrder ?? i + 1,
      })));
    }
  }

  // Fetch criteria from backend if editing and criteria not preloaded
  useEffect(() => {
    if (selectedEvent?.id && (!selectedEvent.criteria || selectedEvent.criteria.length === 0) && (!selectedEvent.eventCriteria || selectedEvent.eventCriteria.length === 0)) {
      eventCriteriaService.getEventCriteria(selectedEvent.id)
        .then((data) => {
          if (data && data.length > 0) {
            setCriteriaList(data.map((c, i) => ({
              id: c.id,
              name: c.name || '',
              description: c.description || '',
              maxScore: c.maxScore ?? 10,
              weight: c.weight ?? 1,
              displayOrder: c.displayOrder ?? i + 1,
            })));
          }
        })
        .catch(() => {});
    }
  }, [selectedEvent?.id]);

  // Calculate backend milestone locks and active stages matching UpdateEventCommandValidator.cs
  const now = new Date();
  const nowTime = now.getTime();

  // Helper to parse ISO or input string to getTime()
  const getTime = (dStr?: string | null) => (dStr ? new Date(dStr).getTime() : 0);

  // Original existing event dates if editing
  const origSubmissionStart = selectedEvent ? getTime(selectedEvent.submissionStartAt) : 0;
  const origSubmissionEnd = selectedEvent ? getTime(selectedEvent.submissionEndAt) : 0;
  const origJudgingStart = selectedEvent ? getTime(selectedEvent.judgingStartAt) : 0;
  const origJudgingEnd = selectedEvent ? getTime(selectedEvent.judgingEndAt) : 0;
  const origVotingStart = selectedEvent ? getTime(selectedEvent.votingStartAt) : 0;
  const origVotingEnd = selectedEvent ? getTime(selectedEvent.votingEndAt) : 0;
  const origResultAnnouncement = selectedEvent ? getTime(selectedEvent.resultAnnouncementAt) : 0;

  // Milestone passed locks (<= now)
  const isSubmissionStartPassed = isEditing && origSubmissionStart > 0 && origSubmissionStart <= nowTime;
  const isSubmissionEndPassed = isEditing && origSubmissionEnd > 0 && origSubmissionEnd <= nowTime;
  const isJudgingStartPassed = isEditing && origJudgingStart > 0 && origJudgingStart <= nowTime;
  const isJudgingEndPassed = isEditing && origJudgingEnd > 0 && origJudgingEnd <= nowTime;
  const isVotingStartPassed = isEditing && origVotingStart > 0 && origVotingStart <= nowTime;
  const isVotingEndPassed = isEditing && origVotingEnd > 0 && origVotingEnd <= nowTime;
  const isResultAnnouncementPassed = isEditing && origResultAnnouncement > 0 && origResultAnnouncement <= nowTime;

  // Active stage flags (start <= now < end)
  const isSubmissionActive = isEditing && origSubmissionStart > 0 && origSubmissionStart <= nowTime && nowTime < origSubmissionEnd;
  const isJudgingActive = isEditing && origJudgingStart > 0 && origJudgingStart <= nowTime && nowTime < origJudgingEnd;
  const isVotingActive = isEditing && origVotingStart > 0 && origVotingStart <= nowTime && nowTime < origVotingEnd;
  const isResultAnnouncementPending = isEditing && origVotingEnd > 0 && origVotingEnd <= nowTime && nowTime < origResultAnnouncement;

  const isEventEnded = isEditing && (status === 'Ended' || isResultAnnouncementPassed);

  // Criteria can only be edited before judging starts
  const isCriteriaLocked = useMemo(() => {
    if (!isEditing || !selectedEvent) return false;
    const statusStr = String(status).toLowerCase();
    const origStatusStr = String(selectedEvent.status).toLowerCase();
    const isJudgingOrLaterStatus =
      statusStr === 'judging' ||
      statusStr === '3' ||
      statusStr === 'ended' ||
      statusStr === '4' ||
      origStatusStr === 'judging' ||
      origStatusStr === '3' ||
      origStatusStr === 'ended' ||
      origStatusStr === '4';

    return Boolean(isJudgingStartPassed || isJudgingActive || isJudgingEndPassed || isJudgingOrLaterStatus);
  }, [isEditing, selectedEvent, status, isJudgingStartPassed, isJudgingActive, isJudgingEndPassed]);

  const handleAddCriterion = () => {
    if (isCriteriaLocked) {
      toast.error('Scoring criteria cannot be added after the judging stage has started.');
      return;
    }
    setCriteriaList((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        maxScore: 10,
        weight: 1,
        displayOrder: prev.length + 1,
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (isCriteriaLocked) {
      toast.error('Scoring criteria cannot be removed after the judging stage has started.');
      return;
    }
    if (criteriaList.length <= 1) {
      toast.error('Event must have at least one scoring criterion.');
      return;
    }
    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (
    index: number,
    field: 'name' | 'description' | 'maxScore' | 'weight',
    value: string | number
  ) => {
    if (isCriteriaLocked) return;
    setCriteriaList((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size must be less than 25MB.');
      return;
    }

    setBannerFile(file);
    const preview = URL.createObjectURL(file);
    setBannerPreviewUrl(preview);
  };

  const handleSaveDraft = async () => {
    await performSave(true);
  };

  // Helper to check if an input field value was actually modified by the user compared to original formatted date
  const isFieldChanged = (currentInputStr: string, origIsoStr?: string | null): boolean => {
    if (!origIsoStr) return false;
    const origFormatted = formatDateForInput(origIsoStr);
    return currentInputStr.trim() !== origFormatted.trim();
  };

  // Validate timeline transitions matching 1:1 backend UpdateEventCommandValidator.cs & CreateEventCommandValidator.cs
  const validateTimelineTransitions = (): string[] => {
    const errors: string[] = [];

    const subStart = getTime(submissionStartAt);
    const subEnd = getTime(submissionEndAt);
    const judgStart = getTime(judgingStartAt);
    const judgEnd = getTime(judgingEndAt);
    const votStart = getTime(votingStartAt);
    const votEnd = getTime(votingEndAt);
    const resAnn = getTime(resultAnnouncementAt);

    if (isEditing && selectedEvent) {
      // 1. Milestones that have already started or passed cannot be modified
      if (origSubmissionStart <= nowTime && isFieldChanged(submissionStartAt, selectedEvent.submissionStartAt)) {
        errors.push('Submission start time has already started or passed and cannot be modified.');
      }
      if (origSubmissionEnd <= nowTime && isFieldChanged(submissionEndAt, selectedEvent.submissionEndAt)) {
        errors.push('Submission end time has already passed and cannot be modified.');
      }
      if (origJudgingStart <= nowTime && isFieldChanged(judgingStartAt, selectedEvent.judgingStartAt)) {
        errors.push('Judging start time has already started or passed and cannot be modified.');
      }
      if (origJudgingEnd <= nowTime && isFieldChanged(judgingEndAt, selectedEvent.judgingEndAt)) {
        errors.push('Judging end time has already passed and cannot be modified.');
      }
      if (origVotingStart <= nowTime && isFieldChanged(votingStartAt, selectedEvent.votingStartAt)) {
        errors.push('Voting start time has already started or passed and cannot be modified.');
      }
      if (origVotingEnd <= nowTime && isFieldChanged(votingEndAt, selectedEvent.votingEndAt)) {
        errors.push('Voting end time has already passed and cannot be modified.');
      }
      if (origResultAnnouncement <= nowTime && isFieldChanged(resultAnnouncementAt, selectedEvent.resultAnnouncementAt)) {
        errors.push('Result announcement time has already passed and cannot be modified.');
      }

      // 2. Active phase end times can only be extended, not shortened
      if (isSubmissionActive && isFieldChanged(submissionEndAt, selectedEvent.submissionEndAt) && subEnd < origSubmissionEnd) {
        errors.push('The submission phase is currently active; its end time can only be extended, not shortened.');
      }
      if (isJudgingActive && isFieldChanged(judgingEndAt, selectedEvent.judgingEndAt) && judgEnd < origJudgingEnd) {
        errors.push('The judging phase is currently active; its end time can only be extended, not shortened.');
      }
      if (isVotingActive && isFieldChanged(votingEndAt, selectedEvent.votingEndAt) && votEnd < origVotingEnd) {
        errors.push('The voting phase is currently active; its end time can only be extended, not shortened.');
      }
      if (isResultAnnouncementPending && isFieldChanged(resultAnnouncementAt, selectedEvent.resultAnnouncementAt) && resAnn < origResultAnnouncement) {
        errors.push('The result announcement phase is currently pending; announcement time can only be extended or postponed, not shortened.');
      }

      // 3. Future stage dates must stay in the future
      if (origSubmissionStart > nowTime && subStart <= nowTime) {
        errors.push('The new submission start time must be in the future.');
      }
      if (origSubmissionEnd > nowTime && subEnd <= nowTime) {
        errors.push('The new submission end time must be in the future.');
      }
      if (origJudgingStart > nowTime && judgStart <= nowTime) {
        errors.push('The new judging start time must be in the future.');
      }
      if (origJudgingEnd > nowTime && judgEnd <= nowTime) {
        errors.push('The new judging end time must be in the future.');
      }
      if (origVotingStart > nowTime && votStart <= nowTime) {
        errors.push('The new voting start time must be in the future.');
      }
      if (origVotingEnd > nowTime && votEnd <= nowTime) {
        errors.push('The new voting end time must be in the future.');
      }
      if (origResultAnnouncement > nowTime && resAnn <= nowTime) {
        errors.push('The new result announcement time must be in the future.');
      }
    }

    // 4. Strict sequential ordering (Create & Update)
    if (subEnd <= subStart) {
      errors.push('Submission end time must be after submission start time.');
    }
    if (judgStart <= subEnd) {
      errors.push('Judging start time must be after submission end time.');
    }
    if (judgEnd <= judgStart) {
      errors.push('Judging end time must be after judging start time.');
    }
    if (votStart <= judgEnd) {
      errors.push('Voting start time must be after judging end time.');
    }
    if (votEnd <= votStart) {
      errors.push('Voting end time must be after voting start time.');
    }
    if (resAnn <= votEnd) {
      errors.push('Result announcement time must be after voting end time.');
    }

    return errors;
  };

  const performSave = async (isDraft = false) => {
    if (!title.trim()) {
      toast.error('Event title is required!');
      return;
    }

    if (!isDraft) {
      if (maxVote <= 0) {
        toast.error('Max vote must be greater than 0.');
        return;
      }

      // Run backend validation checks
      const validationErrors = validateTimelineTransitions();
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }
    }

    setSubmitting(true);

    try {
      let finalBannerUrl = bannerPreviewUrl;
      if (bannerFile) {
        try {
          finalBannerUrl = await creatorProfileService.uploadArtworkImage(bannerFile);
        } catch {
          // Keep bannerPreviewUrl if upload endpoint fails in dev
        }
      }

      const mapStatusToEnum = (s: EventStatus | string | number): number => {
        if (typeof s === 'number') return s;
        switch (String(s).toLowerCase()) {
          case 'open':
          case '2':
            return 2;
          case 'judging':
          case '3':
            return 3;
          case 'ended':
          case '4':
            return 4;
          case 'draft':
          case '1':
          default:
            return 1;
        }
      };

      const formatIsoUtc = (inputStr: string, origIsoStr?: string | null): string => {
        if (origIsoStr && !isFieldChanged(inputStr, origIsoStr)) {
          return origIsoStr;
        }
        const d = new Date(inputStr);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };

      const payload = {
        title: title.trim(),
        description: description.trim(),
        bannerUrl: finalBannerUrl || null,
        rules: rules.trim() || null,
        prize: prize.trim() || null,
        maxVote: Number(maxVote) > 0 ? Number(maxVote) : 1,
        status: isDraft ? 1 : mapStatusToEnum(status),
        isFeatured,
        submissionStartAt: formatIsoUtc(submissionStartAt, selectedEvent?.submissionStartAt),
        submissionEndAt: formatIsoUtc(submissionEndAt, selectedEvent?.submissionEndAt),
        judgingStartAt: formatIsoUtc(judgingStartAt, selectedEvent?.judgingStartAt),
        judgingEndAt: formatIsoUtc(judgingEndAt, selectedEvent?.judgingEndAt),
        votingStartAt: formatIsoUtc(votingStartAt, selectedEvent?.votingStartAt),
        votingEndAt: formatIsoUtc(votingEndAt, selectedEvent?.votingEndAt),
        resultAnnouncementAt: formatIsoUtc(resultAnnouncementAt, selectedEvent?.resultAnnouncementAt),
        criteria: criteriaList
          .filter((c) => c.name.trim().length > 0)
          .map((c, i) => ({
            id: c.id,
            name: c.name.trim(),
            description: c.description.trim() || undefined,
            maxScore: Number(c.maxScore) > 0 ? Number(c.maxScore) : 10,
            weight: Number(c.weight) > 0 ? Number(c.weight) : 1,
            displayOrder: i + 1,
          })),
        eventCriteria: criteriaList
          .filter((c) => c.name.trim().length > 0)
          .map((c, i) => ({
            id: c.id,
            name: c.name.trim(),
            description: c.description.trim() || undefined,
            maxScore: Number(c.maxScore) > 0 ? Number(c.maxScore) : 10,
            weight: Number(c.weight) > 0 ? Number(c.weight) : 1,
            displayOrder: i + 1,
          })),
      };

      let savedData: EventListItemDto;
      if (isEditing && selectedEvent) {
        const updated = await eventService.update(selectedEvent.id, payload as unknown as Record<string, unknown>);
        if (!updated || !updated.id) {
          throw new Error('Failed to update event: backend returned invalid response.');
        }
        savedData = {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          bannerUrl: updated.bannerUrl ?? null,
          rules: updated.rules ?? null,
          prize: updated.prize ?? null,
          maxVote: updated.maxVote,
          status: updated.status,
          isFeatured: updated.isFeatured,
          submissionStartAt: updated.submissionStartAt,
          submissionEndAt: updated.submissionEndAt,
          judgingStartAt: updated.judgingStartAt,
          judgingEndAt: updated.judgingEndAt,
          votingStartAt: updated.votingStartAt,
          votingEndAt: updated.votingEndAt,
          resultAnnouncementAt: updated.resultAnnouncementAt,
          submissionCount: updated.submissionCount ?? selectedEvent.submissionCount ?? 0,
          totalVoteCount: updated.totalVoteCount ?? selectedEvent.totalVoteCount ?? 0,
          createdAt: updated.createdAt || selectedEvent.createdAt,
          updatedAt: updated.updatedAt || new Date().toISOString(),
        };
        toast.success(isDraft ? `Draft "${title}" saved successfully!` : `Event "${title}" updated successfully!`);
      } else {
        const created = await eventService.create(payload as unknown as Record<string, unknown>);
        if (!created || !created.id) {
          throw new Error('Failed to create event: backend returned invalid response.');
        }
        savedData = {
          id: created.id,
          title: created.title,
          description: created.description,
          bannerUrl: created.bannerUrl ?? null,
          rules: created.rules ?? null,
          prize: created.prize ?? null,
          maxVote: created.maxVote,
          status: created.status,
          isFeatured: created.isFeatured,
          submissionStartAt: created.submissionStartAt,
          submissionEndAt: created.submissionEndAt,
          judgingStartAt: created.judgingStartAt,
          judgingEndAt: created.judgingEndAt,
          votingStartAt: created.votingStartAt,
          votingEndAt: created.votingEndAt,
          resultAnnouncementAt: created.resultAnnouncementAt,
          submissionCount: created.submissionCount ?? 0,
          totalVoteCount: created.totalVoteCount ?? 0,
          createdAt: created.createdAt || new Date().toISOString(),
          updatedAt: created.updatedAt,
        };
        toast.success(isDraft ? `Draft "${title}" saved to backend!` : `New event "${title}" created successfully!`);
      }

      onSaveSuccess(savedData);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSave(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl mx-auto rounded-3xl border border-white/15 bg-[#161926] p-6 sm:p-8 shadow-2xl space-y-6 text-[#e4e1e5]"
    >
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-h1 text-white">
              {isEditing ? 'Update Contest Details' : 'Create New Illustration Contest'}
            </h2>
            {isEditing && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-periwinkle/20 text-brand-periwinkle border border-brand-periwinkle/30 font-mono">
                ID: {selectedEvent?.id}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8A8FA9] mt-1">
            Configure contest overview, prize structure, submission deadlines, and banner image.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-[#A7ACD9] hover:bg-white/5 hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Stage / Ended Warning Banner */}
      {isEventEnded && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
          <Lock size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">Contest Completed / Ended</strong>
            This contest has ended or reached the result announcement phase. Past stage dates are locked in accordance with backend constraints.
          </div>
        </div>
      )}

      {/* 1. Contest Banner Image (Dropzone & Live Preview) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
          Contest Banner Image <span className="text-rose-400">*</span>
        </label>

        <input
          type="file"
          ref={bannerInputRef}
          onChange={handleBannerFileChange}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
        />

        {bannerPreviewUrl ? (
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-black/40 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerPreviewUrl} alt="Contest Banner Preview" className="size-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy shadow-md cursor-pointer hover:brightness-110 transition flex items-center gap-1.5"
              >
                <ImageIcon size={14} />
                <span>Change Banner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBannerFile(null);
                  setBannerPreviewUrl('');
                }}
                className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer hover:bg-rose-600 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] hover:border-brand-periwinkle/60 hover:bg-white/[0.04] transition cursor-pointer"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mb-3">
              <MonitorUp size={28} />
            </div>
            <p className="font-h1 text-sm font-bold text-white">Click or drag & drop contest banner from your PC</p>
            <p className="text-xs text-[#8A8FA9] mt-1">Recommended size: 1920x800px (PNG, JPG, WEBP up to 25MB)</p>
          </div>
        )}
      </div>

      {/* 2. Core Contest Fields */}
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Event Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AURA 2026: Beyond the Visible"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Event Overview & Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the contest theme, creative guidelines, and overview..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Contest Rules & Submission Guidelines
          </label>
          <textarea
            rows={4}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Specify eligibility criteria, submission limits, and copyright rules..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Prize Pool & Honors Structure
          </label>
          <input
            type="text"
            maxLength={1000}
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="e.g. 120,000,000 VND · 6 Categories"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Configuration & Status Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Event Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="w-full rounded-xl border border-white/10 bg-[#090b12] px-4 py-2.5 text-sm text-white focus:border-brand-periwinkle focus:outline-none cursor-pointer"
          >
            <option value="Draft" className="bg-[#1f2335]">Draft</option>
            <option value="Open" className="bg-[#1f2335]">Open for Submissions</option>
            <option value="Judging" className="bg-[#1f2335]">Judging & Voting</option>
            <option value="Ended" className="bg-[#1f2335]">Ended</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
            Max Votes Per User
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={maxVote}
            onChange={(e) => setMaxVote(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-brand-periwinkle focus:outline-none"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 text-brand-periwinkle focus:ring-0 cursor-pointer"
            />
            <Sparkles size={16} className="text-amber-300" />
            <span className="text-xs font-semibold text-white">Mark as Featured Contest on Homepage Carousel</span>
          </label>
        </div>
      </div>

      {/* 4. Timeline Schedule with Backend Stage Constraints */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-brand-periwinkle uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={15} /> Event Stages & Timeline Schedules (Backend Constraints)
          </h3>
          <span className="text-[11px] text-[#8A8FA9]">
            Sequential order: Submission → Judging → Voting → Result Announcement
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Submission Start */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Submission Start
              </label>
              {isSubmissionStartPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isSubmissionActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Clock size={10} /> Active Phase
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isSubmissionStartPassed || isEventEnded}
              value={submissionStartAt}
              onChange={(e) => setSubmissionStartAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submission Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Submission Deadline
              </label>
              {isSubmissionEndPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isSubmissionActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  Extendable Only
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isSubmissionEndPassed || isEventEnded}
              min={isSubmissionActive ? formatDateForInput(selectedEvent?.submissionEndAt) : undefined}
              value={submissionEndAt}
              onChange={(e) => setSubmissionEndAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Judging Start */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Judging Start
              </label>
              {isJudgingStartPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isJudgingActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Clock size={10} /> Active Phase
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isJudgingStartPassed || isEventEnded}
              value={judgingStartAt}
              onChange={(e) => setJudgingStartAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Judging Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Judging Deadline
              </label>
              {isJudgingEndPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isJudgingActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  Extendable Only
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isJudgingEndPassed || isEventEnded}
              min={isJudgingActive ? formatDateForInput(selectedEvent?.judgingEndAt) : undefined}
              value={judgingEndAt}
              onChange={(e) => setJudgingEndAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Public Voting Start */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Public Voting Start
              </label>
              {isVotingStartPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isVotingActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Clock size={10} /> Active Phase
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isVotingStartPassed || isEventEnded}
              value={votingStartAt}
              onChange={(e) => setVotingStartAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Public Voting End */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Public Voting End
              </label>
              {isVotingEndPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isVotingActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  Extendable Only
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isVotingEndPassed || isEventEnded}
              min={isVotingActive ? formatDateForInput(selectedEvent?.votingEndAt) : undefined}
              value={votingEndAt}
              onChange={(e) => setVotingEndAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Result Announcement */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
                Result Announcement Date
              </label>
              {isResultAnnouncementPassed || isEventEnded ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={10} /> Passed (Locked)
                </span>
              ) : isResultAnnouncementPending ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  Postponable Only
                </span>
              ) : null}
            </div>
            <input
              type="datetime-local"
              disabled={isResultAnnouncementPassed || isEventEnded}
              min={isResultAnnouncementPending ? formatDateForInput(selectedEvent?.resultAnnouncementAt) : undefined}
              value={resultAnnouncementAt}
              onChange={(e) => setResultAnnouncementAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 5. Scoring Criteria & Rubrics */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-brand-periwinkle uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks size={15} /> 5. Event Scoring Criteria & Rubrics
            </h3>
            <p className="text-[11px] text-[#8A8FA9] mt-0.5">
              Configure evaluation criteria and rubrics for the Jury during the judging stage.
            </p>
          </div>
          {isCriteriaLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Lock size={13} />
              <span>Criteria Locked</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAddCriterion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 text-brand-periwinkle text-xs font-semibold transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Criterion</span>
            </button>
          )}
        </div>

        {/* Warning if criteria is locked */}
        {isCriteriaLocked && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
            <Lock size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Criteria editing is locked</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Evaluation criteria can only be modified before the judging stage begins. Once judging is active or has concluded, scoring criteria are read-only to ensure grading consistency.
              </p>
            </div>
          </div>
        )}

        {/* Summary pill */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <span className="text-[#8A8FA9]">Total Criteria: <strong className="text-white">{criteriaList.length}</strong></span>
          <span className="text-[#8A8FA9]">·</span>
          <span className="text-[#8A8FA9]">Max Score Total: <strong className="text-amber-300">{criteriaList.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0)}</strong></span>
          <span className="text-[#8A8FA9]">·</span>
          <span className="text-[#8A8FA9]">Total Weight: <strong className="text-emerald-300">{criteriaList.reduce((sum, c) => sum + (Number(c.weight) || 0), 0).toFixed(2)}</strong></span>
        </div>

        {/* Criteria items list */}
        <div className="space-y-3">
          {criteriaList.map((crit, idx) => (
            <div
              key={crit.id || `crit-${idx}`}
              className="p-3.5 rounded-xl border border-white/10 bg-[#0c0e18]/80 hover:border-white/20 transition space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="size-5 rounded-full bg-brand-periwinkle/20 text-brand-periwinkle text-[11px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  Criterion #{idx + 1}
                </span>
                {criteriaList.length > 1 && !isCriteriaLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer"
                    title="Remove this criterion"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1">
                    Criterion Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isCriteriaLocked}
                    value={crit.name}
                    onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                    placeholder="e.g. Creativity & Concept"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step="any"
                    disabled={isCriteriaLocked}
                    value={crit.maxScore}
                    onChange={(e) => handleCriterionChange(idx, 'maxScore', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step="any"
                    disabled={isCriteriaLocked}
                    value={crit.weight}
                    onChange={(e) => handleCriterionChange(idx, 'weight', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand-periwinkle focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1">
                    Scoring Guide & Description
                  </label>
                  <input
                    type="text"
                    disabled={isCriteriaLocked}
                    value={crit.description}
                    onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                    placeholder="e.g. Originality, visual storytelling, and adherence to the contest theme..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/5 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save size={14} className="text-brand-periwinkle" />
          <span>Save Draft</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-6 py-2.5 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle size={16} />
          <span>
            {submitting
              ? 'Saving...'
              : isEditing
                ? 'Update Event'
                : 'Create Event'}
          </span>
        </button>
      </div>
    </form>
  );
}
