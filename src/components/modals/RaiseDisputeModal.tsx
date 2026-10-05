'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D14]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1F2335] border border-white/10 shadow-2xl overflow-hidden rounded-3xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Gửi Khiếu Nại Tranh Chấp</h3>
              <p className="text-[11px] text-[#919099]">Yêu cầu Ban Quản trị / Trọng tài can thiệp giải quyết</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!success ? (
            <>
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-200 text-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Khi gửi khiếu nại, trạng thái ký quỹ Escrow của đơn hàng sẽ bị tạm khóa (`Disputed`). Trọng tài sàn sẽ thẩm định lịch sử chat, các mốc phác thảo và bằng chứng để đưa ra phán quyết công bằng.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#919099] uppercase tracking-wider mb-2">
                  Phân loại mâu thuẫn <span className="text-amber-400">*</span>
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => {
                    setReasonCategory(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  className={`w-full p-3 bg-[#1b1b1e] rounded-xl text-xs text-white focus:outline-none transition-all ${
                    reasonError && !reasonCategory
                      ? 'border-2 border-amber-500/80'
                      : 'border border-white/10 focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]'
                  }`}
                >
                  <option value="" disabled className="bg-[#1b1b1e] text-slate-400">Chọn lý do khiếu nại...</option>
                  <option value="Creator vi phạm cam kết / Brief" className="bg-[#1b1b1e] text-white py-2">Creator vẽ không đúng thỏa thuận brief ban đầu</option>
                  <option value="Trễ hạn chót (Missed Deadline)" className="bg-[#1b1b1e] text-white py-2">Quá hạn chót hoàn thành mà không có thỏa thuận</option>
                  <option value="Nghi vấn AI / Chất lượng kém" className="bg-[#1b1b1e] text-white py-2">Nghi vấn tác phẩm sử dụng AI hoặc kém chất lượng</option>
                  <option value="Không thống nhất được mốc nghiệm thu" className="bg-[#1b1b1e] text-white py-2">Bất đồng ý kiến không thể duyệt/sửa mốc phác thảo</option>
                  <option value="Khách hàng yêu cầu vượt phạm vi hợp đồng" className="bg-[#1b1b1e] text-white py-2">Khách hàng đòi hỏi yêu cầu ngoài thỏa thuận ban đầu</option>
                  <option value="Lý do khác" className="bg-[#1b1b1e] text-white py-2">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#919099] uppercase tracking-wider mb-2">
                  Mô tả chi tiết nội dung khiếu nại <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  placeholder="Ghi rõ diễn biến sự việc, các điểm mâu thuẫn và nguyện vọng mong muốn giải quyết..."
                  className={`w-full p-3 bg-[#1b1b1e] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                    reasonError && !details.trim()
                      ? 'border-2 border-amber-500/80'
                      : 'border border-white/10 focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]'
                  }`}
                />
                {reasonError && (
                  <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reasonError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#919099] uppercase tracking-wider mb-2">
                  Link Bằng chứng đính kèm (Không bắt buộc, mỗi link 1 dòng)
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={evidenceUrlInput}
                    onChange={(e) => setEvidenceUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/...\nhttps://imgur.com/..."
                    className="w-full p-3 pl-9 bg-[#1b1b1e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all font-mono"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Inline API Error Banner */}
              {submitError && (
                <div role="alert" className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <p className="font-bold text-rose-200">Gửi khiếu nại thất bại</p>
                    <p className="mt-0.5 text-xs text-rose-200/95">{submitError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Đã gửi đơn khiếu nại thành công!</h4>
              <p className="text-xs text-slate-300">Hồ sơ đã được chuyển tới Ban Trọng tài. Tiền ký quỹ Escrow đã được tạm khóa để chờ thẩm định.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/90 flex justify-end gap-2.5 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 transition-all"
          >
            {success ? 'Đóng' : 'Hủy bỏ'}
          </button>
          {!success && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đơn khiếu nại'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
