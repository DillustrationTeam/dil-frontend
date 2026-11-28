'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { eventSubmissionService } from '@/features/event/services/event-submission.service';
import type { EventSubmissionDto, SubmissionDisputeCategory } from '@/features/event/types/event.types';

const DISPUTE_CATEGORY_OPTIONS: Array<{
  value: SubmissionDisputeCategory;
  label: string;
  labelVie: string;
  hint: string;
  hintVie: string;
}> = [
  {
    value: 'AiArt',
    label: 'AI-Generated Art',
    labelVie: 'Tranh tạo bằng AI',
    hint: 'Suspected undisclosed AI usage',
    hintVie: 'Nghi vấn sử dụng AI không khai báo',
  },
  {
    value: 'Copyright',
    label: 'Copyright / Plagiarism',
    labelVie: 'Bản quyền / Đạo nhái',
    hint: 'Traced, stolen, or unauthorized artwork',
    hintVie: 'Đồ nét, sao chép hoặc tranh không có bản quyền',
  },
  {
    value: 'VoteFraud',
    label: 'Vote Manipulation',
    labelVie: 'Gian lận bình chọn',
    hint: 'Suspicious voting / bot activity',
    hintVie: 'Buff vote, bot hoặc hành vi bất thường',
  },
  {
    value: 'RuleViolation',
    label: 'Contest Rule Violation',
    labelVie: 'Vi phạm thể lệ cuộc thi',
    hint: 'Off-theme, NSFW, or format breach',
    hintVie: 'Sai chủ đề, vi phạm thuần phong mỹ tục, sai định dạng',
  },
  {
    value: 'ScoreAppeal',
    label: 'Judging / Score Concern',
    labelVie: 'Khiếu nại kết quả / Chấm điểm',
    hint: 'Scoring discrepancy or fairness issue',
    hintVie: 'Sai lệch điểm số hoặc vấn đề tính công bằng',
  },
  {
    value: 'Other',
    label: 'Other Issue',
    labelVie: 'Vấn đề khác',
    hint: 'Any other dispute not listed above',
    hintVie: 'Các khiếu nại khác chưa có trong danh sách',
  },
];

