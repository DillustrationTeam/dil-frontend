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
          <h2 className="text-xl font-bold font-sora text-[#241F1A]">
            {isVie ? 'Các bài dự thi cần Tái thẩm định' : 'Submissions Requiring Arbitration'}
          </h2>
          <span className="w-fit rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 px-3 py-1 text-xs font-bold text-[#8A6A1F]">
            {currentCases.filter((c) => c.status.toLowerCase() !== 'resolved' && c.status.toLowerCase() !== 'rejected').length} / {currentCases.length}{' '}
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
                    ? `Chờ xử lý (${currentCases.filter((c) => c.status.toLowerCase() !== 'resolved' && c.status.toLowerCase() !== 'rejected').length})`
                    : `Pending (${currentCases.filter((c) => c.status.toLowerCase() !== 'resolved' && c.status.toLowerCase() !== 'rejected').length})`,
                },
                {
                  value: 'resolved',
                  label: isVie
                    ? `Đã giải quyết (${currentCases.filter((c) => c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected').length})`
                    : `Resolved (${currentCases.filter((c) => c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected').length})`,
                },
              ]}
            />

            <div className="overflow-y-auto max-h-[380px] sm:max-h-[410px] pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#FFFCF6] shadow-sm">
                  <tr className="border-b border-[#221E1A]/10 text-[#746A5F] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">{isVie ? 'Bài dự thi' : 'Entry'}</th>
                    <th className="py-2.5 px-3 text-right">{isVie ? 'Trạng thái' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221E1A]/10">
                  {filteredArbitrationCases.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[#746A5F]">
                        {isVie ? 'Không có trường hợp tái thẩm định nào phù hợp.' : 'No arbitration cases match criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredArbitrationCases.map((c) => {
                      const isActive = selectedArbitrationCase?.id === c.id;
                      const isClosed = c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected';
                      const isDismissed = c.status.toLowerCase() === 'rejected';
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedArbitrationId(c.id)}
                          className={`cursor-pointer transition-colors ${
                            isActive ? 'bg-[#B24A26]/15' : 'hover:bg-[#FFFCF6]'
                          }`}
                        >
                          <td className={`py-3 px-3 ${isActive ? 'border-l-2 border-[#B24A26]' : 'border-l-2 border-transparent'}`}>
                            <span className="block font-semibold text-[#241F1A] truncate">{c.title}</span>
                            <span className="block text-[10px] text-[#746A5F] font-mono mt-0.5">{c.code}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isClosed
                                  ? 'bg-[#2F6B63]/15 border-[#2F6B63]/40 text-[#2F6B63]'
                                  : 'bg-[#8A6A1F]/15 border-[#8A6A1F]/40 text-[#8A6A1F]'
                              }`}
                            >
                              {isClosed
                                ? (isDismissed
                                    ? (isVie ? 'Đã bác bỏ' : 'Dismissed')
                                    : (isVie ? 'Đã giải quyết' : 'Resolved'))
                                : (isVie ? 'Chờ xử lý' : 'Pending')}
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
            <div className="mt-4 pt-4 border-t border-[#221E1A]/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sora font-semibold text-[#241F1A]">
                  {isVie ? 'Tiến độ xử lý tranh chấp' : 'Dispute Resolution Progress'}
                </span>
                <span className="font-mono text-[#746A5F]">
                  {currentCases.filter((c) => c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected').length} / {currentCases.length} ·{' '}
                  <strong className="text-[#B24A26]">
                    {currentCases.length > 0
                      ? Math.round(
                          (currentCases.filter((c) => c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected').length /
                            currentCases.length) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                </span>
              </div>
              <div className="w-full bg-[#F0E7D8] h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8A6A1F] via-[#B24A26] to-[#2F6B63] transition-all"
                  style={{
                    width: `${
                      currentCases.length > 0
                        ? Math.round(
                            (currentCases.filter((c) => c.status.toLowerCase() === 'resolved' || c.status.toLowerCase() === 'rejected').length /
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
              <p className="py-16 text-center text-sm text-[#746A5F]">
                {isVie ? 'Chọn một bài dự thi để xem chi tiết tái thẩm định.' : 'Select an entry to view arbitration details.'}
              </p>
            ) : (
              <div className="space-y-5">
                {/* Header info */}
                <div className="flex flex-col gap-2 border-b border-[#221E1A]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sora text-xl font-bold text-[#241F1A]">{selectedArbitrationCase.title}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FFFCF6] border border-[#221E1A]/10 text-[#B24A26]">
                        {selectedArbitrationCase.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#746A5F] mt-1">{selectedArbitrationCase.notes}</p>
                  </div>
                  {(() => {
                    const isClosed = selectedArbitrationCase.status.toLowerCase() === 'resolved' || selectedArbitrationCase.status.toLowerCase() === 'rejected';
                    const isDismissed = selectedArbitrationCase.status.toLowerCase() === 'rejected';
                    return (
                      <span
                        className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                          isClosed
                            ? 'bg-[#2F6B63]/15 text-[#2F6B63] border-[#2F6B63]/40'
                            : 'bg-[#8A6A1F]/15 text-[#8A6A1F] border-[#8A6A1F]/40'
                        }`}
                      >
                        {isClosed
                          ? (isDismissed
                              ? (isVie ? 'Đã bác bỏ' : 'Dismissed')
                              : (isVie ? 'Đã giải quyết' : 'Resolved'))
                          : (isVie ? 'Chờ xử lý' : 'Pending')}
                      </span>
                    );
                  })()}
                </div>

                {/* Select Resolution Action Form (Separated into specialized forms) */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#B24A26] block uppercase tracking-wider">
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
                  <label className="text-xs font-semibold text-[#B24A26] block">
                    {isVie ? 'Ghi chú lý do kiểm toán của Trưởng ban GK:' : 'Head Jury Audit Rationale Notes:'}
                  </label>
                  <textarea
                    value={arbitrationNotes}
                    onChange={(e) => setArbitrationNotes(e.target.value)}
                    placeholder={isVie ? 'Nêu rõ căn cứ và lý do quyết định kiểm toán...' : 'Provide formal audit rationale for this decision...'}
                    className="w-full min-h-[88px] p-3 rounded-xl bg-[#E5D8C2]/80 border border-[#221E1A]/10 text-xs text-[#241F1A] placeholder-[#746A5F] focus:outline-none focus:border-[#B24A26]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmArbitration}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B24A26] to-[#2F6B63] text-[#F7F2E9] font-sora font-extrabold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  {isVie ? 'Xác nhận Quyết định Tái thẩm định' : 'Confirm Arbitration Decision'}
                </button>

                <div className="p-3 rounded-xl border-l-4 border-[#B24A26] bg-[#B24A26]/10 text-xs text-[#6E6459] leading-relaxed">
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
