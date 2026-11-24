'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface ComplianceArbitrationFormProps {
  decision: string;
  onDecisionChange: (d: string) => void;
}

export function ComplianceArbitrationForm({
  decision,
  onDecisionChange,
}: ComplianceArbitrationFormProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-4">
      {/* 3 Action Buttons for Compliance / Rule / AI / Copyright Violations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onDecisionChange('Disqualify')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Disqualify'
              ? 'border-[#A8321C]/30 bg-[#A8321C]/20 text-[#241F1A] shadow-lg shadow-[#A8321C]'
              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:bg-[#F0E7D8] hover:border-[#221E1A]/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-[#A8321C]">
              <ShieldAlert className="w-4 h-4 text-[#A8321C] shrink-0" />
              <span>{isVie ? 'Truất quyền bài thi' : 'Disqualify Entry'}</span>
            </div>
            <p className="text-[11px] text-[#746A5F] leading-normal">
              {isVie
                ? 'Xác nhận vi phạm thể lệ hoặc AI/bản quyền. Hủy bài dự thi.'
                : 'Confirm rule or AI/copyright violation. Disqualify entry.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Disqualify' ? 'text-[#A8321C]' : 'text-[#746A5F]'
            }`}
          >
            {decision === 'Disqualify'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecisionChange('Dismiss')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Dismiss'
              ? 'border-[#2F6B63]/30 bg-[#2F6B63]/20 text-[#241F1A] shadow-lg shadow-[#2F6B63]'
              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:bg-[#F0E7D8] hover:border-[#221E1A]/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-[#2F6B63]">
              <ShieldCheck className="w-4 h-4 text-[#2F6B63] shrink-0" />
              <span>{isVie ? 'Bác bỏ khiếu nại' : 'Dismiss Dispute'}</span>
            </div>
            <p className="text-[11px] text-[#746A5F] leading-normal">
              {isVie
                ? 'Bài thi hợp lệ, khiếu nại không đủ căn cứ. Duy trì bài dự thi.'
                : 'Submission is valid and compliant. Retain entry in contest.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Dismiss' ? 'text-[#2F6B63]' : 'text-[#746A5F]'
            }`}
          >
            {decision === 'Dismiss'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecisionChange('Request Panel Re-evaluation')}
          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
            decision === 'Request Panel Re-evaluation'
              ? 'border-[#8A6A1F]/30 bg-[#8A6A1F]/20 text-[#241F1A] shadow-lg shadow-[#8A6A1F]'
              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:bg-[#F0E7D8] hover:border-[#221E1A]/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sora text-xs font-bold text-[#8A6A1F]">
              <UserCheck className="w-4 h-4 text-[#8A6A1F] shrink-0" />
              <span>{isVie ? 'Yêu cầu kiểm tra lại' : 'Request Inspection'}</span>
            </div>
            <p className="text-[11px] text-[#746A5F] leading-normal">
              {isVie
                ? 'Yêu cầu thí sinh bổ sung bằng chứng và hội đồng thẩm định thêm.'
                : 'Request additional evidence and panel inspection.'}
            </p>
          </div>
          <span
            className={`mt-2 text-[10px] font-bold ${
              decision === 'Request Panel Re-evaluation' ? 'text-[#8A6A1F]' : 'text-[#746A5F]'
            }`}
          >
            {decision === 'Request Panel Re-evaluation'
              ? (isVie ? '✓ Đã chọn' : '✓ Selected')
              : (isVie ? 'Nhấp để chọn' : 'Click to select')}
          </span>
        </button>
      </div>

      {/* Disqualify Details Note */}
      {decision === 'Disqualify' && (
        <div className="p-4 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-sora font-bold text-[#A8321C]">
            <ShieldAlert className="w-4 h-4 text-[#A8321C]" />
            <span>{isVie ? 'Xác nhận truất quyền bài dự thi' : 'Confirm Entry Disqualification'}</span>
          </div>
          <p className="text-[#6E6459] leading-relaxed">
            {isVie
              ? 'Tác phẩm sẽ bị đánh dấu vi phạm và loại bỏ vĩnh viễn khỏi bảng xếp hạng cuộc thi. Điểm số của Ban Giám Khảo và lượt bình chọn cho bài thi này sẽ bị xóa bỏ.'
              : 'The artwork will be disqualified and permanently excluded from competition standings. All jury scores and votes cast for this entry will be cleared.'}
          </p>
        </div>
      )}

      {/* Dismiss Details Note */}
      {decision === 'Dismiss' && (
        <div className="p-4 rounded-xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-sora font-bold text-[#2F6B63]">
            <ShieldCheck className="w-4 h-4 text-[#2F6B63]" />
            <span>{isVie ? 'Bác bỏ khiếu nại - Công nhận tính hợp lệ' : 'Dismiss Dispute - Affirm Compliance'}</span>
          </div>
          <p className="text-[#6E6459] leading-relaxed">
            {isVie
              ? 'Khiếu nại được xác định là không có cơ sở. Tác phẩm vẫn tiếp tục duy trì tư cách dự thi và điểm số đã được chấm.'
              : 'The dispute is determined to be unfounded. The submission remains fully eligible and keeps its current evaluation.'}
          </p>
        </div>
      )}
    </div>
  );
}
