'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useLanguage } from '@/context/language-context';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';

const money = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

const formatDate = (value?: string | null, isEng = false) => {
  if (!value) return isEng ? 'No delivery date set' : 'Chưa đặt hạn giao';
  return new Intl.DateTimeFormat(isEng ? 'en-US' : 'vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value: string, isEng = false) =>
  new Intl.DateTimeFormat(isEng ? 'en-US' : 'vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

function getStatusBadge(commission: Commission, isEng: boolean) {
  if (commission.status === 'PendingAcceptance') {
    return {
      label: isEng ? 'Awaiting creator' : 'Chờ họa sĩ phản hồi',
      className: 'bg-[#A7ACD9]/15 text-[#d8dbff]',
    };
  }
  if (commission.status === 'Negotiating') {
    return {
      label: isEng ? 'Counter-offer received' : 'Có đề xuất giá mới',
      className: 'bg-amber-300/15 text-amber-200',
    };
  }
  if (commission.status === 'InProgress' && commission.escrowStatus === 'Pending') {
    return {
      label: isEng ? 'Accepted · Awaiting escrow' : 'Đã chấp nhận · Chờ ký quỹ',
      className: 'bg-emerald-400/15 text-emerald-200',
    };
  }
  if (commission.status === 'Cancelled') {
    return {
      label: isEng ? 'Cancelled / Declined' : 'Đã hủy / Từ chối',
      className: 'bg-rose-400/15 text-rose-200',
    };
  }
  return {
    label: commission.status,
    className: 'bg-white/10 text-slate-200',
  };
}

export default function ClientRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const userId = useAuthStore((state) => state.user?.id);

  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    commissionService
      .getById(id)
      .then(setCommission)
      .catch(() => setError(isEng ? 'Unable to load this request.' : 'Không tải được yêu cầu này.'))
      .finally(() => setLoading(false));
  }, [id, hasHydrated, isEng]);

  const respond = async (accept: boolean) => {
    setBusy(true);
    setError('');
    try {
      await commissionService.respondToCounteroffer(id, accept);
      if (accept) router.replace(`/payment/checkout/${id}`);
      else setCommission(await commissionService.getById(id));
    } catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(
        apiError?.details?.join(' ') ||
          apiError?.message ||
          (isEng ? 'Unable to respond to counter-offer.' : 'Không thể phản hồi đề xuất. Vui lòng thử lại.')
      );
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await commissionService.cancelWithPolicy(id, {
        cancellationReason:
          withdrawReason.trim() || (isEng ? 'Client withdrew booking request' : 'Khách hàng rút lại yêu cầu đặt vẽ'),
      });
      setCommission(updated);
      setShowWithdraw(false);
    } catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(
        apiError?.details?.join(' ') ||
          apiError?.message ||
          (isEng ? 'Unable to withdraw this request.' : 'Không thể hủy yêu cầu này. Vui lòng thử lại.')
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-sm text-slate-400" data-no-translate="true">
        {isEng ? 'Loading request…' : 'Đang tải yêu cầu…'}
      </div>
    );
  }
  if (!commission || commission.clientId !== userId) {
    return (
      <div role="alert" className="mx-auto max-w-3xl p-8 text-sm text-red-300" data-no-translate="true">
        {error || (isEng ? 'You do not have permission to view this request.' : 'Bạn không có quyền xem yêu cầu này.')}
      </div>
    );
  }

  const negotiating = commission.status === 'Negotiating';
  const awaitingCreator = commission.status === 'PendingAcceptance';
  const awaitingEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending';
  const price = commission.finalPrice ?? commission.totalPrice ?? commission.price;
  const statusBadge = getStatusBadge(commission, isEng);
  const milestones = [...(commission.milestones ?? [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 pb-10 text-white" data-no-translate="true">
      <Link href="/client/requests" className="inline-block text-xs font-bold text-[#A7ACD9] hover:text-white">
        {isEng ? '← Sent requests' : '← Danh sách yêu cầu đã gửi'}
      </Link>

      <section className="glass-container rounded-[28px] border border-white/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="font-mono text-xs font-bold text-[#A7ACD9]">
            REQUEST #CMD-{commission.id.slice(0, 8).toUpperCase()}
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        <h1 className="mt-3 font-h1 text-2xl font-bold">{commission.title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isEng ? 'Creator:' : 'Họa sĩ:'}{' '}
          <Link
            href={`/creators/${commission.creatorId}`}
            className="font-semibold text-slate-200 hover:text-[#A7ACD9]"
          >
            @{commission.creatorName || commission.creatorId}
          </Link>{' '}
          · {isEng ? 'Sent' : 'Đã gửi'} {formatDateTime(commission.createdAt, isEng)}
        </p>

        <dl className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-400">
              {negotiating
                ? isEng
                  ? 'Counter-offer price'
                  : 'Giá Creator đề xuất'
                : isEng
                  ? 'Total price'
                  : 'Giá yêu cầu'}
            </dt>
            <dd className="mt-1 font-h1 text-xl font-bold text-white">{money(price)}</dd>
            {commission.discountAmount > 0 && (
              <p className="mt-1 text-[11px] text-emerald-300">
                {isEng ? 'Voucher discount:' : 'Giảm giá:'} -{money(commission.discountAmount)}
              </p>
            )}
            {commission.isStagedEscrow && (
              <p className="mt-1 text-[11px] text-[#A7ACD9]">
                {isEng ? 'Staged escrow enabled' : 'Ký quỹ theo từng mốc'}
              </p>
            )}
          </div>
          <div>
            <dt className="text-xs text-slate-400">{isEng ? 'Target deadline' : 'Hạn giao mong muốn'}</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{formatDate(commission.deadlineAt, isEng)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">{isEng ? 'License' : 'Loại bản quyền'}</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{commission.licenseType}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isEng ? 'Commission brief' : 'Nội dung yêu cầu'}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
            {commission.description || (isEng ? 'No detailed description provided.' : 'Không có mô tả chi tiết.')}
          </p>
        </div>

        {milestones.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isEng ? 'Milestones' : 'Các mốc thực hiện'} ({milestones.length})
            </p>
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="text-slate-200">
                    <span className="mr-2 font-mono text-xs text-[#A7ACD9]">#{m.sequence}</span>
                    {m.title}
                  </span>
                  <span className="font-semibold text-white">{money(m.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {awaitingCreator && (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 p-4 text-sm text-[#d8dbff]">
              {isEng
                ? 'Request sent. Waiting for the creator to respond.'
                : 'Đã gửi yêu cầu. Đang chờ Creator phản hồi.'}
            </p>
            {showWithdraw ? (
              <form
                onSubmit={(event) => void withdraw(event)}
                className="space-y-3 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4"
              >
                <p className="text-sm font-bold text-rose-100">
                  {isEng ? 'Withdraw this request?' : 'Xác nhận rút lại yêu cầu này?'}
                </p>
                <input
                  type="text"
                  value={withdrawReason}
                  onChange={(event) => setWithdrawReason(event.target.value)}
                  placeholder={isEng ? 'Reason (optional)' : 'Lý do hủy (không bắt buộc)'}
                  className="w-full rounded-xl border border-white/15 bg-[#10131f] px-3 py-2 text-sm text-white outline-none focus:border-rose-300"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-rose-400 px-4 py-2 text-xs font-bold text-[#351016] disabled:opacity-50"
                  >
                    {busy
                      ? isEng
                        ? 'Withdrawing…'
                        : 'Đang hủy…'
                      : isEng
                        ? 'Confirm withdraw'
                        : 'Xác nhận rút yêu cầu'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowWithdraw(false)}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-slate-200"
                  >
                    {isEng ? 'Keep request' : 'Giữ lại'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-400/20"
              >
                {isEng ? 'Withdraw request' : 'Rút / Hủy yêu cầu'}
              </button>
            )}
          </div>
        )}

        {negotiating && (
          <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 p-5">
            <h2 className="font-h1 text-lg font-bold">
              {isEng ? 'Creator sent a counter-offer' : 'Creator đã gửi đề xuất giá mới'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {isEng
                ? 'Accept the proposed price to proceed to escrow deposit. The workroom only opens after escrow is funded.'
                : 'Chấp nhận giá để chuyển sang bước ký quỹ. Workroom chỉ mở sau khi ký quỹ thành công.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={busy}
                onClick={() => void respond(true)}
                className="commission-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {isEng ? 'Accept price' : 'Chấp nhận giá'}
              </button>
              <button
                disabled={busy}
                onClick={() => void respond(false)}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {isEng ? 'Decline' : 'Từ chối'}
              </button>
            </div>
          </div>
        )}

        {awaitingEscrow && (
          <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <p className="text-sm text-slate-200">
              {isEng
                ? 'The creator accepted your request. Complete the escrow deposit to unlock the workroom and begin.'
                : 'Họa sĩ đã chấp nhận yêu cầu. Hoàn tất ký quỹ để mở Workroom và bắt đầu thực hiện.'}
            </p>
            <Link
              href={`/payment/checkout/${id}`}
              className="commission-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              {commission.isStagedEscrow && (commission.nextEscrowDepositAmount ?? 0) > 0
                ? isEng
                  ? `Deposit Stage #${commission.currentStage ?? 1} (${money(commission.nextEscrowDepositAmount)}) to open Workroom`
                  : `Ký quỹ Mốc #${commission.currentStage ?? 1} (${money(commission.nextEscrowDepositAmount)}) để mở Workroom`
                : isEng
                  ? 'Deposit escrow to open Workroom'
                  : 'Ký quỹ để mở Workroom'}
            </Link>
          </div>
        )}

        {commission.status === 'Cancelled' && (
          <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-slate-300">
            <p>{isEng ? 'This request has ended.' : 'Yêu cầu đã kết thúc.'}</p>
            {commission.cancellationReason && (
              <p className="mt-2">
                <strong>{isEng ? 'Reason:' : 'Lý do:'}</strong> {commission.cancellationReason}
              </p>
            )}
            {commission.cancellationDetails && (
              <p className="mt-1 text-xs text-slate-400">{commission.cancellationDetails}</p>
            )}
          </div>
        )}

        {!awaitingCreator && !negotiating && !awaitingEscrow && !['Cancelled'].includes(commission.status) && (
          <Link href={`/workroom/${id}`} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">
            {isEng ? 'Open Workroom' : 'Mở Workroom'}
          </Link>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
