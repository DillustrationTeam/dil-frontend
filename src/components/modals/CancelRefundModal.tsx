'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';

interface CancelRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  onSuccess?: () => void;
}

export default function CancelRefundModal({
  isOpen,
  onClose,
  commissionId,
  onSuccess,
}: CancelRefundModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setReasonError(null);
    setSubmitError(null);

    if (!reason) {
      setReasonError('Vui lòng chọn lý do hủy đơn hàng.');
      return;
    }

    setIsSubmitting(true);
    try {
      await commissionService.cancelWithPolicy(commissionId, { cancellationReason: reason, details });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setSubmitError(extractErrorMessage(error, 'Không thể gửi yêu cầu hủy đơn hàng.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#131522] border border-white/20 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Hủy đơn hàng & Hoàn tiền</h3>
              <p className="text-[11px] text-slate-300">Yêu cầu hủy đơn và xử lý hoàn số dư Escrow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!success ? (
            <>
              <div className="p-3.5 bg-red-950/50 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>
                  Hủy đơn sẽ hoàn trả số dư tiền ký quỹ Escrow còn lại vào ví của bạn. Các khoản tiền mốc đã được phê duyệt giải ngân trước đó không thể hoàn lại trực tiếp.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Lý do hủy đơn hàng <span className="text-red-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  className={`w-full p-3 bg-[#1c1f33] rounded-xl text-sm text-white focus:outline-none ${
                    reasonError ? 'border-2 border-red-500/80' : 'border border-white/20 focus:border-indigo-400'
                  }`}
                >
                  <option value="" disabled className="bg-[#1c1f33] text-slate-300">Chọn lý do hủy...</option>
                  <option value="Creator unresponsive" className="bg-[#1c1f33] text-white py-2">Creator không phản hồi / Quá lâu</option>
                  <option value="Missed deadline" className="bg-[#1c1f33] text-white py-2">Quá hạn chót hoàn thành (Deadline)</option>
                  <option value="Quality issues" className="bg-[#1c1f33] text-white py-2">Chất lượng vẽ không như thỏa thuận</option>
                  <option value="Mutual agreement" className="bg-[#1c1f33] text-white py-2">Đồng ý hủy từ cả 2 phía</option>
                  <option value="Other" className="bg-[#1c1f33] text-white py-2">Lý do khác</option>
                </select>

                {/* Inline field error */}
                {reasonError && (
                  <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reasonError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Chi tiết bổ sung (Không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ghi rõ thêm hoàn cảnh hoặc lý do cụ thể..."
                  className="w-full p-3 bg-[#1c1f33] border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Inline API Error Banner */}
              {submitError && (
                <div role="alert" className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start gap-2.5 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <p className="font-bold text-red-200">Xử lý hủy thất bại</p>
                    <p className="mt-0.5 text-xs text-red-200/95">{submitError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Đã xử lý hủy đơn hàng!</h4>
              <p className="text-xs text-slate-300">Số tiền ký quỹ Escrow còn lại đã được hoàn trả vào ví của bạn.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/90 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/15 text-slate-200 hover:bg-white/10"
          >
            {success ? 'Đóng' : 'Giữ đơn hàng'}
          </button>
          {!success && (
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Hủy & Hoàn tiền'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