interface SubmissionDisputeModalProps {
  submission: EventSubmissionDto;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmissionDisputeModal({
  submission,
  onClose,
  onSuccess,
}: SubmissionDisputeModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SubmissionDisputeCategory>('Copyright');
  const [evidenceInputs, setEvidenceInputs] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddEvidence = () => {
    if (evidenceInputs.length < 5) {
      setEvidenceInputs([...evidenceInputs, '']);
    }
  };

  const handleEvidenceChange = (index: number, val: string) => {
    const updated = [...evidenceInputs];
    updated[index] = val;
    setEvidenceInputs(updated);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceInputs(evidenceInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(isVie ? 'Vui lòng nêu rõ lý do khiếu nại.' : 'Please specify the dispute reason.');
      return;
    }

    const validUrls = evidenceInputs.map((u) => u.trim()).filter((u) => u.length > 0);

    setSubmitting(true);
    try {
      await eventSubmissionService.createDispute(submission.id, {
        category,
        reason: reason.trim(),
        description: description.trim() || undefined,
        evidenceUrls: validUrls.length > 0 ? validUrls : undefined,
      });

      toast.success(
        isVie
          ? 'Đã gửi khiếu nại thành công. Ban tổ chức và giám khảo sẽ xem xét bài thi này.'
          : 'Dispute reported successfully. The contest moderators and jury will review this submission.'
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Không thể gửi khiếu nại.' : 'Failed to file dispute.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#221E1A]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#8A6A1F]/10 text-[#8A6A1F] border border-[#8A6A1F]/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-h1 text-lg font-bold text-[#241F1A] sm:text-xl">
                {isVie ? 'Khiếu nại bài dự thi' : 'File a Dispute'}
              </h3>
              <p className="text-xs text-[#6E6459]">
                {isVie
                  ? `Báo cáo bài dự thi #${submission.id.slice(0, 8)} để xem xét`
                  : `Report submission #${submission.id.slice(0, 8)} for review`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-2 text-[#6E6459] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition disabled:opacity-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Target Submission Summary */}
        <div className="my-5 flex items-center gap-3.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3.5">
          {submission.artworkImageUrl || submission.artworkThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={submission.artworkImageUrl || submission.artworkThumbnailUrl}
              alt={submission.title}
              className="size-14 shrink-0 rounded-xl object-cover border border-[#221E1A]/10"
            />
          ) : (
            <div className="size-14 shrink-0 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 flex items-center justify-center text-xs text-[#6E6459]">
              {isVie ? 'Không có ảnh' : 'No img'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-brand-periwinkle font-medium">
              {isVie ? 'Bài dự thi' : 'Contest Submission'}
            </p>
            <h4 className="truncate text-sm font-bold text-[#241F1A]">{submission.title}</h4>
            <p className="truncate text-xs text-[#6E6459]">
              {isVie ? 'Tác giả:' : 'Artist:'}{' '}
              <span className="text-[#D6D9FF]">@{submission.submitterName || (isVie ? 'Họa sĩ' : 'Artist')}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#241F1A]">
              {isVie ? 'Lý do / Tóm tắt' : 'Reason / Summary'} <span className="text-[#A8321C]">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isVie ? 'Ví dụ: Tác phẩm đạo nhái tranh gốc trên ArtStation' : 'e.g. Artwork plagiarized from original art on ArtStation'}
              maxLength={200}
              required
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 py-2.5 text-xs text-[#241F1A] placeholder-[#6E6459] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          {/* Dispute Content Category */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-[#241F1A]">
                {isVie ? 'Phân loại khiếu nại' : 'Dispute Category'} <span className="text-[#A8321C]">*</span>
              </label>
              <span className="text-[10px] text-[#6E6459]">
                {isVie ? 'Mức độ ưu tiên tự động gán theo phân loại' : 'Priority is auto-assigned by category'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DISPUTE_CATEGORY_OPTIONS.map((opt) => {
                const active = category === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setCategory(opt.value)}
                    className={`rounded-xl px-3 py-2 text-left border transition cursor-pointer ${
                      active
                        ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-[#241F1A]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:bg-[#F0E7D8] hover:text-[#241F1A]'
                    }`}
                  >
                    <span className={`block text-xs font-semibold ${active ? 'text-brand-periwinkle' : 'text-[#241F1A]'}`}>
                      {isVie ? opt.labelVie : opt.label}
                    </span>
                    <span className="block text-[10px] text-[#6E6459] mt-0.5 line-clamp-1">
                      {isVie ? opt.hintVie : opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#241F1A]">
              {isVie ? 'Mô tả chi tiết (tùy chọn)' : 'Detailed Description (optional)'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isVie ? 'Cung cấp thêm ngữ cảnh hoặc ghi chú cho ban giám khảo / kiểm duyệt viên...' : 'Provide more context or notes for the jury/moderator...'}
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs text-[#241F1A] placeholder-[#6E6459] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          {/* Evidence URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#241F1A]">
                {isVie ? 'Liên kết bằng chứng (tùy chọn)' : 'Evidence Links (optional)'}
              </label>
              {evidenceInputs.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-periwinkle hover:underline cursor-pointer"
                >
                  <Plus size={12} /> {isVie ? 'Thêm liên kết' : 'Add link'}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {evidenceInputs.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6459]" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleEvidenceChange(idx, e.target.value)}
                      placeholder={isVie ? 'https://example.com/link-bang-chung-hoac-tranh-goc' : 'https://example.com/evidence-or-original-link'}
                      className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-8 pr-3 text-xs text-[#241F1A] placeholder-[#6E6459] focus:border-brand-periwinkle focus:outline-none"
                    />
                  </div>
                  {evidenceInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(idx)}
                      className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-2 text-[#6E6459] hover:text-[#A8321C] hover:border-[#A8321C]/40 transition cursor-pointer"
                      title={isVie ? 'Xóa liên kết' : 'Remove link'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caution Note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#8A6A1F]/30 bg-[#8A6A1F]/5 p-3 text-[11px] text-[#8A6A1F] leading-relaxed">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#8A6A1F]" />
            <span>
              {isVie
                ? 'Khiếu nại sai sự thật hoặc mang tính phá hoại có thể dẫn đến xử phạt tài khoản. Vui lòng cung cấp thông tin trung thực.'
                : 'False or malicious disputes can result in penalties on your account. Please submit evidence truthfully.'}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221E1A]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2.5 text-xs font-semibold text-[#6E6459] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition disabled:opacity-50 cursor-pointer"
            >
              {isVie ? 'Hủy bỏ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8A6A1F]/12 hover:bg-[#8A6A1F]/10 text-[#241F1A] px-5 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-[#8A6A1F]"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isVie ? 'Đang gửi...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  {isVie ? 'Gửi khiếu nại' : 'Submit Dispute'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
