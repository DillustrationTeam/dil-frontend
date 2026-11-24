'use client';

import React from 'react';
import { Check, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { WinnerApprovalItem } from '../../types/jury.types';

interface HeadJuryApproveTabProps {
  finalWinnersList: WinnerApprovalItem[];
  isAwardAllocationsConfirmed: boolean;
  isContestResultsApproved: boolean;
  allJuryCompleted?: boolean;
  disputesResolved?: boolean;
  handleApproveAwardAllocations: () => void;
  handleApproveContestResults: () => void;
}

export function HeadJuryApproveTab({
  finalWinnersList,
  isAwardAllocationsConfirmed,
  isContestResultsApproved,
  allJuryCompleted = false,
  disputesResolved = false,
  handleApproveAwardAllocations,
  handleApproveContestResults,
}: HeadJuryApproveTabProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Final Results Table */}
      <div className="glass-container p-6 rounded-2xl space-y-5 lg:col-span-7 xl:col-span-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold font-sora text-[#241F1A]">
              {isVie ? 'Kết quả Cuộc thi Chung cuộc' : 'Final Contest Results'}
            </h2>
            <p className="text-xs text-[#746A5F] mt-0.5">
              {isVie
                ? 'Bảng xếp hạng chính thức và cơ cấu phân bổ giải thưởng của cuộc thi.'
                : 'Official ranking and award allocations for this contest.'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isAwardAllocationsConfirmed
                ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
            }`}
          >
            {isAwardAllocationsConfirmed
              ? (isVie ? 'Đã xác nhận phân bổ giải thưởng' : 'Award Allocations Confirmed')
              : (isVie ? 'Chờ duyệt giải thưởng' : 'Pending Award Approval')}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#221E1A]/10">
          <table className="w-full border-collapse text-left min-w-[500px] text-xs">
            <thead>
              <tr className="border-b border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] uppercase font-semibold text-[10px]">
                <th className="py-3 px-3.5">{isVie ? 'Hạng mục Giải thưởng' : 'Award Category'}</th>
                <th className="py-3 px-3.5">{isVie ? 'Tác phẩm đạt giải' : 'Winning Entry'}</th>
                <th className="py-3 px-3.5">{isVie ? 'Điểm / Bình chọn' : 'Score / Votes'}</th>
                <th className="py-3 px-3.5 text-right">{isVie ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221E1A]/10 text-[#c8c6cf]">
              {finalWinnersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#746A5F]">
                    {isVie
                      ? 'Chưa có bài thi nào được chấm. Phân bổ giải thưởng sẽ hiển thị sau khi các bài thi được đánh giá.'
                      : 'No graded submissions yet. Award allocations will appear after submissions are evaluated.'}
                  </td>
                </tr>
              ) : (
                finalWinnersList.map((w, idx) => (
                <tr key={idx} className="hover:bg-[#FFFCF6] transition-colors">
                  <td className="py-3 px-3.5 font-sora font-bold text-[#8A6A1F]">{w.awardName}</td>
                  <td className="py-3 px-3.5 font-semibold text-[#241F1A]">
                    <span className="block">{w.title}</span>
                    <span className="block text-[10px] text-[#746A5F] font-mono mt-0.5">{w.code}</span>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[#B24A26] font-bold">{w.scoreOrVotes}</td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAwardAllocationsConfirmed
                          ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                          : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
                      }`}
                    >
                      {isAwardAllocationsConfirmed ? (
                        <>
                          <Check className="w-3 h-3" />
                          {isVie ? 'Chính thức' : 'Finalized'}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-[#8A6A1F]" />
                          {isVie ? 'Chờ duyệt' : 'Pending'}
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Action Bar under Final Results Table */}
        <div className="pt-4 border-t border-[#221E1A]/10 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-[#746A5F]">
            {isAwardAllocationsConfirmed
              ? (isVie
                  ? '✓ Phân bổ giải thưởng đã được xác nhận và khóa chính thức.'
                  : '✓ Award allocations confirmed and officially locked.')
              : (isVie
                  ? 'Nhấp Phê duyệt kết quả để xác nhận cơ cấu giải thưởng.'
                  : 'Click Approve Results to confirm award allocations.')}
          </span>
          <button
            type="button"
            onClick={handleApproveAwardAllocations}
            disabled={isAwardAllocationsConfirmed}
            className="commission-primary px-5 py-2.5 rounded-xl font-sora text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isAwardAllocationsConfirmed
                ? (isVie ? 'Đã xác nhận giải thưởng' : 'Award Allocations Confirmed')
                : (isVie ? 'Phê duyệt giải thưởng' : 'Approve Results')}
            </span>
          </button>
        </div>
      </div>

      {/* Checklist Sidebar */}
      <aside className="glass-container p-6 rounded-2xl space-y-5 lg:col-span-5 xl:col-span-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold font-sora text-[#241F1A]">
              {isVie ? 'Danh mục Kiểm tra Phê duyệt' : 'Approval Checklist'}
            </h2>
            <p className="text-xs text-[#746A5F] mt-0.5">
              {isVie
                ? 'Điều kiện bắt buộc trước khi ký duyệt kết quả.'
                : 'Mandatory prerequisites before final sign-off.'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isContestResultsApproved
                ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                : disputesResolved && isAwardAllocationsConfirmed && allJuryCompleted
                ? 'bg-[#2C6A86]/15 border-[#2C6A86]/40 text-[#2C6A86]'
                : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
            }`}
          >
            {isContestResultsApproved
              ? (isVie ? 'Đã phê duyệt' : 'Approved')
              : disputesResolved && isAwardAllocationsConfirmed && allJuryCompleted
              ? (isVie ? 'Đủ điều kiện' : 'Ready to Sign')
              : (isVie ? 'Chờ hoàn tất' : 'Pending')}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6]">
            <span className="text-[#241F1A] font-medium">
              {isVie ? 'Toàn bộ Giám khảo đã hoàn tất chấm' : 'All Jury Evaluations Completed'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                allJuryCompleted
                  ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                  : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
              }`}
            >
              {allJuryCompleted
                ? (isVie ? 'Hoàn thành' : 'Completed')
                : (isVie ? 'Chờ hoàn tất' : 'In Progress')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6]">
            <span className="text-[#241F1A] font-medium">
              {isVie ? 'Tranh chấp & Tái thẩm định đã xử lý' : 'Disputes & Arbitrations Resolved'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                disputesResolved
                  ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                  : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
              }`}
            >
              {disputesResolved
                ? (isVie ? 'Hoàn thành' : 'Completed')
                : (isVie ? 'Chờ xử lý' : 'Pending')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6]">
            <span className="text-[#241F1A] font-medium">
              {isVie ? 'Phân bổ giải thưởng đã xác nhận' : 'Award Allocations Confirmed'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                isAwardAllocationsConfirmed
                  ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                  : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
              }`}
            >
              {isAwardAllocationsConfirmed ? (isVie ? 'Hoàn thành' : 'Completed') : (isVie ? 'Chờ duyệt' : 'Pending')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApproveContestResults}
          disabled={isContestResultsApproved || !disputesResolved || !isAwardAllocationsConfirmed}
          className="commission-primary w-full py-2.5 rounded-xl font-sora text-xs shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isContestResultsApproved
            ? (isVie ? 'Kết quả cuộc thi đã được phê duyệt' : 'Contest Results Approved')
            : (isVie ? 'Ký duyệt Kết quả Cuộc thi' : 'Approve Contest Results')}
        </button>

        {!disputesResolved && !isContestResultsApproved && (
          <p className="text-[11px] text-[#8A6A1F] text-center leading-normal">
            {isVie
              ? '⚠️ Vui lòng giải quyết toàn bộ các vụ Tái thẩm định & Tranh chấp trước khi ký duyệt.'
              : '⚠️ Please resolve all arbitration cases and disputes before signing off.'}
          </p>
        )}

        {!isAwardAllocationsConfirmed && disputesResolved && !isContestResultsApproved && (
          <p className="text-[11px] text-[#8A6A1F] text-center leading-normal">
            {isVie
              ? '⚠️ Vui lòng nhấn "Phê duyệt giải thưởng" ở bảng bên trái trước khi ký duyệt chính thức.'
              : '⚠️ Please click "Approve Results" on the left table before official sign-off.'}
          </p>
        )}

        <div className="p-3 rounded-xl border-l-4 border-[#B24A26] bg-[#B24A26]/10 text-xs text-[#6E6459] leading-relaxed">
          {isVie
            ? 'Việc ký duyệt sẽ tạo bản chụp dữ liệu kết quả bất biến và chuyển quyền công bố giải thưởng cho Ban Kiểm duyệt / Quản trị viên.'
            : 'Approval generates an immutable snapshot of contest results and transfers release permissions to Moderators.'}
        </div>
      </aside>
    </section>
  );
}
