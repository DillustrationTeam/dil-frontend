'use client';

import React from 'react';
import {
  Scale,
  Lock,
  UserCheck,
  Award,
  Check,
} from 'lucide-react';
import type { ArbitrationCase } from '../../types/jury.types';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';

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
  const currentCases = arbitrationCasesState.length > 0 ? arbitrationCasesState : arbitrationCasesList;

  return (
    <section className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold font-sora text-white">Submissions Requiring Arbitration</h2>
          <span className="w-fit rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            {currentCases.filter((c) => c.status.toLowerCase() === 'pending').length} / {currentCases.length} Disputes Pending
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Arbitration Cases table + overall resolution progress */}
          <div className="rounded-2xl border border-white/10 bg-[#151926]/90 backdrop-blur-xl p-4 lg:col-span-5 flex flex-col space-y-3">
            {/* Searchbar & Status Filter for Arbitration Cases */}
            <EventSearchFilterBar
              variant="inline"
              searchQuery={arbitrationSearch}
              onSearchChange={setArbitrationSearch}
              searchPlaceholder="Search entry code or title..."
              statusValue={arbitrationStatusFilter}
              onStatusChange={(val: string) => setArbitrationStatusFilter(val as 'all' | 'pending' | 'resolved')}
              statusOptions={[
                { value: 'all', label: `All (${currentCases.length})` },
                {
                  value: 'pending',
                  label: `Pending (${currentCases.filter((c) => c.status.toLowerCase() === 'pending').length})`,
                },
                {
                  value: 'resolved',
                  label: `Resolved (${currentCases.filter((c) => c.status.toLowerCase() === 'resolved').length})`,
                },
              ]}
            />

            <div className="overflow-y-auto max-h-[380px] sm:max-h-[410px] pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#151926] shadow-sm">
                  <tr className="border-b border-white/10 text-[#858694] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredArbitrationCases.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[#9695a1]">
                        No arbitration cases match criteria.
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
                              {isResolved ? 'Resolved' : 'Pending'}
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
                <span className="font-sora font-semibold text-white">Dispute Resolution Progress</span>
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
          <div className="rounded-2xl border border-white/10 bg-[#151926]/90 backdrop-blur-xl p-5 lg:col-span-7">
            {!selectedArbitrationCase ? (
              <p className="py-16 text-center text-sm text-[#9695a1]">Select an entry to view arbitration details.</p>
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
                    {selectedArbitrationCase.status}
                  </span>
                </div>

                {/* Select Resolution Action */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#A7ACD9] block uppercase tracking-wider">
                    Select Arbitration Action:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setArbitrationDecision('Maintain Current Median Score')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        arbitrationDecision === 'Maintain Current Median Score'
                          ? 'border-[#A7ACD9] bg-[#A7ACD9]/20 text-white shadow-lg shadow-[#A7ACD9]/10'
                          : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-sora text-xs font-bold">
                          <Scale className="w-4 h-4 text-[#7FD5E8] shrink-0" />
                          <span>Maintain Median</span>
                        </div>
                        <p className="text-[11px] text-[#9695a1] leading-normal">
                          Lock current median score. Suppress outlier variance.
                        </p>
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-bold ${
                          arbitrationDecision === 'Maintain Current Median Score' ? 'text-[#7FD5E8]' : 'text-[#858694]'
                        }`}
                      >
                        {arbitrationDecision === 'Maintain Current Median Score' ? '✓ Selected' : 'Click to select'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setArbitrationDecision('Request Panel Re-evaluation')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        arbitrationDecision === 'Request Panel Re-evaluation'
                          ? 'border-amber-400 bg-amber-500/20 text-white shadow-lg shadow-amber-500/10'
                          : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-amber-300">
                          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Request Re-evaluation</span>
                        </div>
                        <p className="text-[11px] text-[#9695a1] leading-normal">
                          Unlock scoresheet for specific jury members to re-review.
                        </p>
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-bold ${
                          arbitrationDecision === 'Request Panel Re-evaluation' ? 'text-amber-300' : 'text-[#858694]'
                        }`}
                      >
                        {arbitrationDecision === 'Request Panel Re-evaluation' ? '✓ Selected' : 'Click to select'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setArbitrationDecision('Cast Head Jury Tie-Breaker')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        arbitrationDecision === 'Cast Head Jury Tie-Breaker'
                          ? 'border-purple-400 bg-purple-500/20 text-white shadow-lg shadow-purple-500/10'
                          : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-purple-300">
                          <Award className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>Tie-Breaker Vote</span>
                        </div>
                        <p className="text-[11px] text-[#9695a1] leading-normal">
                          Cast decisive Head Jury vote for tied placements.
                        </p>
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-bold ${
                          arbitrationDecision === 'Cast Head Jury Tie-Breaker' ? 'text-purple-300' : 'text-[#858694]'
                        }`}
                      >
                        {arbitrationDecision === 'Cast Head Jury Tie-Breaker' ? '✓ Selected' : 'Click to select'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-Panel 1: Maintain Median Score */}
                {arbitrationDecision === 'Maintain Current Median Score' && (
                  <div className="p-4 rounded-xl border border-[#7FD5E8]/30 bg-[#7FD5E8]/10 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-sora font-bold text-white">
                      <Lock className="w-4 h-4 text-[#7FD5E8]" />
                      <span>Lock Median Score Confirmation</span>
                    </div>
                    <p className="text-[#c7c5cf] leading-relaxed">
                      Maintaining the panel median score will automatically disregard extreme score outliers without unlocking scoresheets. The calculated median score of <strong className="text-white">88.5 pts</strong> will be locked as the final baseline.
                    </p>
                  </div>
                )}

                {/* Sub-Panel 2: Request Panel Re-evaluation */}
                {arbitrationDecision === 'Request Panel Re-evaluation' && (
                  <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-sora font-bold text-amber-300">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>Select Target Outlier Jury Members for Re-evaluation</span>
                    </div>
                    <p className="text-[#c7c5cf] leading-relaxed">
                      Scoresheets for the selected jury members will be unlocked for a 24-hour window with audit notes attached:
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-amber-400" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-semibold">Alex Rivers (Jury #2)</span>
                          <span className="font-mono text-xs text-amber-400 font-bold">Rated 98/100 (+18.4% variance)</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-amber-400" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-semibold">Elena Rostova (Jury #4)</span>
                          <span className="font-mono text-xs text-rose-400 font-bold">Rated 65/100 (-14.6% variance)</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Sub-Panel 3: Cast Head Jury Tie-Breaker */}
                {arbitrationDecision === 'Cast Head Jury Tie-Breaker' && (
                  <div className="p-4 rounded-xl border border-purple-400/30 bg-purple-500/10 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-sora font-bold text-purple-200">
                        <Award className="w-4 h-4 text-purple-400" />
                        <span>Interactive Head-to-Head Comparison</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                        Tied at 89.6 pts
                      </span>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-[#9695a1] uppercase font-semibold text-[10px]">
                            <th className="py-2 px-3">Metric / Candidate</th>
                            <th className="py-2 px-3 text-center border-l border-white/10 text-white font-bold">
                              {selectedArbitrationCase.title} ({selectedArbitrationCase.code})
                            </th>
                            <th className="py-2 px-3 text-center border-l border-white/10 text-white font-bold">
                              Thành phố ký ức (#AUR-0184)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-[#c7c5cf]">
                          <tr>
                            <td className="py-2 px-3 text-[#9695a1] font-medium">Panel Avg Score</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-[#A7ACD9] border-l border-white/10">
                              89.6 / 100
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-[#A7ACD9] border-l border-white/10">
                              89.6 / 100
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-[#9695a1] font-medium">Head Jury Score</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-amber-300 border-l border-white/10">
                              92 / 100
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-amber-300 border-l border-white/10">
                              90 / 100
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-[#9695a1] font-medium">Creativity & Concept</td>
                            <td className="py-2 px-3 text-center font-mono text-emerald-400 border-l border-white/10">
                              28 / 30
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-emerald-400 border-l border-white/10">
                              29 / 30
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-[#9695a1] font-medium">Technical Execution</td>
                            <td className="py-2 px-3 text-center font-mono text-purple-300 border-l border-white/10">
                              27 / 30
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-purple-300 border-l border-white/10">
                              27 / 30
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Interactive Winner Selector Buttons */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-purple-200 block">
                        Declare Official Tie-Breaker Winner:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTieBreakerWinnerId(selectedArbitrationCase.submissionId)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            tieBreakerWinnerId === selectedArbitrationCase.submissionId
                              ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md shadow-emerald-500/10'
                              : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-bold">{selectedArbitrationCase.title}</span>
                            <span className="block text-[10px] text-[#9695a1] font-mono">
                              {selectedArbitrationCase.code}
                            </span>
                          </div>
                          {tieBreakerWinnerId === selectedArbitrationCase.submissionId && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setTieBreakerWinnerId('aur-0184')}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            tieBreakerWinnerId === 'aur-0184'
                              ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md shadow-emerald-500/10'
                              : 'border-white/10 bg-white/5 text-[#c7c5cf] hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-bold">Thành phố ký ức</span>
                            <span className="block text-[10px] text-[#9695a1] font-mono">#AUR-0184</span>
                          </div>
                          {tieBreakerWinnerId === 'aur-0184' && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A7ACD9] block">Head Jury Audit Rationale Notes:</label>
                  <textarea
                    value={arbitrationNotes}
                    onChange={(e) => setArbitrationNotes(e.target.value)}
                    placeholder="Provide formal audit rationale for this decision..."
                    className="w-full min-h-[88px] p-3 rounded-xl bg-[#090b12]/80 border border-white/10 text-xs text-white placeholder-[#9695a1] focus:outline-none focus:border-[#A7ACD9]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmArbitration}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#A7ACD9] to-[#7FD5E8] text-[#1F2335] font-sora font-extrabold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Confirm Arbitration Decision
                </button>

                <div className="p-3 rounded-xl border-l-4 border-[#A7ACD9] bg-[#A7ACD9]/10 text-xs text-[#c7c5cf] leading-relaxed">
                  All arbitration actions are permanently logged in the audit trail. Head Jury cannot directly override raw individual jury scores.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
