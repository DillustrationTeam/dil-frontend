'use client';

import React from 'react';
import { Trophy, Award, Medal, HeartHandshake, Check, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface WinnerApprovalItem {
  awardName: string;
  submissionId: string;
  title: string;
  code?: string;
  submitterName?: string;
  artworkImageUrl?: string;
  scoreOrVotes: string;
  status: string;
  badgeType: 'gold' | 'silver' | 'bronze' | 'community' | 'standard';
}

interface PublishResultsTableProps {
  eventTitle: string;
  finalWinnersList: WinnerApprovalItem[];
  isAwardAllocationsConfirmed: boolean;
  isContestResultsPublished: boolean;
  handleApproveAwardAllocations: () => void;
  isLoading?: boolean;
}

export function PublishResultsTable({
  eventTitle,
  finalWinnersList,
  isAwardAllocationsConfirmed,
  isContestResultsPublished,
  handleApproveAwardAllocations,
  isLoading = false,
}: PublishResultsTableProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="glass-container p-6 rounded-2xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold font-sora text-[#241F1A]">
            {isVie ? 'Kết quả chung cuộc' : 'Final Contest Results'}
          </h2>
          <p className="text-xs text-[#746A5F] mt-0.5">
            {isVie ? (
              <>Bảng xếp hạng và giải thưởng chính thức cho <span className="text-[#241F1A] font-medium">{eventTitle}</span>.</>
            ) : (
              <>Official ranking and award allocations for <span className="text-[#241F1A] font-medium">{eventTitle}</span>.</>
            )}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isContestResultsPublished
              ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
              : isAwardAllocationsConfirmed
              ? 'bg-brand-periwinkle/15 border-brand-periwinkle/30 text-brand-periwinkle'
              : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
          }`}
        >
          {isContestResultsPublished
            ? (isVie ? 'Kết quả đã công bố chính thức' : 'Results Officially Published')
            : isAwardAllocationsConfirmed
            ? (isVie ? 'Đã xác nhận phân bổ giải thưởng' : 'Award Allocations Confirmed')
            : (isVie ? 'Chờ phê duyệt giải thưởng' : 'Pending Award Approval')}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#221E1A]/10">
        <table className="w-full border-collapse text-left min-w-[550px] text-xs">
          <thead>
            <tr className="border-b border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] uppercase font-semibold text-[10px]">
              <th className="py-3 px-3.5">{isVie ? 'Hạng mục giải thưởng' : 'Award Category'}</th>
              <th className="py-3 px-3.5">{isVie ? 'Tác phẩm đạt giải' : 'Winning Entry'}</th>
              <th className="py-3 px-3.5">{isVie ? 'Điểm / Bình chọn' : 'Score / Votes'}</th>
              <th className="py-3 px-3.5 text-right">{isVie ? 'Trạng thái' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-[#c8c6cf]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#746A5F]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-brand-periwinkle border-t-transparent" />
                    <span>{isVie ? 'Đang tải kết quả chung cuộc...' : 'Loading final contest results from backend...'}</span>
                  </div>
                </td>
              </tr>
            ) : finalWinnersList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#746A5F]">
                  {isVie ? 'Chưa có bài thi hoặc dữ liệu bảng xếp hạng nào cho cuộc thi này.' : 'No submissions or leaderboard data found for this event yet.'}
                </td>
              </tr>
            ) : (
              finalWinnersList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FFFCF6] transition-colors">
                  <td className="py-3.5 px-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-sora ${
                        item.badgeType === 'gold'
                          ? 'bg-[#8A6A1F]/20 border border-[#8A6A1F]/40 text-[#8A6A1F] shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                          : item.badgeType === 'silver'
                          ? 'bg-[#F0E7D8] border border-[#221E1A]/12 text-[#6E6459]'
                          : item.badgeType === 'bronze'
                          ? 'bg-[#8A6A1F]/20 border border-[#8A6A1F]/40 text-[#8A6A1F]'
                          : item.badgeType === 'community'
                          ? 'bg-[#2C6A86]/20 border border-[#2C6A86]/40 text-[#2C6A86]'
                          : 'bg-[#FFFCF6] border border-[#221E1A]/10 text-[#c8c6cf]'
                      }`}
                    >
                      {item.badgeType === 'gold' ? (
                        <Trophy className="w-3.5 h-3.5 text-[#8A6A1F]" />
                      ) : item.badgeType === 'silver' ? (
                        <Award className="w-3.5 h-3.5 text-[#746A5F]" />
                      ) : item.badgeType === 'bronze' ? (
                        <Medal className="w-3.5 h-3.5 text-[#8A6A1F]" />
                      ) : item.badgeType === 'community' ? (
                        <HeartHandshake className="w-3.5 h-3.5 text-[#2C6A86]" />
                      ) : (
                        <Trophy className="w-3.5 h-3.5 text-[#B24A26]" />
                      )}
                      <span>{item.awardName}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      {item.artworkImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.artworkImageUrl}
                          alt={item.title}
                          className="size-9 rounded-lg object-cover border border-[#221E1A]/10 shrink-0"
                        />
                      )}
                      <div>
                        <span className="font-semibold text-[#241F1A] block">{item.title}</span>
                        <span className="text-[11px] text-[#746A5F] block">
                          {item.submitterName ? `${isVie ? 'bởi' : 'by'} @${item.submitterName}` : ''}
                          {item.code ? ` • ${item.code}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[#B24A26] font-bold text-xs">
                    {item.scoreOrVotes}
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isContestResultsPublished || isAwardAllocationsConfirmed
                          ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                          : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
                      }`}
                    >
                      {isContestResultsPublished ? (
                        <>
                          <Check className="w-3 h-3" />
                          {isVie ? 'Đã công bố' : 'Published'}
                        </>
                      ) : isAwardAllocationsConfirmed ? (
                        <>
                          <Check className="w-3 h-3" />
                          {isVie ? 'Đã chốt' : 'Finalized'}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Bar under Final Results Table */}
      <div className="pt-4 border-t border-[#221E1A]/10 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-[#746A5F]">
          {isContestResultsPublished
            ? (isVie ? '✓ Kết quả chung cuộc đã được công bố chính thức trên Bảng vinh danh công khai.' : '✓ Final results officially published and visible on public Wall of Fame.')
            : isAwardAllocationsConfirmed
            ? (isVie ? '✓ Phân bổ giải thưởng đã được ban giám khảo xác nhận và khóa chính thức.' : '✓ Award allocations confirmed and officially locked by jury panel.')
            : (isVie ? 'Bấm Phê duyệt kết quả để xác nhận phân bổ giải thưởng.' : 'Click Approve Results to confirm award allocations.')}
        </span>
        <button
          type="button"
          onClick={handleApproveAwardAllocations}
          disabled={isAwardAllocationsConfirmed || isContestResultsPublished || finalWinnersList.length === 0}
          className="commission-primary px-5 py-2.5 rounded-xl font-sora text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isContestResultsPublished
              ? (isVie ? 'Kết quả đã công bố' : 'Results Published')
              : isAwardAllocationsConfirmed
              ? (isVie ? 'Đã xác nhận giải thưởng' : 'Award Allocations Confirmed')
              : (isVie ? 'Phê duyệt kết quả' : 'Approve Results')}
          </span>
        </button>
      </div>
    </div>
  );
}
