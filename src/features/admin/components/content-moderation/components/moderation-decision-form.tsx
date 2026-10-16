'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  EyeOff,
  Bot,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { ModerationActionType } from '@/features/admin/types/moderation.types';
import { z } from 'zod';

const moderationSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'flag_ai']),
  note: z.string().max(1000, 'Audit note must be 1000 characters or fewer.'),
}).refine((value) => value.action !== 'reject' || value.note.trim().length > 0, {
  path: ['note'],
  message: 'Audit note is required when rejecting an artwork.',
});

interface ModerationDecisionFormProps {
  artworkId: string;
  isSubmitting: boolean;
  currentStatus: string;
  onExecuteDecision: (
    artworkId: string,
    action: ModerationActionType,
    moderationNote?: string
  ) => Promise<boolean>;
}

export function ModerationDecisionForm({
  artworkId,
  isSubmitting,
  onExecuteDecision,
}: ModerationDecisionFormProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationActionType>('approve');
  const [auditNote, setAuditNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isRejectAction = selectedAction === 'reject';
  const isNoteInvalid = isRejectAction && !auditNote.trim();

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const parsed = moderationSchema.safeParse({ action: selectedAction, note: auditNote });
    if (!parsed.success) {
      return;
    }
    setConfirming(true);
  };

  const handleExecute = async () => {
    const parsed = moderationSchema.safeParse({ action: selectedAction, note: auditNote });
    if (!parsed.success) {
      setConfirming(false);
      return;
    }

    const success = await onExecuteDecision(artworkId, parsed.data.action, parsed.data.note);
    if (success) {
      setAuditNote('');
      setTouched(false);
      setConfirming(false);
    }
  };

  const getActionButtonStyle = () => {
    switch (selectedAction) {
      case 'approve':
        return 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]';
      case 'reject':
        return 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]';
      case 'hide':
        return 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]';
      case 'flag_ai':
        return 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]';
      default:
        return 'bg-emerald-400 hover:bg-emerald-300 text-black';
    }
  };

  return (
    <form
      onSubmit={handleStartSubmit}
      className="space-y-4 text-xs pt-4 border-t border-white/10"
    >
      <div className="space-y-2">
        <label
          htmlFor="moderation-action-select"
          className="block font-bold text-white font-h1 text-xs"
        >
          Select Moderation Action
        </label>

        {/* Action Select Dropdown matching SCR-20 mockup */}
        <select
          id="moderation-action-select"
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value as ModerationActionType);
            setConfirming(false);
          }}
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-xs focus:border-red-400 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="approve" className="bg-[#161926] text-emerald-400 py-2">
            ✓ Approve & Publish to Public Feed
          </option>
          <option value="reject" className="bg-[#161926] text-red-400 py-2">
            ✕ Reject & Delete Artwork
          </option>
          <option value="hide" className="bg-[#161926] text-amber-400 py-2">
            👁️ Hide from Recommendations
          </option>
          <option value="flag_ai" className="bg-[#161926] text-purple-400 py-2">
            🤖 Flag as AI Generated (Tag.IsAiGenerated = true)
          </option>
        </select>
      </div>

      {/* Action Description Hint */}
      <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-start gap-2.5 text-[11px] text-[#8A8FA9]">
        {selectedAction === 'approve' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Artwork will be approved immediately and shown in marketplace discovery and artist profile.
            </span>
          </>
        )}
        {selectedAction === 'reject' && (
          <>
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300/90">
              Artwork will be permanently soft-deleted from public view due to community guideline violations. Audit note is required.
            </span>
          </>
        )}
        {selectedAction === 'hide' && (
          <>
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Artwork remains accessible directly via URL but excluded from algorithmic recommendations.
            </span>
          </>
        )}
        {selectedAction === 'flag_ai' && (
          <>
            <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              Artworks created by generative AI tools will have the AI badge enforced and search filtered accordingly.
            </span>
          </>
        )}
      </div>

      {/* Internal Moderation Audit Note */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="moderation-audit-note"
            className="block font-bold text-white text-xs font-h1 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#8A8FA9]" />
            <span>Internal Moderation Audit Note</span>
            {isRejectAction && <span className="text-red-400">*</span>}
          </label>
          <span className="text-[10px] text-[#8A8FA9] font-mono">
            {auditNote.length}/1000
          </span>
        </div>

        <textarea
          id="moderation-audit-note"
          rows={2}
          maxLength={1000}
          value={auditNote}
          onChange={(e) => setAuditNote(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. Verified image content meets community standards..."
          className={`w-full px-3.5 py-2.5 bg-black/40 rounded-xl border text-white text-xs placeholder:text-[#8A8FA9] focus:outline-none transition-colors font-body ${
            touched && isNoteInvalid
              ? 'border-red-500 bg-red-500/10'
              : 'border-white/10 focus:border-red-400'
          }`}
        />

        {touched && isNoteInvalid && (
          <p className="text-[10px] text-red-400 font-semibold">
            Audit note is required when rejecting an artwork to inform review logs.
          </p>
        )}
      </div>

      {/* Action Button & Confirmation Step */}
      {confirming ? (
        <div className="p-3.5 rounded-xl bg-black/60 border border-amber-400/30 space-y-3">
          <p className="text-white text-xs font-semibold">
            Xác nhận thực hiện hành động{' '}
            <strong className="text-amber-300 uppercase">{selectedAction}</strong> đối với tác phẩm này?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecute}
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${getActionButtonStyle()}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận thực thi</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getActionButtonStyle()}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Moderation Decision...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Execute Moderation Decision</span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
