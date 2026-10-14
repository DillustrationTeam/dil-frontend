'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import type { JuryProgressItem } from '../../types/jury.types';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';

interface HeadJuryProgressTabProps {
  overallJuryProgress: { completed: number; total: number; percent: number };
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
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#A7ACD9] via-[#7FD5E8] to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#9695a1]">Total Submissions</span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-white">248</strong>
        </article>
        <article className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#9695a1]">Fully Graded</span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-emerald-400">231</strong>
        </article>
        <article className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-300 to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#9695a1]">Juries Completed</span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-amber-300">5 / 7</strong>
        </article>
        <article className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-pink-300 to-transparent opacity-75" />
          <span className="text-[11px] uppercase tracking-wider text-[#9695a1]">Dispute Flags</span>
          <strong className="block mt-1 font-sora text-2xl sm:text-3xl font-bold text-rose-400">7</strong>
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold font-sora text-white">Jury Panel Individual Progress</h2>
          <span className="w-fit rounded-full border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 px-3 py-1 text-xs font-bold text-[#A7ACD9]">
            {juryList.filter((j) => j.isCompleted).length} / {juryList.length} Juries Completed
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Jury table + overall progress */}
          <div className="rounded-2xl border border-white/10 bg-[#151926]/90 backdrop-blur-xl p-4 lg:col-span-5 flex flex-col space-y-3">
            {/* Searchbar & Status Filter on the same line */}
            <EventSearchFilterBar
              variant="inline"
              searchQuery={juryMemberSearch}
              onSearchChange={setJuryMemberSearch}
              searchPlaceholder="Search name..."
              statusValue={juryStatusFilter}
              onStatusChange={(val: string) => setJuryStatusFilter(val as 'all' | 'in_progress' | 'completed')}
              statusOptions={[
                { value: 'all', label: `All (${juryList.length})` },
                { value: 'in_progress', label: `In Progress (${juryList.filter((j) => !j.isCompleted).length})` },
                { value: 'completed', label: `Completed (${juryList.filter((j) => j.isCompleted).length})` },
              ]}
            />

            <div className="overflow-y-auto max-h-[380px] sm:max-h-[410px] pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#151926] shadow-sm">
                  <tr className="border-b border-white/10 text-[#858694] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Jury</th>
                    <th className="py-2.5 px-3 w-[55%]">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredJuryList.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[#9695a1]">
                        No jury members found matching criteria.
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
                            isActive ? 'bg-[#A7ACD9]/15' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <td className={`py-3 px-3 ${isActive ? 'border-l-2 border-[#A7ACD9]' : 'border-l-2 border-transparent'}`}>
                            <span className="block font-semibold text-white truncate">{j.name}</span>
                            <span className="block text-[10px] text-[#9695a1] font-mono mt-0.5">
                              {j.completedCount} / {j.totalAssigned}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    j.isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#A7ACD9] to-[#7FD5E8]'
                                  }`}
                                  style={{ width: `${j.gradedPercent}%` }}
                                />
                              </div>
                              <span
                                className={`w-10 text-right font-mono font-bold ${
                                  j.isCompleted ? 'text-emerald-400' : 'text-[#A7ACD9]'
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
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sora font-semibold text-white">Overall Judging Progress</span>
                <span className="font-mono text-[#9695a1]">
                  {overallJuryProgress.completed} / {overallJuryProgress.total} ·{' '}
                  <strong className="text-[#A7ACD9]">{overallJuryProgress.percent}%</strong>
                </span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-[#A7ACD9] to-[#7FD5E8] transition-all"
                  style={{ width: `${overallJuryProgress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Selected jury's scoring list */}
          <div className="rounded-2xl border border-white/10 bg-[#151926]/90 backdrop-blur-xl p-5 lg:col-span-7">
            {!selectedJury ? (
              <p className="py-16 text-center text-sm text-[#9695a1]">Select a jury member to view their scoring.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-sora text-lg font-bold text-white">{selectedJury.name}</h3>
                    <p className="text-xs text-[#9695a1]">
                      {selectedJury.completedCount} of {selectedJury.totalAssigned} assigned entries scored
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                      selectedJury.isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {selectedJury.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                {/* Filter Dropdown */}
                <EventSearchFilterBar
                  variant="compact"
                  statusValue={juryScoreFilter}
                  onStatusChange={(val: string) => setJuryScoreFilter(val as 'all' | 'completed' | 'pending')}
                  statusOptions={[
                    { value: 'all', label: `All Entries (${selectedJuryAssignments.length})` },
                    { value: 'completed', label: `Completed (${selectedJury.completedCount})` },
                    { value: 'pending', label: `Not Completed (${selectedJury.totalAssigned - selectedJury.completedCount})` },
                  ]}
                />

                {/* List */}
                <ul className="space-y-2 overflow-y-auto max-h-[460px] pr-1.5 custom-scrollbar">
                  {filteredJuryAssignments.length === 0 ? (
                    <li className="py-8 text-center text-xs text-[#9695a1]">No entries in this filter.</li>
                  ) : (
                    filteredJuryAssignments.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]"
                      >
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs sm:text-sm font-semibold text-[#e4e1e5] truncate">
                            {item.title}
                          </strong>
                          <small className="block text-[11px] text-[#9695a1] mt-0.5 truncate">
                            {item.code} · {item.category}
                          </small>
                        </div>
                        {item.isCompleted ? (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                            <Check className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                            <Clock className="w-3 h-3" />
                            Not Completed
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
