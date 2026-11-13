'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { commissionService } from '@/services/commission.service';
import { useAuthStore } from '@/store/use-auth-store';
import { Commission } from '@/types/commission.types';

type RequestFilter = 'All' | 'PendingAcceptance' | 'Negotiating' | 'AwaitingEscrow' | 'Cancelled';

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

const formatDate = (value: string, isEng: boolean) =>
  new Intl.DateTimeFormat(isEng ? 'en-US' : 'vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const isAwaitingEscrow = (item: Commission) =>
  item.status === 'InProgress' &&
  item.escrowStatus === 'Pending' &&
  !(item.disbursedAmount && item.disbursedAmount > 0);

const isSentRequestItem = (item: Commission) => {
  const hasDisputeOrEscrow = Boolean(item.dispute || (item.escrowHeldAmount && item.escrowHeldAmount > 0));
  return (
    item.status === 'PendingAcceptance' ||
    item.status === 'Negotiating' ||
    isAwaitingEscrow(item) ||
    (item.status === 'Cancelled' && !hasDisputeOrEscrow)
  );
};

function getRequestStatusMeta(item: Commission, isEng: boolean) {
  if (item.status === 'PendingAcceptance') {
    return {
      label: isEng ? 'Awaiting creator' : 'Chờ họa sĩ phản hồi',
      badgeClass: 'bg-[#A7ACD9]/15 text-[#d8dbff]',
    };
  }
  if (item.status === 'Negotiating') {
    return {
      label: isEng ? 'Counter-offer' : 'Đề xuất giá mới',
      badgeClass: 'bg-amber-300/15 text-amber-200',
    };
  }
  if (isAwaitingEscrow(item)) {
    return {
      label: isEng ? 'Awaiting escrow' : 'Chờ ký quỹ',
      badgeClass: 'bg-emerald-400/15 text-emerald-200',
    };
  }
  return {
    label: isEng ? 'Cancelled / Declined' : 'Đã hủy / Từ chối',
    badgeClass: 'bg-rose-400/15 text-rose-200',
  };
}

export default function ClientSentRequestsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [requests, setRequests] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<RequestFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    commissionService
      .getByClient()
      .then((items) => {
        const filtered = items
          .filter(isSentRequestItem)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(filtered);
      })
      .catch((cause) => {
        const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
        setError(
          apiError?.details?.join(' ') ||
            apiError?.message ||
            (isEng ? 'Unable to load your sent requests.' : 'Không thể tải danh sách yêu cầu đã gửi.')
        );
      })
      .finally(() => setLoading(false));
  }, [isEng]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setLoading(false);
      setError(isEng ? 'Please sign in to view your sent requests.' : 'Vui lòng đăng nhập để xem yêu cầu đã gửi.');
      return;
    }
    loadRequests();
  }, [hasHydrated, isAuthenticated, isEng, loadRequests]);

  const visibleRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'AwaitingEscrow'
            ? isAwaitingEscrow(item)
            : item.status === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const code = `cmd-${item.id.slice(0, 8)}`.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.creatorName ?? '').toLowerCase().includes(q) ||
        code.includes(q)
      );
    });
  }, [requests, filter, searchQuery]);

  const updateItem = (updated: Commission) => {
    setRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleCounteroffer = async (id: string, accept: boolean) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await commissionService.respondToCounteroffer(id, accept);
      updateItem(updated);
      if (accept) router.push(`/payment/checkout/${id}`);
    } catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(
        apiError?.details?.join(' ') ||
          apiError?.message ||
          (isEng ? 'Unable to respond to counter-offer.' : 'Không thể phản hồi đề xuất giá.')
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await commissionService.cancelWithPolicy(id, {
        cancellationReason:
          withdrawReason.trim() ||
          (isEng ? 'Client withdrew booking request' : 'Khách hàng rút lại yêu cầu đặt vẽ'),
      });
      updateItem(updated);
      setWithdrawId(null);
      setWithdrawReason('');
    } catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(
        apiError?.details?.join(' ') ||
          apiError?.message ||
          (isEng ? 'Unable to withdraw request.' : 'Không thể hủy yêu cầu này.')
      );
    } finally {
      setBusyId(null);
    }
  };

  const tabs: Array<{ key: RequestFilter; label: string }> = [
    { key: 'All', label: isEng ? 'All' : 'Tất cả' },
    { key: 'PendingAcceptance', label: isEng ? 'Awaiting' : 'Chờ phản hồi' },
    { key: 'Negotiating', label: isEng ? 'Counter-offer' : 'Đề xuất giá' },
    { key: 'AwaitingEscrow', label: isEng ? 'Awaiting escrow' : 'Chờ ký quỹ' },
    { key: 'Cancelled', label: isEng ? 'Closed' : 'Đã hủy' },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4" data-no-translate="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-h1 text-lg font-bold text-white">
            {isEng ? 'Sent booking requests' : 'Yêu cầu đặt vẽ đã gửi'}
          </h1>
          <span className="text-xs text-slate-400">({visibleRequests.length})</span>
        </div>
        <Link
          href="/creators"
          className="commission-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isEng ? 'New request' : 'Đặt vẽ mới'}
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-xs text-rose-200"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={loadRequests}
                className="rounded-lg border border-rose-300/30 px-2.5 py-1 text-[11px] font-semibold hover:bg-rose-400/20"
              >
                {isEng ? 'Retry' : 'Thử lại'}
              </button>
            )}
            <button onClick={() => setError(null)} className="hover:text-white" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilter(tab.key);
                    setWithdrawId(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#A7ACD9] text-[#151725]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={isEng ? 'Search title or creator…' : 'Tìm tên đơn, họa sĩ…'}
              className="w-full rounded-lg border border-white/10 bg-[#10131f] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#A7ACD9]/60"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            {isEng ? 'Loading requests…' : 'Đang tải yêu cầu…'}
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#A7ACD9]" />
            <p className="mt-3 text-sm font-semibold text-white">
              {requests.length === 0
                ? isEng
                  ? 'No sent requests yet'
                  : 'Bạn chưa gửi yêu cầu đặt vẽ nào'
                : isEng
                  ? 'No matching requests'
                  : 'Không có yêu cầu phù hợp'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {requests.length === 0
                ? isEng
                  ? 'Explore creators to send your first commission brief.'
                  : 'Khám phá họa sĩ để gửi yêu cầu đặt vẽ đầu tiên.'
                : isEng
                  ? 'Try another filter or search keyword.'
                  : 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {visibleRequests.map((item) => {
              const price = item.finalPrice ?? item.totalPrice ?? item.price;
              const statusMeta = getRequestStatusMeta(item, isEng);
              const awaitingEscrow = isAwaitingEscrow(item);
              const isBusy = busyId === item.id;
              const isWithdrawing = withdrawId === item.id;

              return (
                <div key={item.id} className="py-4 first:pt-4 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#A7ACD9]">
                          #CMD-{item.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatDate(item.createdAt, isEng)}</span>
                      </div>
                      <Link
                        href={`/client/requests/${item.id}`}
                        className="mt-1.5 block truncate text-sm font-bold text-white hover:text-[#A7ACD9]"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">
                        @{item.creatorName || item.creatorId} · {formatMoney(price)}
                      </p>
                      {item.status === 'Cancelled' && item.cancellationReason && (
                        <p className="mt-1 text-xs text-rose-300/90">
                          {isEng ? 'Reason:' : 'Lý do:'} {item.cancellationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {item.status === 'PendingAcceptance' && !isWithdrawing && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setWithdrawId(item.id);
                            setWithdrawReason('');
                          }}
                          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                        >
                          {isEng ? 'Withdraw' : 'Rút yêu cầu'}
                        </button>
                      )}

                      {item.status === 'Negotiating' && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleCounteroffer(item.id, true)}
                            className="commission-primary rounded-lg px-3.5 py-2 text-xs font-bold transition disabled:opacity-50"
                          >
                            {isEng ? 'Accept offer' : 'Chấp nhận giá'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleCounteroffer(item.id, false)}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                          >
                            {isEng ? 'Decline' : 'Từ chối'}
                          </button>
                        </>
                      )}

                      {awaitingEscrow && (
                        <Link
                          href={`/payment/checkout/${item.id}`}
                          className="commission-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition"
                        >
                          {isEng ? 'Deposit escrow' : 'Ký quỹ ngay'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      <Link
                        href={`/client/requests/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        {isEng ? 'Details' : 'Chi tiết'}
                      </Link>
                    </div>
                  </div>

                  {isWithdrawing && (
                    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={withdrawReason}
                        onChange={(event) => setWithdrawReason(event.target.value)}
                        placeholder={
                          isEng ? 'Reason for withdrawing (optional)' : 'Lý do rút yêu cầu (không bắt buộc)'
                        }
                        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#10131f] px-3 py-1.5 text-xs text-white outline-none focus:border-rose-300"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleWithdraw(item.id)}
                          className="rounded-lg bg-rose-400 px-3 py-1.5 text-xs font-bold text-[#351016] disabled:opacity-50"
                        >
                          {isBusy ? (isEng ? 'Withdrawing…' : 'Đang hủy…') : isEng ? 'Confirm' : 'Xác nhận hủy'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setWithdrawId(null)}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200"
                        >
                          {isEng ? 'Cancel' : 'Thôi'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
