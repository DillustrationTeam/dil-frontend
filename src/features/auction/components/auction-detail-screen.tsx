'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  CircleAlert,
  Clock,
  Download,
  Gavel,
  Heart,
  FileType2,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  User,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  AuctionConflictError,
  auctionError,
  auctionService,
  useAuctionClock,
  useAuctionHub,
  type AuctionDetailDto,
  type BidDto,
  type AuctionParticipantDto,
  type WalletOverviewDto,
} from '@/features/auction';
import { SellerTransparencyCard } from './seller-transparency-card';
import { PageLoader } from '@/features/navigation';
import { auctionStatusLabels } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function sortBids(bids: BidDto[]) {
  return [...bids].sort((a, b) =>
    Date.parse(b.placedAt) - Date.parse(a.placedAt)
    || Number(b.bidStatus === 'Leading') - Number(a.bidStatus === 'Leading')
    || b.amount - a.amount,
  );
}

function updateBidParticipants(participants: AuctionParticipantDto[] = [], bid: BidDto) {
  const seller = participants.find((participant) => participant.role === 'Seller');
  const bidders = participants.filter((participant) => participant.role !== 'Seller');
  const current = bidders.find((participant) => participant.userId === bid.bidderId);
  const updated = current
    ? bidders.map((participant) => participant.userId === bid.bidderId
        ? { ...participant, highestBid: Math.max(participant.highestBid ?? 0, bid.amount), bidCount: participant.bidCount + 1 }
        : participant)
    : [...bidders, {
        userId: bid.bidderId,
        fullName: bid.bidder?.fullName ?? null,
        role: 'Bidder',
        highestBid: bid.amount,
        bidCount: 1,
      }];

  return [...(seller ? [seller] : []), ...updated.sort((a, b) => (b.highestBid ?? 0) - (a.highestBid ?? 0)).slice(0, 7)];
}

