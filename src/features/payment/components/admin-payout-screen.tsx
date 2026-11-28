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
    badgeClass: 'bg-[#8A6A1F]/15 text-[#8A6A1F] border-[#8A6A1F]/40',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Processed: {
    label: 'Đã chuyển tiền',
    badgeClass: 'bg-[#2F6B63]/15 text-[#2F6B63] border-[#2F6B63]/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Rejected: {
    label: 'Đã từ chối (Hoàn ví)',
    badgeClass: 'bg-[#A8321C]/15 text-[#A8321C] border-[#A8321C]/40',
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
      setModalError('Vui lòng nhập lý do từ chối (bắt buộc để thông báo cho họa sĩ).');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221E1A]/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-h1 text-2xl sm:text-3xl font-extrabold text-[#241F1A] tracking-tight">
              Payout Approvals & Settlement
            </h1>
          </div>
          <p className="text-xs text-[#6E6459] mt-1.5 max-w-2xl font-body"> Đối soát thông tin tài khoản ngân hàng họa sĩ, phê duyệt giải ngân tự động qua cổng PayOS hoặc xác nhận chuyển khoản thủ công. </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void fetchPayouts()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs font-semibold text-[#241F1A] transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách yêu cầu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B24A26]' : 'text-[#B24A26]'}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Pending Requests */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-space-grotesk"> YÊU CẦU CHỜ DUYỆT </span>
            <div className="p-1.5 rounded-lg bg-[#8A6A1F]/10 text-[#8A6A1F]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#8A6A1F] tracking-tight">
            {loading && items.length === 0 ? '...' : `${pendingCount} đơn`}
          </h3>
          <p className="text-[11px] text-[#6E6459]"> Đang chờ quản trị viên kiểm tra và giải ngân </p>
        </div>

        {/* Card 2: Total Pending Amount */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-space-grotesk"> TỔNG TIỀN CHỜ CHI </span>
            <div className="p-1.5 rounded-lg bg-[#8C3718]/10 text-[#8C3718]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#241F1A] tracking-tight">
            {loading && items.length === 0 ? '...' : formatVnd(pendingTotal)}
          </h3>
          <p className="text-[11px] text-[#6E6459]"> Cần giải ngân về STK của họa sĩ </p>
        </div>

        {/* Card 3: Settlement Channel */}
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[24px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-space-grotesk"> KÊNH CHI TIỀN </span>
            <div className="p-1.5 rounded-lg bg-[#2F6B63]/10 text-[#2F6B63]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-lg font-bold text-[#2F6B63] tracking-tight flex items-center gap-1.5 pt-1"> PayOS VietQR + Thủ Công </h3>
          <p className="text-[11px] text-[#6E6459]"> Chi hộ tự động qua Napas247 hoặc ủy nhiệm chi </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#2F6B63]/10 border border-[#2F6B63]/40 flex items-center justify-between gap-3 text-[#2F6B63] text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-[#F0E7D8] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#A8321C]/10 border border-[#A8321C]/40 flex items-center gap-3 text-[#A8321C] text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#A8321C]" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10">
          {(['Pending', 'All', 'Processed', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#B24A26]/20 text-[#241F1A] border border-[#B24A26]/40 shadow-[0_0_12px_rgba(167,172,217,0.2)]'
                  : 'text-[#6E6459] hover:text-[#241F1A] hover:bg-[#FFFCF6] border border-transparent'
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6459]" />
            <input
              type="text"
              placeholder="Lọc theo họa sĩ User ID..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#F0E7D8] rounded-xl border border-[#221E1A]/10 text-[#241F1A] placeholder-[#6E6459]/60 text-xs focus:outline-none focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26]/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#B24A26]/20 hover:bg-[#B24A26]/30 border border-[#B24A26]/30 text-[#8C3718] text-xs font-semibold transition-colors cursor-pointer"
          > Lọc </button>
          {appliedUserId && (
            <button
              type="button"
              onClick={() => {
                setSearchUserId('');
                setAppliedUserId('');
              }}
              className="px-2 py-2 rounded-xl hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] text-xs transition-colors cursor-pointer"
              title="Xóa bộ lọc User ID"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Main Table Container */}
      <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[24px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] text-[11px] font-bold uppercase tracking-wider font-space-grotesk">
                <th className="py-3.5 px-4">Mã Yêu Cầu</th>
                <th className="py-3.5 px-4">Số Tiền Rút</th>
                <th className="py-3.5 px-4">Tài Khoản Thụ Hưởng</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221E1A]/10 text-sm">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#6E6459]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#B24A26]" />
                      <span>Đang tải danh sách yêu cầu rút tiền...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#6E6459]">
                    <div className="flex flex-col items-center gap-3">
                      <Banknote className="w-10 h-10 opacity-30 text-[#3B4C86]" />
                      <p className="font-medium text-[#241F1A]">Không có yêu cầu rút tiền nào</p>
                      <p className="text-xs text-[#6E6459]">
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
                    badgeClass: 'bg-[#F0E7D8] text-[#241F1A] border-[#221E1A]/20',
                    icon: null,
                  };

                  return (
                    <tr
                      key={payout.payoutRequestId}
                      className="hover:bg-[#FFFCF6] transition-colors group"
                    >
                      {/* Payout Request ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-xs text-[#B24A26] font-bold cursor-pointer hover:underline"
                            title={payout.payoutRequestId}
                            onClick={() => handleCopy(payout.payoutRequestId)}
                          >
                            #{payout.payoutRequestId.substring(0, 8)}
                          </span>
                          <button
                            onClick={() => handleCopy(payout.payoutRequestId)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#F0E7D8] rounded text-[#6E6459] hover:text-[#241F1A] transition-opacity"
                            title="Sao chép toàn bộ ID"
                          >
                            {copiedId === payout.payoutRequestId ? (
                              <Check className="w-3.5 h-3.5 text-[#2F6B63]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#241F1A] text-base">
                          {formatVnd(payout.amount)}
                        </span>
                      </td>

                      {/* Bank Account */}
                      <td className="py-3.5 px-4">
                        {payout.bankAccount ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-[#B24A26] shrink-0" />
                              <span className="font-medium text-[#241F1A] text-xs">
                                {payout.bankAccount.bankName}
                              </span>
                            </div>
                            <div className="text-xs text-[#6E6459] font-mono">
                              STK: <strong className="text-[#6E6459]">{payout.bankAccount.accountNumberMasked}</strong>
                            </div>
                            <div className="text-xs text-[#6E6459]"> Chủ TK: <span className="text-[#746A5F] uppercase">{payout.bankAccount.accountHolder}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6E6459] italic">Không có thông tin</span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1 text-xs">
                          {payout.payoutNote && (
                            <p className="text-[#746A5F] line-clamp-2" title={payout.payoutNote}>
                              <span className="text-[#6E6459]">Ghi chú:</span> {payout.payoutNote}
                            </p>
                          )}
                          {payout.transactionRef && (
                            <p className="text-[#2F6B63] font-mono">
                              <span className="text-[#6E6459]">Mã GD:</span> {payout.transactionRef}
                            </p>
                          )}
                          {payout.rejectReason && (
                            <p className="text-[#A8321C]" title={payout.rejectReason}>
                              <span className="text-[#6E6459]">Lý do từ chối:</span> {payout.rejectReason}
                            </p>
                          )}
                          {!payout.payoutNote && !payout.transactionRef && !payout.rejectReason && (
                            <span className="text-[#6E6459]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Timestamps */}
                      <td className="py-3.5 px-4 text-xs text-[#6E6459] whitespace-nowrap">
                        <div>
                          <span>Tạo: </span>
                          <span className="text-[#746A5F]">{formatDate(payout.createdAt)}</span>
                        </div>
                        {payout.processedAt && (
                          <div className="mt-1">
                            <span>Xử lý: </span>
                            <span className="text-[#746A5F]">{formatDate(payout.processedAt)}</span>
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
                              className="px-3 py-1.5 rounded-lg bg-[#2F6B63]/20 hover:bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Duyệt </button>
                            <button
                              onClick={() => openActionModal(payout, 'reject')}
                              className="px-3 py-1.5 rounded-lg bg-[#A8321C]/20 hover:bg-[#A8321C]/20 border border-[#A8321C]/40 text-[#A8321C] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Từ chối </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6E6459] italic">Đã hoàn tất</span>
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
          <div className="p-4 border-t border-[#221E1A]/10 bg-[#FFFCF6] flex justify-center">
            <button
              onClick={() => fetchPayouts(nextCursor, true)}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#B24A26]/20 hover:bg-[#B24A26]/30 border border-[#B24A26]/30 text-[#8C3718] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Tải thêm bản ghi tiếp theo</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Modal (Approve or Reject) */}
      {selectedPayout && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[28px] bg-[#FFFCF6] border border-[#221E1A]/10 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 font-body">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    actionType === 'approve'
                      ? 'bg-[#2F6B63]/15 border border-[#2F6B63]/40 text-[#2F6B63]'
                      : 'bg-[#A8321C]/15 border border-[#A8321C]/40 text-[#A8321C]'
                  }`}
                >
                  {actionType === 'approve' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#241F1A] font-h1">
                    {actionType === 'approve' ? 'Xác Nhận Chuyển Khoản' : 'Từ Chối Yêu Cầu Rút Tiền'}
                  </h3>
                  <p className="text-xs text-[#6E6459]">Mã yêu cầu: #{selectedPayout.payoutRequestId}</p>
                </div>
              </div>
              <button
                onClick={closeActionModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Snapshot Card */}
            <div className="p-4 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#221E1A]/10">
                <span className="text-xs text-[#6E6459]">Số tiền cần thanh toán</span>
                <span className="text-lg font-extrabold text-[#8A6A1F]">
                  {formatVnd(selectedPayout.amount)}
                </span>
              </div>
              {selectedPayout.bankAccount ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6E6459]">Ngân hàng:</span>
                    <p className="text-[#241F1A] font-medium">{selectedPayout.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <span className="text-[#6E6459]">Số tài khoản:</span>
                    <p className="text-[#241F1A] font-mono font-medium">
                      {selectedPayout.bankAccount.accountNumberMasked}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6E6459]">Chủ tài khoản:</span>
                    <p className="text-[#241F1A] uppercase font-medium">
                      {selectedPayout.bankAccount.accountHolder}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#A8321C]">Không tìm thấy thông tin ngân hàng thụ hưởng.</p>
              )}
            </div>

            {/* Warning when Rejecting */}
            {actionType === 'reject' && (
              <div className="p-3.5 rounded-xl bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 text-xs text-[#8A6A1F] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Cảnh báo:</strong> Khi từ chối, toàn bộ số tiền{' '}
                  <strong>{formatVnd(selectedPayout.amount)}</strong> sẽ được hệ thống{' '}
                  <strong>hoàn trả ngay lập tức</strong> vào số dư ví của họa sĩ. </span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {actionType === 'approve' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#746A5F]"> Phương Thức Chi Tiền </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('payos')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        payoutMethod === 'payos'
                          ? 'bg-[#2F6B63]/15 border-[#2F6B63]/30 text-[#241F1A] shadow-sm'
                          : 'bg-[#F0E7D8] border-[#221E1A]/10 text-[#6E6459] hover:border-[#221E1A]/20'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-[#2F6B63]">
                        <span>⚡ Tự động qua PayOS</span>
                      </div>
                      <p className="text-[11px] text-[#6E6459] mt-1"> Hệ thống tự động phát lệnh chi hộ qua API PayOS về STK của họa sĩ. </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('manual')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        payoutMethod === 'manual'
                          ? 'bg-[#B24A26]/15 border-[#B24A26]/60 text-[#241F1A] shadow-sm ring-1 ring-[#B24A26]/30'
                          : 'bg-[#F0E7D8] border-[#221E1A]/10 text-[#6E6459] hover:border-[#221E1A]/20'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-[#3B4C86]">
                        <span>📝 Chuyển thủ công</span>
                      </div>
                      <p className="text-[11px] text-[#6E6459] mt-1"> quản trị viên tự chuyển bằng app ngân hàng rồi nhập mã giao dịch. </p>
                    </button>
                  </div>

                  {payoutMethod === 'manual' ? (
                    <div className="pt-2">
                      <label className="block text-xs font-medium text-[#746A5F] mb-1.5"> Mã Giao Dịch Ngân Hàng (Transaction Ref) <span className="text-[#A8321C]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: FT24050982341..."
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] placeholder-[#6E6459] focus:outline-none focus:border-[#B24A26] focus:ring-1 focus:ring-[#B24A26]/40"
                      />
                      <p className="text-[11px] text-[#6E6459] mt-1"> Nhập mã tham chiếu từ ứng dụng ngân hàng sau khi quản trị viên thực hiện chuyển khoản thành công. </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/30 text-xs text-[#2F6B63]"> Hệ thống sẽ gọi trực tiếp API Kênh chi hộ của PayOS để chuyển <strong>{formatVnd(selectedPayout.amount)}</strong> vào tài khoản thụ hưởng. </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#746A5F] mb-1.5">
                  {actionType === 'approve' ? 'Ghi Chú Xử Lý (Tùy chọn)' : 'Lý Do Từ Chối (Bắt buộc)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionType === 'approve'
                      ? 'Nhập ghi chú hoặc lời nhắn cho họa sĩ...'
                      : 'Nêu rõ lý do từ chối (STK không đúng, tên chủ tài khoản sai lệch, nghi vấn gian lận...)'
                  }
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] placeholder-[#6E6459] focus:outline-none focus:border-[#3B4C86]/30"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-lg bg-[#A8321C]/10 border border-[#A8321C]/30 text-[#A8321C] text-xs">
                  {modalError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#221E1A]/10">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl hover:bg-[#FFFCF6] text-[#6E6459] hover:text-[#241F1A] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              > Hủy bỏ </button>

              <button
                type="button"
                onClick={handleSubmitStatus}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                  actionType === 'approve'
                    ? payoutMethod === 'payos'
                      ? 'bg-gradient-to-r from-[#2F6B63] to-[#2F6B63] hover:from-[#2F6B63] hover:to-[#2F6B63] text-[#241F1A] shadow-lg shadow-[#2F6B63]'
                      : 'bg-[#B24A26] hover:bg-[#B24A26]/90 text-[#F7F2E9] font-bold shadow-lg shadow-[#B24A26]/20'
                    : 'bg-[#A8321C]/12 hover:bg-[#A8321C]/12 text-[#241F1A] shadow-lg shadow-[#A8321C]'
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
