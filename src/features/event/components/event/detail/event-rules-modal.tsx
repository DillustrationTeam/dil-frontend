'use client';

import React from 'react';
import { Trophy, AlertCircle, X } from 'lucide-react';
import type { EventDetailDto } from '@/features/event/types/event.types';

interface EventRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetailDto;
}

export function EventRulesModal({ isOpen, onClose, event }: EventRulesModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
            onClick={onClose}
            className="rounded-xl bg-brand-periwinkle px-6 py-2.5 text-xs font-bold text-brand-navy cursor-pointer hover:brightness-110 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
