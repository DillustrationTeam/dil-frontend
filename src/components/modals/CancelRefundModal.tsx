'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import type { Commission } from '@/types/commission.types';

interface CancelRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  commission?: Commission | null;
  currentUserId?: string | null;
  onSuccess?: () => void;
}

export default function CancelRefundModal({
  isOpen,
  onClose,
  commissionId,
  commission,
  currentUserId,
  onSuccess,
}: CancelRefundModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!reason) return alert('Please select a reason.');
    setIsSubmitting(true);
    try {
      const updated = await commissionService.cancelWithPolicy(commissionId, { cancellationReason: reason, details });
      setResultMessage(updated.status === 'Cancelled'
        ? 'Đơn đã được hủy và phần Escrow còn lại đã được hoàn.'
        : 'Yêu cầu hủy đã được gửi. Bên còn lại có 48 giờ để phản hồi.');
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to cancel commission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequest = commission?.cancellationRequestStatus === 'Pending';
  const canRespond = pendingRequest && commission.cancellationRequestedById !== currentUserId;

  const handleResponse = async (approve: boolean) => {
    setIsSubmitting(true);
    try {
      await commissionService.respondCancellationRequest(commissionId, approve);
      setResultMessage(approve ? 'Đã đồng ý hủy đơn.' : 'Đã từ chối yêu cầu hủy đơn.');
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1000);
    } catch (error) {
      console.error(error);
      alert('Không thể phản hồi yêu cầu hủy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Cancel Commission</h3>
              <p className="text-[11px] text-slate-400">Request cancellation & refund</p>
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
        <div className="p-6 space-y-4">
          {!success && pendingRequest ? (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="font-semibold text-amber-200">Yêu cầu hủy đang chờ phản hồi</p>
                <p className="mt-2 text-xs"><strong>Lý do:</strong> {commission?.cancellationReason}</p>
                {commission?.cancellationDetails ? <p className="mt-1 text-xs"><strong>Chi tiết:</strong> {commission.cancellationDetails}</p> : null}
                {commission?.cancellationRequestExpiresAt ? <p className="mt-1 text-xs"><strong>Hạn phản hồi:</strong> {new Date(commission.cancellationRequestExpiresAt).toLocaleString('vi-VN')}</p> : null}
              </div>
              <p className="text-xs text-slate-400">{canRespond ? 'Bạn có thể đồng ý hoặc từ chối yêu cầu này.' : 'Đang chờ bên còn lại phản hồi.'}</p>
            </div>
          ) : !success ? (
            <>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-300 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>
                  Canceling will refund the remaining Escrow balance to you. Any funds already released for approved milestones cannot be refunded directly.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Reason for Cancellation
                </label>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full p-3 bg-[#1b1b1e] rounded-xl text-xs text-white focus:outline-none transition-all border border-white/10 focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]"
                >
                  <option value="" disabled className="bg-[#1b1b1e] text-slate-400">Chọn lý do hủy đơn...</option>
                  <option value="Creator unresponsive" className="bg-[#1b1b1e] text-white py-2">Creator không phản hồi</option>
                  <option value="Missed deadline" className="bg-[#1b1b1e] text-white py-2">Creator đã quá hạn hoàn thành</option>
                  <option value="Quality issues" className="bg-[#1b1b1e] text-white py-2">Chất lượng không đạt yêu cầu hoặc không đúng thỏa thuận</option>
                  <option value="Mutual agreement" className="bg-[#1b1b1e] text-white py-2">Hai bên đồng ý hủy đơn</option>
                  <option value="Other" className="bg-[#1b1b1e] text-white py-2">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide more context..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Cancellation Processed!</h4>
              <p className="text-xs text-slate-400">{resultMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
          >
            {success ? 'Close' : 'Keep Commission'}
          </button>
          {!success && pendingRequest && canRespond ? (
            <>
              <button onClick={() => handleResponse(false)} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50">Từ chối</button>
              <button onClick={() => handleResponse(true)} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">Đồng ý hủy</button>
            </>
          ) : !success && !pendingRequest ? (
            <button
              onClick={handleCancel}
              disabled={isSubmitting || !reason}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Cancel & Refund'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