export function AuctionDetailScreen({ auctionId, userId }: { auctionId: string; userId: string | null }) {
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [wallet, setWallet] = useState<WalletOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Realtime highlight states
  const [priceFlash, setPriceFlash] = useState(false);
  const [extendedNotice, setExtendedNotice] = useState<string | null>(null);
  const [newBidId, setNewBidId] = useState<string | null>(null);

  // Form đặt giá & auto-bid
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [maxAutoBid, setMaxAutoBid] = useState<string>('');
  const [activeAutoBidCap, setActiveAutoBidCap] = useState<number | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);

  // Actions
  const [watching, setWatching] = useState<boolean>(false);
  const [buyingNow, setBuyingNow] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // FE-01 Đồng hồ đếm ngược với serverTime
  const clock = useAuctionClock({
    endAt: auction?.auctionStatus === 'Scheduled' ? auction?.startAt : auction?.endAt,
    serverTime: auction?.serverTime,
    isDetail: true,
  });

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, walletRes] = await Promise.all([
        auctionService.detail(auctionId),
        userId ? auctionService.getWallet().catch(() => null) : Promise.resolve(null),
      ]);

      setAuction(detailRes.auction);
      setBids(sortBids(detailRes.recentBids));
      setWatching(detailRes.auction.isWatching);
      if (walletRes) setWallet(walletRes);

      const minNext = detailRes.auction.bidCount === 0
        ? detailRes.auction.startPrice
        : detailRes.auction.currentPrice + detailRes.auction.bidStep;

      setBidAmount(minNext.toString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được chi tiết phiên đấu giá.');
    } finally {
      setLoading(false);
    }
  }, [auctionId, userId]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadDetail();
    })();
  }, [loadDetail]);

  // FE-02 SignalR Hub listener với deduplication & status mapping
  useAuctionHub(auctionId, {
    onBidPlaced: (payload) => {
      // Khi proxy-bid thắng thay người vừa gửi request, payload là bid Outbid của
      // requestor; refetch để lấy bid Leading do auto-bid tạo trong cùng transaction.
      if (payload.bid.bidStatus === 'Outbid') {
        void loadDetail();
        return;
      }

      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPrice: payload.currentPrice,
          endAt: payload.endAt,
          bidCount: prev.bidCount + 1,
          leadingBidderId: payload.bid.bidderId,
          participants: updateBidParticipants(prev.participants, payload.bid),
        };
      });

      // Update minimum next bid for form
      const nextMin = payload.minimumNextBid;
      setBidAmount(nextMin.toString());

      // Prepend bid to history if not exists
      setBids((prevBids) => {
        if (prevBids.some((b) => b.bidId === payload.bid.bidId)) return prevBids;
        return sortBids([payload.bid, ...prevBids]);
      });

      setNewBidId(payload.bid.bidId);

      // Trigger price flash animation
      setPriceFlash(true);
      setTimeout(() => setPriceFlash(false), 1500);
    },

    onAuctionExtended: (payload) => {
      setAuction((prev) => (prev ? { ...prev, endAt: payload.endAt } : prev));
      setExtendedNotice(`Phiên đã được tự động gia hạn kết thúc tới ${new Date(payload.endAt).toLocaleTimeString('vi-VN')}`);
      setTimeout(() => setExtendedNotice(null), 4000);
    },

    onStatusChanged: (payload) => {
      setAuction((prev) => (prev ? { ...prev, auctionStatus: payload.status, currentPrice: payload.currentPrice, endAt: payload.endAt } : prev));
    },

    onAuctionSettled: () => {
      void loadDetail();
    },

    onReconnectedRefetch: () => {
      void loadDetail();
    },
  });

  // Calculate chip prices
  const minimumNextBid = auction
    ? (auction.bidCount === 0 ? auction.startPrice : auction.currentPrice + auction.bidStep)
    : 0;

  const handleChipClick = (stepMultiplier: number) => {
    if (!auction) return;
    const targetBid = minimumNextBid + stepMultiplier * auction.bidStep;
    setBidAmount(targetBid.toString());
  };

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
    if (!auction || amountNum < minimumNextBid) {
      setError(`Mức giá đặt phải tối thiểu là ${formatVnd(minimumNextBid)}.`);
      return;
    }

    if (isAuto) {
      const maxNum = Number(maxAutoBid);
      if (!maxNum || maxNum < minimumNextBid) {
        setError(`Giá trần tự động phải lớn hơn hoặc bằng mức giá đặt tối thiểu (${formatVnd(minimumNextBid)}).`);
        return;
      }
    }

    // Wallet balance check
    if (wallet && wallet.wallet.balance < amountNum) {
      setError(`Số dư ví khả dụng không đủ. Cần: ${formatVnd(amountNum)}, Hiện có: ${formatVnd(wallet.wallet.balance)}.`);
      return;
    }

    setSubmittingBid(true);
    setError(null);
    setSuccess(null);

    try {
      const autoMaxNum = isAuto && maxAutoBid ? Number(maxAutoBid) : undefined;
      const res = await auctionService.bid(auctionId, amountNum, isAuto, autoMaxNum);
      if (isAuto && autoMaxNum) setActiveAutoBidCap(autoMaxNum);
      setSuccess(
        res.bid.bidStatus === 'Leading'
          ? isAuto
            ? `Đã kích hoạt Auto-bid với giá trần ${formatVnd(autoMaxNum!)}.`
            : 'Đặt giá thành công! Giá của bạn đang dẫn đầu.'
          : 'Đã ghi nhận giá, nhưng bạn đã bị Auto-bid khác vượt qua.',
      );

      if (res.bid.bidStatus === 'Outbid') {
        await loadDetail();
      }

      if (res.wallet) {
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                wallet: {
                  ...prev.wallet,
                  balance: res.wallet.balance,
                  lockedBalance: res.wallet.lockedBalance,
                },
              }
            : null,
        );
      }
    } catch (err: unknown) {
      if (err instanceof AuctionConflictError) {
        // FE-03: Handle 409 Conflict gracefully by updating price and next bid without page reload
        const c = err.conflictData;
        setAuction((prev) => (prev ? { ...prev, currentPrice: c.currentPrice, endAt: c.endAt } : prev));
        setBidAmount(c.minimumNextBid.toString());
        setError(`Xung đột giá: ${err.message} Giá hiện tại đã được cập nhật thành ${formatVnd(c.currentPrice)}.`);
      } else {
        setError(auctionError(err));
      }
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
      setError(auctionError(err));
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
      setError(auctionError(err));
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
  const isWinner = userId && auction.winnerId === userId;
  const isSeller = userId && auction.seller?.userId === userId;
  const statusLabel = auctionStatusLabels[auction.auctionStatus] || auction.auctionStatus;
  const bidAmountNum = Number(bidAmount) || 0;
  const isBalanceShortage = Boolean(wallet && wallet.wallet.balance < bidAmountNum);
  const totalSeconds = Math.floor(clock.remainingMs / 1000);
  const clockUnits = [
    { label: 'Giờ', value: Math.floor(totalSeconds / 3600).toString().padStart(2, '0') },
    { label: 'Phút', value: Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0') },
    { label: 'Giây', value: (totalSeconds % 60).toString().padStart(2, '0') },
    { label: 'ms', value: Math.floor((clock.remainingMs % 1000) / 10).toString().padStart(2, '0') },
  ];
  const isUrgent = isLive && clock.remainingMs > 0 && clock.remainingMs <= 5 * 60 * 1000;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 text-on-surface">
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

      {extendedNotice && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/15 p-4 text-sm text-amber-200 motion-reduce:animate-none animate-bounce">
          <Clock size={18} className="shrink-0 text-amber-300" />
          <span>{extendedNotice}</span>
        </div>
      )}

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

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Cột trái: Khung ảnh tác phẩm & Seller Transparency Card */}
        <div className="space-y-4">
          {/* FE-05 Seller Transparency */}
          <SellerTransparencyCard seller={auction.seller} />

          <div className="glass-container overflow-hidden rounded-3xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px]">
              <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-1 font-semibold text-brand-periwinkle">
                Bản gốc duy nhất
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-300">
                {auction.artwork?.style || 'Kỹ thuật số'}
              </span>
            </div>
            <div className="relative aspect-[4/3] w-full">
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
            <div className="flex items-end justify-between gap-4 border-t border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h1 className="truncate font-h1 text-xl font-bold">{auction.artwork?.artworkTitle || 'Tác phẩm nghệ thuật'}</h1>
                <p className="mt-1 text-xs text-outline">Bản quyền thương mại kỹ thuật số</p>
              </div>
              <span className="shrink-0 text-right text-[11px] text-outline">
                Mã phiên<br />
                <strong className="font-mono text-on-surface">#{auction.auctionId.slice(0, 8).toUpperCase()}</strong>
              </span>
            </div>
            <div className="grid gap-2 border-t border-white/10 px-5 py-4 text-xs sm:grid-cols-2">
              <p className="flex items-center gap-2"><User size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Tác giả:</span> <strong className="truncate">{auction.seller?.fullName || 'Nghệ sĩ ẩn danh'}</strong></p>
              <p className="flex items-center gap-2"><CalendarDays size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Ngày tạo:</span> <strong>{auction.artwork?.createdAt ? new Date(auction.artwork.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong></p>
              <p className="flex items-center gap-2"><FileType2 size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Định dạng:</span> <strong>{[auction.artwork?.fileFormat, auction.artwork?.resolution, formatFileSize(auction.artwork?.fileSizeBytes)].filter(Boolean).join(' · ') || 'Chưa cập nhật'}</strong></p>
              <p className="flex items-center gap-2"><PackageCheck size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Deliverable:</span> <strong>{auction.artwork?.deliverableCount ?? 0} tệp bàn giao</strong></p>
            </div>
          </div>

          <section className="glass-container rounded-3xl border border-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-h1 text-sm font-bold">
                <Users size={16} className="text-brand-periwinkle" /> Người tham gia
              </h2>
              <span className="rounded-full border border-brand-periwinkle/20 bg-brand-periwinkle/10 px-3 py-1 text-[10px] font-semibold text-brand-periwinkle">
                {(auction.participants ?? []).filter((participant) => participant.role === 'Bidder').length} người đã bid
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(auction.participants ?? []).map((participant) => (
                <div
                  key={`${participant.role}-${participant.userId}`}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${participant.role === 'Seller' ? 'bg-amber-400/15 text-amber-300' : 'bg-brand-periwinkle/15 text-brand-periwinkle'}`}>
                    {(participant.fullName || '?').split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{participant.fullName || 'Người dùng ẩn danh'}</p>
                    <p className={`truncate text-[10px] ${participant.role === 'Seller' ? 'text-amber-300' : 'text-outline'}`}>
                      {participant.role === 'Seller'
                        ? 'Tác giả'
                        : `Top ${(auction.participants ?? []).filter((item) => item.role !== 'Seller').findIndex((item) => item.userId === participant.userId) + 1} · ${formatVnd(participant.highestBid ?? 0)} · ${participant.bidCount} lượt`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải: Thông tin đấu giá & Đặt giá */}
        <div className="space-y-4">
          <section className={`glass-container relative overflow-hidden rounded-2xl border p-3 shadow-xl transition-colors duration-500 ${isUrgent ? 'border-rose-500/60 shadow-rose-950/30' : 'border-amber-500/25'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(167,172,217,0.15)_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
            <div className="relative z-10 mb-2 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  {isLive && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${isUrgent ? 'bg-rose-400' : 'bg-emerald-400'}`} />}
                  <span className={`relative inline-flex size-2.5 rounded-full ${clock.isEnded ? 'bg-outline' : isUrgent ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                </span>
                <h2 className={`text-xs font-bold uppercase tracking-wide ${isUrgent ? 'text-rose-400' : 'text-on-surface'}`}>
                  {clock.isEnded ? (auction?.auctionStatus === 'Scheduled' ? 'Đang mở...' : 'Phiên đã kết thúc') : isUrgent ? 'Sắp chốt phiên' : (auction?.auctionStatus === 'Scheduled' ? 'Bắt đầu sau' : 'Thời gian còn lại')}
                </h2>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isUrgent ? 'border-rose-500/40 bg-rose-500/15 text-rose-400' : 'border-white/10 bg-brand-navy/80 text-outline'}`}>
                {isUrgent ? 'ANTI-SNIPE +3M' : statusLabel}
              </span>
            </div>

            <div className="relative z-10 flex items-start justify-center gap-1 sm:gap-1.5" role="timer" aria-label={clock.isEnded ? 'Phiên đã hết giờ' : `Còn lại ${clock.formatted}`}>
              {clockUnits.map((unit, index) => (
                <div key={unit.label} className="contents">
                  {index > 0 && <span aria-hidden="true" className={`pt-2 font-mono text-2xl font-black sm:text-3xl ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`}>:</span>}
                  <div className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={`relative w-full max-w-24 overflow-hidden rounded-xl border bg-[#070b14] px-1 py-2 text-center shadow-inner ${isUrgent ? 'border-rose-500/35' : 'border-amber-500/25'}`}>
                      <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center font-mono text-3xl font-black opacity-10 sm:text-4xl ${isUrgent ? 'text-rose-500' : 'text-amber-500'}`}>88</span>
                      <span className={`relative font-mono text-3xl font-black leading-none tracking-tight sm:text-4xl ${isUrgent ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.65)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.55)]'}`}>
                        {clock.isEnded ? '00' : unit.value}
                      </span>
                    </div>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-outline">{unit.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-container rounded-3xl border border-white/10 p-5 md:p-6">
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {/* FE-04 Realtime Price Animation */}
              <div
                className={`rounded-2xl border p-4 transition-all duration-500 ${
                  priceFlash
                    ? 'scale-[1.02] border-brand-periwinkle bg-brand-periwinkle/25 motion-reduce:animate-none'
                    : 'border-brand-periwinkle/20 bg-brand-periwinkle/5'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Giá đang dẫn đầu</span>
                  <span>Bước: +{formatVnd(auction.bidStep)}</span>
                </div>
                <p className="mt-2 font-h1 text-3xl font-bold text-brand-periwinkle">
                  {formatVnd(auction.currentPrice)}
                </p>
                <p className="mt-2 text-xs text-outline">Khởi điểm: {formatVnd(auction.startPrice)}</p>
              </div>

              {/* FE-03 Balance Overview */}
              {userId && wallet && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
                  <span className="flex items-center gap-1.5 text-outline">
                    <Wallet size={14} className="text-brand-periwinkle" /> Số dư ví khả dụng
                  </span>
                  <p className="mt-2 font-mono text-xl font-bold text-emerald-400">
                    {formatVnd(wallet.wallet.balance)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-outline">
                    <span>Tiền đang khóa cọc:</span>
                    <span className="font-mono">{formatVnd(wallet.wallet.lockedBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Winner Badge & Download */}
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

            {/* FE-03 & FE-08 Form tham gia đấu giá */}
            {isLive && !isSeller ? (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label htmlFor="bid-amount" className="font-medium text-on-surface-variant">
                      Mức giá bạn muốn đặt (₫)
                    </label>
                    <span className="text-[11px] text-outline">Tối thiểu: {formatVnd(minimumNextBid)}</span>
                  </div>

                  <input
                    id="bid-amount"
                    type="number"
                    min={minimumNextBid}
                    step={auction.bidStep}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-3 font-h1 text-lg font-bold text-on-surface focus:border-brand-periwinkle focus:outline-none"
                  />

                  {/* FE-03 BidStep Chips */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleChipClick(0)}
                      className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      Mặc định ({formatVnd(minimumNextBid)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(1)}
                      className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +1 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(2)}
                      className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +2 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(5)}
                      className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +5 Step
                    </button>
                  </div>
                </div>

                {/* FE-08 Auto-bid settings */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  {activeAutoBidCap && (
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                      <span className="flex items-center gap-2 font-semibold">
                        <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <span>
                          Auto-bid <span className="font-normal text-emerald-300">Đang hoạt động</span>
                        </span>
                        <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                      </span>
                      <span className="font-mono">Trần {formatVnd(activeAutoBidCap)}</span>
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span>
                      <span className="block font-semibold text-on-surface">Đặt giá bằng Auto-bid</span>
                      <span className="mt-0.5 block text-[11px] text-outline">Bật để đăng ký hoặc cập nhật giá trần ở lần đặt giá này.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isAuto}
                      onChange={(e) => setIsAuto(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-brand-periwinkle peer-focus-visible:ring-2 peer-focus-visible:ring-brand-periwinkle/60 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-brand-navy" />
                  </label>
                  <p className="mt-1 text-[11px] text-outline">
                    Hệ thống sẽ tự động tăng giá theo BidStep (+{formatVnd(auction.bidStep)}) mỗi khi có người đè giá, nhưng không vượt quá mức trần tối đa do bạn cài đặt.
                  </p>
                  {isAuto && (
                    <div className="mt-3">
                      <label className="mb-1 block text-outline">Giới hạn giá trần tối đa (₫):</label>
                      <input
                        type="number"
                        min={minimumNextBid}
                        value={maxAutoBid}
                        onChange={(e) => setMaxAutoBid(e.target.value)}
                        placeholder={`Tối thiểu ${minimumNextBid}`}
                        className="w-full rounded-lg border border-white/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingBid || clock.isEnded || isBalanceShortage}
                  className="w-full rounded-full bg-brand-periwinkle py-3 text-center font-h1 text-sm font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Gavel size={16} />{' '}
                    {submittingBid
                      ? 'Đang xử lý...'
                      : isBalanceShortage
                        ? 'Số dư ví không đủ'
                        : isAuto
                          ? `${activeAutoBidCap ? 'Cập nhật' : 'Kích hoạt'} Auto-bid · Trần ${formatVnd(Number(maxAutoBid) || 0)}`
                          : `Đặt giá ${formatVnd(bidAmountNum)}`}
                  </span>
                </button>

                {/* Mua ngay nếu phiên hỗ trợ */}
                {auction.buyNowPrice && (
                  <button
                    type="button"
                    disabled={buyingNow || clock.isEnded}
                    onClick={handleBuyNow}
                    className="w-full rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 py-2.5 text-center font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Zap size={14} /> {buyingNow ? 'Đang xử lý...' : `Mua ngay với ${formatVnd(auction.buyNowPrice)}`}
                    </span>
                  </button>
                )}
              </form>
            ) : isSeller ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-outline">
                Bạn là người tạo phiên đấu giá này nên không thể tham gia đặt giá.
              </div>
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
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {bids.map((b) => {
                  const isNew = b.bidId === newBidId;
                  const isMine = b.bidderId === userId;
                  return (
                    <div
                      key={b.bidId}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all duration-500 ${
                        isMine
                          ? 'border-[#A7ACD9] bg-[#A7ACD9] text-[#1F2335] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
                          : b.bidStatus === 'Leading'
                            ? 'border-brand-periwinkle/30 bg-brand-periwinkle/10'
                            : 'border-white/5 bg-white/[0.02]'
                      } ${isNew ? 'scale-[1.01] ring-1 ring-emerald-400 motion-reduce:transform-none' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex size-7 items-center justify-center rounded-full ${isMine ? 'bg-brand-navy/15 text-brand-navy' : 'bg-white/10 text-brand-periwinkle'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <p className={`font-semibold ${isMine ? 'text-brand-navy' : 'text-on-surface'}`}>
                            {isMine ? 'Bạn' : b.bidder?.fullName || 'Người đấu giá'} {b.bidStatus === 'Leading' ? '(Dẫn đầu)' : ''}
                          </p>
                          <span className={`text-[10px] ${isMine ? 'text-brand-navy/70' : 'text-outline'}`}>
                            {new Date(b.placedAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${isMine ? 'text-brand-navy' : 'text-brand-periwinkle'}`}>
                        {formatVnd(b.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
