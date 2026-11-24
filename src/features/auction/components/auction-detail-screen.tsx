'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  CalendarDays,
  CircleAlert,
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  Gavel,
  Heart,
  FileType2,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  AuctionConflictError,
  auctionError,
  auctionService,
  useAuctionClock,
  useAuctionHub,
  type AuctionCertificateDto,
  type AuctionDetailDto,
  type BidDto,
  type AuctionParticipantDto,
  type WalletOverviewDto,
} from '@/features/auction';
import { SellerTransparencyCard } from './seller-transparency-card';
import { AuctionCertificateCard } from './auction-certificate-card';
import { CommercialRightsModal } from './commercial-rights-modal';
import { DeliverablesDownloadModal } from './deliverables-download-modal';
import { PhysicalDeliveryCard } from './physical-delivery-card';
import { PageLoader } from '@/features/navigation';
import { useLanguage } from '@/context/language-context';
import { auctionStatusLabels, type DeliverableDownloadDto } from '../types/auction.types';

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
  const { lang, t } = useLanguage();
  const isVie = lang === 'VIE';
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
  // Mức tối thiểu đang hiển thị trong ô giá — dùng để biết người dùng đã tự sửa ô hay chưa
  // trước khi ghi đè bằng giá mới từ realtime.
  const previousMinimumBidRef = useRef<string>('');
  const [submittingBid, setSubmittingBid] = useState(false);
  // Xác nhận trước khi Auto-bid chạm giá mua ngay (mua luôn, không hoàn tác).
  const [showAutoBuyConfirm, setShowAutoBuyConfirm] = useState(false);
  const [pendingAutoBuy, setPendingAutoBuy] = useState<{ amount: number; cap: number } | null>(null);

  // Actions
  const [watching, setWatching] = useState<boolean>(false);
  const [buyingNow, setBuyingNow] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [certificate, setCertificate] = useState<AuctionCertificateDto | null>(null);
  const [loadingCert, setLoadingCert] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showCommercialDeed, setShowCommercialDeed] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [downloadDeliverable, setDownloadDeliverable] = useState<DeliverableDownloadDto | null>(null);
  // Hộp thoại cảnh báo khi người thắng đã chọn nhận tranh vật lý nhưng muốn tải bản điện tử ngay
  const [showDigitalNowWarning, setShowDigitalNowWarning] = useState<boolean>(false);
  const [acceptingDigital, setAcceptingDigital] = useState<boolean>(false);
  const [deliverableInfo, setDeliverableInfo] = useState<{
    fileName: string;
    mimeType?: string | null;
    certNumber?: string | null;
    licenseType?: string | null;
  } | null>(null);

  // FE-01 Đồng hồ đếm ngược với serverTime
  const clock = useAuctionClock({
    endAt: auction?.auctionStatus === 'Scheduled' ? auction?.startAt : auction?.endAt,
    serverTime: auction?.serverTime,
    isDetail: true,
  });

  /**
   * `silent` = tải lại ngầm sau một thao tác đã thành công.
   *
   * Trước đây mọi lần reload đều bật `loading`, mà component return <PageLoader/> khi
   * loading ⇒ cả trang bị unmount nên thông báo thành công của thao tác giao nhận
   * (đã gửi hàng / đã nhận hàng / đã gửi khiếu nại...) không bao giờ hiển thị.
   */
  const loadDetail = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
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

      // Khôi phục trần auto-bid từ server để banner "Auto-bid đang hoạt động" không mất
      // sau khi tải lại trang (trước đây giá trị này chỉ sống trong RAM của tab).
      setActiveAutoBidCap(detailRes.auction.myAutoBidMax ?? null);

      const minNext = detailRes.auction.bidCount === 0
        ? detailRes.auction.startPrice
        : detailRes.auction.currentPrice + detailRes.auction.bidStep;

      // Chỉ điền lại ô giá khi người dùng CHƯA gõ gì khác, tránh xoá số đang nhập.
      setBidAmount((current) => (current.trim() === '' ? minNext.toString() : current));
      // Ghi lại mức tối thiểu đang hiển thị để handler realtime biết ô giá còn "nguyên bản"
      // hay người dùng đã tự sửa (nếu không seed, lượt bid realtime đầu tiên không cập nhật ô).
      previousMinimumBidRef.current = minNext.toString();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được chi tiết phiên đấu giá.');
    } finally {
      if (!silent) setLoading(false);
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
        void loadDetail({ silent: true });
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

      // Cập nhật mức tối thiểu cho form, nhưng KHÔNG xoá số người dùng đang gõ: nếu ô giá
      // vẫn đang là mức tối thiểu cũ (hoặc để trống) thì mới điền lại, còn nếu người dùng
      // đã tự nhập số khác thì giữ nguyên.
      const nextMin = payload.minimumNextBid;
      setBidAmount((current) =>
        current.trim() === '' || current === previousMinimumBidRef.current ? nextMin.toString() : current,
      );
      previousMinimumBidRef.current = nextMin.toString();

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
      void loadDetail({ silent: true });
    },

    onReconnectedRefetch: () => {
      void loadDetail({ silent: true });
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
    } catch (err: unknown) {
      // Rollback UI + báo lỗi: trước đây chỉ rollback im lặng nên người dùng tưởng đã theo dõi.
      setWatching(!nextWatch);
      setError(auctionError(err));
    }
  }

  async function handlePlaceBid(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng đăng nhập để tham gia đấu giá.');
      return;
    }
    if (isSeller) {
      setError('Bạn là chủ sở hữu (người bán) của phiên đấu giá này, không thể tự đặt giá cho tác phẩm của mình.');
      return;
    }
    if (auction?.auctionStatus !== 'Active') {
      setError('Phiên đấu giá chưa bắt đầu hoặc đã kết thúc, hiện không nhận lượt đặt giá mới.');
      return;
    }

    const amountNum = Number(bidAmount);
    if (!auction || amountNum < minimumNextBid) {
      setError(`Mức giá đặt phải từ ${formatVnd(minimumNextBid)} trở lên.`);
      return;
    }

    if (isAuto) {
      const maxNum = Number(maxAutoBid);
      if (!maxNum || maxNum < minimumNextBid) {
        setError(`Giá trần tự động phải lớn hơn hoặc bằng mức giá đặt tối thiểu (${formatVnd(minimumNextBid)}).`);
        return;
      }
      // Backend chỉ yêu cầu trần >= mức tối thiểu, và lượt đặt thực tế luôn là
      // min(trần, mức tối thiểu). Trước đây FE đòi trần > giá đang nhập nên chặn nhầm
      // trường hợp hợp lệ (trần đúng bằng mức tối thiểu).
      if (maxNum < amountNum) {
        setError(`Giá trần tự động (${formatVnd(maxNum)}) phải lớn hơn hoặc bằng mức giá sẽ đặt (${formatVnd(amountNum)}).`);
        return;
      }
    }

    // Ví chỉ bị khoá đúng MỨC ĐẶT thực tế (backend dùng min(trần, mức tối thiểu)), 
    // không khoá toàn bộ giá trần — nên chỉ cần kiểm số dư theo amountNum.
    const payableNow = amountNum;
    if (wallet && wallet.wallet.balance < payableNow) {
      setError(
        `Số dư ví khả dụng không đủ để đặt giá! Cần: ${formatVnd(payableNow)}, Hiện có: ${formatVnd(wallet.wallet.balance)} (còn thiếu ${formatVnd(payableNow - wallet.wallet.balance)}).`
      );
      return;
    }

    // Auto-bid có trần bằng/vượt giá mua ngay: backend coi đây là MUA NGAY tức thì
    // (trần chạm giá mua ngay ⇒ chốt luôn ở giá mua ngay, không qua đấu giá tiếp). Đây là
    // chức năng, không phải lỗi — nhưng phải hỏi lại một lần vì tiền ra khỏi ví ngay và
    // không hoàn tác được.
    if (isAuto && auction?.buyNowPrice && Number(maxAutoBid) >= auction.buyNowPrice) {
      setPendingAutoBuy({ amount: amountNum, cap: Number(maxAutoBid) });
      setShowAutoBuyConfirm(true);
      return;
    }

    await submitBid(amountNum, isAuto && maxAutoBid ? Number(maxAutoBid) : undefined);
  }

  /**
   * Gửi lượt đặt giá lên server. Tách khỏi `handlePlaceBid` để luồng "xác nhận mua ngay
   * bằng Auto-bid" gọi lại được ngay sau khi người dùng bấm đồng ý.
   */
  async function submitBid(amountNum: number, autoMaxNum?: number) {
    if (!auction) return;
    const isAuto = autoMaxNum !== undefined;

    setSubmittingBid(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await auctionService.bid(auctionId, amountNum, isAuto, autoMaxNum);
      if (isAuto && autoMaxNum) setActiveAutoBidCap(autoMaxNum);

      if (res.bid.bidStatus === 'Leading') {
        setSuccess(
          isAuto
            ? `Đã kích hoạt Auto-bid thành công với giá trần ${formatVnd(autoMaxNum!)}. Giá của bạn hiện đang dẫn đầu!`
            : 'Đặt giá thành công! Giá của bạn đang dẫn đầu phiên đấu giá.'
        );
      } else if (res.bid.bidStatus === 'Outbid') {
        setError(
          `Lượt đặt giá ${formatVnd(amountNum)} đã được ghi nhận, nhưng bị Auto-bid của đối thủ vượt qua ngay lập tức. Mức giá dẫn đầu hiện tại đã tăng.`
        );
        await loadDetail({ silent: true });
      } else {
        setSuccess('Đã gửi lượt đặt giá lên hệ thống.');
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
      // A bid that reaches the buy-now ceiling settles the session on the spot: reload so
      // the page stops offering "Mua ngay" and shows the settled state.
      if (auction.buyNowPrice && amountNum >= auction.buyNowPrice) {
        setSuccess(`Giá đặt đã chạm mức mua ngay — phiên đã chốt ở ${formatVnd(auction.buyNowPrice)}.`);
        await loadDetail();
      }

    } catch (err: unknown) {
      if (err instanceof AuctionConflictError) {
        // FE-03: Handle 409 Conflict gracefully by updating price and next bid without page reload
        const c = err.conflictData;
        setAuction((prev) => (prev ? { ...prev, currentPrice: c.currentPrice, endAt: c.endAt } : prev));
        setBidAmount(c.minimumNextBid.toString());
        previousMinimumBidRef.current = c.minimumNextBid.toString();
        setError(
          `Có người vừa đặt giá trước bạn! Giá hiện tại đã tăng lên ${formatVnd(c.currentPrice)}. Chúng tôi đã tự động cập nhật mức giá tối thiểu mới (${formatVnd(c.minimumNextBid)}), bạn có thể kiểm tra và bấm Đặt giá ngay.`
        );
      } else {
        setError(auctionError(err));
      }
    } finally {
      setSubmittingBid(false);
    }
  }

  async function handleBuyNow() {
    if (!userId) {
      setError('Vui lòng đăng nhập để thực hiện mua ngay.');
      return;
    }
    if (isSeller) {
      setError('Bạn là chủ sở hữu tác phẩm này, không thể tự mua lại.');
      return;
    }
    if (!auction?.buyNowPrice) return;
    if (auction.auctionStatus !== 'Active') {
      setError('Phiên đấu giá không ở trạng thái mở để mua ngay.');
      return;
    }
    if (wallet && wallet.wallet.balance < auction.buyNowPrice) {
      setError(
        `Số dư ví không đủ để Mua ngay! Cần: ${formatVnd(auction.buyNowPrice)}, Hiện có: ${formatVnd(wallet.wallet.balance)} (còn thiếu ${formatVnd(auction.buyNowPrice - wallet.wallet.balance)}). Vui lòng nạp thêm tiền vào ví.`
      );
      return;
    }

    if (!confirm(`Bạn xác nhận mua ngay tác phẩm này với mức giá ${formatVnd(auction.buyNowPrice)}?`)) return;

    setBuyingNow(true);
    setError(null);
    try {
      await auctionService.buyNow(auctionId);
      setSuccess('Mua ngay thành công! Bạn đã trở thành người sở hữu tác phẩm này.');
      await loadDetail();
    } catch (err: unknown) {
      setError(auctionError(err));
    } finally {
      setBuyingNow(false);
    }
  }

  /** Có đang chờ giao tranh vật lý (chưa xác nhận đã nhận) hay không. */
  const isAwaitingPhysicalDelivery =
    Boolean(auction?.hasPhysicalCopy) &&
    auction?.auctionStatus !== 'Completed' &&
    (['AwaitingPhysical', 'InTransit'].includes(auction?.auctionStatus ?? '') ||
      (Boolean(auction?.delivery) &&
        !['Delivered', 'Cancelled'].includes(auction?.delivery?.status ?? '')));

  /** Tải thật sự — dùng sau khi đã qua bước xác nhận chính sách. */
  async function performDownloadOriginal() {
    setDownloading(true);
    try {
      const res = await auctionService.download(auctionId);
      if (res) {
        setDeliverableInfo({
          fileName: res.fileName,
          mimeType: res.mimeType,
          certNumber: res.certificateNumber,
          licenseType: res.licenseType,
        });
        setDownloadDeliverable(res);
      } else {
        setError('Liên kết tải về chưa sẵn sàng. Vui lòng thử lại sau vài giây.');
      }
    } catch (err: unknown) {
      setError(`Không thể tải tệp gốc: ${auctionError(err)}. Nếu bạn vừa thắng phiên, vui lòng đợi 1–2 phút để hệ thống hoàn tất giải ngân hợp đồng.`);
    } finally {
      setDownloading(false);
    }
  }

  /**
   * Người thắng đã chọn nhận tranh vật lý mà vẫn muốn lấy bản điện tử ngay:
   * bắt buộc đi qua hộp thoại cảnh báo trước, vì thao tác này giải ngân ký quỹ
   * cho người bán và mất quyền khiếu nại bưu phẩm.
   * Tranh vật lý đã giao xong thì tải bình thường, không cần hỏi.
   */
  async function handleDownloadOriginal() {
    if (isAwaitingPhysicalDelivery) {
      setShowDigitalNowWarning(true);
      return;
    }
    await performDownloadOriginal();
  }

  async function handleConfirmDigitalNow() {
    setAcceptingDigital(true);
    setError(null);
    try {
      await auctionService.acceptDigitalDelivery(auctionId);
      setShowDigitalNowWarning(false);
      await loadDetail();
      await performDownloadOriginal();
    } catch (err: unknown) {
      setError(`Không thể chuyển sang nhận tranh điện tử: ${auctionError(err)}`);
      setShowDigitalNowWarning(false);
    } finally {
      setAcceptingDigital(false);
    }
  }

  async function handleViewCertificate() {
    if (!isWinner && !isSeller) {
      return;
    }
    setLoadingCert(true);
    try {
      const cert = await auctionService.getCertificate(auctionId);
      setCertificate(cert);
      setShowCertModal(true);
    } catch (err: unknown) {
      setError(`Không thể tải chứng nhận số: ${auctionError(err)}`);
    } finally {
      setLoadingCert(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <PageLoader label={isVie ? 'Đang tải thông tin phiên đấu giá…' : 'Loading auction details…'} />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-[var(--ivory)]">
        <CircleAlert size={44} className="mx-auto mb-3 text-[var(--ash)]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--ivory)]">
          {isVie ? 'Không tìm thấy phiên đấu giá' : 'Auction session not found'}
        </h1>
        <p className="mt-2 text-sm text-[var(--ash)]">
          {isVie ? 'Phiên đấu giá có thể đã bị xóa hoặc không tồn tại.' : 'This auction session may have been removed or does not exist.'}
        </p>
        <Link href="/auctions" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lumen)] hover:underline">
          <ArrowLeft size={16} /> {isVie ? 'Quay lại danh sách đấu giá' : 'Back to auctions'}
        </Link>
      </div>
    );
  }

  const isLive = auction.auctionStatus === 'Active';
  const isScheduled = auction.auctionStatus === 'Scheduled';
  const isFinished = ['Settled', 'Ended', 'Cancelled', 'Expired', 'AwaitingPhysical', 'InTransit', 'Completed', 'Disputed'].includes(auction.auctionStatus);
  const isEnded = clock.isEnded || isFinished;
  const isWinner = userId && auction.winnerId === userId;
  // Winner chỉ thấy khối "chúc mừng + tải tranh + chứng nhận" SAU KHI đã chọn hình thức nhận hàng.
  // Phiên có bản vật lý: phải chọn nhận tranh thật (đã tạo delivery) hoặc từ chối để nhận file số
  // (requiresPhysicalDelivery = false). Phiên không có bản vật lý thì không có gì phải chọn.
  const hasCompletedDeliveryChoice =
    !auction.hasPhysicalCopy ||
    Boolean(auction.delivery) ||
    auction.requiresPhysicalDelivery === false;
  const isSeller = userId && auction.seller?.userId === userId;
  const statusLabel = auctionStatusLabels[auction.auctionStatus] || auction.auctionStatus;
  const bidAmountNum = Number(bidAmount) || 0;
  const isBalanceShortage = Boolean(wallet && wallet.wallet.balance < bidAmountNum);
  const totalSeconds = isFinished ? 0 : Math.floor(clock.remainingMs / 1000);
  const clockUnits = [
    { label: isVie ? 'Giờ' : 'Hours', value: isFinished ? '00' : Math.floor(totalSeconds / 3600).toString().padStart(2, '0') },
    { label: isVie ? 'Phút' : 'Minutes', value: isFinished ? '00' : Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0') },
    { label: isVie ? 'Giây' : 'Seconds', value: isFinished ? '00' : (totalSeconds % 60).toString().padStart(2, '0') },
    { label: 'ms', value: isFinished ? '00' : Math.floor((clock.remainingMs % 1000) / 10).toString().padStart(2, '0') },
  ];
  const isUrgent = isLive && !isFinished && clock.remainingMs > 0 && clock.remainingMs <= 5 * 60 * 1000;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 text-[var(--ivory)]">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/auctions" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ash)] transition hover:text-[var(--lumen)]">
          <ArrowLeft size={16} /> {isVie ? 'Quay lại danh sách đấu giá' : 'Back to auctions'}
        </Link>
        <button
          type="button"
          onClick={handleToggleWatch}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            watching
              ? 'border-[var(--cinnabar)] bg-[var(--cinnabar)] text-white shadow-sm'
              : 'border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ivory)] hover:border-[var(--lumen)] hover:text-[var(--lumen)]'
          }`}
        >
          <Heart size={14} className={watching ? 'fill-current text-white' : ''} />
          {watching ? (isVie ? 'Đang theo dõi' : 'Watching') : (isVie ? 'Theo dõi phiên' : 'Watch auction')}
        </button>
      </div>

      {extendedNotice && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-4 text-sm text-[var(--gold)] motion-reduce:animate-none animate-bounce">
          <Clock size={18} className="shrink-0 text-[var(--gold)]" />
          <span>{extendedNotice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[var(--cinnabar)]/30 bg-[var(--cinnabar)]/10 p-4 text-sm text-[var(--cinnabar-text)]">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-[var(--cinnabar)]" />
          <div className="flex-1">
            <span>{error}</span>
            {error.toLowerCase().includes('số dư') && (
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href="/deposit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lumen)] px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-[var(--lumen-hi)] transition"
                >
                  <Wallet size={13} /> {isVie ? 'Nạp thêm tiền vào ví ngay' : 'Deposit now'}
                </Link>
              </div>
            )}
            {error.toLowerCase().includes('đăng nhập') && (
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lumen)] px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-[var(--lumen-hi)] transition"
                >
                  {isVie ? 'Đăng nhập tài khoản' : 'Sign in'}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Cột trái: Khung ảnh tác phẩm & Seller Transparency Card */}
        <div className="space-y-4">
          {/* FE-05 Seller Transparency */}
          <SellerTransparencyCard seller={auction.seller} />

          <div className="overflow-hidden rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--hair)] px-5 py-3 text-[11px]">
              <span className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3 py-1 font-semibold text-[var(--lumen)]">
                {isVie ? 'Bản gốc duy nhất' : 'Unique Original'}
              </span>
              <span className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3 py-1 font-semibold text-[var(--ash)]">
                {auction.artwork?.style || (isVie ? 'Kỹ thuật số' : 'Digital')}
              </span>
            </div>
            <div className="relative aspect-[4/3] w-full bg-[var(--ink-3)]">
              {auction.artwork?.imageUrl || auction.artwork?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={auction.artwork.imageUrl || auction.artwork.thumbnailUrl || '/weblogo.png'}
                  alt={auction.artwork.artworkTitle || (isVie ? 'Tác phẩm' : 'Artwork')}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-[var(--ash)]">
                  {isVie ? 'Chưa có ảnh tác phẩm' : 'No preview available'}
                </div>
              )}
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-[var(--hair)] px-5 py-4">
              <div className="min-w-0">
                <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-medium text-[var(--ivory)]">
                  {auction.artwork?.artworkTitle || (isVie ? 'Tác phẩm nghệ thuật' : 'Artwork')}
                </h1>
                <p className="mt-1 text-xs text-[var(--ash)]">
                  {isVie ? 'Bản quyền thương mại kỹ thuật số' : 'Digital commercial rights included'}
                </p>
              </div>
              <span className="shrink-0 text-right text-[11px] text-[var(--ash)]">
                {isVie ? 'Mã phiên' : 'Session ID'}<br />
                <strong className="font-[family-name:var(--font-ui)] tabular-nums text-[var(--ivory)]">#{auction.auctionId.slice(0, 8).toUpperCase()}</strong>
              </span>
            </div>
            <div className="grid gap-2 border-t border-[var(--hair)] px-5 py-4 text-xs sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <User size={14} className="shrink-0 text-[var(--lumen)]" />
                <span className="text-[var(--ash)]">{isVie ? 'Tác giả:' : 'Artist:'}</span> 
                <strong className="truncate text-[var(--ivory)]">{auction.seller?.fullName || (isVie ? 'Nghệ sĩ ẩn danh' : 'Anonymous Artist')}</strong>
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays size={14} className="shrink-0 text-[var(--lumen)]" />
                <span className="text-[var(--ash)]">{isVie ? 'Ngày tạo:' : 'Created:'}</span> 
                <strong className="text-[var(--ivory)]">{auction.artwork?.createdAt ? new Date(auction.artwork.createdAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US') : (isVie ? 'Chưa cập nhật' : 'N/A')}</strong>
              </p>
              <p className="flex items-center gap-2">
                <FileType2 size={14} className="shrink-0 text-[var(--lumen)]" />
                <span className="text-[var(--ash)]">{isVie ? 'Định dạng:' : 'Format:'}</span> 
                <strong className="text-[var(--ivory)]">{[auction.artwork?.fileFormat, auction.artwork?.resolution, formatFileSize(auction.artwork?.fileSizeBytes)].filter(Boolean).join(' · ') || (isVie ? 'Chưa cập nhật' : 'N/A')}</strong>
              </p>
              <p className="flex items-center gap-2">
                <PackageCheck size={14} className="shrink-0 text-[var(--lumen)]" />
                <span className="text-[var(--ash)]">{isVie ? 'Tệp bàn giao:' : 'Deliverables:'}</span> 
                <strong className="text-[var(--ivory)]">{isVie ? `${auction.artwork?.deliverableCount ?? 0} tệp tranh gốc` : `${auction.artwork?.deliverableCount ?? 0} original files`}</strong>
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ivory)]">
                <Users size={16} className="text-[var(--lumen)]" /> {isVie ? 'Người tham gia' : 'Participants'}
              </h2>
              <span className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3 py-1 font-[family-name:var(--font-ui)] text-[10px] font-semibold text-[var(--ivory)]">
                {isVie
                  ? `${(auction.participants ?? []).filter((participant) => participant.role === 'Bidder').length} người đã bid`
                  : `${(auction.participants ?? []).filter((participant) => participant.role === 'Bidder').length} bidder(s)`}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(auction.participants ?? []).map((participant) => (
                <div
                  key={`${participant.role}-${participant.userId}`}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] px-3 py-2.5"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${participant.role === 'Seller' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--lumen)]/15 text-[var(--lumen)]'}`}>
                    {(participant.fullName || '?').split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--ivory)]">{participant.fullName || (isVie ? 'Người dùng ẩn danh' : 'Anonymous User')}</p>
                    <p className={`truncate text-[10px] ${participant.role === 'Seller' ? 'text-[var(--gold)]' : 'text-[var(--ash)]'}`}>
                      {participant.role === 'Seller'
                        ? (isVie ? 'Tác giả' : 'Artist / Seller')
                        : `Top ${(auction.participants ?? []).filter((item) => item.role !== 'Seller').findIndex((item) => item.userId === participant.userId) + 1} · ${formatVnd(participant.highestBid ?? 0)} · ${participant.bidCount} ${isVie ? 'lượt' : 'bids'}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải: Thông tin đấu giá & Đặt giá */}
        <div className="space-y-4">
          <section className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition-colors duration-500 bg-[var(--ink-2)] ${isFinished ? 'border-[var(--hair)]' : isUrgent ? 'border-[var(--cinnabar)]/60' : 'border-[var(--hair-2)]'}`}>
            <div className="relative z-10 mb-3 flex items-center justify-between border-b border-[var(--hair)] pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  {isLive && !isFinished && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${isUrgent ? 'bg-[var(--cinnabar)]' : 'bg-emerald-500'}`} />}
                  <span className={`relative inline-flex size-2.5 rounded-full ${isEnded ? 'bg-[var(--ash)]' : isUrgent ? 'bg-[var(--cinnabar)]' : 'bg-emerald-500'}`} />
                </span>
                <h2 className={`font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide ${isFinished ? 'text-[var(--ash)]' : isUrgent ? 'text-[var(--cinnabar-text)]' : 'text-[var(--ivory)]'}`}>
                  {isFinished
                    ? (auction?.auctionStatus === 'Settled'
                        ? (isVie ? 'Phiên đã chốt' : 'Settled')
                        : auction?.auctionStatus === 'AwaitingPhysical'
                          ? (isVie ? 'Chờ xác nhận tranh vật lý' : 'Awaiting physical copy')
                          : auction?.auctionStatus === 'InTransit'
                            ? (isVie ? 'Đang giao tranh vật lý' : 'Shipping physical copy')
                            : auction?.auctionStatus === 'Completed'
                              ? (isVie ? 'Giao dịch hoàn tất' : 'Transaction completed')
                              : auction?.auctionStatus === 'Cancelled'
                                ? (isVie ? 'Phiên đã hủy' : 'Cancelled')
                                : (isVie ? 'Phiên đã kết thúc' : 'Ended'))
                    : isEnded
                      ? (isScheduled ? (isVie ? 'Đang mở...' : 'Opening...') : (isVie ? 'Phiên đã kết thúc' : 'Ended'))
                      : isUrgent
                        ? (isVie ? 'Sắp chốt phiên' : 'Closing soon')
                        : (isScheduled ? (isVie ? 'Bắt đầu sau' : 'Starts in') : (isVie ? 'Thời gian còn lại' : 'Time remaining'))}
                </h2>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 font-[family-name:var(--font-ui)] text-[10px] font-semibold ${isUrgent && !isFinished ? 'border-[var(--cinnabar)]/40 bg-[var(--cinnabar)]/10 text-[var(--cinnabar-text)]' : 'border-[var(--hair)] bg-[var(--ink-3)] text-[var(--ash)]'}`}>
                {isUrgent && !isFinished ? 'ANTI-SNIPE +3M' : statusLabel}
              </span>
            </div>

            <div className="relative z-10 flex items-start justify-center gap-1.5 sm:gap-2" role="timer" aria-label={isEnded ? (isVie ? 'Phiên đã hết giờ' : 'Session ended') : (isVie ? `Còn lại ${clock.formatted}` : `Remaining ${clock.formatted}`)}>
              {clockUnits.map((unit, index) => (
                <div key={unit.label} className="contents">
                  {index > 0 && <span aria-hidden="true" className={`pt-2 font-[family-name:var(--font-ui)] text-2xl font-bold sm:text-3xl ${isFinished ? 'text-[var(--ash-dim)]' : isUrgent ? 'text-[var(--cinnabar)]' : 'text-[var(--lumen)]'}`}>:</span>}
                  <div className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={`relative w-full max-w-24 overflow-hidden rounded-2xl border bg-[var(--ink-3)] px-1 py-2 text-center shadow-inner ${isFinished ? 'border-[var(--hair)]' : isUrgent ? 'border-[var(--cinnabar)]/40' : 'border-[var(--hair-2)]'}`}>
                      <span className={`relative font-[family-name:var(--font-ui)] text-3xl font-bold leading-none tabular-nums tracking-tight sm:text-4xl ${isFinished ? 'text-[var(--ash)]' : isUrgent ? 'text-[var(--cinnabar)]' : 'text-[var(--ivory)]'}`}>
                        {unit.value}
                      </span>
                    </div>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--ash)]">{unit.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-5 md:p-6 shadow-sm">
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {/* FE-04 Realtime Price Animation */}
              <div
                className={`rounded-2xl border p-4 transition-all duration-500 ${
                  priceFlash
                    ? 'scale-[1.02] border-[var(--lumen)] bg-[var(--lumen-soft)] motion-reduce:animate-none'
                    : 'border-[var(--hair)] bg-[var(--ink-3)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[var(--ash)]">
                  <span>{isVie ? 'Giá đang dẫn đầu' : 'Leading bid'}</span>
                  <span className="font-[family-name:var(--font-ui)] tabular-nums">{isVie ? `Bước: +${formatVnd(auction.bidStep)}` : `Step: +${formatVnd(auction.bidStep)}`}</span>
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-medium tabular-nums text-[var(--lumen)]">
                  {formatVnd(auction.currentPrice)}
                </p>
                <p className="mt-2 text-xs text-[var(--ash)] font-[family-name:var(--font-ui)] tabular-nums">
                  {isVie ? `Khởi điểm: ${formatVnd(auction.startPrice)}` : `Starting: ${formatVnd(auction.startPrice)}`}
                </p>
                {auction.finalPrice != null ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-ui)] tabular-nums">
                    {isVie ? `Giá chốt: ${formatVnd(auction.finalPrice)}` : `Final: ${formatVnd(auction.finalPrice)}`}
                  </p>
                ) : null}
              </div>

              {/* FE-03 Balance Overview */}
              {userId && wallet && (
                <div className="rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--ash)]">
                    <Wallet size={14} className="text-[var(--lumen)]" /> {isVie ? 'Số dư ví khả dụng' : 'Available balance'}
                  </span>
                  <p className="mt-2 font-[family-name:var(--font-ui)] text-xl font-bold tabular-nums text-[var(--ivory)]">
                    {formatVnd(wallet.wallet.balance)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--ash)] font-[family-name:var(--font-ui)] tabular-nums">
                    <span>{isVie ? 'Tiền đang khóa cọc:' : 'Locked deposit:'}</span>
                    <span className="font-semibold text-[var(--ivory)]">{formatVnd(wallet.wallet.lockedBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Winner Badge & Download */}
            {isWinner && hasCompletedDeliveryChoice && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-xs text-[var(--ivory)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <Award size={18} />
                  <span>{isVie ? 'Chúc mừng! Bạn đã thắng phiên đấu giá này.' : 'Congratulations! You won this auction.'}</span>
                </div>
                <p className="mt-1 text-[var(--ash)]">
                  {isVie
                    ? 'Bạn nắm giữ quyền sở hữu độc bản và toàn quyền khai thác thương mại đối với bức tranh này.'
                    : 'You hold exclusive ownership and full commercial exploitation rights for this artwork.'}
                </p>

                {deliverableInfo && (
                  <div className="mt-3 rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3 space-y-1 text-[11px] text-[var(--ivory)] font-[family-name:var(--font-ui)]">
                    <p>• {isVie ? 'Tệp bàn giao:' : 'Deliverable file:'} <span className="font-bold text-[var(--ivory)]">{deliverableInfo.fileName}</span> {deliverableInfo.mimeType ? `(${deliverableInfo.mimeType})` : ''}</p>
                    {deliverableInfo.certNumber && <p>• {isVie ? 'Mã chứng nhận:' : 'Certificate #:'} <span className="text-[var(--lumen)]">{deliverableInfo.certNumber}</span></p>}
                    {deliverableInfo.licenseType && <p>• {isVie ? 'Giấy phép:' : 'License:'} <span className="text-[var(--ivory)]">{deliverableInfo.licenseType}</span></p>}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownloadOriginal}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lumen)] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[var(--lumen-hi)] transition disabled:opacity-50"
                  >
                    <Download size={14} /> {downloading ? (isVie ? 'Đang tạo liên kết...' : 'Generating link...') : (isVie ? 'Tải xuống tranh gốc' : 'Download original')}
                  </button>

                  <button
                    type="button"
                    disabled={loadingCert}
                    onClick={handleViewCertificate}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-2 text-xs font-bold text-[var(--ivory)] shadow hover:border-[var(--lumen)] hover:text-[var(--lumen)] transition disabled:opacity-50"
                  >
                    <ShieldCheck size={14} /> {loadingCert ? (isVie ? 'Đang tải chứng nhận...' : 'Loading cert...') : (isVie ? 'Xem Chứng nhận sở hữu' : 'Ownership Certificate')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCommercialDeed(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 bg-[var(--gold-soft)] px-4 py-2 text-xs font-bold text-[var(--gold)] shadow hover:bg-[var(--gold)]/20 transition"
                  >
                    <FileCheck2 size={14} /> {isVie ? 'Giấy bàn giao quyền thương mại' : 'Commercial Rights Deed'}
                  </button>
                </div>
              </div>
            )}

            {/* Trạng thái phiên chốt: Chỉ Seller mới có nút xem hợp đồng/chứng chỉ, người lạ chỉ thấy thông báo */}
            {auction.auctionStatus === 'Settled' && !isWinner && (
              <div className="mb-6 rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-xs text-[var(--ash)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-[var(--lumen)]">
                    <ShieldCheck size={16} />
                    <span>{isVie ? 'Phiên đấu giá đã chốt quyền sở hữu độc bản' : 'Auction has concluded with verified ownership deed'}</span>
                  </div>
                  {isSeller && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCommercialDeed(true)}
                        className="text-[11px] font-bold text-[var(--gold)] hover:underline cursor-pointer"
                      >
                        {isVie ? 'Quyền thương mại' : 'Commercial rights'}
                      </button>
                      <button
                        type="button"
                        disabled={loadingCert}
                        onClick={handleViewCertificate}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--lumen)] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {loadingCert ? (isVie ? 'Đang tải...' : 'Loading...') : (isVie ? 'Xem chứng chỉ' : 'View cert')} <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quản lý giao nhận tranh vật lý & Biên lai ký quỹ/bưu cục (UC35) */}
            {auction.hasPhysicalCopy && (
              <div className="mb-6">
                <PhysicalDeliveryCard auction={auction} userId={userId} onReload={() => void loadDetail({ silent: true })} />
              </div>
            )}

            {/* FE-03 & FE-08 Form tham gia đấu giá */}
            {isLive && !isSeller ? (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label htmlFor="bid-amount" className="font-semibold text-[var(--ivory)]">
                      {isVie ? 'Mức giá bạn muốn đặt (₫)' : 'Your bid amount (₫)'}
                    </label>
                    <span className="font-[family-name:var(--font-ui)] tabular-nums text-[11px] text-[var(--ash)]">
                      {isVie ? `Tối thiểu: ${formatVnd(minimumNextBid)}` : `Min: ${formatVnd(minimumNextBid)}`}
                    </span>
                  </div>

                  <input
                    id="bid-amount"
                    type="number"
                    min={minimumNextBid}
                    step="any"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className={`w-full rounded-2xl border bg-[var(--ink-3)] px-4 py-3 font-[family-name:var(--font-ui)] text-lg font-bold tabular-nums text-[var(--ivory)] focus:outline-none transition ${
                      bidAmountNum > 0 && (bidAmountNum < minimumNextBid || isBalanceShortage)
                        ? 'border-[var(--cinnabar)] focus:border-[var(--cinnabar)]'
                        : 'border-[var(--hair-2)] focus:border-[var(--lumen)]'
                    }`}
                  />
                  {bidAmountNum > 0 && bidAmountNum < minimumNextBid && (
                    <p className="mt-1 text-xs text-[var(--cinnabar-text)]">
                      {isVie ? `Mức giá đặt chưa đủ! Tối thiểu là ${formatVnd(minimumNextBid)}.` : `Amount too low! Minimum is ${formatVnd(minimumNextBid)}.`}
                    </p>
                  )}
                  {auction.buyNowPrice && bidAmountNum >= auction.buyNowPrice && (
                    <p className="mt-1 text-xs text-[var(--lumen)]">
                      {isVie
                        ? `Giá đặt đã chạm mức mua ngay: phiên sẽ chốt ngay ở ${formatVnd(auction.buyNowPrice)}, phần vượt không bị trừ.`
                        : `Bid meets Buy Now price: session will conclude at ${formatVnd(auction.buyNowPrice)}.`}
                    </p>
                  )}
                  {isBalanceShortage && (
                    <p className="mt-1 text-xs text-[var(--cinnabar-text)] flex items-center justify-between">
                      <span>
                        {isVie
                          ? `Số dư ví không đủ! Cần ${formatVnd(bidAmountNum)}, hiện có ${formatVnd(wallet?.wallet.balance ?? 0)} (thiếu ${formatVnd(bidAmountNum - (wallet?.wallet.balance ?? 0))}).`
                          : `Insufficient balance! Needed: ${formatVnd(bidAmountNum)}, current: ${formatVnd(wallet?.wallet.balance ?? 0)}.`}
                      </span>
                      <Link href="/deposit" className="text-[var(--lumen)] underline hover:text-[var(--lumen-hi)] font-semibold ml-1">
                        {isVie ? 'Nạp tiền' : 'Deposit'}
                      </Link>
                    </p>
                  )}

                  {/* FE-03 BidStep Chips */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleChipClick(0)}
                      className="min-h-11 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-2.5 py-1 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)] hover:text-[var(--lumen)] cursor-pointer"
                    >
                      {isVie ? 'Mặc định' : 'Default'} ({formatVnd(minimumNextBid)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(1)}
                      className="min-h-11 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-2.5 py-1 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)] hover:text-[var(--lumen)] cursor-pointer"
                    >
                      +1 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(2)}
                      className="min-h-11 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-2.5 py-1 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)] hover:text-[var(--lumen)] cursor-pointer"
                    >
                      +2 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(5)}
                      className="min-h-11 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-2.5 py-1 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--lumen-soft)] hover:text-[var(--lumen)] cursor-pointer"
                    >
                      +5 Step
                    </button>
                  </div>
                </div>

                {/* FE-08 Auto-bid settings */}
                <div className="rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-xs">
                  {activeAutoBidCap && (
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-300">
                      <span className="flex items-center gap-2 font-semibold">
                        <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <span>
                          Auto-bid <span className="font-normal">{isVie ? 'Đang hoạt động' : 'Active'}</span>
                        </span>
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                      </span>
                      <span className="font-[family-name:var(--font-ui)] tabular-nums">{isVie ? `Trần ${formatVnd(activeAutoBidCap)}` : `Cap ${formatVnd(activeAutoBidCap)}`}</span>
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span>
                      <span className="block font-semibold text-[var(--ivory)]">{isVie ? 'Đặt giá bằng Auto-bid' : 'Enable Auto-bid'}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--ash)]">{isVie ? 'Bật để đăng ký hoặc cập nhật giá trần ở lần đặt giá này.' : 'Toggle to set or update auto-bid max cap.'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isAuto}
                      onChange={(e) => setIsAuto(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-11 shrink-0 rounded-full bg-[var(--hair-2)] transition peer-checked:bg-[var(--lumen)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--lumen)] after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                  <p className="mt-1 text-[11px] text-[var(--ash)]">
                    {isVie
                      ? `Hệ thống sẽ tự động tăng giá theo BidStep (+${formatVnd(auction.bidStep)}) mỗi khi có người đè giá, nhưng không vượt quá mức trần tối đa do bạn cài đặt.`
                      : `System will auto-increment bids by step (+${formatVnd(auction.bidStep)}) up to your specified cap.`}
                  </p>
                  {isAuto && (
                    <div className="mt-3">
                      <label className="mb-1 block text-[var(--ash)] font-medium">{isVie ? 'Giới hạn giá trần tối đa (₫):' : 'Max price ceiling (₫):'}</label>
                      <input
                        type="number"
                        min={minimumNextBid}
                        value={maxAutoBid}
                        onChange={(e) => setMaxAutoBid(e.target.value)}
                        placeholder={isVie ? `Tối thiểu ${minimumNextBid}` : `Minimum ${minimumNextBid}`}
                        className={`w-full rounded-xl border bg-[var(--ink-2)] px-3 py-2 font-[family-name:var(--font-ui)] tabular-nums text-[var(--ivory)] focus:outline-none transition ${
                          maxAutoBid && (Number(maxAutoBid) < minimumNextBid || Number(maxAutoBid) < bidAmountNum)
                            ? 'border-[var(--cinnabar)] focus:border-[var(--cinnabar)]'
                            : 'border-[var(--hair-2)] focus:border-[var(--lumen)]'
                        }`}
                      />
                      {maxAutoBid && Number(maxAutoBid) < minimumNextBid && (
                        <p className="mt-1 text-xs text-[var(--cinnabar-text)]">
                          {isVie
                            ? `Giá trần tự động phải lớn hơn hoặc bằng mức giá đặt tối thiểu (${formatVnd(minimumNextBid)}).`
                            : `Max cap must be at least the minimum next bid (${formatVnd(minimumNextBid)}).`}
                        </p>
                      )}
                      {maxAutoBid && Number(maxAutoBid) >= minimumNextBid && Number(maxAutoBid) < bidAmountNum && (
                        <p className="mt-1 text-xs text-[var(--cinnabar-text)]">
                          {isVie
                            ? `Giá trần tự động (${formatVnd(Number(maxAutoBid))}) phải lớn hơn hoặc bằng mức giá sẽ đặt (${formatVnd(bidAmountNum)}).`
                            : `Max cap must be at least your current bid amount.`}
                        </p>
                      )}
                      {/* Cảnh báo trước khi bấm: trần chạm giá mua ngay = mua luôn, không đấu giá tiếp. */}
                      {auction.buyNowPrice != null && Number(maxAutoBid) >= auction.buyNowPrice && (
                        <p className="mt-1 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] px-2.5 py-1.5 text-[11px] text-[var(--gold)]">
                          {isVie
                            ? `Trần này chạm giá mua ngay (${formatVnd(auction.buyNowPrice)}): khi gửi, hệ thống sẽ hỏi xác nhận và mua ngay tác phẩm ở mức giá đó.`
                            : `Cap reaches Buy Now (${formatVnd(auction.buyNowPrice)}): confirmation will be requested to buy instantly.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    submittingBid ||
                    isEnded ||
                    isBalanceShortage ||
                    bidAmountNum < minimumNextBid ||
                    Boolean(isAuto && (!maxAutoBid || Number(maxAutoBid) < minimumNextBid || Number(maxAutoBid) < bidAmountNum))
                  }
                  className="w-full rounded-full bg-[var(--lumen)] py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-[var(--lumen-hi)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Gavel size={16} />{' '}
                    {submittingBid
                      ? (isVie ? 'Đang xử lý...' : 'Processing...')
                      : isBalanceShortage
                        ? (isVie ? 'Số dư ví không đủ' : 'Insufficient balance')
                        : isAuto
                          ? (isVie
                              ? `${activeAutoBidCap ? 'Cập nhật' : 'Kích hoạt'} Auto-bid · Trần ${formatVnd(Number(maxAutoBid) || 0)}`
                              : `${activeAutoBidCap ? 'Update' : 'Activate'} Auto-bid · Cap ${formatVnd(Number(maxAutoBid) || 0)}`)
                          : (isVie ? `Đặt giá ${formatVnd(bidAmountNum)}` : `Place bid ${formatVnd(bidAmountNum)}`)}
                  </span>
                </button>

                {/* Mua ngay nếu phiên hỗ trợ */}
                {auction.buyNowPrice && auction.currentPrice < auction.buyNowPrice && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled={buyingNow || isEnded}
                      onClick={handleBuyNow}
                      className="w-full rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] py-2.5 text-center text-xs font-bold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:text-[var(--lumen)] disabled:opacity-50 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Zap size={14} className="text-[var(--gold)]" /> {buyingNow ? (isVie ? 'Đang xử lý...' : 'Processing...') : (isVie ? `Mua ngay với ${formatVnd(auction.buyNowPrice)}` : `Buy now for ${formatVnd(auction.buyNowPrice)}`)}
                      </span>
                    </button>
                    {wallet && wallet.wallet.balance < auction.buyNowPrice && (
                      <p className="text-center text-[11px] text-[var(--ash)]">
                        {isVie
                          ? `Số dư ví của bạn (${formatVnd(wallet.wallet.balance)}) chưa đủ để Mua ngay (thiếu ${formatVnd(auction.buyNowPrice - wallet.wallet.balance)}).`
                          : `Insufficient balance for Buy Now.`}
                      </p>
                    )}
                  </div>
                )}

                {/* Dòng ghi chú nhỏ quy chế và điều lệ đấu giá */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-[var(--ash)]">
                  <ShieldCheck size={13} className="text-[var(--lumen)] shrink-0" />
                  <span>
                    {isVie ? 'Bằng việc đặt giá hoặc mua ngay tác phẩm này, bạn đồng ý với ' : 'By placing a bid or buying now, you agree to '}
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-[var(--lumen)] font-medium underline decoration-[var(--lumen)]/40 underline-offset-2 hover:text-[var(--lumen-hi)] transition cursor-pointer"
                    >
                      {isVie ? 'Quy chế sàn đấu giá & Điều lệ bản quyền' : 'Auction Rules & Copyright Terms'}
                    </button>
                    .
                  </span>
                </div>
              </form>
            ) : isSeller ? (
              <div className="rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-center text-xs text-[var(--ash)]">
                {isVie ? 'Bạn là người tạo phiên đấu giá này nên không thể tham gia đặt giá.' : 'You are the seller of this auction and cannot bid.'}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-center text-xs text-[var(--ash)]">
                {isVie ? 'Phiên đấu giá hiện tại không ở trạng thái mở để đặt giá.' : 'This auction is not currently open for bidding.'}
              </div>
            )}
          </section>

          {/* Lịch sử đặt giá gần đây */}
          <section className="rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ivory)]">
                {isVie ? `Lịch sử đặt giá (${auction.bidCount})` : `Bid history (${auction.bidCount})`}
              </h2>
              <button
                type="button"
                onClick={() => void loadDetail()}
                disabled={loading}
                className="text-xs text-[var(--ash)] hover:text-[var(--lumen)] transition cursor-pointer"
                title={isVie ? 'Làm mới lịch sử' : 'Refresh history'}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {bids.length === 0 ? (
              <p className="py-4 text-center text-xs text-[var(--ash)]">
                {isVie ? 'Chưa có lượt đặt giá nào. Hãy là người đầu tiên!' : 'No bids yet. Be the first to place a bid!'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {bids.map((b) => {
                  const isNew = b.bidId === newBidId;
                  const isMine = b.bidderId === userId;
                  return (
                    <div
                      key={b.bidId}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all duration-300 ${
                        isMine
                          ? 'border-[var(--lumen)]/40 bg-[var(--lumen-soft)] text-[var(--ivory)] shadow-sm'
                          : b.bidStatus === 'Leading'
                            ? 'border-[var(--hair-2)] bg-[var(--ink-3)]'
                            : 'border-[var(--hair)] bg-[var(--ink-3)]/60'
                      } ${isNew ? 'scale-[1.01] ring-1 ring-[var(--lumen)] motion-reduce:transform-none' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${isMine ? 'bg-[var(--lumen)] text-white' : 'bg-[var(--hair-2)] text-[var(--ash)]'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--ivory)]">
                            {isMine ? (isVie ? 'Bạn' : 'You') : b.bidder?.fullName || (isVie ? 'Người đấu giá' : 'Bidder')} {b.bidStatus === 'Leading' ? (isVie ? '(Dẫn đầu)' : '(Leading)') : ''}
                          </p>
                          <span className="text-[10px] text-[var(--ash)] font-[family-name:var(--font-ui)] tabular-nums">
                            {new Date(b.placedAt).toLocaleTimeString(isVie ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                      <span className={`font-[family-name:var(--font-ui)] font-bold tabular-nums ${isMine || b.bidStatus === 'Leading' ? 'text-[var(--lumen)]' : 'text-[var(--ivory)]'}`}>
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

      {/* Modal Chứng nhận quyền sở hữu số VIP Card (chỉ Winner hoặc Seller) */}
      {showCertModal && certificate && (isWinner || isSeller) && (
        <AuctionCertificateCard
          certificate={certificate}
          onClose={() => setShowCertModal(false)}
          onOpenCommercialRights={() => {
            setShowCertModal(false);
            setShowCommercialDeed(true);
          }}
        />
      )}

      {/* Modal Hợp đồng bàn giao quyền thương mại (chỉ Winner hoặc Seller) */}
      {showCommercialDeed && (isWinner || isSeller) && (
        <CommercialRightsModal
          auctionId={auctionId}
          onClose={() => setShowCommercialDeed(false)}
        />
      )}

      {/* Cảnh báo: nhận tranh điện tử ngay khi đang chờ giao tranh vật lý */}
      {showDigitalNowWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--gold)]/40 bg-[var(--ink-2)] p-6 shadow-2xl text-[var(--ivory)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--gold)]">
                  {isVie ? 'Nhận tranh điện tử ngay?' : 'Receive digital files now?'}
                </h3>
                <p className="mt-1 text-xs text-[var(--ash)]">
                  {isVie ? 'Bạn đang chờ bưu cục giao bản tranh vật lý. Nếu nhận bản điện tử ngay bây giờ:' : 'You are currently awaiting physical delivery. If you accept digital files now:'}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] p-4 text-xs text-[var(--ivory)]">
              <li className="flex gap-2">
                <span className="text-[var(--gold)]">•</span>
                <span>{isVie ? 'Tiền ký quỹ được ' : 'Escrow funds will be '}<strong className="text-[var(--ivory)]">{isVie ? 'giải ngân ngay cho người bán' : 'immediately released to the seller'}</strong>{isVie ? ', phiên đấu giá đóng lại.' : ', closing the auction.'}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--cinnabar)]">•</span>
                <span>
                  {isVie ? 'Sàn ' : 'The platform '}
                  <strong className="text-[var(--ivory)]">{isVie ? 'không còn giữ tiền' : 'will no longer hold funds'}</strong>
                  {isVie ? ', nên nếu bưu phẩm đến muộn, hư hỏng hoặc không đúng tranh, bạn ' : ', so if the package arrives late or damaged, you '}
                  <strong className="text-[var(--cinnabar-text)]">{isVie ? 'không được hoàn tiền' : 'cannot claim refund'}</strong>
                  {isVie ? ' và không mở khiếu nại được nữa.' : ' or open a dispute.'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>{isVie ? 'Đổi lại bạn nhận ngay bản tranh gốc độ phân giải cao và giấy chứng nhận sở hữu.' : 'In return, you immediately get high-res original files and the ownership certificate.'}</span>
              </li>
            </ul>

            <p className="mt-3 text-[11px] text-[var(--ash)]">
              {isVie ? 'Nếu muốn giữ quyền khiếu nại bưu phẩm, hãy bấm Huỷ và chờ xác nhận đã nhận tranh vật lý.' : 'If you wish to retain dispute rights, cancel and wait for the physical package.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--hair)] pt-4">
              <button
                type="button"
                onClick={() => setShowDigitalNowWarning(false)}
                disabled={acceptingDigital}
                className="rounded-full border border-[var(--hair-2)] px-4 py-2 text-xs font-semibold text-[var(--ash)] hover:border-[var(--lumen)] hover:text-[var(--lumen)] transition disabled:opacity-50 cursor-pointer"
              >
                {isVie ? 'Huỷ, chờ nhận tranh vật lý' : 'Cancel, wait for delivery'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDigitalNow}
                disabled={acceptingDigital}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--lumen)] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[var(--lumen-hi)] transition disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> {acceptingDigital ? (isVie ? 'Đang xử lý...' : 'Processing...') : (isVie ? 'Tôi đồng ý, nhận tranh điện tử ngay' : 'I agree, accept digital files now')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tải bàn giao tranh gốc HD (cho Winner) */}
      {downloadDeliverable && (
        <DeliverablesDownloadModal
          deliverable={downloadDeliverable}
          onClose={() => setDownloadDeliverable(null)}
        />
      )}

      {/* Modal Quy chế sàn đấu giá & Điều lệ bản quyền */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-6 shadow-2xl backdrop-blur-2xl text-[var(--ivory)] space-y-4">
            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-[var(--ash)] hover:bg-[var(--ink-3)] hover:text-[var(--ivory)] transition cursor-pointer"
              aria-label={isVie ? 'Đóng' : 'Close'}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lumen-soft)] text-[var(--lumen)]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ivory)]">
                  {isVie ? 'Quy chế sàn & Điều lệ bản quyền' : 'Auction Platform Rules & Copyright Policy'}
                </h3>
                <p className="text-[11px] text-[var(--ash)]">
                  {isVie ? 'Quy định giao dịch đấu giá minh bạch trên Dillustration' : 'Transparent auction trading terms on Dillustration'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs text-[var(--ivory)] leading-relaxed">
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ivory)]">{isVie ? 'Ký quỹ tự động & Hoàn cọc 100% (Escrow):' : 'Automated Escrow & 100% Refund:'}</strong>
                  <p className="text-[var(--ash)] mt-0.5">
                    {isVie
                      ? 'Khi bạn đặt giá, số tiền cọc tương ứng được tạm khóa trong ví. Nếu có người trả giá cao hơn, tiền cọc của bạn lập tức được tự động mở khóa hoàn trả 100% về ví ngay tức thì (không giam tiền).'
                      : 'When you place a bid, deposit funds are temporarily reserved in escrow. If outbid, 100% of the funds are unlocked immediately back to your wallet.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ivory)]">{isVie ? 'Quyền sở hữu & khai thác thương mại 100% cho Người thắng:' : 'Full Ownership & Commercial Rights for Winner:'}</strong>
                  <p className="text-[var(--ash)] mt-0.5">
                    {isVie
                      ? 'Người thắng phiên nhận quyền tài sản độc quyền đối với bức tranh: toàn quyền khai thác hình ảnh tranh để sinh lời (in ấn tranh, trưng bày, quảng cáo), quyền niêm yết bán lại thứ cấp, tải tệp tranh gốc chất lượng cao và Giấy chứng nhận độc bản.'
                      : 'The winner receives exclusive commercial rights to reproduce, display, and merchandise the artwork, along with the authentic certificate of ownership.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] p-3">
                <ShieldCheck size={16} className="text-[var(--gold)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--gold)]">{isVie ? 'Bảo hộ Quyền nhân thân cho Họa sĩ gốc:' : 'Moral Rights Protection for the Original Artist:'}</strong>
                  <p className="text-[var(--ivory)] mt-0.5">
                    {isVie
                      ? 'Theo Luật Sở hữu trí tuệ, danh tính Họa sĩ sáng tác gốc là bất biến và vĩnh viễn không thay đổi qua mọi đời chủ sở hữu.'
                      : 'Under Intellectual Property Law, moral attribution of the original creator is perpetual and immutable.'}
                  </p>
                  <p className="text-[var(--ash)] mt-0.5">
                    {isVie
                      ? 'Người thắng phiên sở hữu quyền thương mại nhưng '
                      : 'The winner holds commercial exploitation rights but '}
                    <strong className="text-[var(--gold)]">{isVie ? 'tuyệt đối không được mạo danh mình là tác giả sáng tác ra tác phẩm' : 'cannot claim false authorship'}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
                <CheckCircle2 size={16} className="text-[var(--lumen)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ivory)]">{isVie ? 'Tính ràng buộc của lệnh đặt giá:' : 'Binding Commitment of Bids:'}</strong>
                  <p className="text-[var(--ash)] mt-0.5">
                    {isVie
                      ? 'Lệnh đặt giá hoặc mua ngay một khi đã xác nhận thành công là cam kết thanh toán hợp lệ, không thể tự ý hủy ngang giữa chừng và chỉ được giải phóng khi có người trả giá cao hơn.'
                      : 'Bids and Buy Now actions are legally binding commitments that cannot be retracted unless superseded by a higher bid.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--hair)]">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="rounded-full bg-[var(--lumen)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--lumen-hi)] transition cursor-pointer"
              >
                {isVie ? 'Đã hiểu & Đóng' : 'Understood & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xác nhận mua ngay bằng Auto-bid: trần >= giá mua ngay thì hệ thống chốt phiên
          ngay ở giá mua ngay (không đấu giá tiếp). Tiền ra khỏi ví ngay, không hoàn tác. */}
      {showAutoBuyConfirm && auction?.buyNowPrice && pendingAutoBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-buy-confirm-title"
            className="w-full max-w-md space-y-4 rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-6 shadow-2xl text-[var(--ivory)]"
          >
            <div className="flex items-start gap-3">
              <Gavel size={20} className="mt-0.5 shrink-0 text-[var(--gold)]" />
              <div className="space-y-1">
                <h3 id="auto-buy-confirm-title" className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ivory)]">
                  {isVie ? 'Xác nhận mua ngay bằng Auto-bid' : 'Confirm Buy Now via Auto-bid'}
                </h3>
                <p className="text-xs text-[var(--ash)] font-[family-name:var(--font-ui)] tabular-nums">
                  {isVie
                    ? `Giá trần bạn đặt (${formatVnd(pendingAutoBuy.cap)}) đã chạm hoặc vượt giá mua ngay (${formatVnd(auction.buyNowPrice)}).`
                    : `Your cap (${formatVnd(pendingAutoBuy.cap)}) meets or exceeds Buy Now price (${formatVnd(auction.buyNowPrice)}).`}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] p-3 text-xs text-[var(--ivory)] space-y-1.5 font-[family-name:var(--font-ui)] tabular-nums">
              <p>
                {isVie
                  ? 'Theo quy chế, khi trần auto-bid chạm giá mua ngay thì hệ thống '
                  : 'Under auction rules, when cap meets Buy Now, system will '}
                <strong className="text-[var(--gold)]">{isVie ? `mua ngay tác phẩm ở ${formatVnd(auction.buyNowPrice)}` : `purchase immediately at ${formatVnd(auction.buyNowPrice)}`}</strong>:
                {isVie ? ' phiên kết thúc ngay, không đấu giá tiếp.' : ' concluding the auction session.'}
              </p>
              <p>
                {isVie ? 'Số tiền ' : 'The amount of '}
                <strong className="text-[var(--gold)]">{formatVnd(auction.buyNowPrice)}</strong>
                {isVie ? ' được trừ từ ví khả dụng và giữ ở sàn theo quy trình giao nhận. Lệnh này không huỷ được sau khi xác nhận.' : ' will be debited from your wallet into escrow. This cannot be undone.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAutoBuyConfirm(false);
                  setPendingAutoBuy(null);
                }}
                className="rounded-full border border-[var(--hair-2)] px-4 py-2 text-xs font-semibold text-[var(--ash)] hover:border-[var(--lumen)] hover:text-[var(--lumen)] transition cursor-pointer"
              >
                {isVie ? 'Huỷ, để tôi chỉnh lại' : 'Cancel, let me adjust'}
              </button>
              <button
                type="button"
                disabled={submittingBid}
                onClick={async () => {
                  const pending = pendingAutoBuy;
                  setShowAutoBuyConfirm(false);
                  setPendingAutoBuy(null);
                  if (pending) {
                    await submitBid(pending.amount, pending.cap);
                  }
                }}
                className="rounded-full bg-[var(--gold)] px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                {submittingBid ? (isVie ? 'Đang xử lý...' : 'Processing...') : (isVie ? `Xác nhận mua ngay ${formatVnd(auction.buyNowPrice)}` : `Confirm Buy Now ${formatVnd(auction.buyNowPrice)}`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
