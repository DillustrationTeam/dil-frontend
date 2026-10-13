'use client';

import React from 'react';
import Link from 'next/link';
import { Medal } from 'lucide-react';
import type { EventLeaderboardItemDto } from '@/features/event/types/event.types';

interface LeaderboardHonorRollGridProps {
  restLeaderboard: EventLeaderboardItemDto[];
  wallSort: 'votes' | 'score';
  formatScore: (val?: number | null) => string | null;
}

export function LeaderboardHonorRollGrid({
  restLeaderboard,
  wallSort,
  formatScore,
}: LeaderboardHonorRollGridProps) {
  if (restLeaderboard.length === 0) return null;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="font-h1 text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Medal size={18} className="text-slate-400" />
          <span>Honor Roll Contenders</span>
        </h3>
        <span className="text-xs text-[#8A8FA9]">
          Ranks #{restLeaderboard[0]?.rank || 4} - #{restLeaderboard[restLeaderboard.length - 1]?.rank || (restLeaderboard.length + 3)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {restLeaderboard.map((item, idx) => {
          const artworkLink = item.artworkId ? `/artworks/${item.artworkId}` : '#';
          const scoreDisplay = formatScore(item.score ?? item.judgeScore);

          return (
            <article
              key={item.submissionId}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#161926] p-5 shadow-lg transition duration-200 hover:-translate-y-1 hover:border-brand-periwinkle/40 space-y-4"
            >
              <Link
                href={artworkLink}
                className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 group-hover:border-brand-periwinkle/30 transition cursor-pointer"
              >
                {item.artworkImageUrl || item.artworkThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.artworkImageUrl || item.artworkThumbnailUrl || ''}
                    alt={item.title}
                    className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-outline">
                    Artwork Preview
                  </div>
                )}

                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                  <span>#{item.rank || idx + 4}</span>
                </div>
              </Link>

              <div>
                <Link
                  href={artworkLink}
                  className="block font-h1 text-sm font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-[#8A8FA9] mt-0.5">@{item.submitterName}</p>
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                {wallSort === 'score' ? (
                  <>
                    <div>
                      <span className="text-brand-periwinkle block text-[10px] font-bold uppercase tracking-wider">
                        Jury Score
                      </span>
                      <span className="font-h1 font-extrabold text-white text-base">
                        {scoreDisplay ?? 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                      <span className="text-xs text-[#A7ACD9] font-medium">
                        {item.voteCount} votes
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                        Votes
                      </span>
                      <span className="font-h1 font-extrabold text-brand-periwinkle text-base">
                        {item.voteCount}
                      </span>
                    </div>
                    {scoreDisplay && (
                      <div className="text-right">
                        <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                        <span className="text-xs text-slate-300 font-semibold">
                          {scoreDisplay}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
