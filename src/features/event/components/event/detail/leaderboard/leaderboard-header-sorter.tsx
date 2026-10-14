'use client';

import React from 'react';
import { Crown } from 'lucide-react';

interface LeaderboardHeaderSorterProps {
  wallSort: 'votes' | 'score';
  setWallSort: (sort: 'votes' | 'score') => void;
}

export function LeaderboardHeaderSorter({ wallSort, setWallSort }: LeaderboardHeaderSorterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <div className="flex items-center gap-2">
          <Crown size={22} className="text-amber-400" />
          <h2 className="font-h1 text-xl sm:text-2xl font-bold text-white">
            The Wall Of Fame
          </h2>
        </div>
        <p className="text-xs text-[#8A8FA9] mt-1">
          Honoring the grand champions, laureates, and highest-ranking creations of this competition
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8A8FA9]">Rank by:</span>
        <button
          type="button"
          onClick={() => setWallSort('votes')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            wallSort === 'votes'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
          }`}
        >
          Community Votes
        </button>
        <button
          type="button"
          onClick={() => setWallSort('score')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            wallSort === 'score'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
          }`}
        >
          Jury Score
        </button>
      </div>
    </div>
  );
}
