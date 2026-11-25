'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import type { JuryProgressItem } from '../../types/jury.types';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';
import { useLanguage } from '@/context/language-context';

interface HeadJuryProgressTabProps {
  overallJuryProgress: { completed: number; total: number; percent: number };
  totalSubmissions?: number;
  fullyGradedCount?: number;
  anomalyFlagsCount?: number;
  juryList: JuryProgressItem[];
  filteredJuryList: JuryProgressItem[];
  selectedJuryId: string | null;
  setSelectedJuryId: (id: string | null) => void;
  selectedJury: JuryProgressItem | null;
  juryMemberSearch: string;
  setJuryMemberSearch: (s: string) => void;
  juryStatusFilter: 'all' | 'in_progress' | 'completed';
  setJuryStatusFilter: (val: 'all' | 'in_progress' | 'completed') => void;
  juryScoreFilter: 'all' | 'completed' | 'pending';
  setJuryScoreFilter: (val: 'all' | 'completed' | 'pending') => void;
  selectedJuryAssignments: Array<{ id: string; code: string; title: string; category: string; isCompleted: boolean }>;
  filteredJuryAssignments: Array<{ id: string; code: string; title: string; category: string; isCompleted: boolean }>;
}

export function HeadJuryProgressTab({
  overallJuryProgress,
  totalSubmissions = 0,
  fullyGradedCount = 0,
  anomalyFlagsCount = 0,
  juryList,
  filteredJuryList,
  selectedJury,
  setSelectedJuryId,
  juryMemberSearch,
  setJuryMemberSearch,
  juryStatusFilter,
  setJuryStatusFilter,
  juryScoreFilter,
  setJuryScoreFilter,
  selectedJuryAssignments,
  filteredJuryAssignments,
}: HeadJuryProgressTabProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const completedJuries = juryList.filter((j) => j.isCompleted).length;
  const totalJuries = juryList.length;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B24A26] via-[#2F6B63] to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#746A5F]">
            {isVie ? 'Tổng bài dự thi' : 'Total Submissions'}
          </span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-[#241F1A]">
            {totalSubmissions}
          </strong>
        </article>
        <article className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2F6B63] via-[#2F6B63] to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#746A5F]">
            {isVie ? 'Đã chấm đầy đủ' : 'Fully Graded'}
          </span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-[#2F6B63]">
            {fullyGradedCount}
          </strong>
        </article>
        <article className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8A6A1F] via-[#B24A26] to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#746A5F]">
            {isVie ? 'Giám khảo hoàn tất' : 'Juries Completed'}
          </span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-[#8A6A1F]">
            {completedJuries} / {totalJuries}
          </strong>
        </article>
        <article className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#A8321C] via-[#A8321C] to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#746A5F]">
            {isVie ? 'Cờ tranh chấp / Lệch điểm' : 'Dispute Flags'}
          </span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-[#A8321C]">
            {anomalyFlagsCount}
          </strong>
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold font-sora text-[#241F1A]">
            {isVie ? 'Tiến độ từng Giám khảo' : 'Jury Panel Individual Progress'}
          </h2>
          <span className="w-fit rounded-full border border-[#B24A26]/30 bg-[#B24A26]/15 px-3 py-1 text-xs font-bold text-[#B24A26]">
            {juryList.filter((j) => j.isCompleted).length} / {juryList.length} {isVie ? 'Giám khảo hoàn tất' : 'Juries Completed'}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Jury table + overall progress */}
          <div className="glass-container rounded-2xl p-4 lg:col-span-5 flex flex-col space-y-3">
            {/* Searchbar & Status Filter on the same line */}
            <EventSearchFilterBar
              variant="inline"
              searchQuery={juryMemberSearch}
              onSearchChange={setJuryMemberSearch}
              searchPlaceholder={isVie ? 'Tìm tên giám khảo...' : 'Search name...'}
              statusValue={juryStatusFilter}
              onStatusChange={(val: string) => setJuryStatusFilter(val as 'all' | 'in_progress' | 'completed')}
              statusOptions={[
                { value: 'all', label: isVie ? `Tất cả (${juryList.length})` : `All (${juryList.length})` },
                { value: 'in_progress', label: isVie ? `Đang chấm (${juryList.filter((j) => !j.isCompleted).length})` : `In Progress (${juryList.filter((j) => !j.isCompleted).length})` },
                { value: 'completed', label: isVie ? `Đã hoàn tất (${juryList.filter((j) => j.isCompleted).length})` : `Completed (${juryList.filter((j) => j.isCompleted).length})` },
              ]}
            />

            <div className="overflow-y-auto max-h-[380px] sm:max-h-[410px] pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#FFFCF6] shadow-sm">
                  <tr className="border-b border-[#221E1A]/10 text-[#746A5F] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">{isVie ? 'Giám khảo' : 'Jury'}</th>
                    <th className="py-2.5 px-3 w-[55%]">{isVie ? 'Tiến độ' : 'Progress'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221E1A]/10">
                  {filteredJuryList.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[#746A5F]">
                        {isVie ? 'Không tìm thấy giám khảo phù hợp tiêu chí.' : 'No jury members found matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredJuryList.map((j) => {
                      const isActive = selectedJury?.id === j.id;
                      return (
                        <tr
                          key={j.id}
                          onClick={() => {
                            setSelectedJuryId(j.id);
                            setJuryScoreFilter('all');
                          }}
                          className={`cursor-pointer transition-colors ${
                            isActive ? 'bg-[#B24A26]/15' : 'hover:bg-[#FFFCF6]'
                          }`}
                        >
                          <td className={`py-3 px-3 ${isActive ? 'border-l-2 border-[#B24A26]' : 'border-l-2 border-transparent'}`}>
                            <span className="block font-semibold text-[#241F1A] truncate">{j.name}</span>
                            <span className="block text-[10px] text-[#746A5F] font-mono mt-0.5">
                              {j.completedCount} / {j.totalAssigned}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#F0E7D8] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    j.isCompleted ? 'bg-[#2F6B63]/10' : 'bg-gradient-to-r from-[#B24A26] to-[#2F6B63]'
                                  }`}
                                  style={{ width: `${j.gradedPercent}%` }}
                                />
                              </div>
                              <span
                                className={`w-10 text-right font-mono font-bold ${
                                  j.isCompleted ? 'text-[#2F6B63]' : 'text-[#B24A26]'
                                }`}
                              >
                                {j.gradedPercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall judging progress */}
            <div className="mt-4 pt-4 border-t border-[#221E1A]/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sora font-semibold text-[#241F1A]">
                  {isVie ? 'Tiến độ toàn bộ hội đồng' : 'Overall Judging Progress'}
                </span>
                <span className="font-mono text-[#746A5F]">
                  {overallJuryProgress.completed} / {overallJuryProgress.total} ·{' '}
                  <strong className="text-[#B24A26]">{overallJuryProgress.percent}%</strong>
                </span>
              </div>
              <div className="w-full bg-[#F0E7D8] h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B24A26] to-[#8C3718] transition-all"
                  style={{ width: `${overallJuryProgress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Selected jury's scoring list */}
          <div className="glass-container rounded-2xl p-5 lg:col-span-7">
            {!selectedJury ? (
              <p className="py-16 text-center text-sm text-[#746A5F]">
                {isVie ? 'Chọn một thành viên giám khảo để xem các bài chấm của họ.' : 'Select a jury member to view their scoring.'}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 border-b border-[#221E1A]/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-sora text-lg font-bold text-[#241F1A]">{selectedJury.name}</h3>
                    <p className="text-xs text-[#746A5F]">
                      {selectedJury.completedCount} / {selectedJury.totalAssigned}{' '}
                      {isVie ? 'bài dự thi được phân công đã chấm' : 'assigned entries scored'}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                      selectedJury.isCompleted
                        ? 'bg-[#2F6B63]/15 text-[#2F6B63] border-[#2F6B63]/40'
                        : 'bg-[#8A6A1F]/15 text-[#8A6A1F] border-[#8A6A1F]/40'
                    }`}
                  >
                    {selectedJury.isCompleted ? (isVie ? 'Đã hoàn tất' : 'Completed') : (isVie ? 'Đang thực hiện' : 'In Progress')}
                  </span>
                </div>

                {/* Filter Dropdown */}
                <EventSearchFilterBar
                  variant="compact"
                  statusValue={juryScoreFilter}
                  onStatusChange={(val: string) => setJuryScoreFilter(val as 'all' | 'completed' | 'pending')}
                  statusOptions={[
                    { value: 'all', label: isVie ? `Tất cả bài thi (${selectedJuryAssignments.length})` : `All Entries (${selectedJuryAssignments.length})` },
                    { value: 'completed', label: isVie ? `Đã chấm (${selectedJury.completedCount})` : `Completed (${selectedJury.completedCount})` },
                    { value: 'pending', label: isVie ? `Chưa chấm (${selectedJury.totalAssigned - selectedJury.completedCount})` : `Not Completed (${selectedJury.totalAssigned - selectedJury.completedCount})` },
                  ]}
                />

                {/* List */}
                <ul className="space-y-2 overflow-y-auto max-h-[460px] pr-1.5 custom-scrollbar">
                  {filteredJuryAssignments.length === 0 ? (
                    <li className="py-8 text-center text-xs text-[#746A5F]">
                      {isVie ? 'Không có bài thi nào trong bộ lọc này.' : 'No entries in this filter.'}
                    </li>
                  ) : (
                    filteredJuryAssignments.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6]"
                      >
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs sm:text-sm font-semibold text-[#241F1A] truncate">
                            {item.title}
                          </strong>
                          <small className="block text-[11px] text-[#746A5F] mt-0.5 truncate">
                            {item.code} · {item.category}
                          </small>
                        </div>
                        {item.isCompleted ? (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2F6B63]/15 border border-[#2F6B63]/40 text-[#2F6B63] text-[10px] font-semibold">
                            <Check className="w-3 h-3" />
                            {isVie ? 'Đã chấm' : 'Completed'}
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 text-[#8A6A1F] text-[10px] font-semibold">
                            <Clock className="w-3 h-3" />
                            {isVie ? 'Chưa chấm' : 'Not Completed'}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
