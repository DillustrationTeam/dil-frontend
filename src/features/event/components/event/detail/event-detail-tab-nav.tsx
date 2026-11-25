'use client';

import React from 'react';
import { Palette, UserCheck, Crown, Lock } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="mt-10 overflow-x-auto">
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'artworks'}
          onClick={() => setActiveTab('artworks')}
          className="tab cursor-pointer"
        >
          <Palette size={16} aria-hidden />
          <span>{isVie ? 'Tác phẩm dự thi' : 'Event artworks'}</span>
          <span className="tag">{submissionsCount}</span>
        </button>

        {!isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'my-submission'}
            onClick={() => setActiveTab('my-submission')}
            className="tab cursor-pointer"
          >
            <UserCheck size={16} aria-hidden />
            <span>{isVie ? 'Bài của tôi' : 'My submission'}</span>
            {hasMySubmission && <span className="dot" aria-hidden />}
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'wall-of-fame'}
          onClick={() => setActiveTab('wall-of-fame')}
          className="tab cursor-pointer"
        >
          {isAnnounced ? <Crown size={16} aria-hidden /> : <Lock size={14} aria-hidden />}
          <span>{isVie ? 'Bảng vinh danh' : 'Wall of fame'}</span>
          {isAnnounced ? (
            <span className="tag">Top {leaderboardCount}</span>
          ) : (
            <span className="badge badge--done">{isVie ? 'Chờ công bố' : 'Pending'}</span>
          )}
        </button>
      </div>
    </div>
  );
}
