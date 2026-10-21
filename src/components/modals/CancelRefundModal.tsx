'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2, ShieldAlert, Scale, MessageSquare } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import type { Commission } from '@/types/commission.types';

interface CancelRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  commission?: Commission | null;
  currentUserId?: string | null;
  isCreator?: boolean;
  onOpenDispute?: () => void;
  onSuccess?: () => void;
}

export default function CancelRefundModal({
  isOpen,
  onClose,
  commissionId,
  commission,
  currentUserId,
  isCreator,
  onOpenDispute,
  onSuccess,
}: CancelRefundModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDisputePrompt, setShowDisputePrompt] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  if (!isOpen) return null;

  const isUserCreator = isCreator ?? (commission && currentUserId ? commission.clientId !== currentUserId : false);

  const handleCancel = async () => {
    if (!reason) return alert('Vui lòng chọn lý do hủy đơn.');
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
      alert('Không thể gửi yêu cầu hủy đơn.');
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
      if (approve) {
        setResultMessage('Đã đồng ý hủy đơn. Quỹ Escrow đã được xử lý hoàn trả.');
        setSuccess(true);
        setTimeout(() => onSuccess?.(), 1000);
      } else {
        setShowDisputePrompt(true);
      }
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
              <h3 className="text-sm font-space-grotesk font-bold text-white">
                {pendingRequest
                  ? canRespond
                    ? 'Phản hồi yêu cầu hủy đơn'
                    : 'Yêu cầu hủy đang chờ phản hồi'
                  : 'Yêu cầu hủy đơn hàng'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {pendingRequest
                  ? canRespond
                    ? 'Xem lý do và lựa chọn đồng ý hoặc từ chối hủy'
                    : 'Đang chờ đối phương phản hồi'
                  : 'Yêu cầu hủy đơn & xử lý quỹ ký quỹ'}
              </p>
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
          {showDisputePrompt ? (
            <div className="py-4 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Đã từ chối yêu cầu hủy đơn</h4>
                <p className="text-xs text-slate-300">
                  Đơn hàng tiếp tục được duy trì. Quỹ Escrow vẫn được bảo lưu an toàn trên hệ thống.
                </p>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs text-amber-200/90 space-y-1.5">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 shrink-0 text-amber-400" />
                  Bạn có muốn gửi tranh chấp về cho Admin không?
                </p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Nếu hai bên có mâu thuẫn không thể tự giải quyết qua chat, bạn có thể gửi Khiếu nại Tranh chấp để thương lượng lại tỷ lệ hoàn tiền hoặc yêu cầu Ban Quản trị phân xử.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSuccess?.();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tiếp tục làm việc &amp; Trao đổi qua chat</span>
                </button>

                {onOpenDispute && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSuccess?.();
                      onOpenDispute();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Gửi Khiếu Nại Tranh Chấp (Tới Trọng tài)</span>
                  </button>
                )}
              </div>
            </div>
          ) : !success && pendingRequest ? (
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
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-200 text-xs leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>
                  {isUserCreator
                    ? 'Yêu cầu hủy đơn sẽ giải phóng quỹ ký quỹ Escrow còn lại để hoàn trả về ví của Khách hàng. Các mốc bạn đã hoàn thành và được duyệt trước đó vẫn được bảo lưu doanh thu.'
                    : 'Yêu cầu hủy sẽ hoàn lại số dư ký quỹ Escrow còn lại về ví của bạn. Các mốc đã duyệt và giải ngân trước đó cho Họa sĩ sẽ không được hoàn trả trực tiếp.'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Lý do yêu cầu hủy đơn <span className="text-red-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full p-3 bg-[#1b1b1e] rounded-xl text-xs text-white focus:outline-none transition-all border border-white/10 focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]"
                >
                  <option value="" disabled className="bg-[#1b1b1e] text-slate-400">Chọn lý do hủy đơn...</option>

                  <optgroup label="Lý do chung" className="bg-[#1b1b1e] text-amber-300 font-bold">
                    <option value="Hai bên đồng ý hủy đơn" className="bg-[#1b1b1e] text-white py-2">Hai bên đồng ý hủy đơn</option>
                    <option value="Thay đổi kế hoạch / Bận việc cá nhân" className="bg-[#1b1b1e] text-white py-2">Thay đổi kế hoạch / Bận việc cá nhân đột xuất</option>
                  </optgroup>

                  {isUserCreator ? (
                    <optgroup label="Lý do từ phía Họa sĩ (Creator)" className="bg-[#1b1b1e] text-cyan-300 font-bold">
                      <option value="Khách hàng không phản hồi quá lâu" className="bg-[#1b1b1e] text-white py-2">Khách hàng không phản hồi / Mất liên lạc quá lâu</option>
                      <option value="Khách hàng yêu cầu vượt quá thỏa thuận brief" className="bg-[#1b1b1e] text-white py-2">Khách hàng yêu cầu vượt quá thỏa thuận brief ban đầu</option>
                      <option value="Bất đồng quan điểm nghệ thuật không thể thống nhất" className="bg-[#1b1b1e] text-white py-2">Bất đồng quan điểm nghệ thuật không thể thống nhất</option>
                      <option value="Sự cố cá nhân không thể tiếp tục nhận đơn" className="bg-[#1b1b1e] text-white py-2">Sự cố cá nhân không thể tiếp tục hoàn thành đơn</option>
                    </optgroup>
                  ) : (
                    <optgroup label="Lý do từ phía Khách hàng (Client)" className="bg-[#1b1b1e] text-emerald-300 font-bold">
                      <option value="Creator không phản hồi" className="bg-[#1b1b1e] text-white py-2">Creator không phản hồi / Mất liên lạc quá lâu</option>
                      <option value="Creator đã quá hạn hoàn thành" className="bg-[#1b1b1e] text-white py-2">Creator đã quá hạn hoàn thành cam kết</option>
                      <option value="Chất lượng không đạt yêu cầu hoặc không đúng thỏa thuận" className="bg-[#1b1b1e] text-white py-2">Chất lượng phác thảo không đạt yêu cầu hoặc sai lệch brief</option>
                      <option value="Khách hàng thay đổi nhu cầu cá nhân" className="bg-[#1b1b1e] text-white py-2">Khách hàng thay đổi nhu cầu cá nhân / Vấn đề tài chính</option>
                    </optgroup>
                  )}

                  <optgroup label="Khác" className="bg-[#1b1b1e] text-slate-400 font-bold">
                    <option value="Lý do khác" className="bg-[#1b1b1e] text-white py-2">Lý do khác (mô tả chi tiết bên dưới)</option>
                  </optgroup>
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
              <h4 className="text-sm font-bold text-white">Đã xử lý yêu cầu!</h4>
              <p className="text-xs text-slate-400">{resultMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showDisputePrompt && (
          <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50 transition"
            >
              {success ? 'Đóng' : pendingRequest && canRespond ? 'Để sau (Đóng)' : 'Đóng'}
            </button>

            <div className="flex items-center gap-2.5">
              {!success && pendingRequest && canRespond ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleResponse(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
                  >
                    Từ chối hủy (Tiếp tục đơn)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResponse(true)}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition disabled:opacity-50"
                  >
                    Đồng ý hủy đơn
                  </button>
                </>
              ) : !success && !pendingRequest ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting || !reason}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy & Hoàn tiền'}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
