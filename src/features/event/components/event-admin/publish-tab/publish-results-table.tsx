'use client';

import React from 'react';
import { Trophy, Award, HeartHandshake } from 'lucide-react';

export interface FinalResultItem {
  award: string;
  artworkTitle: string;
  winnerName: string;
  scoreOrVotes: string;
  badgeType: 'gold' | 'silver' | 'bronze';
}

const defaultResults: FinalResultItem[] = [
  {
    award: 'Grand Prize',
    artworkTitle: 'Cloud Realm of Memories',
    winnerName: 'Linh Chi',
    scoreOrVotes: '96.8',
    badgeType: 'gold',
  },
  {
    award: 'Jury Choice',
    artworkTitle: 'Night Garden',
    winnerName: 'An Nhien',
    scoreOrVotes: '94.5',
    badgeType: 'silver',
  },
  {
    award: 'Community Choice',
    artworkTitle: 'Azure Stream',
    winnerName: 'Minh Khoa',
    scoreOrVotes: '2,418 votes',
    badgeType: 'bronze',
  },
];

export function PublishResultsTable() {
  return (
    <div className="glass-container rounded-2xl p-6">
      <h2 className="text-xl font-bold font-h1 text-on-surface">Final Contest Results</h2>
      <p className="text-sm text-outline mt-1 mb-4">
        Only available after Head Jury formal sign-off.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-bold text-outline uppercase tracking-wider">
              <th className="pb-3 px-3">Award Category</th>
              <th className="pb-3 px-3">Artwork Title</th>
              <th className="pb-3 px-3">Winner / Recipient</th>
              <th className="pb-3 px-3 text-right">Final Score / Votes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {defaultResults.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.badgeType === 'gold'
                        ? 'bg-amber-950/70 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                        : item.badgeType === 'silver'
                        ? 'bg-slate-900 border border-slate-400/40 text-slate-200'
                        : 'bg-amber-950/40 border border-amber-600/30 text-amber-400'
                    }`}
                  >
                    {item.badgeType === 'gold' ? (
                      <Trophy className="w-3.5 h-3.5" />
                    ) : item.badgeType === 'silver' ? (
                      <Award className="w-3.5 h-3.5" />
                    ) : (
                      <HeartHandshake className="w-3.5 h-3.5" />
                    )}
                    {item.award}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-semibold text-on-surface">
                  {item.artworkTitle}
                </td>
                <td className="py-3.5 px-3 text-on-surface-variant font-medium">
                  {item.winnerName}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-brand-periwinkle">
                  {item.scoreOrVotes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
