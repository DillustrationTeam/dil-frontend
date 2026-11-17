'use client';

import React from 'react';
import { Scale, Lock, UserCheck, Award, Check } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { ArbitrationCase } from '../../../types/jury.types';

interface ScoreArbitrationFormProps {
  decision: string;
  onDecisionChange: (d: string) => void;
  selectedCase: ArbitrationCase;
  tieBreakerWinnerId: string;
  onTieBreakerWinnerChange: (id: string) => void;
}

export function ScoreArbitrationForm({
  decision,
  onDecisionChange,
  selectedCase,
  tieBreakerWinnerId,
  onTieBreakerWinnerChange,
}: ScoreArbitrationFormProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-4">
      {/* 3 Action Buttons for Score Variance & Tie-Breaker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onDecisionChange('Maintain Current Median Score')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Maintain Current Median Score'
              ? 'border-[#A7ACD9] bg-[#A7ACD9]/20 text-white shadow-lg shadow-[#A7ACD9]/10'
              : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold">
              <Scale className="w-4 h-4 text-[#7FD5E8] shrink-0" />
              <span>{isVie ? 'Giữ điểm trung vị' : 'Maintain Median'}</span>
            </div>
            <p className="text-[11px] text-[#9695a1] leading-normal">
              {isVie
                ? 'Khóa điểm trung vị hiện tại. Loại trừ các điểm lệch bất thường.'
                : 'Lock current median score. Suppress outlier variance.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Maintain Current Median Score' ? 'text-[#7FD5E8]' : 'text-[#858694]'
            }`}
          >
            {decision === 'Maintain Current Median Score'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecisionChange('Request Panel Re-evaluation')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Request Panel Re-evaluation'
              ? 'border-amber-400 bg-amber-500/20 text-white shadow-lg shadow-amber-500/10'
              : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-amber-300">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isVie ? 'Yêu cầu chấm lại' : 'Request Re-evaluation'}</span>
            </div>
            <p className="text-[11px] text-[#9695a1] leading-normal">
              {isVie
                ? 'Mở khóa bảng điểm cho các giám khảo cụ thể để đánh giá lại.'
                : 'Unlock scoresheet for specific jury members to re-review.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Request Panel Re-evaluation' ? 'text-amber-300' : 'text-[#858694]'
            }`}
          >
            {decision === 'Request Panel Re-evaluation'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecisionChange('Cast Head Jury Tie-Breaker')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Cast Head Jury Tie-Breaker'
              ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-white shadow-lg shadow-brand-periwinkle/10'
              : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-brand-periwinkle">
              <Award className="w-4 h-4 text-brand-periwinkle shrink-0" />
              <span>{isVie ? 'Bỏ phiếu Tie-Breaker' : 'Tie-Breaker Vote'}</span>
            </div>
            <p className="text-[11px] text-[#9695a1] leading-normal">
              {isVie
                ? 'Bỏ phiếu quyết định của Trưởng ban GK đối với các bài đồng hạng.'
                : 'Cast decisive Head Jury vote for tied placements.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Cast Head Jury Tie-Breaker' ? 'text-brand-periwinkle' : 'text-[#858694]'
            }`}
          >
            {decision === 'Cast Head Jury Tie-Breaker'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>
      </div>

      {/* Sub-Panel 1: Maintain Median Score */}
      {decision === 'Maintain Current Median Score' && (
        <div className="p-4 rounded-xl border border-[#7FD5E8]/30 bg-[#7FD5E8]/10 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-sora font-bold text-white">
            <Lock className="w-4 h-4 text-[#7FD5E8]" />
            <span>{isVie ? 'Xác nhận khóa điểm trung vị' : 'Lock Median Score Confirmation'}</span>
          </div>
          <p className="text-[#c7c5cf] leading-relaxed">
            {isVie
              ? 'Việc giữ điểm trung vị của hội đồng sẽ tự động bỏ qua các điểm số ngoại lai bất thường mà không cần mở khóa bảng điểm.'
              : 'Maintaining the panel median score will automatically disregard extreme score outliers without unlocking scoresheets.'}
          </p>
        </div>
      )}

      {/* Sub-Panel 2: Request Panel Re-evaluation */}
      {decision === 'Request Panel Re-evaluation' && (
        <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-sora font-bold text-amber-300">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>
              {isVie ? 'Chọn giám khảo cần mở khóa để chấm lại' : 'Select Target Outlier Jury Members for Re-evaluation'}
            </span>
          </div>
          <p className="text-[#c7c5cf] leading-relaxed">
            {isVie
              ? 'Bảng điểm của các giám khảo được chọn sẽ được mở khóa trong 24 giờ kèm theo ghi chú yêu cầu kiểm toán:'
              : 'Scoresheets for the selected jury members will be unlocked for a 24-hour window with audit notes attached:'}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-amber-400" />
              <div className="flex-1 flex items-center justify-between">
                <span className="font-semibold">Thu Dinh Art (Jury #2)</span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {isVie ? 'Chấm 96/100 (+15.3% độ lệch)' : 'Rated 96/100 (+15.3% variance)'}
                </span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-amber-400" />
              <div className="flex-1 flex items-center justify-between">
                <span className="font-semibold">Tung Ho Illustration (Jury #3)</span>
                <span className="font-mono text-xs text-rose-400 font-bold">
                  {isVie ? 'Chấm 58/100 (-22.7% độ lệch)' : 'Rated 58/100 (-22.7% variance)'}
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Sub-Panel 3: Cast Head Jury Tie-Breaker */}
      {decision === 'Cast Head Jury Tie-Breaker' && (
        <div className="p-4 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-sora font-bold text-[#E4E1E5]">
              <Award className="w-4 h-4 text-brand-periwinkle" />
              <span>{isVie ? 'So sánh đối đầu trực tiếp' : 'Interactive Head-to-Head Comparison'}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-brand-periwinkle/20 text-brand-periwinkle text-[10px] font-bold">
              {isVie ? 'Đồng hạng 80.6 điểm' : 'Tied at 80.6 pts'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[#9695a1] uppercase font-semibold text-[10px]">
                  <th className="py-2 px-3">{isVie ? 'Tiêu chí / Ứng viên' : 'Metric / Candidate'}</th>
                  <th className="py-2 px-3 text-center border-l border-white/10 text-white font-bold">
                    {selectedCase.title} ({selectedCase.code})
                  </th>
                  <th className="py-2 px-3 text-center border-l border-white/10 text-white font-bold">
                    Skyline (#SUB-D89B)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-[#c7c5cf]">
                <tr>
                  <td className="py-2 px-3 text-[#9695a1] font-medium">
                    {isVie ? 'Điểm TB Hội đồng' : 'Panel Avg Score'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-[#A7ACD9] border-l border-white/10">
                    80.7 / 100
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-[#A7ACD9] border-l border-white/10">
                    80.0 / 100
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-[#9695a1] font-medium">
                    {isVie ? 'Điểm Trưởng ban GK' : 'Head Jury Score'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-amber-300 border-l border-white/10">
                    88.0 / 100
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-amber-300 border-l border-white/10">
                    85.0 / 100
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-[#9695a1] font-medium">
                    {isVie ? 'Độ bám sát chủ đề' : 'Theme Adherence'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-emerald-400 border-l border-white/10">
                    22 / 25
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-emerald-400 border-l border-white/10">
                    20 / 25
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-[#9695a1] font-medium">
                    {isVie ? 'Kỹ thuật & Bố cục' : 'Technical & Composition'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-brand-periwinkle border-l border-white/10">
                    31 / 35
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-brand-periwinkle border-l border-white/10">
                    30 / 35
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interactive Winner Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-[#E4E1E5] block">
              {isVie ? 'Tuyên bố ứng viên thắng Tie-Breaker:' : 'Declare Official Tie-Breaker Winner:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onTieBreakerWinnerChange(selectedCase.submissionId)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  tieBreakerWinnerId === selectedCase.submissionId
                    ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md shadow-emerald-500/10'
                    : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold">{selectedCase.title}</span>
                  <span className="block text-[10px] text-[#9695a1] font-mono">
                    {selectedCase.code}
                  </span>
                </div>
                {tieBreakerWinnerId === selectedCase.submissionId && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onTieBreakerWinnerChange('sub-d89b')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  tieBreakerWinnerId === 'sub-d89b'
                    ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md shadow-emerald-500/10'
                    : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold">Skyline</span>
                  <span className="block text-[10px] text-[#9695a1] font-mono">#SUB-D89B</span>
                </div>
                {tieBreakerWinnerId === 'sub-d89b' && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
