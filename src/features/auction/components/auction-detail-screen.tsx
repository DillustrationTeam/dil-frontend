'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { localizeStyle } from '@/features/marketplace/utils/style-labels';
import { RiskDetailStrip } from './risk-detail-strip';
import { SimilarAuctionsRail } from './similar-auctions-rail';
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
  Eye,
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
  const [cancellingAutoBid, setCancellingAutoBid] = useState<boolean>(false);
  // Phân trang lịch sử đặt giá: `recentBids` của API chi tiết chỉ có 10 lượt gần nhất.
  const [bidCursor, setBidCursor] = useState<string | null>(null);
  const [loadingMoreBids, setLoadingMoreBids] = useState<boolean>(false);
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
      setBidCursor(null);
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
      setError('Bạn là chủ sở hữu của phiên đấu giá này, không thể tự đặt giá cho tác phẩm của mình.');
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

  /**
   * Huỷ đăng ký Auto-bid. Lượt đặt giá đang dẫn đầu vẫn được giữ — chỉ dừng việc tự động
   * nâng giá khi có người đè, nên phải nói rõ điều đó trước khi người dùng bấm.
   */
  async function handleCancelAutoBid() {
    if (!activeAutoBidCap || cancellingAutoBid) return;
    if (!confirm(
      `Huỷ Auto-bid với giá trần ${formatVnd(activeAutoBidCap)}?\n\nLượt đặt giá hiện tại của bạn vẫn được giữ, nhưng hệ thống sẽ KHÔNG tự nâng giá nữa khi có người đè — bạn phải tự đặt giá lại.`,
    )) return;

    setCancellingAutoBid(true);
    setError(null);
    setSuccess(null);
    try {
      await auctionService.cancelAutoBid(auctionId);
      setActiveAutoBidCap(null);
      setIsAuto(false);
      setMaxAutoBid('');
      setSuccess('Đã huỷ Auto-bid. Lượt đặt giá hiện tại của bạn vẫn được giữ nguyên.');
      await loadDetail({ silent: true });
    } catch (err: unknown) {
      setError(auctionError(err));
    } finally {
      setCancellingAutoBid(false);
    }
  }

  /**
   * Tải thêm lịch sử đặt giá (API trả theo cursor, mỗi trang 10 lượt).
   *
   * Trang đầu của `/bids` trùng đúng 10 lượt `recentBids` đã hiển thị, nên lần bấm đầu tiên
   * sẽ không thêm dòng nào — vòng lặp dưới đây đi tiếp cho tới khi có lượt mới thật sự.
   */
  async function loadMoreBids() {
    if (loadingMoreBids) return;
    setLoadingMoreBids(true);
    setError(null);
    try {
      const seen = new Set(bids.map((b) => b.bidId));
      let cursor = bidCursor ?? undefined;
      let appended = 0;
      let next: string | null = bidCursor;

      for (let page = 0; page < 4; page += 1) {
        const res = await auctionService.bids(auctionId, cursor);
        const fresh = res.items.filter((b) => !seen.has(b.bidId));
        fresh.forEach((b) => seen.add(b.bidId));
        if (fresh.length > 0) {
          setBids((prev) => sortBids([...prev, ...fresh]));
          appended += fresh.length;
        }
        next = res.nextCursor;
        cursor = res.nextCursor ?? undefined;
        if (appended > 0 || !next) break;
      }

      setBidCursor(next);
      if (appended === 0) {
        setSuccess('Đã hiển thị toàn bộ lịch sử đặt giá của phiên này.');
      }
    } catch (err: unknown) {
      setError(auctionError(err));
    } finally {
      setLoadingMoreBids(false);
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
          <ArrowLeft size={16} /> Quay lại danh sách đấu giá </Link>
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
  // Cùng định dạng với thẻ đấu giá ở ngoài danh sách: "17 ngày 03:13:24" (có Ngày)
  const clockUnits = [
    { label: 'Ngày', value: isFinished ? '00' : Math.floor(totalSeconds / 86400).toString().padStart(2, '0') },
    { label: 'Giờ', value: isFinished ? '00' : Math.floor((totalSeconds % 86400) / 3600).toString().padStart(2, '0') },
    { label: 'Phút', value: isFinished ? '00' : Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0') },
    { label: 'Giây', value: isFinished ? '00' : (totalSeconds % 60).toString().padStart(2, '0') },
  ];
  const isUrgent = isLive && !isFinished && clock.remainingMs > 0 && clock.remainingMs <= 5 * 60 * 1000;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 text-on-surface">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/auctions" className="inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại danh sách đấu giá </Link>
        <button
          type="button"
          onClick={handleToggleWatch}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            watching
              ? 'border-brand-periwinkle bg-brand-periwinkle text-[#FFFCF6]'
              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-on-surface hover:bg-[#F0E7D8]'
          }`}
        >
          <Heart size={14} className={watching ? 'fill-brand-navy' : ''} />
          {watching ? 'Đang theo dõi' : 'Theo dõi phiên'}
        </button>
      </div>

      {extendedNotice && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 p-4 text-sm text-[#8A6A1F] motion-reduce:animate-none animate-bounce">
          <Clock size={18} className="shrink-0 text-[#8A6A1F]" />
          <span>{extendedNotice}</span>
        </div>
      )}

      {/* Chỉ hiện với Administrator/Moderator: API trả 403 nên component tự ẩn */}
      <RiskDetailStrip auctionId={auctionId} />

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-[#A8321C]" />
          <div className="flex-1">
            <span>{error}</span>
            {error.toLowerCase().includes('số dư') && (
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href="/deposit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-periwinkle px-3.5 py-1.5 font-h1 text-xs font-bold text-[#FFFCF6] shadow hover:brightness-110"
                >
                  <Wallet size={13} /> Nạp thêm tiền vào ví ngay </Link>
              </div>
            )}
            {error.toLowerCase().includes('đăng nhập') && (
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-periwinkle px-3.5 py-1.5 font-h1 text-xs font-bold text-[#FFFCF6] shadow hover:brightness-110"
                > Đăng nhập tài khoản </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 p-4 text-sm text-[#2F6B63]">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Cột trái: Khung ảnh tác phẩm & Seller Transparency Card */}
        <div className="space-y-4">
          {/* FE-05 Seller Transparency */}
          <SellerTransparencyCard seller={auction.seller} />

          <div className="glass-container overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#F0E7D8]">
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 px-5 py-3 text-[11px]">
              <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-1 font-semibold text-brand-periwinkle"> Bản gốc duy nhất </span>
              <span className="rounded-full border border-[#2F6B63]/30 bg-[#2F6B63]/10 px-3 py-1 font-semibold text-[#2F6B63]">
                {auction.artwork?.style ? localizeStyle(auction.artwork.style) : 'Kỹ thuật số'}
              </span>
            </div>
            <div className="relative aspect-[4/3] w-full">
              {auction.artwork?.imageUrl || auction.artwork?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={auction.artwork.imageUrl || auction.artwork.thumbnailUrl || '/weblogo.png'}
                  alt={auction.artwork.artworkTitle || 'Tác phẩm'}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-outline"> Chưa có ảnh tác phẩm </div>
              )}
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-[#221E1A]/10 px-5 py-4">
              <div className="min-w-0">
                <h1 className="truncate font-h1 text-xl font-bold">{auction.artwork?.artworkTitle || 'Tác phẩm nghệ thuật'}</h1>
                <p className="mt-1 text-xs text-outline">Bản quyền thương mại kỹ thuật số</p>
              </div>
              <span className="shrink-0 text-right text-[11px] text-outline"> Mã phiên<br />
                <strong className="font-mono text-on-surface">#{auction.auctionId.slice(0, 8).toUpperCase()}</strong>
              </span>
            </div>
            <div className="grid gap-2 border-t border-[#221E1A]/10 px-5 py-4 text-xs sm:grid-cols-2">
              <p className="flex items-center gap-2"><User size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Tác giả:</span> <strong className="truncate">{auction.seller?.fullName || 'Nghệ sĩ ẩn danh'}</strong></p>
              <p className="flex items-center gap-2"><CalendarDays size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Ngày tạo:</span> <strong>{auction.artwork?.createdAt ? new Date(auction.artwork.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong></p>
              <p className="flex items-center gap-2"><FileType2 size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Định dạng:</span> <strong>{[auction.artwork?.fileFormat, auction.artwork?.resolution, formatFileSize(auction.artwork?.fileSizeBytes)].filter(Boolean).join(' · ') || 'Chưa cập nhật'}</strong></p>
              <p className="flex items-center gap-2"><PackageCheck size={14} className="shrink-0 text-brand-periwinkle" /><span className="text-outline">Tệp bàn giao:</span> <strong>{`${auction.artwork?.deliverableCount ?? 0} tệp tranh gốc`}</strong></p>
            </div>
          </div>

          <section className="glass-container rounded-3xl border border-[#221E1A]/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-h1 text-sm font-bold">
                <Users size={16} className="text-brand-periwinkle" /> Người tham gia </h2>
              <span className="rounded-full border border-brand-periwinkle/20 bg-brand-periwinkle/10 px-3 py-1 text-[10px] font-semibold text-brand-periwinkle">
                {(auction.participants ?? []).filter((participant) => participant.role === 'Bidder').length} người đã đặt giá
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(auction.participants ?? []).map((participant) => (
                <div
                  key={`${participant.role}-${participant.userId}`}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${participant.role === 'Seller' ? 'bg-[#8A6A1F]/15 text-[#8A6A1F]' : 'bg-brand-periwinkle/15 text-brand-periwinkle'}`}>
                    {(participant.fullName || '?').split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{participant.fullName || 'Người dùng ẩn danh'}</p>
                    <p className={`truncate text-[10px] ${participant.role === 'Seller' ? 'text-[#8A6A1F]' : 'text-outline'}`}>
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
          <section className={`glass-container relative overflow-hidden rounded-2xl border p-3 shadow-xl transition-colors duration-500 ${isFinished ? 'border-[#221E1A]/10' : isUrgent ? 'border-[#A8321C]/40 shadow-[#A8321C]' : 'border-[#8A6A1F]/35'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(167,172,217,0.15)_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
            <div className="relative z-10 mb-2 flex items-center justify-between border-b border-[#221E1A]/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  {isLive && !isFinished && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${isUrgent ? 'bg-[#A8321C]/10' : 'bg-[#2F6B63]/10'}`} />}
                  <span className={`relative inline-flex size-2.5 rounded-full ${isEnded ? 'bg-outline' : isUrgent ? 'bg-[#A8321C]/12' : 'bg-[#2F6B63]/12'}`} />
                </span>
                <h2 className={`text-xs font-bold uppercase tracking-wide ${isFinished ? 'text-[#746A5F]' : isUrgent ? 'text-[#A8321C]' : 'text-on-surface'}`}>
                  {isFinished
                    ? (auction?.auctionStatus === 'Settled'
                        ? 'Phiên đã chốt'
                        : auction?.auctionStatus === 'AwaitingPhysical'
                          ? 'Chờ xác nhận tranh vật lý'
                          : auction?.auctionStatus === 'InTransit'
                            ? 'Đang giao tranh vật lý'
                            : auction?.auctionStatus === 'Completed'
                              ? 'Giao dịch hoàn tất'
                              : auction?.auctionStatus === 'Cancelled'
                                ? 'Phiên đã hủy'
                                : 'Phiên đã kết thúc')
                    : isEnded
                      ? (isScheduled ? 'Đang mở...' : 'Phiên đã kết thúc')
                      : isUrgent
                        ? 'Sắp chốt phiên'
                        : (isScheduled ? 'Bắt đầu sau' : 'Thời gian còn lại')}
                </h2>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isUrgent && !isFinished ? 'border-[#A8321C]/40 bg-[#A8321C]/15 text-[#A8321C]' : 'border-[#221E1A]/10 bg-brand-navy/80 text-outline'}`}>
                {isUrgent && !isFinished ? 'ANTI-SNIPE +3M' : statusLabel}
              </span>
            </div>

            <div className="relative z-10 flex items-start justify-center gap-1 sm:gap-1.5" role="timer" aria-label={isEnded ? 'Phiên đã hết giờ' : `Còn lại ${clock.formatted}`}>
              {clockUnits.map((unit, index) => (
                <div key={unit.label} className="contents">
                  {index > 0 && <span aria-hidden="true" className={`pt-2 font-[family-name:var(--font-ui)] text-2xl font-black sm:text-3xl ${isFinished ? 'text-[#241F1A]' : isUrgent ? 'text-[#A8321C]' : 'text-[#8A6A1F]'}`}>:</span>}
                  <div className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={`relative w-full max-w-24 overflow-hidden rounded-xl border bg-[#FFFCF6] px-1 py-2 text-center shadow-inner ${isFinished ? 'border-[#221E1A]/10' : isUrgent ? 'border-[#A8321C]/40' : 'border-[#8A6A1F]/35'}`}>
                      <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center font-[family-name:var(--font-ui)] tabular-nums text-3xl font-black tracking-[0.08em] opacity-10 sm:text-4xl ${isFinished ? 'text-[#241F1A]' : isUrgent ? 'text-[#A8321C]' : 'text-[#8A6A1F]'}`}>88</span>
                      <span className={`relative font-[family-name:var(--font-ui)] tabular-nums text-3xl font-black leading-none tracking-[0.08em] sm:text-4xl ${isFinished ? 'text-[#746A5F]' : isUrgent ? 'text-[#A8321C] drop-shadow-[0_0_8px_rgba(251,113,133,0.65)]' : 'text-[#8A6A1F] drop-shadow-[0_0_8px_rgba(251,191,36,0.55)]'}`}>
                        {unit.value}
                      </span>
                    </div>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-outline">{unit.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-container rounded-3xl border border-[#221E1A]/10 p-5 md:p-6">
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
                {auction.finalPrice != null ? (
                  <p className="mt-1 text-xs font-semibold text-[#2F6B63]">
                    Giá chốt: {formatVnd(auction.finalPrice)}
                  </p>
                ) : null}
              </div>

              {/* FE-03 Balance Overview */}
              {userId && wallet && (
                <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs">
                  <span className="flex items-center gap-1.5 text-outline">
                    <Wallet size={14} className="text-brand-periwinkle" /> Số dư ví khả dụng </span>
                  <p className="mt-2 font-h1 text-xl font-bold text-[#2F6B63]">
                    {formatVnd(wallet.wallet.balance)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-outline">
                    <span>Tiền đang khóa cọc:</span>
                    <span>{formatVnd(wallet.wallet.lockedBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Winner Badge & Download */}
            {isWinner && hasCompletedDeliveryChoice && (
              <div className="mb-6 rounded-2xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 p-5 text-xs text-[#2F6B63]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2F6B63]">
                  <Award size={18} />
                  <span>Chúc mừng! Bạn đã thắng phiên đấu giá này.</span>
                </div>
                <p className="mt-1 text-[#2F6B63]"> Bạn nắm giữ quyền sở hữu độc bản và toàn quyền khai thác thương mại đối với bức tranh này. </p>

                {deliverableInfo && (
                  <div className="mt-3 rounded-xl border border-[#2F6B63]/30 bg-[#F0E7D8] p-3 space-y-1 text-[11px] text-[#2F6B63] font-mono">
                    <p>• Tệp bàn giao: <span className="font-bold text-[#241F1A]">{deliverableInfo.fileName}</span> {deliverableInfo.mimeType ? `(${deliverableInfo.mimeType})` : ''}</p>
                    {deliverableInfo.certNumber && <p>• Mã chứng nhận: <span className="text-[#2F6B63]">{deliverableInfo.certNumber}</span></p>}
                    {deliverableInfo.licenseType && <p>• Giấy phép: <span className="text-[#241F1A]">{deliverableInfo.licenseType}</span></p>}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownloadOriginal}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#2F6B63]/10 px-4 py-2 font-h1 font-bold text-[#241F1A] shadow hover:brightness-110 disabled:opacity-50"
                  >
                    <Download size={14} /> {downloading ? 'Đang tạo liên kết...' : 'Tải xuống tranh gốc'}
                  </button>

                  <button
                    type="button"
                    disabled={loadingCert}
                    onClick={handleViewCertificate}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/20 px-4 py-2 font-h1 font-bold text-[#2F6B63] shadow hover:bg-[#2F6B63]/20 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} /> {loadingCert ? 'Đang tải chứng nhận...' : 'Xem Chứng nhận sở hữu'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCommercialDeed(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-4 py-2 font-h1 font-bold text-[#8A6A1F] shadow hover:bg-[#8A6A1F]/20"
                  >
                    <FileCheck2 size={14} /> Giấy bàn giao quyền thương mại </button>
                </div>
              </div>
            )}

            {/* Trạng thái phiên chốt: Chỉ Seller mới có nút xem hợp đồng/chứng chỉ, người lạ chỉ thấy thông báo */}
            {auction.auctionStatus === 'Settled' && !isWinner && (
              <div className="mb-6 rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-4 text-xs text-on-surface-variant">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-brand-periwinkle">
                    <ShieldCheck size={16} />
                    <span>Phiên đấu giá đã chốt quyền sở hữu độc bản</span>
                  </div>
                  {isSeller && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCommercialDeed(true)}
                        className="text-[11px] font-bold text-[#8A6A1F] hover:underline cursor-pointer"
                      > Quyền thương mại </button>
                      <button
                        type="button"
                        disabled={loadingCert}
                        onClick={handleViewCertificate}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-periwinkle hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {loadingCert ? 'Đang tải...' : 'Xem chứng chỉ'} <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AUCT-04 — người bán sửa thông số phiên khi phiên chưa mở và chưa có lượt đặt giá */}
            {isSeller && auction.auctionStatus === 'Scheduled' && auction.bidCount === 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8A6A1F]/35 bg-[#8A6A1F]/10 p-4 text-xs">
                <div className="flex items-start gap-2 text-[#8A6A1F]">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-[#8A6A1F]" />
                  <span> Phiên <strong>chưa bắt đầu</strong> và chưa có lượt đặt giá — bạn vẫn sửa được giá khởi điểm,
 bước giá, giá mua ngay và thời gian. </span>
                </div>
                <Link
                  href={`/auctions/${auctionId}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-4 py-2 font-h1 text-[11px] font-bold text-[#241F1A] transition hover:brightness-110"
                >
                  <RefreshCw size={13} /> Sửa phiên </Link>
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
                    <label htmlFor="bid-amount" className="font-medium text-on-surface-variant">
                      Mức giá bạn muốn đặt (₫)
                    </label>
                    <span className="text-[11px] text-outline">Tối thiểu: {formatVnd(minimumNextBid)}</span>
                  </div>


                  <input
                    id="bid-amount"
                    type="number"
                    min={minimumNextBid}
                    step="any"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className={`w-full rounded-xl border bg-brand-navy/60 px-4 py-3 font-h1 text-lg font-bold text-on-surface focus:outline-none transition ${
                      bidAmountNum > 0 && (bidAmountNum < minimumNextBid || isBalanceShortage)
                        ? 'border-[#A8321C]/30 focus:border-[#A8321C]/30'
                        : 'border-[#221E1A]/10 focus:border-brand-periwinkle'
                    }`}
                  />
                  {bidAmountNum > 0 && bidAmountNum < minimumNextBid && (
                    <p className="mt-1 text-xs text-[#A8321C]">
                      Mức giá đặt chưa đủ! Tối thiểu là {formatVnd(minimumNextBid)}.
                    </p>
                  )}
                  {auction.buyNowPrice && bidAmountNum >= auction.buyNowPrice && (
                    <p className="mt-1 text-xs text-brand-periwinkle/90">
                      Giá đặt đã chạm mức mua ngay: phiên sẽ chốt ngay ở {formatVnd(auction.buyNowPrice)}, phần vượt không bị trừ.
                    </p>
                  )}
                  {isBalanceShortage && (
                    <p className="mt-1 text-xs text-[#A8321C] flex items-center justify-between">
                      <span>
                        Số dư ví không đủ! Cần {formatVnd(bidAmountNum)}, hiện có {formatVnd(wallet?.wallet.balance ?? 0)} (thiếu {formatVnd(bidAmountNum - (wallet?.wallet.balance ?? 0))}).
                      </span>
                      <Link href="/deposit" className="text-brand-periwinkle underline hover:text-[#241F1A] font-semibold ml-1"> Nạp tiền </Link>
                    </p>
                  )}

                  {/* FE-03 BidStep Chips */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleChipClick(0)}
                      className="min-h-11 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      Mặc định ({formatVnd(minimumNextBid)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(1)}
                      className="min-h-11 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +1 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(2)}
                      className="min-h-11 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +2 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChipClick(5)}
                      className="min-h-11 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-semibold hover:border-brand-periwinkle hover:bg-brand-periwinkle/10"
                    >
                      +5 Step
                    </button>
                  </div>
                </div>

                {/* FE-08 Auto-bid settings */}
                <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs">
                  {activeAutoBidCap && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2F6B63]/40 bg-[#2F6B63]/10 px-3 py-2 text-[#2F6B63]">
                      <span className="flex items-center gap-2 font-semibold">
                        <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <span>
                          Auto-bid <span className="font-normal text-[#2F6B63]">Đang hoạt động</span>
                        </span>
                        <span className="size-1.5 rounded-full bg-[#2F6B63]/10 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">Trần {formatVnd(activeAutoBidCap)}</span>
                        <button
                          type="button"
                          onClick={() => void handleCancelAutoBid()}
                          disabled={cancellingAutoBid}
                          className="inline-flex items-center gap-1 rounded-full border border-[#A8321C]/40 bg-[#A8321C]/15 px-2.5 py-1 text-[11px] font-semibold text-[#A8321C] transition hover:bg-[#A8321C]/20 disabled:opacity-50"
                          title="Dừng tự động nâng giá khi bị đè"
                        >
                          <X size={12} /> {cancellingAutoBid ? 'Đang huỷ…' : 'Huỷ Auto-bid'}
                        </button>
                      </span>
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
                    <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#F0E7D8] transition peer-checked:bg-brand-periwinkle peer-focus-visible:ring-2 peer-focus-visible:ring-brand-periwinkle/60 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-[#F0E7D8] after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-brand-navy" />
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
                        className={`w-full rounded-lg border bg-brand-navy px-3 py-2 text-on-surface focus:outline-none transition ${
                          maxAutoBid && (Number(maxAutoBid) < minimumNextBid || Number(maxAutoBid) < bidAmountNum)
                            ? 'border-[#A8321C]/30 focus:border-[#A8321C]/30'
                            : 'border-[#221E1A]/10 focus:border-brand-periwinkle'
                        }`}
                      />
                      {maxAutoBid && Number(maxAutoBid) < minimumNextBid && (
                        <p className="mt-1 text-xs text-[#A8321C]">
                          Giá trần tự động phải lớn hơn hoặc bằng mức giá đặt tối thiểu ({formatVnd(minimumNextBid)}).
                        </p>
                      )}
                      {maxAutoBid && Number(maxAutoBid) >= minimumNextBid && Number(maxAutoBid) < bidAmountNum && (
                        <p className="mt-1 text-xs text-[#A8321C]">
                          Giá trần tự động ({formatVnd(Number(maxAutoBid))}) phải lớn hơn hoặc bằng mức giá sẽ đặt ({formatVnd(bidAmountNum)}).
                        </p>
                      )}
                      {/* Cảnh báo trước khi bấm: trần chạm giá mua ngay = mua luôn, không đấu giá tiếp. */}
                      {auction.buyNowPrice != null && Number(maxAutoBid) >= auction.buyNowPrice && (
                        <p className="mt-1 rounded-lg border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-2 py-1.5 text-[11px] text-[#8A6A1F]">
                          Trần này chạm giá mua ngay ({formatVnd(auction.buyNowPrice)}): khi gửi, hệ thống sẽ hỏi xác nhận và
                          mua ngay tác phẩm ở mức giá đó.
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
                  className="w-full rounded-full bg-brand-periwinkle py-3 text-center font-h1 text-sm font-bold text-[#FFFCF6] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                {auction.buyNowPrice && auction.currentPrice < auction.buyNowPrice && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled={buyingNow || isEnded}
                      onClick={handleBuyNow}
                      className="w-full rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 py-2.5 text-center font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Zap size={14} /> {buyingNow ? 'Đang xử lý...' : `Mua ngay với ${formatVnd(auction.buyNowPrice)}`}
                      </span>
                    </button>
                    {wallet && wallet.wallet.balance < auction.buyNowPrice && (
                      <p className="text-center text-[11px] text-[#8A6A1F]">
                        Số dư ví của bạn ({formatVnd(wallet.wallet.balance)}) chưa đủ để Mua ngay (thiếu {formatVnd(auction.buyNowPrice - wallet.wallet.balance)}).
                      </p>
                    )}
                  </div>
                )}

                {/* Dòng ghi chú nhỏ quy chế và điều lệ đấu giá */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-outline">
                  <ShieldCheck size={13} className="text-brand-periwinkle shrink-0" />
                  <span>
                    Bằng việc đặt giá hoặc mua ngay tác phẩm này, bạn đồng ý với{' '}
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-brand-periwinkle font-medium underline decoration-brand-periwinkle/40 underline-offset-2 hover:text-[#241F1A] transition cursor-pointer"
                    >
                      Quy chế sàn đấu giá &amp; Điều lệ bản quyền
                    </button>
                    .
                  </span>
                </div>
              </form>
            ) : isSeller ? (
              <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-center text-xs text-outline"> Bạn là người tạo phiên đấu giá này nên không thể tham gia đặt giá. </div>
            ) : (
              <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-center text-xs text-outline"> Phiên đấu giá hiện tại không ở trạng thái mở để đặt giá. </div>
            )}
          </section>

          {/* Lịch sử đặt giá gần đây */}
          <section className="glass-container rounded-3xl border border-[#221E1A]/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-h1 text-base font-bold">Lịch sử đặt giá ({auction.bidCount})</h2>
                {/* Cùng số liệu với thẻ ngoài danh sách: "N theo dõi" */}
                <span className="inline-flex items-center gap-1 text-xs text-outline">
                  <Eye size={13} />
                  {auction.watchCount ?? 0} theo dõi
                </span>
              </div>
              <button
                type="button"
                onClick={() => void loadDetail()}
                disabled={loading}
                className="text-xs text-outline hover:text-[#241F1A]"
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
                          ? 'border-[#B24A26] bg-[#B24A26] text-[#F7F2E9] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
                          : b.bidStatus === 'Leading'
                            ? 'border-brand-periwinkle/30 bg-brand-periwinkle/10'
                            : 'border-[#221E1A]/10 bg-[#FFFCF6]'
                      } ${isNew ? 'scale-[1.01] ring-1 ring-[#2F6B63]/30 motion-reduce:transform-none' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex size-7 items-center justify-center rounded-full ${isMine ? 'bg-brand-navy/15 text-[#241F1A]' : 'bg-[#F0E7D8] text-brand-periwinkle'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <p className={`font-semibold ${isMine ? 'text-[#241F1A]' : 'text-on-surface'}`}>
                            {isMine ? 'Bạn' : b.bidder?.fullName || 'Người đấu giá'} {b.bidStatus === 'Leading' ? '(Dẫn đầu)' : ''}
                          </p>
                          <span className={`text-[10px] ${isMine ? 'text-[#241F1A]/70' : 'text-outline'}`}>
                            {new Date(b.placedAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${isMine ? 'text-[#241F1A]' : 'text-brand-periwinkle'}`}>
                        {formatVnd(b.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tải thêm lịch sử: API chi tiết chỉ trả 10 lượt gần nhất, còn bidCount là tổng thật. */}
            {auction.bidCount > bids.length && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => void loadMoreBids()}
                  disabled={loadingMoreBids}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-4 py-2 text-[11px] font-semibold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
                >
                  {loadingMoreBids ? (
                    <LoaderCircle size={12} className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {loadingMoreBids
                    ? 'Đang tải thêm…'
                    : `Xem thêm lượt đặt giá cũ hơn (còn ${Math.max(auction.bidCount - bids.length, 0)})`}
                </button>
              </div>
            )}
            {bids.length > 0 && auction.bidCount <= bids.length && bids.length > 10 && (
              <p className="mt-2 text-center text-[10px] text-outline">Đã hiển thị toàn bộ lượt đặt giá của phiên này.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0E7D8]/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[#8A6A1F]/40 bg-[#F7F2E9] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 text-[#8A6A1F]">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-h1 text-base font-bold text-[#8A6A1F]"> Nhận tranh điện tử ngay? </h3>
                <p className="mt-1 text-xs text-on-surface-variant"> Bạn đang chờ bưu cục giao bản tranh vật lý. Nếu nhận bản điện tử ngay bây giờ: </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-4 text-xs text-on-surface-variant">
              <li className="flex gap-2">
                <span className="text-[#8A6A1F]">•</span>
                <span>Tiền ký quỹ được <strong className="text-[#241F1A]">giải ngân ngay cho người bán</strong>, phiên đấu giá đóng lại.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#A8321C]">•</span>
                <span> Sàn <strong className="text-[#241F1A]">không còn giữ tiền</strong>, nên nếu bưu phẩm đến muộn, hư hỏng hoặc
 không đúng tranh, bạn <strong className="text-[#A8321C]">không được hoàn tiền</strong> và không mở khiếu nại được nữa. </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#2F6B63]">•</span>
                <span>Đổi lại bạn nhận ngay bản tranh gốc độ phân giải cao và giấy chứng nhận sở hữu.</span>
              </li>
            </ul>

            <p className="mt-3 text-[11px] text-outline"> Nếu muốn giữ quyền khiếu nại bưu phẩm, hãy bấm Huỷ và chờ xác nhận đã nhận tranh vật lý. </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#221E1A]/10 pt-4">
              <button
                type="button"
                onClick={() => setShowDigitalNowWarning(false)}
                disabled={acceptingDigital}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-outline hover:text-[#241F1A] transition disabled:opacity-50"
              > Huỷ, chờ nhận tranh vật lý </button>
              <button
                type="button"
                onClick={handleConfirmDigitalNow}
                disabled={acceptingDigital}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8A6A1F]/10 px-5 py-2 text-xs font-bold text-[#241F1A] shadow-md hover:brightness-110 transition disabled:opacity-50"
              >
                <Download size={14} /> {acceptingDigital ? 'Đang xử lý...' : 'Tôi đồng ý, nhận tranh điện tử ngay'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#221E1A]/10 bg-[#F7F2E9]/95 p-6 shadow-2xl backdrop-blur-2xl text-on-surface space-y-4">
            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-outline hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-periwinkle/15 text-brand-periwinkle">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-h1 text-base font-bold text-[#241F1A]">Quy chế sàn &amp; Điều lệ bản quyền</h3>
                <p className="text-[11px] text-outline">Quy định giao dịch đấu giá minh bạch trên Dillustration</p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs text-on-surface leading-relaxed">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3">
                <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#241F1A]">Ký quỹ tự động &amp; Hoàn cọc 100% (Escrow):</strong>
                  <p className="text-outline mt-0.5"> Khi bạn đặt giá, số tiền cọc tương ứng được tạm khóa trong ví. Nếu có người trả giá cao hơn, tiền cọc của bạn lập tức được tự động mở khóa hoàn trả 100% về ví ngay tức thì (không giam tiền). </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3">
                <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#241F1A]">Quyền sở hữu &amp; khai thác thương mại 100% cho Người thắng:</strong>
                  <p className="text-outline mt-0.5"> Người thắng phiên nhận quyền tài sản độc quyền đối với bức tranh: toàn quyền khai thác hình ảnh tranh để sinh lời (in ấn tranh, trưng bày, quảng cáo), quyền niêm yết bán lại thứ cấp, tải tệp tranh gốc chất lượng cao và Giấy chứng nhận độc bản. </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3">
                <ShieldCheck size={16} className="text-[#8A6A1F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#8A6A1F]">Bảo hộ Quyền nhân thân cho Họa sĩ gốc:</strong>
                  <p className="text-[#241F1A]/90 mt-0.5"> Theo Luật Sở hữu trí tuệ, danh tính Họa sĩ sáng tác gốc là bất biến và vĩnh viễn không thay đổi qua mọi đời chủ sở hữu. </p>
                  <p className="text-outline mt-0.5"> Người thắng phiên sở hữu quyền thương mại nhưng <strong className="text-[#8A6A1F]">tuyệt đối không được mạo danh mình là tác giả sáng tác ra tác phẩm</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3">
                <CheckCircle2 size={16} className="text-brand-periwinkle shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#241F1A]">Tính ràng buộc của lệnh đặt giá:</strong>
                  <p className="text-outline mt-0.5"> Lệnh đặt giá hoặc mua ngay một khi đã xác nhận thành công là cam kết thanh toán hợp lệ, không thể tự ý hủy ngang giữa chừng và chỉ được giải phóng khi có người trả giá cao hơn. </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#221E1A]/10">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="rounded-full bg-brand-periwinkle px-5 py-2 text-xs font-bold text-[#FFFCF6] hover:brightness-110 transition cursor-pointer"
              >
                Đã hiểu &amp; Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* Xác nhận mua ngay bằng Auto-bid: trần >= giá mua ngay thì hệ thống chốt phiên
          ngay ở giá mua ngay (không đấu giá tiếp). Tiền ra khỏi ví ngay, không hoàn tác. */}
      {showAutoBuyConfirm && auction?.buyNowPrice && pendingAutoBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-buy-confirm-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#8A6A1F]/40 bg-brand-navy p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <Gavel size={20} className="mt-0.5 shrink-0 text-[#8A6A1F]" />
              <div className="space-y-1">
                <h3 id="auto-buy-confirm-title" className="font-h1 text-base font-bold text-[#241F1A]"> Xác nhận mua ngay bằng Auto-bid </h3>
                <p className="text-xs text-outline">
                  Giá trần bạn đặt ({formatVnd(pendingAutoBuy.cap)}) đã chạm hoặc vượt giá mua ngay
                  ({formatVnd(auction.buyNowPrice)}).
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3 text-xs text-[#8A6A1F] space-y-1.5">
              <p>
                Theo quy chế, khi trần auto-bid chạm giá mua ngay thì hệ thống{' '}
                <strong className="text-[#8A6A1F]">mua ngay tác phẩm ở {formatVnd(auction.buyNowPrice)}</strong> cho bạn:
 phiên kết thúc ngay, không đấu giá tiếp. </p>
              <p> Số tiền <strong className="text-[#8A6A1F]">{formatVnd(auction.buyNowPrice)}</strong> được trừ từ ví khả dụng
 và giữ ở sàn theo quy trình giao nhận. Lệnh này không huỷ được sau khi xác nhận. </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAutoBuyConfirm(false);
                  setPendingAutoBuy(null);
                }}
                className="rounded-full border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-[#241F1A]/80 hover:bg-[#FFFCF6] transition"
              > Huỷ, để tôi chỉnh lại </button>
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
                className="rounded-full bg-[#8A6A1F]/10 px-4 py-2 text-xs font-bold text-[#241F1A] hover:brightness-110 disabled:opacity-50 transition"
              >
                {submittingBid ? 'Đang xử lý...' : `Xác nhận mua ngay ${formatVnd(auction.buyNowPrice)}`}
              </button>
            </div>
          </div>
        </div>
      )}
      <SimilarAuctionsRail auctionId={auctionId} />
    </div>
  );
}
