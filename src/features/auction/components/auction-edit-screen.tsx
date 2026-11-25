'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Gavel, LoaderCircle, Save } from 'lucide-react';
import { auctionError, auctionService, type AuctionDetailDto } from '@/features/auction';
import { PageLoader } from '@/features/navigation';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

/** ISO → giá trị cho <input type="datetime-local"> theo giờ máy người dùng. */
function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * AUCT-04 — màn hình sửa phiên đấu giá.
 *
 * Trước đây backend đã có `PUT /auctions/{id}` nhưng không có màn nào gọi tới, nên người bán
 * lỡ đặt sai giá/bước giá/giờ kết thúc chỉ còn cách huỷ phiên rồi tạo lại (mất phí và mất lượt
 * hiển thị). Màn này chỉ mở với phiên `Scheduled` chưa có lượt đặt giá — đúng điều kiện backend.
 */
export function AuctionEditScreen({ auctionId, userId }: { auctionId: string; userId: string | null }) {
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [startPrice, setStartPrice] = useState('');
  const [bidStep, setBidStep] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [clearBuyNow, setClearBuyNow] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.detail(auctionId);
      const a = res.auction;
      setAuction(a);
      setStartPrice(String(a.startPrice));
      setBidStep(String(a.bidStep));
      setBuyNowPrice(a.buyNowPrice != null ? String(a.buyNowPrice) : '');
      setStartAt(toLocalInputValue(a.startAt));
      setEndAt(toLocalInputValue(a.endAt));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin phiên đấu giá.');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await load();
    })();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auction) return;

    setError(null);
    setSuccess(null);

    const startNum = Number(startPrice);
    const stepNum = Number(bidStep);
    const buyNowNum = buyNowPrice.trim() === '' ? null : Number(buyNowPrice);
    const startIso = fromLocalInputValue(startAt);
    const endIso = fromLocalInputValue(endAt);

    if (!Number.isFinite(startNum) || startNum <= 0) {
      setError('Giá khởi điểm phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(stepNum) || stepNum <= 0) {
      setError('Bước giá phải lớn hơn 0.');
      return;
    }
    if (!clearBuyNow && buyNowNum !== null && (!Number.isFinite(buyNowNum) || buyNowNum <= startNum)) {
      setError('Giá mua ngay phải lớn hơn giá khởi điểm.');
      return;
    }
    if (!startIso || !endIso) {
      setError('Vui lòng chọn đầy đủ thời điểm bắt đầu và kết thúc.');
      return;
    }
    if (Date.parse(endIso) <= Date.parse(startIso)) {
      setError('Thời điểm kết thúc phải sau thời điểm bắt đầu.');
      return;
    }

    setSaving(true);
    try {
      await auctionService.update(auctionId, {
        startPrice: startNum,
        bidStep: stepNum,
        startAt: startIso,
        endAt: endIso,
        ...(clearBuyNow ? { clearBuyNowPrice: true } : buyNowNum !== null ? { buyNowPrice: buyNowNum } : {}),
      });
      setSuccess('Đã lưu thay đổi. Phiên đấu giá sẽ dùng thông số mới khi bắt đầu.');
      await load();
      router.refresh();
    } catch (err: unknown) {
      setError(auctionError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <PageLoader label="Đang tải thông tin phiên đấu giá…" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-on-surface">
        <AlertTriangle size={40} className="mx-auto mb-3 text-[#8A6A1F]" />
        <h1 className="font-h1 text-xl font-bold">Không mở được phiên đấu giá</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{error ?? 'Phiên đấu giá không tồn tại.'}</p>
        <Link href="/my-auctions" className="mt-5 inline-flex items-center gap-2 text-xs text-brand-periwinkle hover:underline">
          <ArrowLeft size={14} /> Về danh sách phiên của tôi </Link>
      </div>
    );
  }

  const isSeller = Boolean(userId) && auction.seller?.userId === userId;
  const canEdit = isSeller && auction.auctionStatus === 'Scheduled' && auction.bidCount === 0;

  if (!canEdit) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-on-surface">
        <AlertTriangle size={40} className="mx-auto mb-3 text-[#8A6A1F]" />
        <h1 className="font-h1 text-xl font-bold">Không sửa được phiên này</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {!isSeller
            ? 'Chỉ người bán của phiên mới được sửa thông số.'
            : auction.bidCount > 0
              ? 'Phiên đã có lượt đặt giá nên không sửa được nữa — người đã đặt giá có quyền dựa vào con số họ đã thấy.'
              : 'Chỉ sửa được phiên đang ở trạng thái “Sắp diễn ra”.'}
        </p>
        <Link
          href={`/auctions/${auctionId}`}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-5 py-2.5 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-[#FFFCF6]"
        >
          <ArrowLeft size={14} /> Về trang phiên đấu giá </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 text-on-surface">
      <Link href={`/auctions/${auctionId}`} className="mb-5 inline-flex items-center gap-1.5 text-xs text-outline hover:text-[#241F1A]">
        <ArrowLeft size={14} /> Về trang phiên đấu giá </Link>

      <div className="mb-6">
        <h1 className="font-h1 text-2xl font-bold">Sửa phiên đấu giá</h1>
        <p className="mt-1 text-xs text-on-surface-variant">
          {auction.artwork?.artworkTitle ?? 'Tác phẩm'} · Mã phiên #{auction.auctionId.slice(0, 8).toUpperCase()} · Chưa có lượt đặt giá
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-5 flex items-start gap-2 rounded-2xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 p-4 text-sm text-[#2F6B63]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-container space-y-5 rounded-3xl border border-[#221E1A]/10 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-on-surface">Giá khởi điểm (₫)</span>
            <input
              type="number"
              min={1}
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2.5 font-mono text-on-surface focus:border-brand-periwinkle focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-outline">Hiện tại: {formatVnd(auction.startPrice)}</span>
          </label>

          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-on-surface">Bước giá (₫)</span>
            <input
              type="number"
              min={1}
              value={bidStep}
              onChange={(e) => setBidStep(e.target.value)}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2.5 font-mono text-on-surface focus:border-brand-periwinkle focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-outline">Hiện tại: {formatVnd(auction.bidStep)}</span>
          </label>
        </div>

        <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-on-surface">Giá mua ngay</span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-outline">
              <input
                type="checkbox"
                checked={clearBuyNow}
                onChange={(e) => setClearBuyNow(e.target.checked)}
                className="size-3.5 accent-[#B24A26]"
              /> Tắt giá mua ngay </label>
          </div>
          <input
            type="number"
            min={1}
            disabled={clearBuyNow}
            value={buyNowPrice}
            onChange={(e) => setBuyNowPrice(e.target.value)}
            placeholder="Để trống nếu không bán ngay"
            className="mt-2 w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2 font-mono text-on-surface focus:border-brand-periwinkle focus:outline-none disabled:opacity-50"
          />
          <span className="mt-1 block text-[11px] text-outline">
            {auction.buyNowPrice != null
              ? `Hiện tại: ${formatVnd(auction.buyNowPrice)} · Phải lớn hơn giá khởi điểm.`
              : 'Phiên này chưa bật mua ngay.'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 flex items-center gap-1.5 font-semibold text-on-surface">
              <CalendarClock size={13} /> Bắt đầu </span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2.5 text-on-surface focus:border-brand-periwinkle focus:outline-none"
            />
          </label>

          <label className="block text-xs">
            <span className="mb-1 flex items-center gap-1.5 font-semibold text-on-surface">
              <CalendarClock size={13} /> Kết thúc </span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2.5 text-on-surface focus:border-brand-periwinkle focus:outline-none"
            />
          </label>
        </div>

        <p className="rounded-xl border border-[#8A6A1F]/35 bg-[#8A6A1F]/10 px-3 py-2 text-[11px] text-[#8A6A1F]"> Phiên phải kéo dài tối thiểu 1 giờ và tối đa 30 ngày. Sau khi có người đặt giá, mọi thông số bị khoá. </p>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#221E1A]/10 pt-4">
          <Link
            href={`/auctions/${auctionId}`}
            className="rounded-full border border-[#221E1A]/10 px-5 py-2.5 text-xs font-semibold text-outline hover:text-[#241F1A]"
          > Huỷ </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-6 py-2.5 font-h1 text-xs font-bold text-[#FFFCF6] shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" /> : <Save size={14} />}
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-outline">
        <Gavel size={12} /> Thay đổi chỉ áp dụng cho phiên chưa bắt đầu và chưa có lượt đặt giá. </p>
    </div>
  );
}
