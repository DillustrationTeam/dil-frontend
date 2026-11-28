'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  onSuccess?: () => void;
}

export default function RaiseDisputeModal({
  isOpen,
  onClose,
  commissionId,
  onSuccess,
}: RaiseDisputeModalProps) {
  const [reasonCategory, setReasonCategory] = useState('');
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [details, setDetails] = useState('');
  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setReasonError(null);
    setSubmitError(null);

    if (!reasonCategory) {
      setReasonError('Vui lòng chọn loại lý do khiếu nại.');
      return;
    }

    if (!details.trim()) {
      setReasonError('Vui lòng mô tả chi tiết lý do khiếu nại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullReason = `[${reasonCategory}] ${details.trim()}`;
      const evidenceUrls = evidenceUrlInput.trim()
        ? evidenceUrlInput
            .split('\n')
            .map((url) => url.trim())
            .filter((url) => url.length > 0)
        : undefined;

      await commissionService.createDispute(commissionId, {
        reason: fullReason,
        evidenceUrls,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setSubmitError(extractErrorMessage(error, 'Không thể gửi đơn khiếu nại tranh chấp.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFFCF6]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#F7F2E9] border border-[#221E1A]/10 shadow-2xl overflow-hidden rounded-3xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8A6A1F]/20 text-[#8A6A1F] flex items-center justify-center border border-[#8A6A1F]/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Gửi Khiếu Nại Tranh Chấp</h3>
              <p className="text-[11px] text-[#746A5F]">Yêu cầu Ban Quản trị / Trọng tài can thiệp giải quyết</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!success ? (
            <>
              <div className="p-3.5 bg-[#8A6A1F]/10 border border-[#8A6A1F]/40 rounded-xl flex items-start gap-2.5 text-[#8A6A1F] text-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#8A6A1F]" />
                <span>
                  Khi gửi khiếu nại, trạng thái ký quỹ của đơn hàng sẽ bị tạm khóa (`Disputed`). Trọng tài sàn sẽ thẩm định lịch sử trò chuyện, các mốc phác thảo và bằng chứng để đưa ra phán quyết công bằng.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2"> Phân loại mâu thuẫn <span className="text-[#8A6A1F]">*</span>
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => {
                    setReasonCategory(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  className={`w-full p-3 bg-[#FFFCF6] rounded-xl text-xs text-[#241F1A] focus:outline-none transition-all ${
                    reasonError && !reasonCategory
                      ? 'border-2 border-[#8A6A1F]/40'
                      : 'border border-[#221E1A]/10 focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26]'
                  }`}
                >
                  <option value="" disabled className="bg-[#FFFCF6] text-[#746A5F]">{isVie ? 'Chọn lý do khiếu nại...' : 'Select a dispute reason...'}</option>
                  <option value="Họa sĩ vi phạm cam kết / đề bài" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Họa sĩ vẽ không đúng thỏa thuận đề bài ban đầu' : "Creator's work does not match the original brief"}</option>
                  <option value="Trễ hạn chót (Missed hạn chót)" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Quá hạn chót hoàn thành mà không có thỏa thuận' : 'Deadline passed without an agreed extension'}</option>
                  <option value="Nghi vấn AI / Chất lượng kém" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Nghi vấn tác phẩm sử dụng AI hoặc kém chất lượng' : 'Suspected AI-generated or low-quality artwork'}</option>
                  <option value="Không thống nhất được mốc nghiệm thu" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Bất đồng ý kiến không thể duyệt/sửa mốc phác thảo' : 'Unable to agree on approving or revising the sketch milestone'}</option>
                  <option value="Khách hàng yêu cầu vượt phạm vi hợp đồng" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Khách hàng đòi hỏi yêu cầu ngoài thỏa thuận ban đầu' : 'Client requested work beyond the original agreement'}</option>
                  <option value="Lý do khác" className="bg-[#FFFCF6] text-[#241F1A] py-2">{isVie ? 'Lý do khác' : 'Other reason'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2"> Mô tả chi tiết nội dung khiếu nại <span className="text-[#8A6A1F]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  placeholder="Ghi rõ diễn biến sự việc, các điểm mâu thuẫn và nguyện vọng mong muốn giải quyết..."
                  className={`w-full p-3 bg-[#FFFCF6] rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none transition-all ${
                    reasonError && !details.trim()
                      ? 'border-2 border-[#8A6A1F]/40'
                      : 'border border-[#221E1A]/10 focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26]'
                  }`}
                />
                {reasonError && (
                  <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#8A6A1F] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reasonError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2"> Link Bằng chứng đính kèm (Không bắt buộc, mỗi link 1 dòng) </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={evidenceUrlInput}
                    onChange={(e) => setEvidenceUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/...\nhttps://imgur.com/..."
                    className="w-full p-3 pl-9 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26] transition-all font-mono"
                  />
                  <LinkIcon className="w-4 h-4 text-[#746A5F] absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Inline API Error Banner */}
              {submitError && (
                <div role="alert" className="p-3.5 bg-[#A8321C]/10 border border-[#A8321C]/40 rounded-xl flex items-start gap-2.5 text-[#A8321C] text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A8321C]" />
                  <div>
                    <p className="font-bold text-[#A8321C]">Gửi khiếu nại thất bại</p>
                    <p className="mt-0.5 text-xs text-[#A8321C]">{submitError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">Đã gửi đơn khiếu nại thành công!</h4>
              <p className="text-xs text-[#746A5F]">Hồ sơ đã được chuyển tới Ban Trọng tài. Tiền ký quỹ đã được tạm khóa để chờ thẩm định.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#221E1A]/10 bg-[#FFFCF6]/90 flex justify-end gap-2.5 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6] transition-all"
          >
            {success ? 'Đóng' : 'Hủy bỏ'}
          </button>
          {!success && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#8A6A1F]/12 text-[#241F1A] shadow-lg shadow-[#8A6A1F] hover:bg-[#8A6A1F]/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đơn khiếu nại'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
