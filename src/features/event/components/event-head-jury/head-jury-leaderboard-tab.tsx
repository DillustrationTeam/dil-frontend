'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import type { CombinedScoreItem } from '../../types/jury.types';

interface HeadJuryLeaderboardTabProps {
  combinedScores: CombinedScoreItem[];
}

export function HeadJuryLeaderboardTab({ combinedScores }: HeadJuryLeaderboardTabProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <section className="glass-container p-6 rounded-2xl space-y-4">
      <h2 className="text-xl font-bold font-sora text-[#241F1A]">
        {isVie ? 'Bảng điểm & Xếp hạng tổng hợp' : 'Combined Leaderboard & Scores'}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[650px] text-xs">
          <thead>
            <tr className="border-b border-[#221E1A]/10 text-[#746A5F] uppercase font-semibold text-[10px]">
              <th className="py-3 px-3">{isVie ? 'Hạng' : 'Rank'}</th>
              <th className="py-3 px-3">{isVie ? 'Tác phẩm' : 'Contest Entry'}</th>
              <th className="py-3 px-3">{isVie ? 'Điểm TB Giám khảo' : 'Jury Average'}</th>
              <th className="py-3 px-3">{isVie ? 'Điểm Trưởng ban GK' : 'Head Jury Score'}</th>
              <th className="py-3 px-3">{isVie ? 'Độ lệch' : 'Variance'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-[#c8c6cf]">
            {combinedScores.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#746A5F]">
                  {isVie
                    ? 'Chưa có bảng điểm tổng hợp. Bảng xếp hạng sẽ tự động cập nhật khi các thành viên giám khảo hoàn tất đánh giá.'
                    : 'No combined scores available yet. Leaderboard will be populated as jury evaluations are completed.'}
                </td>
              </tr>
            ) : (
              combinedScores.map((row) => (
              <tr key={row.submissionId} className="hover:bg-[#FFFCF6]">
                <td className="py-3 px-3 font-mono font-bold text-[#8A6A1F]">#{row.rank}</td>
                <td className="py-3 px-3 font-semibold text-[#241F1A]">{row.title}</td>
                <td className="py-3 px-3 font-mono">{row.juryScoreAvg}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#B24A26]">{row.headJuryScore}</td>
                <td className="py-3 px-3 font-mono text-[#8A6A1F]">{row.deviationPercent}%</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
