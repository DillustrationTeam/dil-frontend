'use client';

import React, { useEffect } from 'react';
import type { ArbitrationCase } from '../../types/jury.types';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';
import { useLanguage } from '@/context/language-context';
import { ComplianceArbitrationForm } from './arbitration/compliance-arbitration-form';
import { ScoreArbitrationForm } from './arbitration/score-arbitration-form';

interface HeadJuryArbitrationTabProps {
  arbitrationCasesState: ArbitrationCase[];
  arbitrationCasesList: ArbitrationCase[];
  filteredArbitrationCases: ArbitrationCase[];
  selectedArbitrationCase: ArbitrationCase | null;
  setSelectedArbitrationId: (id: string | null) => void;
  arbitrationSearch: string;
  setArbitrationSearch: (s: string) => void;
  arbitrationStatusFilter: 'all' | 'pending' | 'resolved';
  setArbitrationStatusFilter: (val: 'all' | 'pending' | 'resolved') => void;
  arbitrationDecision: string;
  setArbitrationDecision: (d: string) => void;
  arbitrationNotes: string;
  setArbitrationNotes: (n: string) => void;
  tieBreakerWinnerId: string;
  setTieBreakerWinnerId: (id: string) => void;
  handleConfirmArbitration: () => void;
}

export function HeadJuryArbitrationTab({
  arbitrationCasesState,
  arbitrationCasesList,
  filteredArbitrationCases,
  selectedArbitrationCase,
  setSelectedArbitrationId,
  arbitrationSearch,
  setArbitrationSearch,
  arbitrationStatusFilter,
  setArbitrationStatusFilter,
  arbitrationDecision,
  setArbitrationDecision,
  arbitrationNotes,
  setArbitrationNotes,
  tieBreakerWinnerId,
  setTieBreakerWinnerId,
  handleConfirmArbitration,
}: HeadJuryArbitrationTabProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const currentCases = arbitrationCasesState.length > 0 ? arbitrationCasesState : arbitrationCasesList;

  const category = (selectedArbitrationCase?.category || '').toLowerCase();
  const isRuleOrAiDispute =
    category === 'aiart' ||
    category === 'copyright' ||
    category === 'roleviolation' ||
    category === 'ruleviolation' ||
    category === 'votefraud';

  useEffect(() => {
    if (!selectedArbitrationCase) return;
    if (isRuleOrAiDispute) {
      if (
        arbitrationDecision !== 'Disqualify' &&
        arbitrationDecision !== 'Dismiss' &&
        arbitrationDecision !== 'Request Panel Re-evaluation'
      ) {
        setArbitrationDecision('Disqualify');
      }
    } else {
      if (
        arbitrationDecision === 'Disqualify' ||
        arbitrationDecision === 'Dismiss'
      ) {
        setArbitrationDecision('Maintain Current Median Score');
      }
    }
  }, [selectedArbitrationCase?.id, isRuleOrAiDispute]);

  return (
    <section className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold font-sora text-white">
            {isVie ? 'Các bài dự thi cần Tái thẩm định' : 'Submissions Requiring Arbitration'}
          </h2>
          <span className="w-fit rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            {currentCases.filter((c) => c.status.toLowerCase() === 'pending').length} / {currentCases.length}{' '}
            {isVie ? 'Tranh chấp chờ giải quyết' : 'Disputes Pending'}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Arbitration Cases table + overall resolution progress */}
          <div className="glass-container rounded-2xl p-4 lg:col-span-5 flex flex-col space-y-3">
            {/* Searchbar & Status Filter for Arbitration Cases */}
            <EventSearchFilterBar
              variant="inline"
              searchQuery={arbitrationSearch}
              onSearchChange={setArbitrationSearch}
              searchPlaceholder={isVie ? 'Tìm mã hoặc tiêu đề bài thi...' : 'Search entry code or title...'}
              statusValue={arbitrationStatusFilter}
              onStatusChange={(val: string) => setArbitrationStatusFilter(val as 'all' | 'pending' | 'resolved')}
              statusOptions={[
                { value: 'all', label: isVie ? `Tất cả (${currentCases.length})` : `All (${currentCases.length})` },
                {
                  value: 'pending',
                  label: isVie
                    ? `Chờ xử lý (${currentCases.filter((c) => c.status.toLowerCase() === 'pending').length})`
                    : `Pending (${currentCases.filter((c) => c.status.toLowerCase() === 'pending').length})`,
                },
                {
                  value: 'resolved',
                  label: isVie
                    ? `Đã giải quyết (${currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length})`
                    : `Resolved (${currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length})`,
                },
              ]}
            />

            <div className="overflow-y-auto max-h-[380px] sm:max-h-[410px] pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#161926] shadow-sm">
                  <tr className="border-b border-white/10 text-[#858694] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">{isVie ? 'Bài dự thi' : 'Entry'}</th>
                    <th className="py-2.5 px-3 text-right">{isVie ? 'Trạng thái' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredArbitrationCases.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[#9695a1]">
                        {isVie ? 'Không có trường hợp tái thẩm định nào phù hợp.' : 'No arbitration cases match criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredArbitrationCases.map((c) => {
                      const isActive = selectedArbitrationCase?.id === c.id;
                      const isResolved = c.status.toLowerCase() === 'resolved';
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedArbitrationId(c.id)}
                          className={`cursor-pointer transition-colors ${
                            isActive ? 'bg-[#A7ACD9]/15' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <td className={`py-3 px-3 ${isActive ? 'border-l-2 border-[#A7ACD9]' : 'border-l-2 border-transparent'}`}>
                            <span className="block font-semibold text-white truncate">{c.title}</span>
                            <span className="block text-[10px] text-[#9695a1] font-mono mt-0.5">{c.code}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isResolved
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              }`}
                            >
                              {isResolved ? (isVie ? 'Đã giải quyết' : 'Resolved') : (isVie ? 'Chờ xử lý' : 'Pending')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Resolution Progress Bar */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sora font-semibold text-white">
                  {isVie ? 'Tiến độ xử lý tranh chấp' : 'Dispute Resolution Progress'}
                </span>
                <span className="font-mono text-[#9695a1]">
                  {currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length} / {currentCases.length} ·{' '}
                  <strong className="text-[#A7ACD9]">
                    {currentCases.length > 0
                      ? Math.round(
                          (currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length /
                            currentCases.length) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                </span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-all"
                  style={{
                    width: `${
                      currentCases.length > 0
                        ? Math.round(
                            (currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length /
                              currentCases.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Detailed Master View & Arbitration Action Panel */}
          <div className="glass-container rounded-2xl p-5 lg:col-span-7">
            {!selectedArbitrationCase ? (
              <p className="py-16 text-center text-sm text-[#9695a1]">
                {isVie ? 'Chọn một bài dự thi để xem chi tiết tái thẩm định.' : 'Select an entry to view arbitration details.'}
              </p>
            ) : (
              <div className="space-y-5">
                {/* Header info */}
                <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sora text-xl font-bold text-white">{selectedArbitrationCase.title}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#A7ACD9]">
                        {selectedArbitrationCase.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#9695a1] mt-1">{selectedArbitrationCase.notes}</p>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                      selectedArbitrationCase.status.toLowerCase() === 'resolved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {selectedArbitrationCase.status.toLowerCase() === 'resolved'
                      ? (isVie ? 'Đã giải quyết' : 'Resolved')
                      : (isVie ? 'Chờ xử lý' : 'Pending')}
                  </span>
                </div>

                {/* Select Resolution Action Form (Separated into specialized forms) */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#A7ACD9] block uppercase tracking-wider">
                    {isVie ? 'Chọn hành động tái thẩm định:' : 'Select Arbitration Action:'}
                  </label>

                  {isRuleOrAiDispute ? (
                    <ComplianceArbitrationForm
                      decision={arbitrationDecision}
                      onDecisionChange={setArbitrationDecision}
                    />
                  ) : (
                    <ScoreArbitrationForm
                      decision={arbitrationDecision}
                      onDecisionChange={setArbitrationDecision}
                      selectedCase={selectedArbitrationCase}
                      tieBreakerWinnerId={tieBreakerWinnerId}
                      onTieBreakerWinnerChange={setTieBreakerWinnerId}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A7ACD9] block">
                    {isVie ? 'Ghi chú lý do kiểm toán của Trưởng ban GK:' : 'Head Jury Audit Rationale Notes:'}
                  </label>
                  <textarea
                    value={arbitrationNotes}
                    onChange={(e) => setArbitrationNotes(e.target.value)}
                    placeholder={isVie ? 'Nêu rõ căn cứ và lý do quyết định kiểm toán...' : 'Provide formal audit rationale for this decision...'}
                    className="w-full min-h-[88px] p-3 rounded-xl bg-[#090b12]/80 border border-white/10 text-xs text-white placeholder-[#9695a1] focus:outline-none focus:border-[#A7ACD9]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmArbitration}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#A7ACD9] to-[#7FD5E8] text-[#1F2335] font-sora font-extrabold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  {isVie ? 'Xác nhận Quyết định Tái thẩm định' : 'Confirm Arbitration Decision'}
                </button>

                <div className="p-3 rounded-xl border-l-4 border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs text-[#c7c5cf] leading-relaxed">
                  {isVie
                    ? 'Tất cả các hành động tái thẩm định được ghi nhận vĩnh viễn vào nhật ký kiểm toán. Trưởng ban GK không thể trực tiếp ghi đè điểm số thô của từng giám khảo.'
                    : 'All arbitration actions are permanently logged in the audit trail. Head Jury cannot directly override raw individual jury scores.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
