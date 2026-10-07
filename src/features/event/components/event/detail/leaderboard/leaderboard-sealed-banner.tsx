'use client';

import React from 'react';
import { Lock, Clock, Palette, Trophy } from 'lucide-react';
import type { EventDetailDto } from '@/features/event/types/event.types';
import type { TabType } from '../event-detail-tab-nav';

interface LeaderboardSealedBannerProps {
  event: EventDetailDto;
  setActiveTab: (tab: TabType) => void;
  onOpenRulesModal: () => void;
}

export function LeaderboardSealedBanner({
  event,
  setActiveTab,
  onOpenRulesModal,
}: LeaderboardSealedBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#161926] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
      <div className="absolute -right-20 -top-20 size-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-60 rounded-full bg-brand-periwinkle/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
          <Lock size={36} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 mb-4">
          <Clock size={13} /> Official Results Sealed
        </span>

        <h3 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white">
          The Wall of Fame is Locked
        </h3>

        <p className="mt-3 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
          The Hall of Laureates, Grand Prix champions, and official jury marks will only open after the Announcement stage. Until then, final rankings and scores remain confidential.
        </p>

        {event.resultAnnouncementAt && (
          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs">
            <span className="text-[#8A8FA9]">Official Announcement scheduled for:</span>
            <span className="font-h1 font-bold text-white text-sm">
              {new Date(event.resultAnnouncementAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('artworks')}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-6 py-3 text-xs font-bold text-brand-navy shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Palette size={16} />
            <span>Explore Submissions & Vote</span>
          </button>
          <button
            type="button"
            onClick={onOpenRulesModal}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Trophy size={16} className="text-amber-400" />
            <span>View Prize Pool Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
