'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface LeaderboardHeaderSorterProps {
  wallSort: 'votes' | 'score';
  setWallSort: (sort: 'votes' | 'score') => void;
}

export function LeaderboardHeaderSorter({ wallSort, setWallSort }: LeaderboardHeaderSorterProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221E1A]/10 pb-6">
      <div>
        <div className="flex items-center gap-2">
          <Crown size={22} className="text-[#8A6A1F]" />
          <h2 className="font-h1 text-xl sm:text-2xl font-bold text-[#241F1A]">
            {isVie ? 'Bảng Vinh Danh' : 'The Wall Of Fame'}
          </h2>
        </div>
        <p className="text-xs text-[#6E6459] mt-1">
          {isVie
            ? 'Vinh danh các quán quân xuất sắc, người chiến thắng và các tác phẩm xếp hạng cao nhất của cuộc thi'
            : 'Honoring the grand champions, laureates, and highest-ranking creations of this competition'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#6E6459]">
          {isVie ? 'Xếp hạng theo:' : 'Rank by:'}
        </span>
        <button
          type="button"
          onClick={() => setWallSort('votes')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            wallSort === 'votes'
              ? 'bg-[#8A6A1F]/10 text-[#241F1A] shadow-md'
              : 'bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8]'
          }`}
        >
          {isVie ? 'Bình chọn cộng đồng' : 'Community Votes'}
        </button>
        <button
          type="button"
          onClick={() => setWallSort('score')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            wallSort === 'score'
              ? 'bg-[#8A6A1F]/10 text-[#241F1A] shadow-md'
              : 'bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8]'
          }`}
        >
          {isVie ? 'Điểm Ban giám khảo' : 'Jury Score'}
        </button>
      </div>
    </div>
  );
}
