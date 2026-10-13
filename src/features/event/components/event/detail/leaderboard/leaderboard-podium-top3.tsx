'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Medal } from 'lucide-react';
import type { EventLeaderboardItemDto } from '@/features/event/types/event.types';

interface LeaderboardPodiumTop3Props {
  podiumTop3: EventLeaderboardItemDto[];
  wallSort: 'votes' | 'score';
  formatScore: (val?: number | null) => string | null;
}

export function LeaderboardPodiumTop3({
  podiumTop3,
  wallSort,
  formatScore,
}: LeaderboardPodiumTop3Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
      {/* #2 Silver Laureate */}
      {podiumTop3[1] && (
        <div className="order-2 md:order-1 rounded-3xl border border-slate-300/30 bg-gradient-to-b from-slate-400/10 via-[#161926] to-[#161926] p-6 text-center shadow-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/40 bg-slate-300/20 px-3.5 py-1 text-xs font-bold text-slate-200">
            <Medal size={14} className="text-slate-300" />
            <span>#2 Silver Laureate</span>
          </div>

          <Link
            href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer"
          >
            {podiumTop3[1].artworkImageUrl || podiumTop3[1].artworkThumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={podiumTop3[1].artworkImageUrl || podiumTop3[1].artworkThumbnailUrl || ''}
                alt={podiumTop3[1].title}
                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-outline">
                Artwork Preview
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
              className="font-h1 text-base font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
            >
              {podiumTop3[1].title}
            </Link>
            <p className="text-xs text-[#8A8FA9] mt-0.5">@{podiumTop3[1].submitterName}</p>
          </div>

          <div className="border-t border-white/10 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-brand-periwinkle block text-[10px] font-bold uppercase tracking-wider">
                    Jury Score
                  </span>
                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                    {formatScore(podiumTop3[1].score ?? podiumTop3[1].judgeScore) ?? 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                  <span className="font-bold text-slate-300 text-sm">
                    {podiumTop3[1].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                    Total Votes
                  </span>
                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                    {podiumTop3[1].voteCount}
                  </span>
                </div>
                {(podiumTop3[1].score || podiumTop3[1].judgeScore) && (
                  <div>
                    <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                    <span className="font-bold text-brand-periwinkle text-sm">
                      {formatScore(podiumTop3[1].score ?? podiumTop3[1].judgeScore)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* #1 Champion Grand Prix (Gold) */}
      {podiumTop3[0] && (
        <div className="order-1 md:order-2 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 via-[#161926] to-[#161926] p-7 text-center shadow-[0_0_50px_rgba(251,191,36,0.25)] space-y-4 md:-translate-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg">
            <Crown size={15} />
            <span>#1 GRAND PRIX CHAMPION</span>
          </div>

          <Link
            href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-black/40 shadow-inner cursor-pointer"
          >
            {podiumTop3[0].artworkImageUrl || podiumTop3[0].artworkThumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={podiumTop3[0].artworkImageUrl || podiumTop3[0].artworkThumbnailUrl || ''}
                alt={podiumTop3[0].title}
                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-outline">
                Artwork Preview
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
              className="font-h1 text-lg font-extrabold text-white line-clamp-1 hover:text-amber-300 transition cursor-pointer"
            >
              {podiumTop3[0].title}
            </Link>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">@{podiumTop3[0].submitterName}</p>
          </div>

          <div className="border-t border-amber-400/20 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-amber-200/90 block text-[10px] uppercase font-bold tracking-wider">
                    Jury Rating
                  </span>
                  <span className="font-h1 font-extrabold text-amber-300 text-xl sm:text-2xl">
                    {formatScore(podiumTop3[0].score ?? podiumTop3[0].judgeScore) ?? 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-amber-200/80 block text-[10px] uppercase font-bold">
                    Total Votes
                  </span>
                  <span className="font-h1 font-bold text-white text-base sm:text-lg">
                    {podiumTop3[0].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-amber-200/80 block text-[10px] uppercase font-bold tracking-wider">
                    Total Votes
                  </span>
                  <span className="font-h1 font-extrabold text-amber-300 text-xl sm:text-2xl">
                    {podiumTop3[0].voteCount}
                  </span>
                </div>
                {(podiumTop3[0].score || podiumTop3[0].judgeScore) && (
                  <div>
                    <span className="text-amber-200/80 block text-[10px] uppercase font-bold">
                      Jury Rating
                    </span>
                    <span className="font-h1 font-extrabold text-white text-lg">
                      {formatScore(podiumTop3[0].score ?? podiumTop3[0].judgeScore)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* #3 Bronze Laureate */}
      {podiumTop3[2] && (
        <div className="order-3 rounded-3xl border border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-[#161926] to-[#161926] p-6 text-center shadow-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-700/30 px-3.5 py-1 text-xs font-bold text-amber-200">
            <Medal size={14} className="text-amber-500" />
            <span>#3 Bronze Laureate</span>
          </div>

          <Link
            href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer"
          >
            {podiumTop3[2].artworkImageUrl || podiumTop3[2].artworkThumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={podiumTop3[2].artworkImageUrl || podiumTop3[2].artworkThumbnailUrl || ''}
                alt={podiumTop3[2].title}
                className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-outline">
                Artwork Preview
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
              className="font-h1 text-base font-bold text-white line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
            >
              {podiumTop3[2].title}
            </Link>
            <p className="text-xs text-[#8A8FA9] mt-0.5">@{podiumTop3[2].submitterName}</p>
          </div>

          <div className="border-t border-white/10 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-amber-400 block text-[10px] font-bold uppercase tracking-wider">
                    Jury Score
                  </span>
                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                    {formatScore(podiumTop3[2].score ?? podiumTop3[2].judgeScore) ?? 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8FA9] block text-[10px] uppercase">Votes</span>
                  <span className="font-semibold text-slate-300 text-xs">
                    {podiumTop3[2].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[#8A8FA9] block text-[10px] uppercase font-bold tracking-wider">
                    Total Votes
                  </span>
                  <span className="font-h1 font-extrabold text-white text-base sm:text-lg">
                    {podiumTop3[2].voteCount}
                  </span>
                </div>
                {(podiumTop3[2].score || podiumTop3[2].judgeScore) && (
                  <div>
                    <span className="text-[#8A8FA9] block text-[10px] uppercase">Jury</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {formatScore(podiumTop3[2].score ?? podiumTop3[2].judgeScore)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
