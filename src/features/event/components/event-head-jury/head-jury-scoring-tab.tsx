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
import { getRubricMaxTotal } from '../../utils/jury-phase';
import { EventSearchFilterBar } from '../event/event-search-filter-bar';
import { useLanguage } from '@/context/language-context';

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
  isJudgingPhase?: boolean;
  judgingLockMessage?: string;
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
  isJudgingPhase = false,
  judgingLockMessage,
}: HeadJuryScoringTabProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const isReadOnly = Boolean(activeSubmission?.isLocked) || !isJudgingPhase;
  const maxTotalScore = getRubricMaxTotal(criteria);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Queue List */}
      <aside className="glass-container p-4 rounded-2xl lg:col-span-4 xl:col-span-4 flex flex-col">
        {/* Panel Head */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#221E1A]/10 mb-3">
          <div>
            <h2 className="font-sora font-semibold text-[#241F1A] text-base">
              {isVie ? 'Danh sách phân công' : 'Assigned Queue'}
            </h2>
            <span className="text-xs text-[#746A5F]">
              {submissions.filter((s) => !s.isGraded).length} {isVie ? 'bài chờ đánh giá' : 'pending evaluation'}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#6E6459]">
            {submissions.length} {isVie ? 'tổng số' : 'total'}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <EventSearchFilterBar
          variant="stacked"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={isVie ? 'Tìm theo tiêu đề hoặc mã bài thi...' : 'Search title or entry code...'}
          statusValue={filterTab}
          onStatusChange={(val: string) => setFilterTab(val as 'all' | 'pending' | 'graded')}
          statusOptions={[
            { value: 'all', label: isVie ? 'Tất cả bài thi (Mặc định)' : 'All Submissions (Default)' },
            { value: 'pending', label: isVie ? 'Chờ đánh giá' : 'Pending Evaluation' },
            { value: 'graded', label: isVie ? 'Đã chấm điểm' : 'Graded' },
          ]}
        />

        {/* Submissions Queue List */}
        <div className="space-y-2 overflow-y-auto max-h-[480px] lg:max-h-[calc(100vh-18rem)] pr-1.5 custom-scrollbar">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#746A5F]">
              {isVie ? 'Không tìm thấy bài dự thi phù hợp.' : 'No matching submissions found.'}
            </div>
          ) : (
            filteredSubmissions.map((entry) => {
              const isActive = entry.id === activeSubmission?.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(entry.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isActive
                      ? 'border-[#B24A26] bg-[#B24A26]/15 shadow-md shadow-[#B24A26]/5'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#FFFCF6] hover:border-[#221E1A]/20'
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <strong
                      className={`block text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-[#241F1A]' : 'text-[#241F1A]'
                        }`}
                    >
                      {entry.title}
                    </strong>
                    <small className="block text-[11px] text-[#746A5F] mt-0.5 truncate">
                      {entry.code} · {entry.category || (isVie ? 'Tranh minh họa' : 'Illustration')}
                    </small>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {entry.isLocked ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2F6B63]/15 border border-[#2F6B63]/40 text-[#2F6B63] text-[11px] font-mono font-bold" title={isVie ? 'Điểm đã khóa' : 'Score locked'}>
                        <Lock className="w-3 h-3 text-[#2F6B63]" />
                        <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                      </span>
                    ) : entry.isGraded ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2F6B63]/15 border border-[#2F6B63]/40 text-[#2F6B63] text-[11px] font-mono font-bold">
                        <Check className="w-3 h-3" />
                        <span>{entry.gradedScore != null ? entry.gradedScore : '—'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 text-[#8A6A1F] text-[10px]">
                        {isVie ? 'Chưa chấm' : 'Pending'}
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
          className="glass-container p-5 sm:p-6 rounded-2xl space-y-6 lg:col-span-8 xl:col-span-8"
        >
          {activeSubmission.isLocked && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/40 text-[#2F6B63] text-xs">
              <Lock className="w-4 h-4 text-[#2F6B63] shrink-0" />
              <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{isVie ? 'Điểm đã được khóa:' : 'Score Locked:'}</strong>{' '}
                  {isVie
                    ? 'Bài dự thi này đã hoàn tất đánh giá và được khóa điểm. Điểm số không thể chỉnh sửa trừ khi mở khóa tái thẩm định.'
                    : 'This submission has been graded and locked. Scores cannot be edited unless unlocked for re-evaluation.'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] font-mono text-[11px] font-bold">
                  {activeSubmission.gradedScore ?? totalScore} {isVie ? 'điểm' : 'pts'}
                </span>
              </div>
            </div>
          )}

          {!isJudgingPhase && !activeSubmission.isLocked && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#8A6A1F]/10 border border-[#8A6A1F]/40 text-[#8A6A1F] text-xs">
              <Lock className="w-4 h-4 text-[#8A6A1F] shrink-0" />
              <span>
                {judgingLockMessage ||
                  (isVie
                    ? 'Chức năng chấm điểm tạm thời khóa cho đến khi cuộc thi bước vào vòng Chấm điểm chính thức.'
                    : 'Grading controls are temporarily locked until the contest enters its active Judging phase.')}
              </span>
            </div>
          )}

          {/* Submission Title Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#221E1A]/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#241F1A]">{activeSubmission.title}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#B24A26]/15 text-[#B24A26] border border-[#B24A26]/30">
                  {activeSubmission.code}
                </span>
              </div>
              <span className="text-xs text-[#746A5F] mt-1 flex items-center gap-1.5">
                <EyeOff className="w-3 h-3 text-[#B24A26]" />
                <span>
                  {isVie ? 'Thí sinh ẩn danh' : 'Anonymous Candidate'} · {activeSubmission.category || (isVie ? 'Minh họa' : 'Illustration')}
                </span>
              </span>
            </div>

            {/* Total Score Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#746A5F] uppercase tracking-wider block font-semibold">
                  {isVie ? 'Điểm Trưởng ban GK' : 'Head Jury Score'}
                </span>
                <strong className="text-2xl sm:text-3xl font-sora font-extrabold text-[#B24A26] block">
                  {activeSubmission.isGraded || totalScore > 0 ? (
                    <>
                      {totalScore} <span className="text-sm font-normal text-[#746A5F]">/ {maxTotalScore}</span>
                    </>
                  ) : (
                    <span className="text-lg sm:text-xl font-medium text-[#746A5F]">
                      {isVie ? 'Chờ chấm' : 'Pending'}
                    </span>
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* Artwork Preview Panel */}
          <div className="relative group rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSubmission.artworkImageUrl}
              alt={activeSubmission.title}
              className="max-h-[500px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Top Overlay Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {activeSubmission.aiScanPassed && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E5D8C2] backdrop-blur-md border border-[#2F6B63]/40 text-[#2F6B63] text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isVie ? 'Đạt kiểm tra AI' : 'AI Scan Passed'}</span>
                </span>
              )}
            </div>

            {/* Zoom / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5D8C2] hover:bg-[#F0E7D8]/90 backdrop-blur-md border border-[#221E1A]/20 text-[#241F1A] text-xs transition-all shadow-lg cursor-pointer"
              title={isVie ? 'Soi chi tiết nét vẽ và tranh' : 'Inspect brushwork and details'}
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#B24A26]" />
              <span>{isVie ? 'Soi chi tiết nét vẽ' : 'Inspect Brushwork'}</span>
            </button>
          </div>

          {/* Artist Statement / Description */}
          {activeSubmission.description && (
            <div className="p-3.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-xs text-[#6E6459]">
              <strong className="block text-[#746A5F] mb-1 uppercase tracking-wider text-[10px]">
                {isVie ? 'Tuyên ngôn / Thông điệp tác giả' : 'Artist Statement'}
              </strong>
              <p className="leading-relaxed">{activeSubmission.description}</p>
            </div>
          )}

          {/* Rubric Criteria Evaluation */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sora font-semibold text-[#241F1A] text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#B24A26]" />
                <span>{isVie ? 'Tiêu chí chấm điểm' : 'Evaluation Rubric'}</span>
              </h3>
              <span className="text-xs text-[#746A5F]">
                {isVie ? 'Kéo thanh trượt hoặc nhập số điểm' : 'Adjust sliders or enter score points'}
              </span>
            </div>

            <div className="space-y-4">
              {criteria.map((crit) => {
                const currentScore = scores[crit.id] ?? 0;
                return (
                  <div key={crit.id} className="p-4 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-sora text-sm font-semibold text-[#241F1A] block">{crit.name}</span>
                        {crit.description && <p className="text-xs text-[#746A5F] mt-0.5">{crit.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={crit.maxScore}
                          value={currentScore}
                          disabled={isReadOnly}
                          onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                          className={`w-16 px-2 py-1 bg-[#FFFCF6] border rounded-lg text-right text-xs font-mono font-bold text-[#241F1A] focus:outline-none ${isReadOnly
                              ? 'border-[#221E1A]/10 opacity-60 cursor-not-allowed text-[#746A5F]'
                              : 'border-[#221E1A]/10 focus:border-[#B24A26]'
                            }`}
                        />
                        <span className="text-xs text-[#746A5F] font-mono">/ {crit.maxScore}</span>
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
                        disabled={isReadOnly}
                        onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value) || 0, crit.maxScore)}
                        className={`w-full accent-[#B24A26] ${isReadOnly ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
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
            <label className="font-sora font-semibold text-[#241F1A] text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B24A26]" />
              <span>{isVie ? 'Ghi chú chuyên môn của Trưởng ban GK' : 'Head Jury Professional Notes'}</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              disabled={isReadOnly}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isVie ? 'Đưa ra nhận xét cụ thể về kỹ thuật, nét vẽ, bố cục, màu sắc...' : 'Provide structured notes on execution, technique, or potential concerns...'}
              className={`w-full p-3 text-xs bg-[#FFFCF6] border rounded-xl text-[#241F1A] placeholder-[#746A5F] focus:outline-none leading-relaxed ${isReadOnly
                  ? 'border-[#221E1A]/10 opacity-60 cursor-not-allowed'
                  : 'border-[#221E1A]/10 focus:border-[#B24A26]'
                }`}
            />
          </div>

          {/* Confirmations Checkbox */}
          <div className="space-y-3 pt-2">
            <label className={`flex items-start gap-2.5 text-xs text-[#6E6459] ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={noConflict}
                disabled={isReadOnly}
                onChange={(e) => setNoConflict(e.target.checked)}
                className="mt-0.5 rounded border-[#221E1A]/20 bg-[#FFFCF6] text-[#B24A26] focus:ring-0 accent-[#B24A26] disabled:cursor-not-allowed"
              />
              <span>
                {isVie
                  ? 'Tôi cam kết không có bất kỳ xung đột lợi ích cá nhân hay tài chính nào liên quan đến thí sinh hoặc tác phẩm này.'
                  : 'I declare no personal or financial conflict of interest regarding this candidate or artwork submission.'}
              </span>
            </label>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#221E1A]/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => {
                  if (activeIndex > 0) {
                    setSelectedSubmissionId(submissions[activeIndex - 1].id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isVie ? 'Bài trước' : 'Previous'}</span>
              </button>

              <button
                type="button"
                disabled={activeIndex >= submissions.length - 1}
                onClick={() => {
                  if (activeIndex < submissions.length - 1) {
                    setSelectedSubmissionId(submissions[activeIndex + 1].id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{isVie ? 'Bài tiếp' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isReadOnly}
                className="px-4 py-2.5 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs font-semibold text-[#241F1A] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 text-[#B24A26]" />
                <span>{isVie ? 'Lưu bản nháp' : 'Save Draft'}</span>
              </button>

              <button
                type="submit"
                disabled={isReadOnly}
                className={`px-5 py-2.5 rounded-xl font-sora text-xs shadow-lg transition-all flex items-center gap-2 ${activeSubmission.isLocked
                    ? 'bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] font-extrabold cursor-not-allowed opacity-90'
                    : 'commission-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                  }`}
              >
                {activeSubmission.isLocked ? <Lock className="w-4 h-4 text-[#2F6B63]" /> : <Send className="w-4 h-4" />}
                <span>
                  {activeSubmission.isLocked
                    ? (isVie ? 'Điểm đã khóa' : 'Score Locked')
                    : (isVie ? 'Gửi điểm chấm của Trưởng ban' : 'Submit Head Jury Evaluation')}
                </span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass-container p-12 text-center rounded-2xl text-[#746A5F] lg:col-span-8 xl:col-span-8">
          {isVie ? 'Chọn một bài dự thi từ danh sách để bắt đầu đánh giá.' : 'Select a submission from the queue to start evaluation.'}
        </div>
      )}
    </div>
  );
}
