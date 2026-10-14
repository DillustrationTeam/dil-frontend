'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface SubmissionModalHeaderProps {
  isEditing: boolean;
  eventTitle: string;
  onClose: () => void;
}

export function SubmissionModalHeader({ isEditing, eventTitle, onClose }: SubmissionModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-periwinkle/20 text-brand-periwinkle">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="font-h1 text-lg font-bold text-white">
            {isEditing ? 'Edit Contest Entry' : 'Submit Contest Artwork'}
          </h3>
          <p className="text-xs text-[#8A8FA9] line-clamp-1">{eventTitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  );
}
