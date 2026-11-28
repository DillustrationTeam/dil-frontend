'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  EyeOff,
  Bot,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { ModerationActionType } from '@/features/admin/types/moderation.types';
import { useLanguage } from '@/context/language-context';
import { z } from 'zod';

const moderationSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'flag_ai']),
  note: z.string().max(1000, 'Audit note must be 1000 characters or fewer.'),
}).refine((value) => value.action !== 'reject' || value.note.trim().length > 0, {
  path: ['note'],
  message: 'Audit note is required when rejecting an artwork.',
});

interface ModerationDecisionFormProps {
  artworkId: string;
  isSubmitting: boolean;
  currentStatus: string;
  onExecuteDecision: (
    artworkId: string,
    action: ModerationActionType,
    moderationNote?: string
  ) => Promise<boolean>;
}

export function ModerationDecisionForm({
  artworkId,
  isSubmitting,
  onExecuteDecision,
}: ModerationDecisionFormProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [selectedAction, setSelectedAction] = useState<ModerationActionType>('approve');
  const [auditNote, setAuditNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isRejectAction = selectedAction === 'reject';
  const isNoteInvalid = isRejectAction && !auditNote.trim();

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const parsed = moderationSchema.safeParse({ action: selectedAction, note: auditNote });
    if (!parsed.success) {
      return;
    }
    setConfirming(true);
  };

  const handleExecute = async () => {
    const parsed = moderationSchema.safeParse({ action: selectedAction, note: auditNote });
    if (!parsed.success) {
      setConfirming(false);
      return;
    }

    const success = await onExecuteDecision(artworkId, parsed.data.action, parsed.data.note);
    if (success) {
      setAuditNote('');
      setTouched(false);
      setConfirming(false);
    }
  };

  // Nền đặc (solid) ở theme paper; ở theme ink (html[data-theme="ink"]) gallery.css
  // tự map bg-[#2F6B63] → --petrol-soft (nền nhạt), nên chữ phải đổi sang token sáng
  // tương ứng, nếu không sẽ ra chữ trắng trên nền nhạt = không đọc được.
  const getActionButtonStyle = () => {
    switch (selectedAction) {
      case 'approve':
        return 'bg-[#2F6B63] hover:brightness-110 text-[#FFFCF6] border border-[#2F6B63] shadow-sm [html[data-theme=ink]_&]:text-[#7fd1be]';
      case 'reject':
        return 'bg-[#A8321C] hover:brightness-110 text-[#FFFCF6] border border-[#A8321C] shadow-sm [html[data-theme=ink]_&]:text-[#f08a6e]';
      case 'hide':
        return 'bg-[#8A6A1F] hover:brightness-110 text-[#FFFCF6] border border-[#8A6A1F] shadow-sm [html[data-theme=ink]_&]:text-[#c9a96a]';
      case 'flag_ai':
        return 'bg-[#5F3F86] hover:brightness-110 text-[#FFFCF6] border border-[#5F3F86] shadow-sm [html[data-theme=ink]_&]:text-[#cbd0f2]';
      default:
        return 'bg-[#2F6B63] hover:brightness-110 text-[#FFFCF6] border border-[#2F6B63] shadow-sm [html[data-theme=ink]_&]:text-[#7fd1be]';
    }
  };

  return (
    <form
      onSubmit={handleStartSubmit}
      className="space-y-4 text-xs pt-4 border-t border-[#221E1A]/10"
    >
      <div className="space-y-2">
        <label
          htmlFor="moderation-action-select"
          className="block font-bold text-[#241F1A] font-h1 text-xs"
        >
          {isVie ? 'Chọn Quyết định Kiểm duyệt' : 'Select Moderation Action'}
        </label>

        {/* Action Select Dropdown matching SCR-20 mockup */}
        <select
          id="moderation-action-select"
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value as ModerationActionType);
            setConfirming(false);
          }}
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-[#E5D8C2] border border-[#221E1A]/10 text-[#241F1A] font-bold text-xs focus:border-[#A8321C]/30 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="approve" className="bg-[#FFFCF6] text-[#2F6B63] py-2">
            {isVie ? '✓ Phê duyệt & Công khai lên Sàn' : '✓ Approve & Publish to Public Feed'}
          </option>
          <option value="reject" className="bg-[#FFFCF6] text-[#A8321C] py-2">
            {isVie ? '✕ Từ chối & Xóa tác phẩm' : '✕ Reject & Delete Artwork'}
          </option>
          <option value="hide" className="bg-[#FFFCF6] text-[#8A6A1F] py-2">
            {isVie ? '👁️ Ẩn khỏi Đề xuất' : '👁️ Hide from Recommendations'}
          </option>
          <option value="flag_ai" className="bg-[#FFFCF6] text-[#5F3F86] py-2">
            {isVie ? '🤖 Gắn nhãn AI tạo (Tag.IsAiGenerated = true)' : '🤖 Flag as AI Generated (Tag.IsAiGenerated = true)'}
          </option>
        </select>
      </div>

      {/* Action Description Hint */}
      <div className="p-3 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 flex items-start gap-2.5 text-[11px] text-[#6E6459]">
        {selectedAction === 'approve' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-[#2F6B63] shrink-0 mt-0.5" />
            <span>
              {isVie
                ? 'Tác phẩm sẽ được phê duyệt ngay và xuất hiện trên bảng khám phá và trang cá nhân họa sĩ.'
                : 'Artwork will be approved immediately and shown in marketplace discovery and artist profile.'}
            </span>
          </>
        )}
        {selectedAction === 'reject' && (
          <>
            <XCircle className="w-4 h-4 text-[#A8321C] shrink-0 mt-0.5" />
            <span className="text-[#A8321C]">
              {isVie
                ? 'Tác phẩm sẽ bị ẩn/xóa mềm vĩnh viễn khỏi chế độ xem công khai do vi phạm tiêu chuẩn cộng đồng. Bắt buộc nhập ghi chú kiểm toán.'
                : 'Artwork will be permanently soft-deleted from public view due to community guideline violations. Audit note is required.'}
            </span>
          </>
        )}
        {selectedAction === 'hide' && (
          <>
            <EyeOff className="w-4 h-4 text-[#8A6A1F] shrink-0 mt-0.5" />
            <span>
              {isVie
                ? 'Tác phẩm vẫn có thể truy cập trực tiếp qua URL nhưng không xuất hiện trong đề xuất thuật toán.'
                : 'Artwork remains accessible directly via URL but excluded from algorithmic recommendations.'}
            </span>
          </>
        )}
        {selectedAction === 'flag_ai' && (
          <>
            <Bot className="w-4 h-4 text-[#5F3F86] shrink-0 mt-0.5" />
            <span>
              {isVie
                ? 'Tác phẩm được tạo bởi AI sẽ được gắn huy hiệu AI bắt buộc và lọc tìm kiếm tương ứng.'
                : 'Artworks created by generative AI tools will have the AI badge enforced and search filtered accordingly.'}
            </span>
          </>
        )}
      </div>

      {/* Internal Moderation Audit Note */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="moderation-audit-note"
            className="block font-bold text-[#241F1A] text-xs font-h1 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#6E6459]" />
            <span>{isVie ? 'Ghi chú Kiểm duyệt Nội bộ' : 'Internal Moderation Audit Note'}</span>
            {isRejectAction && <span className="text-[#A8321C]">*</span>}
          </label>
          <span className="text-[10px] text-[#6E6459] font-mono">
            {auditNote.length}/1000
          </span>
        </div>

        <textarea
          id="moderation-audit-note"
          rows={2}
          maxLength={1000}
          value={auditNote}
          onChange={(e) => setAuditNote(e.target.value)}
          disabled={isSubmitting}
          placeholder={
            isVie
              ? 'Ví dụ: Đã kiểm tra nội dung tranh đạt tiêu chuẩn cộng đồng...'
              : 'e.g. Verified image content meets community standards...'
          }
          className={`w-full px-3.5 py-2.5 bg-[#F0E7D8] rounded-xl border text-[#241F1A] text-xs placeholder:text-[#6E6459] focus:outline-none transition-colors font-body ${
            touched && isNoteInvalid
              ? 'border-[#A8321C]/30 bg-[#A8321C]/10'
              : 'border-[#221E1A]/10 focus:border-[#A8321C]/30'
          }`}
        />

        {touched && isNoteInvalid && (
          <p className="text-[10px] text-[#A8321C] font-semibold">
            {isVie
              ? 'Bắt buộc nhập ghi chú khi từ chối tác phẩm để lưu lại nhật ký xem xét.'
              : 'Audit note is required when rejecting an artwork to inform review logs.'}
          </p>
        )}
      </div>

      {/* Action Button & Confirmation Step */}
      {confirming ? (
        <div className="p-3.5 rounded-xl bg-[#F0E7D8] border border-[#8A6A1F] space-y-3">
          <p className="text-[#241F1A] text-xs font-semibold">
            {isVie ? 'Xác nhận thực hiện hành động ' : 'Confirm executing action '}
            <strong className="text-[#8A6A1F] uppercase">{selectedAction}</strong>{' '}
            {isVie ? 'đối với tác phẩm này?' : 'for this artwork?'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecute}
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${getActionButtonStyle()}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isVie ? 'Đang xử lý...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isVie ? 'Xác nhận thực thi' : 'Confirm Execution'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
              className="px-4 py-2.5 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold rounded-xl text-xs border border-[#221E1A]/15 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isVie ? 'Hủy' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getActionButtonStyle()}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isVie ? 'Đang thực thi quyết định...' : 'Executing Moderation Decision...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{isVie ? 'Thực thi Quyết định Kiểm duyệt' : 'Execute Moderation Decision'}</span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
