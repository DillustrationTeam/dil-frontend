'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, Clock, Download, Eye, Gavel, Heart, RefreshCw, ShieldCheck, Sparkles, User, Zap } from 'lucide-react';
import { auctionService } from '../services/auction.service';
import { auctionStatusLabels, type AuctionDetailDto, type AuctionSettlementDto, type BidDto } from '../types/auction.types';
import { PageLoader } from '@/features/navigation';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function AuctionDetailScreen({ auctionId, userId }: { auctionId: string; userId: string | null }) {
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [settlement, setSettlement] = useState<AuctionSettlementDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form đặt giá
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [maxAutoBid, setMaxAutoBid] = useState<string>('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Actions
  const [watching, setWatching] = useState<boolean>(false);
  const [buyingNow, setBuyingNow] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  async function loadDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.detail(auctionId);
      setAuction(res.auction);
      setBids(res.recentBids);
      setWatching(res.auction.isWatching);

      const minNext = res.auction.currentPrice + res.auction.bidStep;
      setBidAmount(minNext.toString());

      if (res.auction.auctionStatus === 'Settled' || res.auction.auctionStatus === 'Ended') {
        const sRes = await auctionService.settlement(auctionId).catch(() => null);
        if (sRes) setSettlement(sRes);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được chi tiết phiên đấu giá.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [auctionId]);

  async function handleToggleWatch() {
    if (!userId) {
      setError('Vui lòng đăng nhập để theo dõi phiên đấu giá.');
      return;
    }
    const nextWatch = !watching;
    setWatching(nextWatch);
    try {
      await auctionService.watch(auctionId, nextWatch);
    } catch {
      setWatching(!nextWatch);
    }
  }

  async function handlePlaceBid(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng đăng nhập để tham gia đấu giá.');
      return;
    }
    const amountNum = Number(bidAmount);
    if (!auction || amountNum < auction.currentPrice + auction.bidStep) {
      setError(`Mức giá đặt phải tối thiểu là ${formatVnd((auction?.currentPrice || 0) + (auction?.bidStep || 0))}.`);
      return;
    }
    setSubmittingBid(true);
    setError(null);
    try {
      const autoMaxNum = isAuto && maxAutoBid ? Number(maxAutoBid) : undefined;
      await auctionService.bid(auctionId, amountNum, isAuto, autoMaxNum);
      setSuccess('Đặt giá thành công! Bạn đang dẫn đầu phiên đấu giá.');
      await loadDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đặt giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmittingBid(false);
    }
  }

  async function handleBuyNow() {
    if (!userId) {
      setError('Vui lòng đăng nhập để mua ngay.');
      return;
    }
    if (!auction?.buyNowPrice) return;
    if (!confirm(`Bạn xác nhận mua ngay tác phẩm này với mức giá ${formatVnd(auction.buyNowPrice)}?`)) return;
    setBuyingNow(true);
    setError(null);
    try {
      await auctionService.buyNow(auctionId);
      setSuccess('Mua ngay thành công! Phiên đấu giá đã hoàn tất.');
      await loadDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện mua ngay.');
    } finally {
      setBuyingNow(false);
    }
  }

  async function handleDownloadOriginal() {
    setDownloading(true);
    try {
      const res = await auctionService.download(auctionId);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lấy liên kết tải tệp gốc.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <PageLoader label="Đang tải thông tin phiên đấu giá…" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-on-surface">
        <CircleAlert size={44} className="mx-auto mb-3 text-outline" />
        <h1 className="font-h1 text-xl font-bold">Không tìm thấy phiên đấu giá</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Phiên đấu giá có thể đã bị xóa hoặc không tồn tại.</p>
        <Link href="/auctions" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại danh sách đấu giá
        </Link>
      </div>
    );
  }

  const isLive = auction.auctionStatus === 'Active';
  const isSettled = auction.auctionStatus === 'Settled';
  const isWinner = userId && auction.winnerId === userId;
  const statusLabel = auctionStatusLabels[auction.auctionStatus] || auction.auctionStatus;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-on-surface">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/auctions" className="inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại danh sách đấu giá
        </Link>
        <button
          type="button"
          onClick={handleToggleWatch}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            watching
              ? 'border-brand-periwinkle bg-brand-periwinkle text-brand-navy'
              : 'border-white/15 bg-white/5 text-on-surface hover:bg-white/10'
          }`}
        >
          <Heart size={14} className={watching ? 'fill-brand-navy' : ''} />
          {watching ? 'Đang theo dõi' : 'Theo dõi phiên'}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Khung ảnh tác phẩm bên trái */}
        <div className="lg:col-span-7">
          <div className="glass-container overflow-hidden rounded-3xl border border-white/10 bg-black/40">
            <div className="relative aspect-square w-full">
              {auction.artwork?.imageUrl || auction.artwork?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={auction.artwork.imageUrl || auction.artwork.thumbnailUrl || ''}
                  alt={auction.artwork.artworkTitle || 'Tác phẩm'}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-outline">
                  Chưa có ảnh tác phẩm
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-outline">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-brand-periwinkle" />
              Tác phẩm gốc độc quyền có bản quyền số
            </span>
            <span>Mã tác phẩm: #{auction.auctionId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Cột thông tin & Đặt giá bên phải */}
        <div className="space-y-6 lg:col-span-5">
          <section className="glass-container rounded-3xl border border-white/10 p-6 md:p-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-0.5 text-xs font-semibold text-brand-periwinkle">
                {statusLabel}
              </span>
              <span className="flex items-center gap-1 text-xs text-outline">
                <Clock size={13} /> Kết thúc: {new Date(auction.endAt).toLocaleString('vi-VN')}
              </span>
            </div>

            <h1 className="font-h1 text-2xl font-bold">{auction.artwork?.artworkTitle || 'Tác phẩm nghệ thuật'}</h1>
            <p className="mt-1 text-xs text-outline">
              Tác giả: <strong className="text-on-surface">{auction.seller?.fullName || 'Nghệ sĩ ẩn danh'}</strong> · Phong cách: {auction.artwork?.style || 'Kỹ thuật số'}
            </p>

            {/* Mức giá hiện tại */}
            <div className="my-6 rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-4">
              <span className="text-xs text-on-surface-variant">Giá đang dẫn đầu</span>
              <p className="font-h1 text-3xl font-bold text-brand-periwinkle">
                {formatVnd(auction.currentPrice)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-outline">
                <span>Khởi điểm: {formatVnd(auction.startPrice)}</span>
                <span>Bước giá: +{formatVnd(auction.bidStep)}</span>
              </div>
            </div>

            {/* Nếu là người thắng cuộc */}
            {isWinner && (
              <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                <p className="font-bold">Chúc mừng! Bạn đã thắng phiên đấu giá này.</p>
                <p className="mt-1">Bạn có quyền sở hữu tác phẩm và tải tệp gốc chất lượng cao.</p>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadOriginal}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2 font-h1 font-bold text-brand-navy shadow hover:brightness-110"
                >
                  <Download size={14} /> {downloading ? 'Đang tạo liên kết...' : 'Tải xuống tệp tranh gốc'}
                </button>
              </div>
            )}

            {/* Form tham gia đấu giá */}
            {isLive ? (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label htmlFor="bid-amount" className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                    Mức giá bạn muốn đặt (₫)
                  </label>
                  <input
                    id="bid-amount"
                    type="number"
                    min={auction.currentPrice + auction.bidStep}
                    step={auction.bidStep}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-3 font-h1 text-lg font-bold text-on-surface focus:border-brand-periwinkle focus:outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-outline">
                    Tối thiểu: {formatVnd(auction.currentPrice + auction.bidStep)} (Số tiền sẽ được tạm giữ từ số dư ví)
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAuto}
                      onChange={(e) => setIsAuto(e.target.checked)}
                      className="size-4 accent-brand-periwinkle"
                    />
                    <span className="font-semibold text-on-surface">Bật tự động đấu giá (Auto-bid)</span>
                  </label>
                  {isAuto && (
                    <div className="mt-3">
                      <label className="mb-1 block text-outline">Giới hạn tối đa cho phép tự động trả giá (₫):</label>
                      <input
                        type="number"
                        min={auction.currentPrice + auction.bidStep * 2}
                        value={maxAutoBid}
                        onChange={(e) => setMaxAutoBid(e.target.value)}
                        placeholder="VD: 5000000"
                        className="w-full rounded-lg border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingBid}
                  className="w-full rounded-full bg-brand-periwinkle py-3 text-center font-h1 text-sm font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Gavel size={16} /> {submittingBid ? 'Đang xử lý...' : `Đặt giá ${formatVnd(Number(bidAmount) || 0)}`}
                  </span>
                </button>

                {/* Mua ngay nếu có thiết lập */}
                {auction.buyNowPrice && (
                  <button
                    type="button"
                    disabled={buyingNow}
                    onClick={handleBuyNow}
                    className="w-full rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 py-2.5 text-center font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Zap size={14} /> {buyingNow ? 'Đang xử lý...' : `Mua ngay với ${formatVnd(auction.buyNowPrice)}`}
                    </span>
                  </button>
                )}
              </form>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-outline">
                Phiên đấu giá hiện tại không ở trạng thái mở để đặt giá.
              </div>
            )}
          </section>

          {/* Lịch sử đặt giá gần đây */}
          <section className="glass-container rounded-3xl border border-white/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-h1 text-base font-bold">Lịch sử đặt giá ({bids.length})</h2>
              <button
                type="button"
                onClick={loadDetail}
                disabled={loading}
                className="text-xs text-outline hover:text-white"
                title="Làm mới lịch sử"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {bids.length === 0 ? (
              <p className="py-4 text-center text-xs text-outline">Chưa có lượt đặt giá nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="space-y-2.5">
                {bids.map((b, i) => (
                  <div
                    key={b.bidId}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                      i === 0
                        ? 'border-brand-periwinkle/30 bg-brand-periwinkle/10'
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-white/10 text-brand-periwinkle">
                        <User size={13} />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {b.bidder?.fullName || 'Người đấu giá'} {i === 0 ? '(Dẫn đầu)' : ''}
                        </p>
                        <span className="text-[10px] text-outline">
                          {new Date(b.placedAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-brand-periwinkle">
                      {formatVnd(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
