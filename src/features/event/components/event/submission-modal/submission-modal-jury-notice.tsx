'use client';

import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface SubmissionModalJuryNoticeProps {
  onClose: () => void;
  eventTitle: string;
}

export function SubmissionModalJuryNotice({ onClose, eventTitle }: SubmissionModalJuryNoticeProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-[#161926] p-8 text-center shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8A8FA9] hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h3 className="font-h1 text-xl font-bold text-white">Submission Not Permitted</h3>
        <p className="text-sm text-[#A7ACD9] leading-relaxed">
          You are currently serving as a member of the <strong className="text-white">Jury Panel (Head Jury / Jury)</strong> for <strong className="text-white">{eventTitle}</strong>. Dillustration competition policies strictly prohibit jury panel members from submitting entries to ensure complete impartiality.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-brand-periwinkle text-brand-navy font-bold text-xs hover:brightness-110 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
