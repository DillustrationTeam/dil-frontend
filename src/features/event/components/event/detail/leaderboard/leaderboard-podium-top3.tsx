'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Medal } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
      {/* #2 Silver Laureate */}
      {podiumTop3[1] && (
        <div className="order-2 md:order-1 rounded-3xl border border-[#221E1A]/12 bg-gradient-to-b from-[#E5D8C2] via-[#FFFCF6] to-[#FFFCF6] p-6 text-center shadow-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/12 bg-[#E5D8C2] px-3.5 py-1 text-xs font-bold text-[#6E6459]">
            <Medal size={14} className="text-[#746A5F]" />
            <span>{isVie ? '#2 Giải Nhì Bạc' : '#2 Silver Laureate'}</span>
          </div>

          <Link
            href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] cursor-pointer"
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
                {isVie ? 'Xem tác phẩm' : 'Artwork Preview'}
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[1].artworkId ? `/artworks/${podiumTop3[1].artworkId}` : '#'}
              className="font-h1 text-base font-bold text-[#241F1A] line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
            >
              {podiumTop3[1].title}
            </Link>
            <p className="text-xs text-[#6E6459] mt-0.5">@{podiumTop3[1].submitterName}</p>
          </div>

          <div className="border-t border-[#221E1A]/10 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-brand-periwinkle block text-[10px] font-bold uppercase tracking-wider">
                    {isVie ? 'Điểm Giám khảo' : 'Jury Score'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#241F1A] text-base sm:text-lg">
                    {formatScore(podiumTop3[1].score ?? podiumTop3[1].judgeScore) ?? (isVie ? 'Chờ chấm' : 'Pending')}
                  </span>
                </div>
                <div>
                  <span className="text-[#6E6459] block text-[10px] uppercase">
                    {isVie ? 'Lượt bình chọn' : 'Votes'}
                  </span>
                  <span className="font-bold text-[#746A5F] text-sm">
                    {podiumTop3[1].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[#6E6459] block text-[10px] uppercase font-bold tracking-wider">
                    {isVie ? 'Tổng bình chọn' : 'Total Votes'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#241F1A] text-base sm:text-lg">
                    {podiumTop3[1].voteCount}
                  </span>
                </div>
                {(podiumTop3[1].score || podiumTop3[1].judgeScore) && (
                  <div>
                    <span className="text-[#6E6459] block text-[10px] uppercase">
                      {isVie ? 'Điểm GK' : 'Jury'}
                    </span>
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
        <div className="order-1 md:order-2 rounded-3xl border-2 border-[#8A6A1F]/30 bg-gradient-to-b from-[#8A6A1F] via-[#FFFCF6] to-[#FFFCF6] p-7 text-center shadow-[0_0_50px_rgba(251,191,36,0.25)] space-y-4 md:-translate-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8A6A1F]/30 bg-[#8A6A1F]/10 px-4 py-1.5 text-xs font-extrabold text-[#241F1A] shadow-lg">
            <Crown size={15} />
            <span>{isVie ? '#1 QUÁN QUÂN GRAND PRIX' : '#1 GRAND PRIX CHAMPION'}</span>
          </div>

          <Link
            href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border-2 border-[#8A6A1F]/40 bg-[#F0E7D8] shadow-inner cursor-pointer"
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
                {isVie ? 'Xem tác phẩm' : 'Artwork Preview'}
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[0].artworkId ? `/artworks/${podiumTop3[0].artworkId}` : '#'}
              className="font-h1 text-lg font-extrabold text-[#241F1A] line-clamp-1 hover:text-[#8A6A1F] transition cursor-pointer"
            >
              {podiumTop3[0].title}
            </Link>
            <p className="text-xs text-[#8A6A1F] font-semibold mt-0.5">@{podiumTop3[0].submitterName}</p>
          </div>

          <div className="border-t border-[#8A6A1F]/30 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-[#8A6A1F] block text-[10px] uppercase font-bold tracking-wider">
                    {isVie ? 'Điểm Giám khảo' : 'Jury Rating'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#8A6A1F] text-xl sm:text-2xl">
                    {formatScore(podiumTop3[0].score ?? podiumTop3[0].judgeScore) ?? (isVie ? 'Chờ chấm' : 'Pending')}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A6A1F] block text-[10px] uppercase font-bold">
                    {isVie ? 'Tổng bình chọn' : 'Total Votes'}
                  </span>
                  <span className="font-h1 font-bold text-[#241F1A] text-base sm:text-lg">
                    {podiumTop3[0].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[#8A6A1F] block text-[10px] uppercase font-bold tracking-wider">
                    {isVie ? 'Tổng bình chọn' : 'Total Votes'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#8A6A1F] text-xl sm:text-2xl">
                    {podiumTop3[0].voteCount}
                  </span>
                </div>
                {(podiumTop3[0].score || podiumTop3[0].judgeScore) && (
                  <div>
                    <span className="text-[#8A6A1F] block text-[10px] uppercase font-bold">
                      {isVie ? 'Điểm GK' : 'Jury Rating'}
                    </span>
                    <span className="font-h1 font-extrabold text-[#241F1A] text-lg">
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
        <div className="order-3 rounded-3xl border border-[#8A6A1F]/40 bg-gradient-to-b from-[#8A6A1F] via-[#FFFCF6] to-[#FFFCF6] p-6 text-center shadow-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 px-3.5 py-1 text-xs font-bold text-[#8A6A1F]">
            <Medal size={14} className="text-[#8A6A1F]" />
            <span>{isVie ? '#3 Giải Ba Đồng' : '#3 Bronze Laureate'}</span>
          </div>

          <Link
            href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
            className="group/img relative aspect-video w-full block overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] cursor-pointer"
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
                {isVie ? 'Xem tác phẩm' : 'Artwork Preview'}
              </div>
            )}
          </Link>

          <div>
            <Link
              href={podiumTop3[2].artworkId ? `/artworks/${podiumTop3[2].artworkId}` : '#'}
              className="font-h1 text-base font-bold text-[#241F1A] line-clamp-1 hover:text-brand-periwinkle transition cursor-pointer"
            >
              {podiumTop3[2].title}
            </Link>
            <p className="text-xs text-[#6E6459] mt-0.5">@{podiumTop3[2].submitterName}</p>
          </div>

          <div className="border-t border-[#221E1A]/10 pt-3 flex items-center justify-around text-xs">
            {wallSort === 'score' ? (
              <>
                <div>
                  <span className="text-[#8A6A1F] block text-[10px] font-bold uppercase tracking-wider">
                    {isVie ? 'Điểm Giám khảo' : 'Jury Score'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#241F1A] text-base sm:text-lg">
                    {formatScore(podiumTop3[2].score ?? podiumTop3[2].judgeScore) ?? (isVie ? 'Chờ chấm' : 'Pending')}
                  </span>
                </div>
                <div>
                  <span className="text-[#6E6459] block text-[10px] uppercase">
                    {isVie ? 'Lượt bình chọn' : 'Votes'}
                  </span>
                  <span className="font-semibold text-[#746A5F] text-xs">
                    {podiumTop3[2].voteCount}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[#6E6459] block text-[10px] uppercase font-bold tracking-wider">
                    {isVie ? 'Tổng bình chọn' : 'Total Votes'}
                  </span>
                  <span className="font-h1 font-extrabold text-[#241F1A] text-base sm:text-lg">
                    {podiumTop3[2].voteCount}
                  </span>
                </div>
                {(podiumTop3[2].score || podiumTop3[2].judgeScore) && (
                  <div>
                    <span className="text-[#6E6459] block text-[10px] uppercase">
                      {isVie ? 'Điểm GK' : 'Jury'}
                    </span>
                    <span className="font-bold text-[#8A6A1F] text-sm">
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
