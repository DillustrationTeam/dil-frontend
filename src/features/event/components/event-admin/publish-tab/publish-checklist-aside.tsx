'use client';

import React from 'react';
import { CheckCircle2, Megaphone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export function PublishChecklistAside() {
  const checklistItems = [
    { label: 'Event Period Concluded', passed: true },
    { label: 'Head Jury Sign-Off Complete', passed: true },
    { label: 'Dispute Queue Resolved', passed: true },
    { label: 'Announcement Payload Verified', passed: true },
  ];

  const handlePublishDemo = () => {
    toast.success('Final contest results published to platform feed successfully!');
  };

  return (
    <aside className="glass-container rounded-2xl p-6 h-fit sticky top-24">
      <h2 className="text-xl font-bold font-h1 text-on-surface mb-4">Release Audit Checklist</h2>

      <div className="flex flex-col gap-2.5 mb-6">
        {checklistItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
          >
            <span className="text-sm font-medium text-on-surface-variant">{item.label}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passed
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePublishDemo}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center justify-center gap-2 mb-4"
      >
        <Megaphone className="w-4 h-4" />
        Publish Results Demo
      </button>

      <div className="p-3 rounded-xl border-l-4 border-brand-periwinkle bg-brand-periwinkle/10 text-on-surface-variant text-xs leading-relaxed flex items-start gap-2">
        <Lock className="w-4 h-4 text-brand-periwinkle shrink-0 mt-0.5" />
        <span>
          Moderators publish signed snapshots only. Scores or rankings cannot be altered once published.
        </span>
      </div>
    </aside>
  );
}
