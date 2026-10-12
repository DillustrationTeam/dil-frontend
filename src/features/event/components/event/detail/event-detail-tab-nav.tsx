'use client';

import React from 'react';
import { Palette, UserCheck, Crown, Lock } from 'lucide-react';

export type TabType = 'artworks' | 'my-submission' | 'wall-of-fame';

interface EventDetailTabNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  submissionsCount: number;
  hasMySubmission: boolean;
  isAnnounced: boolean;
  leaderboardCount: number;
  isAdmin?: boolean;
}

export function EventDetailTabNav({
  activeTab,
  setActiveTab,
  submissionsCount,
  hasMySubmission,
  isAnnounced,
  leaderboardCount,
  isAdmin = false,
}: EventDetailTabNavProps) {
  return (
    <div className="mt-12 flex border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto">
      <button
        type="button"
        onClick={() => setActiveTab('artworks')}
        className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
          activeTab === 'artworks'
            ? 'border-brand-periwinkle text-brand-periwinkle'
            : 'border-transparent text-[#8A8FA9] hover:text-white'
        }`}
      >
        <Palette size={17} />
        <span>Event Artworks ({submissionsCount})</span>
      </button>

      {!isAdmin && (
        <button
          type="button"
          onClick={() => setActiveTab('my-submission')}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'my-submission'
              ? 'border-brand-periwinkle text-brand-periwinkle'
              : 'border-transparent text-[#8A8FA9] hover:text-white'
          }`}
        >
          <UserCheck size={17} />
          <span>My Submission</span>
          {hasMySubmission && (
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => setActiveTab('wall-of-fame')}
        className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
          activeTab === 'wall-of-fame'
            ? isAnnounced
              ? 'border-amber-400 text-amber-300'
              : 'border-brand-periwinkle text-brand-periwinkle'
            : 'border-transparent text-[#8A8FA9] hover:text-white'
        }`}
      >
        {isAnnounced ? <Crown size={17} /> : <Lock size={15} className="text-[#8A8FA9]" />}
        <span>Wall Of Fame</span>
        {isAnnounced ? (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-300">
            Top {leaderboardCount}
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#A7ACD9]">
            Pending Announcement
          </span>
        )}
      </button>
    </div>
  );
}
