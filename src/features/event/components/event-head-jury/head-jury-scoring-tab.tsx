'use client';

import React from 'react';
import {
  Check,
  EyeOff,
  ShieldCheck,
  Maximize2,
  Sliders,
  FileText,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Lock,
} from 'lucide-react';
import type { JuryCriterion, JurySubmissionItem } from '../../types/jury.types';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';

interface HeadJuryScoringTabProps {
  submissions: JurySubmissionItem[];
  activeSubmission: JurySubmissionItem | null;
  selectedSubmissionId: string | null;
  setSelectedSubmissionId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterTab: 'all' | 'pending' | 'graded';
  setFilterTab: (val: 'all' | 'pending' | 'graded') => void;
  filteredSubmissions: JurySubmissionItem[];
  criteria: JuryCriterion[];
  scores: Record<string, number>;
  handleScoreChange: (criteriaId: string, val: number, maxScore: number) => void;
  totalScore: number;
  notes: string;
  setNotes: (n: string) => void;
  noConflict: boolean;
  setNoConflict: (b: boolean) => void;
  handleSaveDraft: () => void;
  handleSubmitScore: (e: React.FormEvent) => void;
  setIsLightboxOpen: (open: boolean) => void;
  activeIndex: number;
}

export function HeadJuryScoringTab({
  submissions,
  activeSubmission,
  setSelectedSubmissionId,
  searchQuery,
  setSearchQuery,
  filterTab,
  setFilterTab,
  filteredSubmissions,
  criteria,
  scores,
  handleScoreChange,
  totalScore,
  notes,
  setNotes,
  noConflict,
  setNoConflict,
  handleSaveDraft,
  handleSubmitScore,
  setIsLightboxOpen,
  activeIndex,
}: HeadJuryScoringTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
      {/* Left Column: Queue List */}
      <aside className="p-4 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl lg:sticky lg:top-36 max-h-none lg:max-h-[calc(100vh-10rem)] flex flex-col">
        {/* Panel Head */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3">
          <div>
            <h2 className="font-sora font-semibold text-white text-base">Assigned Queue</h2>
            <span className="text-xs text-[#9695a1]">
              {submissions.filter((s) => !s.isGraded).length} pending evaluation
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#c7c5cf]">
            {submissions.length} total
          </span>
        </div>

        {/* Search & Filter Bar */}
        <EventSearchFilterBar
          variant="stacked"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search title or entry code..."
          statusValue={filterTab}
          onStatusChange={(val: string) => setFilterTab(val as 'all' | 'pending' | 'graded')}
          statusOptions={[
            { value: 'all', label: 'All Submissions (Default)' },
            { value: 'pending', label: 'Pending Evaluation' },
            { value: 'graded', label: 'Graded' },
          ]}
        />

        {/* Submissions Queue List */}
        <div className="space-y-2 overflow-y-auto max-h-[480px] lg:max-h-[calc(100vh-18rem)] pr-1.5 custom-scrollbar">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#9695a1]">No matching submissions found.</div>
          ) : (
            filteredSubmissions.map((entry) => {
              const isActive = entry.id === activeSubmission?.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(entry.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 shadow-md shadow-[#A7ACD9]/5'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <strong
                      className={`block text-xs sm:text-sm font-semibold truncate ${
                        isActive ? 'text-white' : 'text-[#e4e1e5]'
                      }`}
                    >
                      {entry.title}
                    </strong>
                    <small className="block text-[11px] text-[#9695a1] mt-0.5 truncate">
                      {entry.code} · {entry.category || 'Illustration'}
                    </small>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {entry.isLocked ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold" title="Điểm đã khóa">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                      </span>
                    ) : entry.isGraded ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                        <Check className="w-3 h-3" />
                        <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
                        Pending
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Column: Scoring Form */}
      {activeSubmission ? (
        <form
          onSubmit={handleSubmitScore}
          className="p-5 sm:p-6 rounded-2xl bg-[#151926]/90 border border-white/10 backdrop-blur-xl space-y-6"
        >
          {activeSubmission.isLocked && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Điểm đã được khóa (Locked):</strong> Bài dự thi này đã hoàn tất đánh giá và được khóa điểm. Điểm số không thể chỉnh sửa trừ khi mở khóa tái thẩm định.
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                  {activeSubmission.gradedScore ?? totalScore} pts
                </span>
              </div>
            </div>
          )}

          {/* Submission Title Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-sora text-white">{activeSubmission.title}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#A7ACD9]/15 text-[#A7ACD9] border border-[#A7ACD9]/30">
                  {activeSubmission.code}
                </span>
              </div>
              <span className="text-xs text-[#9695a1] mt-1 flex items-center gap-1.5">
                <EyeOff className="w-3 h-3 text-[#A7ACD9]" />
                <span>Anonymous Candidate · {activeSubmission.category || 'Illustration'}</span>
              </span>
            </div>

            {/* Total Score Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#9695a1] uppercase tracking-wider block font-semibold">
                  Head Jury Score
                </span>
                <strong className="text-2xl sm:text-3xl font-sora font-extrabold text-[#A7ACD9] block">
                  {activeSubmission.isGraded || totalScore > 0 ? (
                    <>
                      {totalScore} <span className="text-sm font-normal text-[#9695a1]">/ 100</span>
                    </>
                  ) : (
                    <span className="text-lg sm:text-xl font-medium text-[#9695a1]">Pending</span>
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* Artwork Preview Panel */}
          <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#090b12] min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSubmission.artworkImageUrl}
              alt={activeSubmission.title}
              className="max-h-[500px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Top Overlay Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {activeSubmission.aiScanPassed && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AI Scan Passed</span>
                </span>
              )}
            </div>

            {/* Zoom / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs transition-all shadow-lg cursor-pointer"
              title="Inspect brushwork and details"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#A7ACD9]" />
              <span>Inspect Brushwork</span>
            </button>
          </div>

          {/* Artist Statement / Description */}
          {activeSubmission.description && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-[#c7c5cf]">
              <strong className="block text-[#9695a1] mb-1 uppercase tracking-wider text-[10px]">
                Artist Statement
              </strong>
              <p className="leading-relaxed">{activeSubmission.description}</p>
            </div>
          )}

          {/* Rubric Criteria Evaluation */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sora font-semibold text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#A7ACD9]" />
                <span>Evaluation Rubric</span>
              </h3>
              <span className="text-xs text-[#9695a1]">Adjust sliders or enter score points</span>
            </div>

            <div className="space-y-4">
              {criteria.map((crit) => {
                const currentScore = scores[crit.id] ?? 0;
                return (
                  <div key={crit.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-sora text-sm font-semibold text-white block">{crit.name}</span>
                        {crit.description && <p className="text-xs text-[#9695a1] mt-0.5">{crit.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={crit.maxScore}
                          value={currentScore}
                          disabled={Boolean(activeSubmission.isLocked)}
                          onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                          className={`w-16 px-2 py-1 bg-white/5 border rounded-lg text-right text-xs font-mono font-bold text-white focus:outline-none ${
                            activeSubmission.isLocked
                              ? 'border-white/5 opacity-60 cursor-not-allowed text-[#9695a1]'
                              : 'border-white/10 focus:border-[#A7ACD9]'
                          }`}
                        />
                        <span className="text-xs text-[#9695a1] font-mono">/ {crit.maxScore}</span>
                      </div>
                    </div>

                    {/* Slider bar */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={crit.maxScore}
                        step={1}
                        value={currentScore}
                        disabled={Boolean(activeSubmission.isLocked)}
                        onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                        className={`w-full accent-[#A7ACD9] ${
                          activeSubmission.isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Professional Notes & Deliberation */}
          <div className="space-y-2 pt-2">
            <label className="font-sora font-semibold text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#A7ACD9]" />
              <span>Head Jury Professional Notes</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              disabled={Boolean(activeSubmission.isLocked)}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide structured notes on execution, technique, or potential concerns..."
              className={`w-full p-3 text-xs bg-white/5 border rounded-xl text-white placeholder-[#9695a1] focus:outline-none leading-relaxed ${
                activeSubmission.isLocked
                  ? 'border-white/5 opacity-60 cursor-not-allowed'
                  : 'border-white/10 focus:border-[#A7ACD9]'
              }`}
            />
          </div>

          {/* Confirmations Checkbox */}
          <div className="space-y-3 pt-2">
            <label className={`flex items-start gap-2.5 text-xs text-[#c7c5cf] ${activeSubmission.isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={noConflict}
                disabled={Boolean(activeSubmission.isLocked)}
                onChange={(e) => setNoConflict(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/5 text-[#A7ACD9] focus:ring-0 accent-[#A7ACD9] disabled:cursor-not-allowed"
              />
              <span>
                I declare no personal or financial conflict of interest regarding this candidate or artwork submission.
              </span>
            </label>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => {
                  if (activeIndex > 0) {
                    setSelectedSubmissionId(submissions[activeIndex - 1].id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={activeIndex >= submissions.length - 1}
                onClick={() => {
                  if (activeIndex < submissions.length - 1) {
                    setSelectedSubmissionId(submissions[activeIndex + 1].id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={Boolean(activeSubmission.isLocked)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 text-[#A7ACD9]" />
                <span>Save Draft</span>
              </button>

              <button
                type="submit"
                disabled={Boolean(activeSubmission.isLocked)}
                className={`px-5 py-2.5 rounded-xl font-sora font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 ${
                  activeSubmission.isLocked
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-not-allowed opacity-90'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7FD5E8] hover:brightness-110 text-white cursor-pointer hover:shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
                }`}
              >
                {activeSubmission.isLocked ? <Lock className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
                <span>{activeSubmission.isLocked ? 'Điểm đã khóa' : 'Submit Head Jury Evaluation'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#151926]/90 border border-white/10 text-[#9695a1]">
          Select a submission from the queue to start evaluation.
        </div>
      )}
    </div>
  );
}
