'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { ExternalLink, FileText, Maximize2 } from 'lucide-react';
import ReferenceLightboxModal from '@/components/modals/ReferenceLightboxModal';
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
      className: 'bg-[#B24A26]/15 text-[#A8321C]',
    };
  }
  if (commission.status === 'Negotiating') {
    return {
      label: isEng ? 'Counter-offer received' : 'Có đề xuất giá mới',
      className: 'bg-[#8A6A1F]/15 text-[#8A6A1F]',
    };
  }
  if (commission.status === 'InProgress' && commission.escrowStatus === 'Pending') {
    return {
      label: isEng ? 'Accepted · Awaiting escrow' : 'Đã chấp nhận · Chờ ký quỹ',
      className: 'bg-[#2F6B63]/15 text-[#2F6B63]',
    };
  }
  if (commission.status === 'Cancelled') {
    return {
      label: isEng ? 'Cancelled / Declined' : 'Đã hủy / Từ chối',
      className: 'bg-[#A8321C]/15 text-[#A8321C]',
    };
  }
  return {
    label: commission.status,
    className: 'bg-[#F0E7D8] text-[#6E6459]',
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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
      <div className="mx-auto max-w-3xl p-8 text-sm text-[#746A5F]" data-no-translate="true">
        {isEng ? 'Loading request…' : 'Đang tải yêu cầu…'}
      </div>
    );
  }
  if (!commission || commission.clientId !== userId) {
    return (
      <div role="alert" className="mx-auto max-w-3xl p-8 text-sm text-[#A8321C]" data-no-translate="true">
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
    <main className="mx-auto w-full max-w-3xl space-y-5 pb-10 text-[#241F1A]" data-no-translate="true">
      <Link href="/client/requests" className="inline-block text-xs font-bold text-[#B24A26] hover:text-[#241F1A]">
        {isEng ? '← Sent requests' : '← Danh sách yêu cầu đã gửi'}
      </Link>

      <section className="glass-container rounded-[28px] border border-[#221E1A]/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="font-mono text-xs font-bold text-[#B24A26]">
            REQUEST #CMD-{commission.id.slice(0, 8).toUpperCase()}
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        <h1 className="mt-3 font-h1 text-2xl font-bold">{commission.title}</h1>
        <p className="mt-2 text-sm text-[#746A5F]">
          {isEng ? 'Creator:' : 'Họa sĩ:'}{' '}
          <Link
            href={`/creators/${commission.creatorId}`}
            className="font-semibold text-[#6E6459] hover:text-[#B24A26]"
          >
            @{commission.creatorName || commission.creatorId}
          </Link>{' '}
          · {isEng ? 'Sent' : 'Đã gửi'} {formatDateTime(commission.createdAt, isEng)}
        </p>

        <dl className="mt-6 grid gap-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[#746A5F]">
              {negotiating
                ? isEng
                  ? 'Counter-offer price'
                  : 'Giá họa sĩ đề xuất'
                : isEng
                  ? 'Total price'
                  : 'Giá yêu cầu'}
            </dt>
            <dd className="mt-1 font-h1 text-xl font-bold text-[#241F1A]">{money(price)}</dd>
            {commission.discountAmount > 0 && (
              <p className="mt-1 text-[11px] text-[#2F6B63]">
                {isEng ? 'Voucher discount:' : 'Giảm giá:'} -{money(commission.discountAmount)}
              </p>
            )}
            {commission.isStagedEscrow && (
              <p className="mt-1 text-[11px] text-[#B24A26]">
                {isEng ? 'Staged escrow enabled' : 'Ký quỹ theo từng mốc'}
              </p>
            )}
          </div>
          <div>
            <dt className="text-xs text-[#746A5F]">{isEng ? 'Target deadline' : 'Hạn giao mong muốn'}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#241F1A]">{formatDate(commission.deadlineAt, isEng)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#746A5F]">{isEng ? 'License' : 'Loại bản quyền'}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#241F1A]">{commission.licenseType}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#746A5F]">
            {isEng ? 'Commission brief' : 'Nội dung yêu cầu'}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#746A5F]">
            {commission.description || (isEng ? 'No detailed description provided.' : 'Không có mô tả chi tiết.')}
          </p>
        </div>

        {(commission.referenceImages?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#746A5F]">
              {isEng ? 'Reference materials' : 'Tài liệu & Hình ảnh tham khảo'} ({commission.referenceImages?.length})
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {commission.referenceImages?.map((url, idx) => {
                const isImg = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url) || url.includes('cloudinary.com') || (url.includes('commissions/references') && !/\.pdf(\?|$)/i.test(url));
                const isPdf = /\.pdf(\?|$)/i.test(url);
                const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com');
                const isPinterest = url.includes('pinterest.com') || url.includes('pin.it');
                return (
                  <div key={idx} className="group relative overflow-hidden rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] p-2">
                    {isImg ? (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="relative block h-24 w-full overflow-hidden rounded cursor-pointer"
                        title={isEng ? 'Preview original image' : 'Xem ảnh gốc'}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Ref #${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center bg-[#F0E7D8]/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4 text-[#241F1A]" />
                        </div>
                      </button>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex h-24 w-full flex-col items-center justify-center gap-1 overflow-hidden p-2 text-center text-xs text-[#746A5F] hover:text-[#241F1A]" title={url}>
                        {isPdf ? <FileText className="h-5 w-5 shrink-0 text-[#A8321C]" /> : <ExternalLink className="h-4 w-4 shrink-0 text-[#B24A26]" />}
                        <span className="text-[11px] font-bold text-[#241F1A]">
                          {isPdf ? (isEng ? 'PDF Document' : 'Tài liệu PDF') : isDrive ? 'Google Drive' : isPinterest ? 'Pinterest' : isEng ? 'External Link' : 'Liên kết ngoài'}
                        </span>
                        <span className="w-full truncate text-[10px] text-[#746A5F]">
                          {url.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(commission.aiReferenceImages?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#746A5F]">
              {isEng ? 'AI layout suggestions' : 'AI gợi ý bố cục'} ({commission.aiReferenceImages?.length})
            </p>
            {commission.layoutHint && (
              <p className="mt-1 text-xs text-[#746A5F]">
                {isEng ? 'Your layout hint:' : 'Gợi ý bố cục của bạn:'}{' '}
                <span className="italic">{commission.layoutHint}</span>
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {commission.aiReferenceImages?.map((img, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] p-2">
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(img.url)}
                    className="relative block h-24 w-full overflow-hidden rounded cursor-pointer"
                    title={isEng ? 'Preview AI sketch' : 'Xem ảnh phác thảo AI'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`AI #${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F0E7D8]/35 opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4 text-[#241F1A]" />
                    </div>
                  </button>
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-[#746A5F]">
                    {isEng ? img.labelEn : img.labelVi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {milestones.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#746A5F]">
              {isEng ? 'Milestones' : 'Các mốc thực hiện'} ({milestones.length})
            </p>
            <ul className="mt-3 divide-y divide-[#221E1A]/10 text-sm">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="text-[#6E6459]">
                    <span className="mr-2 font-mono text-xs text-[#B24A26]">#{m.sequence}</span>
                    {m.title}
                  </span>
                  <span className="font-semibold text-[#241F1A]">{money(m.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {awaitingCreator && (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-[#B24A26]/30 bg-[#B24A26]/10 p-4 text-sm text-[#A8321C]">
              {isEng
                ? 'Request sent. Waiting for the creator to respond.'
                : 'Đã gửi yêu cầu. Đang chờ họa sĩ phản hồi.'}
            </p>
            {showWithdraw ? (
              <form
                onSubmit={(event) => void withdraw(event)}
                className="space-y-3 rounded-xl border border-[#A8321C]/35 bg-[#A8321C]/10 p-4"
              >
                <p className="text-sm font-bold text-[#A8321C]">
                  {isEng ? 'Withdraw this request?' : 'Xác nhận rút lại yêu cầu này?'}
                </p>
                <input
                  type="text"
                  value={withdrawReason}
                  onChange={(event) => setWithdrawReason(event.target.value)}
                  placeholder={isEng ? 'Reason (optional)' : 'Lý do hủy (không bắt buộc)'}
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-sm text-[#241F1A] outline-none focus:border-[#A8321C]/30"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-[#A8321C]/10 px-4 py-2 text-xs font-bold text-[#FFFCF6] disabled:opacity-50"
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
                    className="rounded-xl border border-[#221E1A]/20 px-4 py-2 text-xs text-[#6E6459]"
                  >
                    {isEng ? 'Keep request' : 'Giữ lại'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-2 text-xs font-bold text-[#A8321C] transition hover:bg-[#A8321C]/20"
              >
                {isEng ? 'Withdraw request' : 'Rút / Hủy yêu cầu'}
              </button>
            )}
          </div>
        )}

        {negotiating && (
          <div className="mt-6 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-5">
            <h2 className="font-h1 text-lg font-bold">
              {isEng ? 'Creator sent a counter-offer' : 'Họa sĩ đã gửi đề xuất giá mới'}
            </h2>
            <p className="mt-2 text-sm text-[#746A5F]">
              {isEng
                ? 'Accept the proposed price to proceed to escrow deposit. The workroom only opens after escrow is funded.'
                : 'Chấp nhận giá để chuyển sang bước ký quỹ. phòng làm việc chỉ mở sau khi ký quỹ thành công.'}
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
                className="rounded-xl border border-[#221E1A]/20 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {isEng ? 'Decline' : 'Từ chối'}
              </button>
            </div>
          </div>
        )}

        {awaitingEscrow && (
          <div className="mt-6 rounded-xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 p-5">
            <p className="text-sm text-[#6E6459]">
              {isEng
                ? 'The creator accepted your request. Complete the escrow deposit to unlock the workroom and begin.'
                : 'Họa sĩ đã chấp nhận yêu cầu. Hoàn tất ký quỹ để mở phòng làm việc và bắt đầu thực hiện.'}
            </p>
            <Link
              href={`/payment/checkout/${id}`}
              className="commission-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              {commission.isStagedEscrow && (commission.nextEscrowDepositAmount ?? 0) > 0
                ? isEng
                  ? `Deposit Stage #${commission.currentStage ?? 1} (${money(commission.nextEscrowDepositAmount)}) to open Workroom`
                  : `Ký quỹ Mốc #${commission.currentStage ?? 1} (${money(commission.nextEscrowDepositAmount)}) để mở phòng làm việc`
                : isEng
                  ? 'Deposit escrow to open Workroom'
                  : 'Ký quỹ để mở phòng làm việc'}
            </Link>
          </div>
        )}

        {commission.status === 'Cancelled' && (
          <div className="mt-6 rounded-xl border border-[#A8321C]/30 bg-[#A8321C]/10 p-4 text-sm text-[#746A5F]">
            <p>{isEng ? 'This request has ended.' : 'Yêu cầu đã kết thúc.'}</p>
            {commission.cancellationReason && (
              <p className="mt-2">
                <strong>{isEng ? 'Reason:' : 'Lý do:'}</strong> {commission.cancellationReason}
              </p>
            )}
            {commission.cancellationDetails && (
              <p className="mt-1 text-xs text-[#746A5F]">{commission.cancellationDetails}</p>
            )}
          </div>
        )}

        {!awaitingCreator && !negotiating && !awaitingEscrow && !['Cancelled'].includes(commission.status) && (
          <Link href={`/workroom/${id}`} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">
            {isEng ? 'Open Workroom' : 'Mở phòng làm việc'}
          </Link>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#A8321C]">
            {error}
          </p>
        )}
      </section>
      <ReferenceLightboxModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </main>
  );
}
