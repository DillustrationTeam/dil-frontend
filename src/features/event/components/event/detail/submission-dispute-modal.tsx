'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventSubmissionService } from '@/features/event/services/event-submission.service';
import type { EventSubmissionDto } from '@/features/event/types/event.types';

interface SubmissionDisputeModalProps {
  submission: EventSubmissionDto;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmissionDisputeModal({
  submission,
  onClose,
  onSuccess,
}: SubmissionDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [evidenceInputs, setEvidenceInputs] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddEvidence = () => {
    if (evidenceInputs.length < 5) {
      setEvidenceInputs([...evidenceInputs, '']);
    }
  };

  const handleEvidenceChange = (index: number, val: string) => {
    const updated = [...evidenceInputs];
    updated[index] = val;
    setEvidenceInputs(updated);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceInputs(evidenceInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify the dispute reason.');
      return;
    }

    const validUrls = evidenceInputs.map((u) => u.trim()).filter((u) => u.length > 0);

    setSubmitting(true);
    try {
      await eventSubmissionService.createDispute(submission.id, {
        reason: reason.trim(),
        description: description.trim() || undefined,
        evidenceUrls: validUrls.length > 0 ? validUrls : undefined,
        priority,
      });

      toast.success('Dispute reported successfully. The contest moderators and jury will review this submission.');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to file dispute.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#161926] p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-h1 text-lg font-bold text-white sm:text-xl">
                File a Dispute
              </h3>
              <p className="text-xs text-[#8A8FA9]">
                Report submission #{submission.id.slice(0, 8)} for review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8A8FA9] hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Target Submission Summary */}
        <div className="my-5 flex items-center gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
          {submission.artworkImageUrl || submission.artworkThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={submission.artworkImageUrl || submission.artworkThumbnailUrl}
              alt={submission.title}
              className="size-14 shrink-0 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div className="size-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[#8A8FA9]">
              No img
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-brand-periwinkle font-medium">Contest Submission</p>
            <h4 className="truncate text-sm font-bold text-white">{submission.title}</h4>
            <p className="truncate text-xs text-[#8A8FA9]">
              Artist: <span className="text-[#D6D9FF]">@{submission.submitterName || 'Artist'}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Reason / Summary <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Artwork plagiarized from original art on ArtStation"
              maxLength={200}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">Priority</label>
            <div className="flex items-center gap-2">
              {(['Low', 'Medium', 'High'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    priority === p
                      ? p === 'High'
                        ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                        : 'border-brand-periwinkle bg-brand-periwinkle/20 text-brand-periwinkle'
                      : 'border-white/10 bg-white/5 text-[#8A8FA9] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Detailed Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context or notes for the jury/moderator..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          {/* Evidence URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white">Evidence Links (optional)</label>
              {evidenceInputs.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-periwinkle hover:underline cursor-pointer"
                >
                  <Plus size={12} /> Add link
                </button>
              )}
            </div>
            <div className="space-y-2">
              {evidenceInputs.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FA9]" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleEvidenceChange(idx, e.target.value)}
                      placeholder="https://example.com/evidence-or-original-link"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
                    />
                  </div>
                  {evidenceInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(idx)}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8A8FA9] hover:text-rose-400 hover:border-rose-400/30 transition cursor-pointer"
                      title="Remove link"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caution Note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/90 leading-relaxed">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <span>
              False or malicious disputes can result in penalties on your account. Please submit evidence truthfully.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#8A8FA9] hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-brand-navy px-5 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  Submit Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
