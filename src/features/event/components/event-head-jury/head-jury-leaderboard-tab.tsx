'use client';

import React from 'react';
import type { CombinedScoreItem } from '../../types/jury.types';

interface HeadJuryLeaderboardTabProps {
  combinedScores: CombinedScoreItem[];
}

export function HeadJuryLeaderboardTab({ combinedScores }: HeadJuryLeaderboardTabProps) {
  return (
    <section className="p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-4">
      <h2 className="text-xl font-bold font-sora text-white">Combined Leaderboard & Scores</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[650px] text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[#858694] uppercase font-semibold text-[10px]">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Contest Entry</th>
              <th className="py-3 px-3">Jury Average</th>
              <th className="py-3 px-3">Head Jury Score</th>
              <th className="py-3 px-3">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[#c8c6cf]">
            {combinedScores.map((row) => (
              <tr key={row.submissionId} className="hover:bg-white/[0.02]">
                <td className="py-3 px-3 font-mono font-bold text-amber-300">#{row.rank}</td>
                <td className="py-3 px-3 font-semibold text-white">{row.title}</td>
                <td className="py-3 px-3 font-mono">{row.juryScoreAvg}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#A7ACD9]">{row.headJuryScore}</td>
                <td className="py-3 px-3 font-mono text-amber-400">{row.deviationPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
