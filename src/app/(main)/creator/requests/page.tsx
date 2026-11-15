'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { commissionService } from '@/services/commission.service';
import { useAuthStore } from '@/store/use-auth-store';
import { Commission, RespondToCommissionPayload } from '@/types/commission.types';

type DeadlineFilter = 'all' | 'within7' | 'within14' | 'within30' | 'noDeadline';
type PrioritySort = 'recommended' | 'deadlineAsc' | 'budgetDesc' | 'newest';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

const formatDate = (value?: string | null, isEng = false) => {
  if (!value) return isEng ? 'No delivery date set' : 'Chưa đặt hạn giao';
  return new Intl.DateTimeFormat(isEng ? 'en-US' : 'vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatSubmittedAt = (value: string, isEng = false) =>
  new Intl.DateTimeFormat(isEng ? 'en-US' : 'vi-VN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

function getDaysUntilDeadline(deadlineAt?: string | null): number | null {
  if (!deadlineAt) return null;
  const diff = new Date(deadlineAt).getTime() - Date.now();
  return Math.ceil(diff / DAY_MS);
}

function getPriorityScore(request: Commission): number {
  const days = getDaysUntilDeadline(request.deadlineAt);
  const price = request.totalPrice ?? request.price ?? 0;
  const urgencyScore =
    days === null ? 0 : days <= 3 ? 60 : days <= 7 ? 45 : days <= 14 ? 25 : days <= 30 ? 10 : 0;
  const budgetScore = Math.min(30, Math.floor(price / 200_000) * 3);
  const commercialBonus = request.licenseType === 'Commercial' ? 15 : 0;
  return urgencyScore + budgetScore + commercialBonus;
}

function extractApiErrorMessage(cause: unknown, fallback: string): string {
  if (isAxiosError(cause)) {
    const apiError = cause.response?.data?.error;
    if (Array.isArray(apiError?.details) && apiError.details.length > 0) {
      return apiError.details.join(' ');
    }
    if (typeof apiError?.message === 'string' && apiError.message.trim()) {
      return apiError.message;
    }
    if (typeof cause.response?.data?.message === 'string' && cause.response.data.message.trim()) {
      return cause.response.data.message;
    }
  }
  return fallback;
}

export default function CreatorRequestsPage() {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [requests, setRequests] = useState<Commission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Commission | null>(null);
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [prioritySort, setPrioritySort] = useState<PrioritySort>('recommended');
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [counterOffer, setCounterOffer] = useState('');
  const [negotiateNote, setNegotiateNote] = useState('');
  const [pendingConfirmOffer, setPendingConfirmOffer] = useState<{ price: number; note?: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    commissionService
      .getCreatorRequests()
      .then((items) => {
        setRequests(items);
        setSelectedId(items[0]?.id ?? null);
      })
      .catch((cause) =>
        setFeedback({
          type: 'error',
          text: extractApiErrorMessage(
            cause,
            isEng
              ? 'Unable to load incoming requests. Please try again.'
              : 'Không thể tải danh sách yêu cầu mới. Vui lòng thử lại.'
          ),
        })
      )
      .finally(() => setLoading(false));
  }, [hasHydrated, isEng]);

  const visibleRequests = useMemo(() => {
    const filtered = requests.filter((request) => {
      const days = getDaysUntilDeadline(request.deadlineAt);
      if (deadlineFilter === 'within7') return days !== null && days <= 7;
      if (deadlineFilter === 'within14') return days !== null && days <= 14;
      if (deadlineFilter === 'within30') return days !== null && days <= 30;
      if (deadlineFilter === 'noDeadline') return days === null;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (prioritySort === 'recommended') {
        const diff = getPriorityScore(b) - getPriorityScore(a);
        if (diff !== 0) return diff;
      }
      if (prioritySort === 'deadlineAsc') {
        const aTime = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
      }
      if (prioritySort === 'budgetDesc') {
        const aPrice = a.totalPrice ?? a.price ?? 0;
        const bPrice = b.totalPrice ?? b.price ?? 0;
        if (aPrice !== bPrice) return bPrice - aPrice;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests, deadlineFilter, prioritySort]);

  const selectedRequest = useMemo(
    () => visibleRequests.find((item) => item.id === selectedId) ?? visibleRequests[0] ?? null,
    [visibleRequests, selectedId]
  );

  useEffect(() => {
    if (!selectedRequest) {
      setSelectedDetail(null);
      return;
    }
    if (selectedRequest.milestones !== undefined) {
      setSelectedDetail(selectedRequest);
      return;
    }
    let cancelled = false;
    commissionService
      .getById(selectedRequest.id)
      .then((detail) => {
        if (cancelled) return;
        const merged: Commission = {
          ...selectedRequest,
          ...detail,
          clientName: detail.clientName || selectedRequest.clientName,
          creatorName: detail.creatorName || selectedRequest.creatorName,
        };
        setSelectedDetail(merged);
        setRequests((prev) =>
          prev.map((item) =>
            item.id === detail.id
              ? {
                  ...item,
                  ...detail,
                  clientName: detail.clientName || item.clientName,
                  creatorName: detail.creatorName || item.creatorName,
                }
              : item
          )
        );
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail(selectedRequest);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRequest]);

  const activeDetail = selectedDetail?.id === selectedRequest?.id ? selectedDetail : selectedRequest;

  const respond = async (payload: RespondToCommissionPayload) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await commissionService.respond(selectedRequest.id, payload);
      const remainingRequests = requests.filter((request) => request.id !== selectedRequest.id);
      setRequests(remainingRequests);
      setSelectedId(remainingRequests[0]?.id ?? null);
      setShowNegotiate(false);
      setNegotiateNote('');
      setPendingConfirmOffer(null);
      setRejecting(false);
      setFeedback({
        type: 'success',
        text:
          payload.action === 'Accept'
            ? isEng
              ? 'Request accepted. The client can now secure the escrow deposit.'
              : 'Đã chấp nhận yêu cầu. Khách hàng có thể tiến hành ký quỹ.'
            : payload.action === 'Reject'
              ? isEng
                ? 'Request declined.'
                : 'Đã từ chối yêu cầu.'
              : isEng
                ? 'Counter-offer sent to the client.'
                : 'Đã gửi đề xuất giá mới tới khách hàng.',
      });
    } catch (cause) {
      setFeedback({
        type: 'error',
        text: extractApiErrorMessage(
          cause,
          isEng
            ? 'We could not update this request. Please try again.'
            : 'Không thể cập nhật yêu cầu này. Vui lòng thử lại.'
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const total = selectedRequest?.totalPrice ?? selectedRequest?.price;
  const selectedDays = selectedRequest ? getDaysUntilDeadline(selectedRequest.deadlineAt) : null;
  const minNegotiatePrice = useMemo(() => {
    if (!selectedRequest) return 1;
    const baseTotal = selectedRequest.totalPrice ?? selectedRequest.price ?? 0;
    const milestones = activeDetail?.milestones ?? [];
    const oldMilestoneSum = milestones.reduce((sum, m) => sum + m.price, 0);
    const milestoneFloor =
      milestones.length > 0 && oldMilestoneSum > 0
        ? Math.max(1, baseTotal - oldMilestoneSum + milestones.length)
        : 1;
    const discountFloor = (selectedRequest.discountAmount ?? 0) + 1;
    return Math.max(1, milestoneFloor, discountFloor);
  }, [selectedRequest, activeDetail]);

  const deadlineOptions: Array<{ key: DeadlineFilter; label: string }> = [
    { key: 'all', label: isEng ? 'All deadlines' : 'Tất cả hạn giao' },
    { key: 'within7', label: isEng ? 'Urgent (≤ 7d)' : 'Gấp (≤ 7 ngày)' },
    { key: 'within14', label: isEng ? 'Within 14d' : 'Trong 14 ngày' },
    { key: 'within30', label: isEng ? 'Within 30d' : 'Trong 30 ngày' },
    { key: 'noDeadline', label: isEng ? 'No deadline' : 'Chưa đặt hạn' },
  ];

  const sortOptions: Array<{ key: PrioritySort; label: string }> = [
    { key: 'recommended', label: isEng ? 'Recommended priority' : 'Ưu tiên đề xuất' },
    { key: 'deadlineAsc', label: isEng ? 'Earliest deadline' : 'Deadline gần nhất' },
    { key: 'budgetDesc', label: isEng ? 'Highest budget' : 'Ngân sách cao nhất' },
    { key: 'newest', label: isEng ? 'Newest first' : 'Mới gửi gần đây' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4" data-no-translate="true">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-h1 text-2xl font-bold text-white">
            {isEng ? 'Incoming commission requests' : 'Yêu cầu đặt vẽ mới'}
          </h1>
          <span className="text-sm text-slate-400">
            {requests.length} {isEng ? 'pending' : 'chờ xử lý'}
          </span>
        </div>
      </section>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${
            feedback.type === 'error'
              ? 'border border-rose-400/30 bg-rose-400/10 text-rose-200'
              : 'bg-[#A7ACD9]/10 text-[#d8dbff]'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="opacity-80 hover:text-white hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-xl bg-white/[0.025] text-sm text-slate-400">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#A7ACD9]" />
          {isEng ? 'Loading requests…' : 'Đang tải yêu cầu…'}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl bg-white/[0.025] px-6 text-center">
          <CheckCircle2 className="mb-4 h-10 w-10 text-[#A7ACD9]" />
          <h2 className="font-h1 text-lg font-bold text-white">
            {isEng ? 'Your inbox is clear' : 'Chưa có yêu cầu nào đang chờ'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            {isEng
              ? 'New commission briefs for your studio will appear here.'
              : 'Các yêu cầu đặt vẽ mới gửi tới studio của bạn sẽ hiển thị tại đây.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1E2536] bg-white/[0.025]">
          <div className="flex flex-col gap-3 border-b border-[#1E2536] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                <CalendarClock className="h-3.5 w-3.5 text-[#A7ACD9]" />
                {isEng ? 'Deadline:' : 'Hạn hoàn thành:'}
              </span>
              {deadlineOptions.map((option) => {
                const active = deadlineFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setDeadlineFilter(option.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? 'bg-[#A7ACD9] text-[#151725]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="priority-sort" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#A7ACD9]" />
                {isEng ? 'Priority:' : 'Sắp xếp ưu tiên:'}
              </label>
              <select
                id="priority-sort"
                value={prioritySort}
                onChange={(event) => setPrioritySort(event.target.value as PrioritySort)}
                className="rounded-lg border border-[#1E2536] bg-[#10131f] px-3 py-1 text-xs font-semibold text-white outline-none focus:border-[#A7ACD9]"
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleRequests.length === 0 || !selectedRequest ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <CalendarClock className="mb-3 h-9 w-9 text-[#A7ACD9]" />
              <h2 className="font-h1 text-base font-bold text-white">
                {isEng ? 'No requests match this deadline filter' : 'Không có yêu cầu nào khớp bộ lọc hạn hoàn thành'}
              </h2>
              <button
                type="button"
                onClick={() => setDeadlineFilter('all')}
                className="mt-4 rounded-lg border border-[#1E2536] px-4 py-2 text-xs font-semibold text-white hover:bg-white/5"
              >
                {isEng ? 'Show all requests' : 'Hiển thị tất cả'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row">
              <aside
                aria-hidden={isQueueCollapsed}
                className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                  isQueueCollapsed
                    ? 'max-h-0 border-b-0 opacity-0 lg:max-h-none lg:w-0 lg:border-r-0'
                    : 'max-h-[700px] border-b border-[#1E2536] opacity-100 lg:max-h-none lg:w-[320px] lg:border-b-0 lg:border-r lg:border-[#1E2536]'
                }`}
              >
                <div className="w-full lg:w-[320px]">
                  <div className="flex items-center justify-between border-b border-[#1E2536] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <h2 className="font-h1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {isEng ? 'Request queue' : 'Hàng đợi yêu cầu'}
                      </h2>
                      <span className="text-xs font-semibold text-slate-400">{visibleRequests.length}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQueueCollapsed(true)}
                      title={isEng ? 'Collapse queue' : 'Thu gọn hàng đợi'}
                      aria-label={isEng ? 'Collapse queue' : 'Thu gọn hàng đợi'}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[640px] divide-y divide-[#1E2536] overflow-y-auto">
                    {visibleRequests.map((request) => {
                      const isSelected = selectedRequest.id === request.id;
                      const days = getDaysUntilDeadline(request.deadlineAt);
                      const isUrgent = days !== null && days <= 7;
                      return (
                        <button
                          key={request.id}
                          onClick={() => {
                            setSelectedId(request.id);
                            setShowNegotiate(false);
                            setRejecting(false);
                          }}
                          className={`w-full px-5 py-4 text-left transition ${
                            isSelected ? 'bg-[#A7ACD9]/10' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-[#A7ACD9]">
                                #{request.id.slice(0, 8).toUpperCase()}
                              </span>
                              {isUrgent && (
                                <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                                  {days <= 0
                                    ? isEng
                                      ? 'Due'
                                      : 'Sát hạn'
                                    : isEng
                                      ? `${days}d left`
                                      : `Còn ${days} ngày`}
                                </span>
                              )}
                              {request.licenseType === 'Commercial' && (
                                <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                                  Commercial
                                </span>
                              )}
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#A7ACD9]' : 'text-slate-600'}`}
                            />
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-bold text-white">{request.title}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            @{request.clientName || request.clientId.slice(0, 8)}
                          </p>
                          <div className="mt-2.5 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#A7ACD9]">
                              {formatMoney(request.totalPrice ?? request.price)}
                            </span>
                            <span className="text-slate-500">
                              {request.deadlineAt
                                ? `${isEng ? 'Due' : 'Hạn:'} ${formatDate(request.deadlineAt, isEng)}`
                                : formatSubmittedAt(request.createdAt, isEng)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="flex min-w-0 flex-1 flex-col justify-between p-6 transition-all duration-300 sm:p-8">
                <div>
                  <header className="flex flex-col gap-3 border-b border-[#1E2536] pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isQueueCollapsed && (
                          <button
                            type="button"
                            onClick={() => setIsQueueCollapsed(false)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#d8dbff] transition hover:bg-white/10"
                          >
                            <PanelLeftOpen className="h-3.5 w-3.5" />
                            {isEng ? `Queue (${visibleRequests.length})` : `Hàng đợi (${visibleRequests.length})`}
                          </button>
                        )}
                        <span className="font-mono text-xs font-bold text-[#A7ACD9]">
                          #{selectedRequest.id.slice(0, 8).toUpperCase()}
                        </span>
                        {selectedDays !== null && selectedDays <= 7 && (
                          <span className="rounded-full bg-amber-300/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                            {selectedDays <= 0
                              ? isEng
                                ? 'Urgent deadline'
                                : 'Deadline sát hạn'
                              : isEng
                                ? `Urgent · ${selectedDays}d left`
                                : `Ưu tiên gấp · Còn ${selectedDays} ngày`}
                          </span>
                        )}
                        {selectedRequest.licenseType === 'Commercial' && (
                          <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                            Commercial
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1.5 font-h1 text-xl font-bold text-white sm:text-2xl">
                        {selectedRequest.title}
                      </h2>
                      <p className="mt-1.5 text-sm text-slate-400">
                        {isEng ? 'Client:' : 'Khách hàng:'}{' '}
                        <span className="font-semibold text-slate-200">
                          @{selectedRequest.clientName || selectedRequest.clientId}
                        </span>{' '}
                        · {isEng ? 'Submitted' : 'Đã nộp'} {formatSubmittedAt(selectedRequest.createdAt, isEng)}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#A7ACD9]/15 px-3 py-1 text-xs font-bold text-[#d8dbff]">
                      {isEng ? 'Ready for review' : 'Chờ bạn xem xét'}
                    </span>
                  </header>

                  <div className="space-y-6 py-6">
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isEng ? 'Project brief' : 'Mô tả yêu cầu (Brief)'}
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {selectedRequest.description ||
                          (isEng
                            ? 'The client has not added a detailed brief yet.'
                            : 'Khách hàng chưa thêm mô tả chi tiết.')}
                      </p>
                    </div>

                    <dl className="grid gap-4 border-y border-[#1E2536] py-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-slate-500">
                          {isEng ? 'Proposed budget' : 'Ngân sách đề xuất'}
                        </dt>
                        <dd className="mt-1 font-h1 text-xl font-bold text-white">{formatMoney(total)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">
                          {isEng ? 'Delivery target' : 'Hạn bàn giao dự kiến'}
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                          {formatDate(selectedRequest.deadlineAt, isEng)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">{isEng ? 'Milestones' : 'Các cột mốc'}</dt>
                        <dd className="mt-1 font-semibold text-white">
                          {activeDetail?.milestones?.length ?? 0} {isEng ? 'proposed' : 'mốc'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  {showNegotiate && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const price = Number(counterOffer);
                        if (!Number.isFinite(price) || price <= 0) {
                          setFeedback({
                            type: 'error',
                            text: isEng ? 'Please enter a valid positive price.' : 'Vui lòng nhập mức giá hợp lệ (> 0).',
                          });
                          return;
                        }
                        if (price < minNegotiatePrice) {
                          setFeedback({
                            type: 'error',
                            text: isEng
                              ? `Counter-offer must be at least ${formatMoney(minNegotiatePrice)} so milestones and discounts remain valid.`
                              : `Giá đề xuất tối thiểu phải từ ${formatMoney(minNegotiatePrice)} để không làm âm cột mốc cuối hoặc mã giảm giá.`,
                          });
                          return;
                        }
                        const note = negotiateNote.trim() || undefined;
                        const baseTotal = total ?? 0;
                        if (baseTotal > 0 && (price < baseTotal * 0.5 || price > baseTotal * 2)) {
                          setPendingConfirmOffer({ price, note });
                          return;
                        }
                        setPendingConfirmOffer(null);
                        void respond({
                          action: 'Negotiate',
                          negotiatePrice: price,
                          negotiateNote: note,
                        });
                      }}
                      className="mb-4 space-y-2.5 border-t border-[#1E2536] pt-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <label htmlFor="counter-offer" className="block text-sm font-bold text-white">
                          {isEng ? 'Send a counter-offer' : 'Gửi đề xuất lại giá'}
                        </label>
                        {minNegotiatePrice > 1 && (
                          <span className="text-[11px] text-slate-400">
                            {isEng ? 'Minimum:' : 'Tối thiểu:'} {formatMoney(minNegotiatePrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                          <input
                            id="counter-offer"
                            type="text"
                            inputMode="numeric"
                            required
                            value={
                              counterOffer
                                ? new Intl.NumberFormat('vi-VN').format(Number(counterOffer))
                                : ''
                            }
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, '');
                              setCounterOffer(digits);
                              setPendingConfirmOffer(null);
                            }}
                            placeholder={isEng ? 'Proposed price (VND)' : 'Nhập giá đề xuất (VD: 350.000)'}
                            className="w-full rounded-lg border border-[#1E2536] bg-[#10131f] py-2 pl-3 pr-8 text-sm font-semibold text-white outline-none focus:border-[#A7ACD9]"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                            ₫
                          </span>
                        </div>
                        <button
                          disabled={submitting}
                          className="rounded-lg bg-[#A7ACD9] px-4 py-2 text-xs font-bold text-[#1F2335] disabled:opacity-60"
                        >
                          <Send className="mr-1 inline h-3.5 w-3.5" /> {isEng ? 'Send offer' : 'Gửi đề xuất'}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={negotiateNote}
                        onChange={(event) => setNegotiateNote(event.target.value)}
                        placeholder={
                          isEng
                            ? 'Note for client (e.g. Complex background / commercial usage)'
                            : 'Ghi chú cho khách hàng (VD: Chi tiết nền phức tạp, thêm phụ phí bản quyền…)'
                        }
                        className="w-full rounded-lg border border-[#1E2536] bg-[#10131f] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#A7ACD9]"
                      />
                      {pendingConfirmOffer && (
                        <div className="rounded-lg border border-amber-300/35 bg-amber-300/10 p-3 text-xs text-amber-100">
                          <p className="font-semibold">
                            {isEng
                              ? `Your counter-offer (${formatMoney(pendingConfirmOffer.price)}) differs sharply from the original budget (${formatMoney(total)}). Are you sure you want to send it?`
                              : `Giá đề xuất (${formatMoney(pendingConfirmOffer.price)}) chênh lệch lớn so với giá ban đầu (${formatMoney(total)}). Bạn chắc chắn muốn gửi?`}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => {
                                const offer = pendingConfirmOffer;
                                setPendingConfirmOffer(null);
                                void respond({
                                  action: 'Negotiate',
                                  negotiatePrice: offer.price,
                                  negotiateNote: offer.note,
                                });
                              }}
                              className="rounded-lg bg-amber-300 px-3 py-1.5 font-bold text-[#1F2335] disabled:opacity-60"
                            >
                              {isEng ? 'Confirm & send' : 'Xác nhận gửi đề xuất'}
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setPendingConfirmOffer(null)}
                              className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/5"
                            >
                              {isEng ? 'Edit price' : 'Sửa lại'}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  )}

                  {rejecting && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void respond({ action: 'Reject', rejectReason: rejectReason.trim() || undefined });
                      }}
                      className="mb-4 border-t border-[#1E2536] pt-4"
                    >
                      <label htmlFor="decline-reason" className="text-sm font-bold text-red-200">
                        {isEng ? 'Reason for declining' : 'Lý do từ chối'}{' '}
                        <span className="font-normal text-red-200/60">
                          {isEng ? '(optional)' : '(không bắt buộc)'}
                        </span>
                      </label>
                      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                        <input
                          id="decline-reason"
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          placeholder={isEng ? 'e.g. My current queue is full' : 'VD: Lịch vẽ hiện tại đã kín'}
                          className="min-w-0 flex-1 rounded-lg border border-[#1E2536] bg-[#10131f] px-3 py-2 text-sm text-white outline-none focus:border-red-300"
                        />
                        <button
                          disabled={submitting}
                          className="rounded-lg bg-red-400 px-4 py-2 text-xs font-bold text-[#351016] disabled:opacity-60"
                        >
                          {isEng ? 'Confirm decline' : 'Xác nhận từ chối'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col gap-3 border-t border-[#1E2536] pt-5 sm:flex-row">
                    <button
                      disabled={submitting}
                      onClick={() => void respond({ action: 'Accept' })}
                      className="order-1 flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#151725] transition hover:bg-[#dfe2ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />{' '}
                      {submitting
                        ? isEng
                          ? 'Updating…'
                          : 'Đang cập nhật…'
                        : isEng
                          ? 'Accept & await escrow'
                          : 'Chấp nhận & chờ ký quỹ'}
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => {
                        setShowNegotiate(!showNegotiate);
                        setRejecting(false);
                        setCounterOffer(String(total ?? ''));
                      }}
                      className="order-2 flex items-center justify-center rounded-lg border border-[#1E2536] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60"
                    >
                      {isEng ? 'Counter-offer' : 'Đề xuất lại giá'}
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => {
                        setRejecting(!rejecting);
                        setShowNegotiate(false);
                      }}
                      className="order-3 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-60"
                    >
                      {isEng ? 'Decline' : 'Từ chối'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
