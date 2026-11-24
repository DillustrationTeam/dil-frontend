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
  onSuccess?: (action: 'cancelled_immediately' | 'cancel_requested' | 'cancel_approved' | 'cancel_rejected') => void;
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
        ? 'Đơn đã được hủy và phần ký quỹ còn lại đã được hoàn.'
        : 'Yêu cầu hủy đã được gửi. Bên còn lại có 48 giờ để phản hồi.');
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(updated.status === 'Cancelled' ? 'cancelled_immediately' : 'cancel_requested');
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
      setTimeout(() => onSuccess?.(approve ? 'cancel_approved' : 'cancel_rejected'), 1000);
    } catch (error) {
      console.error(error);
      alert('Không thể phản hồi yêu cầu hủy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#FFFCF6]/95 border border-[#221E1A]/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A8321C]/20 text-[#A8321C] flex items-center justify-center border border-[#A8321C]/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Cancel Commission</h3>
              <p className="text-[11px] text-[#746A5F]">Request cancellation & refund</p>
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
        <div className="p-6 space-y-4">
          {!success && pendingRequest ? (
            <div className="space-y-4 text-sm text-[#746A5F]">
              <div className="rounded-xl border border-[#8A6A1F]/30 bg-[#8A6A1F]/10 p-4">
                <p className="font-semibold text-[#8A6A1F]">Yêu cầu hủy đang chờ phản hồi</p>
                <p className="mt-2 text-xs"><strong>Lý do:</strong> {commission?.cancellationReason}</p>
                {commission?.cancellationDetails ? <p className="mt-1 text-xs"><strong>Chi tiết:</strong> {commission.cancellationDetails}</p> : null}
                {commission?.cancellationRequestExpiresAt ? <p className="mt-1 text-xs"><strong>Hạn phản hồi:</strong> {new Date(commission.cancellationRequestExpiresAt).toLocaleString('vi-VN')}</p> : null}
              </div>
              <p className="text-xs text-[#746A5F]">{canRespond ? 'Bạn có thể đồng ý hoặc từ chối yêu cầu này.' : 'Đang chờ bên còn lại phản hồi.'}</p>
            </div>
          ) : !success ? (
            <>
              <div className="p-3 bg-[#A8321C]/10 border border-[#A8321C]/30 rounded-xl flex items-start gap-2.5 text-[#A8321C] text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A8321C]" />
                <span>
                  Canceling will refund the remaining Escrow balance to you. Any funds already released for approved milestones cannot be refunded directly.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2">
                  Reason for Cancellation
                </label>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full p-3 bg-[#FFFCF6] rounded-xl text-xs text-[#241F1A] focus:outline-none transition-all border border-[#221E1A]/10 focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26]"
                >
                  <option value="" disabled className="bg-[#FFFCF6] text-[#746A5F]">Chọn lý do hủy đơn...</option>
                  <option value="Creator unresponsive" className="bg-[#FFFCF6] text-[#241F1A] py-2">Họa sĩ không phản hồi</option>
                  <option value="Missed deadline" className="bg-[#FFFCF6] text-[#241F1A] py-2">Họa sĩ đã quá hạn hoàn thành</option>
                  <option value="Quality issues" className="bg-[#FFFCF6] text-[#241F1A] py-2">Chất lượng không đạt yêu cầu hoặc không đúng thỏa thuận</option>
                  <option value="Mutual agreement" className="bg-[#FFFCF6] text-[#241F1A] py-2">Hai bên đồng ý hủy đơn</option>
                  <option value="Other" className="bg-[#FFFCF6] text-[#241F1A] py-2">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide more context..."
                  className="w-full p-3 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-sm text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#3B4C86]/30 focus:ring-1 focus:ring-[#3B4C86]/30"
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">Cancellation Processed!</h4>
              <p className="text-xs text-[#746A5F]">{resultMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#221E1A]/10 bg-[#FFFCF6]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6]"
          >
            {success ? 'Close' : 'Keep Commission'}
          </button>
          {!success && pendingRequest && canRespond ? (
            <>
              <button onClick={() => handleResponse(false)} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6] disabled:opacity-50">Từ chối</button>
              <button onClick={() => handleResponse(true)} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#A8321C]/12 text-[#241F1A] hover:bg-[#A8321C]/12 disabled:opacity-50">Đồng ý hủy</button>
            </>
          ) : !success && !pendingRequest ? (
            <button
              onClick={handleCancel}
              disabled={isSubmitting || !reason}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#A8321C]/12 text-[#241F1A] shadow-lg shadow-[#A8321C] hover:bg-[#A8321C]/12 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Cancel & Refund'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
