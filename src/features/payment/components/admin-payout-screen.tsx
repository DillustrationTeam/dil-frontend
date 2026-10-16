'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { PayoutDto, UpdatePayoutStatusRequest } from '../types/payment.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(isoString?: string | null) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoString;
  }
}

const STATUS_BADGES: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  Pending: {
    label: 'Chờ duyệt',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Processed: {
    label: 'Đã chuyển tiền',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Rejected: {
    label: 'Đã từ chối (Hoàn ví)',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export function AdminPayoutScreen() {
  const [items, setItems] = useState<PayoutDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Processed' | 'Rejected'>('Pending');
  const [searchUserId, setSearchUserId] = useState('');
  const [appliedUserId, setAppliedUserId] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Modal actions
  const [selectedPayout, setSelectedPayout] = useState<PayoutDto | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form inputs for modals
  const [transactionRef, setTransactionRef] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'payos' | 'manual'>('payos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayouts = useCallback(
    async (cursor?: string, append = false, signal?: AbortSignal) => {
      if (signal?.aborted) return;
      setLoading(true);
      setError(null);
      try {
        const res = await paymentService.adminPayouts({
          status: statusFilter === 'All' ? undefined : statusFilter,
          userId: appliedUserId.trim() || undefined,
          cursor: cursor || undefined,
          limit: 20,
        }, signal);
        if (signal?.aborted) return;
        if (append) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }
        setNextCursor(res.nextCursor);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không tải được danh sách yêu cầu rút tiền.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [statusFilter, appliedUserId]
  );

  useEffect(() => {
    const controller = new AbortController();
    // Hủy truy vấn cũ khi đổi bộ lọc; bắt đầu tải ở lượt bất đồng bộ tiếp theo.
    void Promise.resolve().then(() => fetchPayouts(undefined, false, controller.signal));
    return () => controller.abort();
  }, [fetchPayouts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedUserId(searchUserId.trim());
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openActionModal = (payout: PayoutDto, type: 'approve' | 'reject') => {
    setSelectedPayout(payout);
    setActionType(type);
    setPayoutMethod('payos');
    setModalError(null);
    setTransactionRef('');
    setPayoutNote('');
  };

  const closeActionModal = () => {
    if (isSubmitting) return;
    setSelectedPayout(null);
    setActionType(null);
    setModalError(null);
    setTransactionRef('');
    setPayoutNote('');
  };

  const handleSubmitStatus = async () => {
    if (!selectedPayout || !actionType) return;

    if (actionType === 'reject' && !payoutNote.trim()) {
      setModalError('Vui lòng nhập lý do từ chối (bắt buộc để thông báo cho Creator).');
      return;
    }

    if (actionType === 'approve' && payoutMethod === 'manual' && !transactionRef.trim()) {
      setModalError('Vui lòng nhập mã giao dịch ngân hàng đã chuyển khoản thành công.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload: UpdatePayoutStatusRequest = {
      payoutStatus: actionType === 'approve' ? 'Processed' : 'Rejected',
      payoutNote: payoutNote.trim() || null,
      transactionRef: actionType === 'approve' && payoutMethod === 'manual' ? transactionRef.trim() : null,
    };

    try {
      await paymentService.updatePayoutStatus(selectedPayout.payoutRequestId, payload);
      setSuccessMsg(
        actionType === 'approve'
          ? `Đã duyệt thành công yêu cầu #${selectedPayout.payoutRequestId.substring(0, 8)} (${formatVnd(selectedPayout.amount)}). Trạng thái đơn đã chuyển sang "Đã chuyển tiền (Processed)".`
          : `Đã từ chối yêu cầu #${selectedPayout.payoutRequestId.substring(0, 8)}. Hệ thống đã tự động hoàn trả ${formatVnd(selectedPayout.amount)} về số dư ví Creator.`
      );
      setSelectedPayout(null);
      setActionType(null);
      await fetchPayouts();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary from loaded items
  const pendingCount = items.filter((x) => x.payoutStatus === 'Pending').length;
  const pendingTotal = items
    .filter((x) => x.payoutStatus === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fadeIn font-body pb-12">
      {/* 1. Header with Title, Actions & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payout Approvals & Settlement
            </h1>
          </div>
          <p className="text-xs text-[#8A8FA9] mt-1.5 max-w-2xl font-body">
            Đối soát thông tin tài khoản ngân hàng Creator, phê duyệt giải ngân tự động qua cổng PayOS hoặc xác nhận chuyển khoản thủ công.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void fetchPayouts()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách yêu cầu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#A7ACD9]' : 'text-[#A7ACD9]'}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Pending Requests */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider font-space-grotesk">
              YÊU CẦU CHỜ DUYỆT
            </span>
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-amber-300 tracking-tight">
            {loading && items.length === 0 ? '...' : `${pendingCount} đơn`}
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">
            Đang chờ Admin kiểm tra và giải ngân
          </p>
        </div>

        {/* Card 2: Total Pending Amount */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider font-space-grotesk">
              TỔNG TIỀN CHỜ CHI
            </span>
            <div className="p-1.5 rounded-lg bg-[#C5C9F8]/10 text-[#C5C9F8]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-white tracking-tight">
            {loading && items.length === 0 ? '...' : formatVnd(pendingTotal)}
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">
            Cần giải ngân về STK của Creator
          </p>
        </div>

        {/* Card 3: Settlement Channel */}
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider font-space-grotesk">
              KÊNH CHI TIỀN
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-lg font-bold text-emerald-400 tracking-tight flex items-center gap-1.5 pt-1">
            PayOS VietQR + Thủ Công
          </h3>
          <p className="text-[11px] text-[#8A8FA9]">
            Chi hộ tự động qua Napas247 hoặc ủy nhiệm chi
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
          {(['Pending', 'All', 'Processed', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#A7ACD9]/20 text-white border border-[#A7ACD9]/40 shadow-[0_0_12px_rgba(167,172,217,0.2)]'
                  : 'text-[#8A8FA9] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab === 'All'
                ? 'Tất cả'
                : tab === 'Pending'
                  ? 'Chờ duyệt'
                  : tab === 'Processed'
                    ? 'Đã duyệt'
                    : 'Đã từ chối'}
            </button>
          ))}
        </div>

        {/* User ID Search Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FA9]" />
            <input
              type="text"
              placeholder="Lọc theo Creator User ID..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-black/40 rounded-xl border border-white/10 text-white placeholder-[#8A8FA9]/60 text-xs focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#A7ACD9]/20 hover:bg-[#A7ACD9]/30 border border-[#A7ACD9]/30 text-[#C5C9F8] text-xs font-semibold transition-colors cursor-pointer"
          >
            Lọc
          </button>
          {appliedUserId && (
            <button
              type="button"
              onClick={() => {
                setSearchUserId('');
                setAppliedUserId('');
              }}
              className="px-2 py-2 rounded-xl hover:bg-white/10 text-[#8A8FA9] hover:text-white text-xs transition-colors cursor-pointer"
              title="Xóa bộ lọc User ID"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Main Table Container */}
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[#8A8FA9] text-[11px] font-bold uppercase tracking-wider font-space-grotesk">
                <th className="py-3.5 px-4">Mã Yêu Cầu</th>
                <th className="py-3.5 px-4">Số Tiền Rút</th>
                <th className="py-3.5 px-4">Tài Khoản Thụ Hưởng</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#8A8FA9]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#A7ACD9]" />
                      <span>Đang tải danh sách yêu cầu rút tiền...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#8A8FA9]">
                    <div className="flex flex-col items-center gap-3">
                      <Banknote className="w-10 h-10 opacity-30 text-indigo-400" />
                      <p className="font-medium text-white">Không có yêu cầu rút tiền nào</p>
                      <p className="text-xs text-[#8A8FA9]">
                        {statusFilter !== 'All'
                          ? `Không có bản ghi nào ở trạng thái "${statusFilter}".`
                          : 'Hàng chờ hiện tại đang trống.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((payout) => {
                  const statusInfo = STATUS_BADGES[payout.payoutStatus] || {
                    label: payout.payoutStatus,
                    badgeClass: 'bg-white/10 text-white border-white/20',
                    icon: null,
                  };

                  return (
                    <tr
                      key={payout.payoutRequestId}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Payout Request ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-xs text-[#A7ACD9] font-bold cursor-pointer hover:underline"
                            title={payout.payoutRequestId}
                            onClick={() => handleCopy(payout.payoutRequestId)}
                          >
                            #{payout.payoutRequestId.substring(0, 8)}
                          </span>
                          <button
                            onClick={() => handleCopy(payout.payoutRequestId)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-[#8A8FA9] hover:text-white transition-opacity"
                            title="Sao chép toàn bộ ID"
                          >
                            {copiedId === payout.payoutRequestId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white text-base">
                          {formatVnd(payout.amount)}
                        </span>
                      </td>

                      {/* Bank Account */}
                      <td className="py-3.5 px-4">
                        {payout.bankAccount ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-[#A7ACD9] shrink-0" />
                              <span className="font-medium text-white text-xs">
                                {payout.bankAccount.bankName}
                              </span>
                            </div>
                            <div className="text-xs text-[#8A8FA9] font-mono">
                              STK: <strong className="text-slate-200">{payout.bankAccount.accountNumberMasked}</strong>
                            </div>
                            <div className="text-xs text-[#8A8FA9]">
                              Chủ TK: <span className="text-slate-300 uppercase">{payout.bankAccount.accountHolder}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A8FA9] italic">Không có thông tin</span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1 text-xs">
                          {payout.payoutNote && (
                            <p className="text-slate-300 line-clamp-2" title={payout.payoutNote}>
                              <span className="text-[#8A8FA9]">Ghi chú:</span> {payout.payoutNote}
                            </p>
                          )}
                          {payout.transactionRef && (
                            <p className="text-emerald-300 font-mono">
                              <span className="text-[#8A8FA9]">Mã GD:</span> {payout.transactionRef}
                            </p>
                          )}
                          {payout.rejectReason && (
                            <p className="text-rose-300" title={payout.rejectReason}>
                              <span className="text-[#8A8FA9]">Lý do từ chối:</span> {payout.rejectReason}
                            </p>
                          )}
                          {!payout.payoutNote && !payout.transactionRef && !payout.rejectReason && (
                            <span className="text-[#8A8FA9]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Timestamps */}
                      <td className="py-3.5 px-4 text-xs text-[#8A8FA9] whitespace-nowrap">
                        <div>
                          <span>Tạo: </span>
                          <span className="text-slate-300">{formatDate(payout.createdAt)}</span>
                        </div>
                        {payout.processedAt && (
                          <div className="mt-1">
                            <span>Xử lý: </span>
                            <span className="text-slate-400">{formatDate(payout.processedAt)}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {payout.payoutStatus === 'Pending' ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openActionModal(payout, 'approve')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Duyệt
                            </button>
                            <button
                              onClick={() => openActionModal(payout, 'reject')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A8FA9] italic">Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cursor Pagination (Load More) */}
        {nextCursor && (
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-center">
            <button
              onClick={() => fetchPayouts(nextCursor, true)}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#A7ACD9]/20 hover:bg-[#A7ACD9]/30 border border-[#A7ACD9]/30 text-[#C5C9F8] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Tải thêm bản ghi tiếp theo</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Modal (Approve or Reject) */}
      {selectedPayout && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[28px] bg-[#161926] border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 font-body">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    actionType === 'approve'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {actionType === 'approve' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-h1">
                    {actionType === 'approve' ? 'Xác Nhận Chuyển Khoản' : 'Từ Chối Yêu Cầu Rút Tiền'}
                  </h3>
                  <p className="text-xs text-[#8A8FA9]">Mã yêu cầu: #{selectedPayout.payoutRequestId}</p>
                </div>
              </div>
              <button
                onClick={closeActionModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Snapshot Card */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#8A8FA9]">Số tiền cần thanh toán</span>
                <span className="text-lg font-extrabold text-amber-300">
                  {formatVnd(selectedPayout.amount)}
                </span>
              </div>
              {selectedPayout.bankAccount ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8A8FA9]">Ngân hàng:</span>
                    <p className="text-white font-medium">{selectedPayout.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <span className="text-[#8A8FA9]">Số tài khoản:</span>
                    <p className="text-white font-mono font-medium">
                      {selectedPayout.bankAccount.accountNumberMasked}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8A8FA9]">Chủ tài khoản:</span>
                    <p className="text-white uppercase font-medium">
                      {selectedPayout.bankAccount.accountHolder}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-rose-300">Không tìm thấy thông tin ngân hàng thụ hưởng.</p>
              )}
            </div>

            {/* Warning when Rejecting */}
            {actionType === 'reject' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Cảnh báo:</strong> Khi từ chối, toàn bộ số tiền{' '}
                  <strong>{formatVnd(selectedPayout.amount)}</strong> sẽ được hệ thống{' '}
                  <strong>hoàn trả ngay lập tức</strong> vào số dư ví của Creator.
                </span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {actionType === 'approve' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Phương Thức Chi Tiền
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('payos')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        payoutMethod === 'payos'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                          : 'bg-black/20 border-white/10 text-[#8A8FA9] hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                        <span>⚡ Tự động qua PayOS</span>
                      </div>
                      <p className="text-[11px] text-[#8A8FA9] mt-1">
                        Hệ thống tự động phát lệnh chi hộ qua API PayOS về STK của Creator.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('manual')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        payoutMethod === 'manual'
                          ? 'bg-[#A7ACD9]/15 border-[#A7ACD9]/60 text-white shadow-sm ring-1 ring-[#A7ACD9]/30'
                          : 'bg-black/20 border-white/10 text-[#8A8FA9] hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-indigo-400">
                        <span>📝 Chuyển thủ công</span>
                      </div>
                      <p className="text-[11px] text-[#8A8FA9] mt-1">
                        Admin tự chuyển bằng app ngân hàng rồi nhập mã giao dịch.
                      </p>
                    </button>
                  </div>

                  {payoutMethod === 'manual' ? (
                    <div className="pt-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Mã Giao Dịch Ngân Hàng (Transaction Ref) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: FT24050982341..."
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white placeholder-[#8A8FA9] focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9]/40"
                      />
                      <p className="text-[11px] text-[#8A8FA9] mt-1">
                        Nhập mã tham chiếu từ ứng dụng ngân hàng sau khi Admin thực hiện chuyển khoản thành công.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      Hệ thống sẽ gọi trực tiếp API Kênh chi hộ của PayOS để chuyển <strong>{formatVnd(selectedPayout.amount)}</strong> vào tài khoản thụ hưởng.
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {actionType === 'approve' ? 'Ghi Chú Xử Lý (Tùy chọn)' : 'Lý Do Từ Chối (Bắt buộc)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionType === 'approve'
                      ? 'Nhập ghi chú hoặc lời nhắn cho Creator...'
                      : 'Nêu rõ lý do từ chối (STK không đúng, tên chủ tài khoản sai lệch, nghi vấn gian lận...)'
                  }
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white placeholder-[#8A8FA9] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-[#8A8FA9] hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSubmitStatus}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                  actionType === 'approve'
                    ? payoutMethod === 'payos'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-[#A7ACD9] hover:bg-[#A7ACD9]/90 text-[#1F2335] font-bold shadow-lg shadow-[#A7ACD9]/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionType === 'reject'
                    ? 'Từ chối & Hoàn Tiền'
                    : payoutMethod === 'payos'
                    ? '⚡ Xác Nhận Chi Tự Động (PayOS)'
                    : 'Xác Nhận Đã Chuyển Thủ Công'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
