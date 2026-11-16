'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { EventDetailDto, EventLeaderboardItemDto } from '@/features/event/types/event.types';
import type { TabType } from './event-detail-tab-nav';

import { LeaderboardSealedBanner } from './leaderboard/leaderboard-sealed-banner';
import { LeaderboardHeaderSorter } from './leaderboard/leaderboard-header-sorter';
import { LeaderboardPodiumTop3 } from './leaderboard/leaderboard-podium-top3';
import { LeaderboardHonorRollGrid } from './leaderboard/leaderboard-honor-roll-grid';

interface EventTabLeaderboardProps {
  isAnnounced: boolean;
  event: EventDetailDto;
  setActiveTab: (tab: TabType) => void;
  onOpenRulesModal: () => void;
  wallSort: 'votes' | 'score';
  setWallSort: (sort: 'votes' | 'score') => void;
  leaderboard: EventLeaderboardItemDto[];
  podiumTop3: EventLeaderboardItemDto[];
  restLeaderboard: EventLeaderboardItemDto[];
  formatScore: (val?: number | null) => string | null;
}

export function EventTabLeaderboard({
  isAnnounced,
  event,
  setActiveTab,
  onOpenRulesModal,
  wallSort,
  setWallSort,
  leaderboard,
  podiumTop3,
  restLeaderboard,
  formatScore,
}: EventTabLeaderboardProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-10">
      {!isAnnounced ? (
        <LeaderboardSealedBanner
          event={event}
          setActiveTab={setActiveTab}
          onOpenRulesModal={onOpenRulesModal}
        />
      ) : (
        <>
          {/* Header & Sorter */}
          <LeaderboardHeaderSorter wallSort={wallSort} setWallSort={setWallSort} />

          {leaderboard.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center">
              <Trophy size={40} className="mx-auto text-amber-400/40 mb-3" />
              <h3 className="font-h1 text-lg font-bold text-white">
                {isVie ? 'Bảng vinh danh đang chờ đón các quán quân' : 'Wall of Fame Awaiting Champions'}
              </h3>
              <p className="mt-1 text-xs text-[#8A8FA9]">
                {isVie
                  ? 'Khi lượt bình chọn của cộng đồng và điểm chấm từ ban giám khảo được tổng hợp, các họa sĩ xuất sắc nhất sẽ được vinh danh tại đây.'
                  : 'As community votes and jury evaluations accumulate, the top artists will be immortalized here.'}
              </p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 */}
              <LeaderboardPodiumTop3
                podiumTop3={podiumTop3}
                wallSort={wallSort}
                formatScore={formatScore}
              />

              {/* Honor Roll List for #4 and above */}
              <LeaderboardHonorRollGrid
                restLeaderboard={restLeaderboard}
                wallSort={wallSort}
                formatScore={formatScore}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
