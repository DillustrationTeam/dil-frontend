'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import type { MilestoneStatus } from '@/types/commission.types';

interface ApprovalRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  wipPreviewUrl: string;
  maxRevisions: number;
  revisionCount: number;
  isCreator?: boolean;
  revisionFeedback?: string | null;
  milestoneStatus?: MilestoneStatus;
  onOpenSubmitModal?: () => void;
  onSuccess?: () => void;
}

export default function ApprovalRevisionModal({
  isOpen,
  onClose,
  commissionId,
  milestoneId,
  wipPreviewUrl,
  maxRevisions,
  revisionCount,
  isCreator = false,
  revisionFeedback,
  milestoneStatus,
  onOpenSubmitModal,
  onSuccess,
}: ApprovalRevisionModalProps) {
  const [mode, setMode] = useState<'view' | 'revise'>('view');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);

  if (!isOpen) return null;

  const revisionsLeft = maxRevisions - revisionCount;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await commissionService.approveMilestone(commissionId, milestoneId);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to approve milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStandardizeFeedback = async () => {
    if (!feedback.trim()) return;
    setIsStandardizing(true);
    try {
      const res = await aiService.standardizeRevision({ feedback });
      if (res?.content) {
        setFeedback(res.content);
      }
    } catch (err) {
      console.error('Failed to standardize revision', err);
      alert('Không thể chuẩn hóa phản hồi lúc này.');
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!feedback.trim()) return alert('Please enter revision feedback.');
    setIsSubmitting(true);
    try {
      await commissionService.requestRevision(commissionId, milestoneId, feedback);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to request revision. Maybe you exceeded the limit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Image Viewer */}
        <div className="w-full md:w-3/5 bg-black/40 border-r border-white/10 p-6 flex flex-col justify-center items-center relative min-h-[300px]">
          {wipPreviewUrl ? (
            <Image
              src={wipPreviewUrl}
              alt="Milestone Preview"
              width={1200}
              height={900}
              unoptimized
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg pointer-events-none"
            />
          ) : (
            <p className="text-slate-500 text-sm">No preview available.</p>
          )}
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Watermarked Preview</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="w-full md:w-2/5 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-space-grotesk font-bold text-white">Review Milestone</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6">
            {isCreator ? (
              <div className="space-y-4 text-sm text-slate-300">
                <p>{revisionFeedback || 'Đang chờ khách hàng duyệt bản vẽ.'}</p>
                {milestoneStatus === 'RevisionRequested' ? (
                  <button onClick={() => { onClose(); onOpenSubmitModal?.(); }} className="w-full rounded-xl bg-[#A7ACD9] px-4 py-3 font-semibold text-[#1F2335]">
                    Nộp bản chỉnh sửa
                  </button>
                ) : null}
              </div>
            ) : milestoneStatus && milestoneStatus !== 'Submitted' ? (
              <p className="text-sm text-slate-300">Chỉ có thể duyệt hoặc yêu cầu chỉnh sửa khi bản vẽ đang chờ duyệt.</p>
            ) : mode === 'view' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve this draft
                  </h4>
                  <p className="text-xs text-emerald-300/70 mb-4">
                    If you are satisfied with this work, approve it to release funds for this milestone and allow the creator to proceed to the next stage.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Approving...' : 'Approve & Release Funds'}
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Request Revision
                  </h4>
                  <p className="text-xs text-amber-300/70 mb-2">
                    Not quite right? Ask the creator to make changes.
                  </p>
                  <p className="text-[11px] text-amber-400/50 mb-4 font-mono">
                    Revisions left: {revisionsLeft} / {maxRevisions}
                  </p>
                  <button
                    onClick={() => setMode('revise')}
                    disabled={revisionsLeft <= 0}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {revisionsLeft > 0 ? 'Write Feedback' : 'No Revisions Left'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-space-grotesk font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Revision Details
                    </label>
                    <button
                      type="button"
                      disabled={isStandardizing || !feedback.trim()}
                      onClick={handleStandardizeFeedback}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {isStandardizing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{isStandardizing ? 'Đang chuẩn hóa…' : '✨ AI Chuẩn hóa yêu cầu'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Be specific about what needs to be changed, added, or removed..."
                    className="w-full p-4 bg-black/40 border border-amber-500/30 rounded-xl text-sm text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
