'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Eye,
  Gavel,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { auctionService, auctionError } from '../services/auction.service';
import { SellerRiskFlagsCard } from './seller-risk-flags';
import { useAuctionClock } from '../hooks/use-auction-clock';
import type { AuctionListItemDto, MyActiveBidDto, MyActiveBidsMeta } from '../types/auction.types';
import { PageLoader } from '@/features/navigation';
import { useAuthStore } from '@/store/use-auth-store';

type DashboardTab = 'all' | 'leading' | 'outbid' | 'watching';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function BiddingCard({ bid }: { bid: MyActiveBidDto }) {
  const clock = useAuctionClock({ endAt: bid.endAt });
  const isLeading = bid.participationStatus === 'Leading';

  return (
    <div
      className={`glass-container flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
        isLeading ? 'border-[#2F6B63]/40 bg-[#2F6B63]/5' : 'border-[#8A6A1F]/40 bg-[#8A6A1F]/5'
      }`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
              isLeading
                ? 'border border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63]'
                : 'border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]'
            }`}
          >
            {isLeading ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {isLeading ? 'Đang dẫn đầu' : 'Bị đè giá!'}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-[#8A6A1F]">
            <Clock size={12} /> {clock.isEnded ? 'Đã kết thúc' : clock.formatted}
          </span>
        </div>

        <h3 className="font-h1 text-lg font-bold text-on-surface line-clamp-1">{bid.artworkTitle}</h3>
        <p className="mt-1 text-xs text-outline">Mã phiên: #{bid.auctionId.slice(0, 8).toUpperCase()}</p>

        <div className="my-4 space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-outline">Giá hiện tại:</span>
            <span className="font-mono font-bold text-brand-periwinkle">{formatVnd(bid.currentPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline">Tiền cọc đang giữ:</span>
            <span className="font-mono font-semibold text-[#8A6A1F]">{formatVnd(bid.lockedAmount)}</span>
          </div>
          {!isLeading && (
            <div className="flex items-center justify-between text-[#8A6A1F] border-t border-[#221E1A]/10 pt-1.5">
              <span>Mức đặt tối thiểu tiếp theo:</span>
              <span className="font-mono font-bold">{formatVnd(bid.minimumNextBid)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-[#221E1A]/10 flex items-center justify-between">
        <span className="text-[11px] text-outline">
          Đặt lúc: {new Date(bid.lastBidAt).toLocaleTimeString('vi-VN')}
        </span>
        <Link
          href={`/auctions/${bid.auctionId}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-h1 text-xs font-bold transition ${
            isLeading
              ? 'border border-brand-periwinkle/30 bg-brand-periwinkle/10 text-brand-periwinkle hover:bg-brand-periwinkle hover:text-[#FFFCF6]'
              : 'bg-[#8A6A1F]/10 text-[#241F1A] hover:brightness-110 shadow-md'
          }`}
        >
          {isLeading ? 'Xem phiên' : 'Nâng giá ngay'} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}


/** Thẻ phiên đang theo dõi — chỉ hiển thị, không có tiền cọc vì người dùng chưa đặt giá. */
function WatchedCard({
  item,
  onUnwatch,
  unwatching,
}: {
  item: AuctionListItemDto;
  onUnwatch: (id: string) => void;
  unwatching: boolean;
}) {
  const clock = useAuctionClock({ endAt: item.endAt });
  const isLive = item.auctionStatus === 'Active';

  return (
    <div className="glass-container flex flex-col justify-between rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 transition-all duration-300 hover:-translate-y-1">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
              isLive
                ? 'border border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63]'
                : 'border border-[#221E1A]/10 bg-[#FFFCF6] text-outline'
            }`}
          >
            <Eye size={12} /> {isLive ? 'Đang diễn ra' : 'Sắp diễn ra'}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-[#8A6A1F]">
            <Clock size={12} /> {clock.isEnded ? 'Đã kết thúc' : clock.formatted}
          </span>
        </div>

        <h3 className="font-h1 text-lg font-bold text-on-surface line-clamp-1">
          {item.artwork?.artworkTitle || 'Tác phẩm đấu giá'}
        </h3>
        <p className="mt-1 text-xs text-outline">Mã phiên: #{item.auctionId.slice(0, 8).toUpperCase()}</p>

        <div className="my-4 space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-outline">Giá hiện tại:</span>
            <span className="font-mono font-bold text-brand-periwinkle">{formatVnd(item.currentPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline">Lượt đặt giá:</span>
            <span className="font-mono font-semibold text-on-surface">{item.bidCount}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#221E1A]/10 pt-1.5">
            <span className="text-outline">Người theo dõi:</span>
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#2F6B63]">
              <Bell size={11} /> {item.watchCount}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#221E1A]/10 pt-2">
        <button
          type="button"
          onClick={() => onUnwatch(item.auctionId)}
          disabled={unwatching}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-[11px] font-semibold text-outline transition hover:border-[#A8321C]/40 hover:text-[#A8321C] disabled:opacity-50"
          title="Bỏ theo dõi phiên này"
        >
          <BellOff size={12} /> {unwatching ? 'Đang bỏ…' : 'Bỏ theo dõi'}
        </button>
        <Link
          href={`/auctions/${item.auctionId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-4 py-2 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6]"
        > Xem phiên <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

/** Lắng nghe quá trình hydrate của auth store (persist Zustand). */
function subscribeAuthHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}
export function BiddingDashboardScreen({ initialTab = 'all' }: { initialTab?: DashboardTab }) {
  const userId = useAuthStore((state) => state.user?.id);
  // Chờ auth store hydrate xong rồi mới quyết định "chưa đăng nhập": nếu không, SSR và lần
  // render đầu ở client đều thấy userId = null nên hiện "Vui lòng đăng nhập" rồi mới nháy
  // sang nội dung (hydration mismatch), đồng thời gọi API khi chưa có token (401 vô ích).
  const authReady = useSyncExternalStore(
    subscribeAuthHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
  const accessToken = useAuthStore((state) => state.accessToken);
  const [bids, setBids] = useState<MyActiveBidDto[]>([]);
  const [meta, setMeta] = useState<MyActiveBidsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  // "Phiên tôi đang theo dõi" — tách state riêng vì nạp lười khi mở tab.
  const [watched, setWatched] = useState<AuctionListItemDto[]>([]);
  const [watchCursor, setWatchCursor] = useState<string | null>(null);
  const [watchingLoaded, setWatchingLoaded] = useState(false);
  const [loadingWatches, setLoadingWatches] = useState(false);
  const [unwatchingId, setUnwatchingId] = useState<string | null>(null);

  const loadWatches = useCallback(async (cursor?: string) => {
    setLoadingWatches(true);
    setError(null);
    try {
      const res = await auctionService.getMyWatched(cursor, 12);
      setWatched((prev) => {
        if (!cursor) return res.items;
        const seen = new Set(prev.map((w) => w.auctionId));
        return [...prev, ...res.items.filter((w) => !seen.has(w.auctionId))];
      });
      setWatchCursor(res.nextCursor);
      setWatchingLoaded(true);
    } catch (err: unknown) {
      setError(auctionError(err) || 'Không tải được danh sách phiên đang theo dõi.');
    } finally {
      setLoadingWatches(false);
    }
  }, []);

  async function handleUnwatch(auctionId: string) {
    setUnwatchingId(auctionId);
    setError(null);
    try {
      await auctionService.watch(auctionId, false);
      setWatched((prev) => prev.filter((w) => w.auctionId !== auctionId));
    } catch (err: unknown) {
      setError(auctionError(err));
    } finally {
      setUnwatchingId(null);
    }
  }

  useEffect(() => {
    if (!authReady || !accessToken) return;
    if (activeTab !== 'watching' || watchingLoaded) return;
    void (async () => {
      await Promise.resolve();
      await loadWatches();
    })();
  }, [activeTab, watchingLoaded, authReady, accessToken, loadWatches]);

  async function loadDashboard(cursor?: string) {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await auctionService.getMyActiveBids(cursor, 12);
      if (cursor) {
        setBids((prev) => [...prev, ...res.items]);
      } else {
        setBids(res.items);
      }
      setMeta(res.meta);
    } catch (err: unknown) {
      setError(auctionError(err) || 'Không tải được danh sách phiên đấu giá.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!authReady || !accessToken) {
      setLoading(false);
      return;
    }

    void (async () => {
      await Promise.resolve();
      await loadDashboard();
    })();
    // Chỉ chạy lại khi trạng thái đăng nhập thực sự đổi.
     
  }, [authReady, accessToken]);

  if (!authReady) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải phiên đấu giá của bạn…</span>
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-4 h-8 w-1/2 max-w-sm" />
        <div className="mt-6 space-y-3">
          <div className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
          <div className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
          <div className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-on-surface">
        <Gavel size={44} className="mx-auto mb-3 text-brand-periwinkle" />
        <h1 className="font-h1 text-2xl font-bold">Quản lý phiên đấu giá cá nhân</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Vui lòng đăng nhập để xem các phiên bạn đang tham gia đấu giá.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <PageLoader label="Đang tải danh sách đấu giá cá nhân…" />
      </div>
    );
  }

  const filteredBids = bids.filter((b) => {
    if (activeTab === 'leading') return b.participationStatus === 'Leading';
    if (activeTab === 'outbid') return b.participationStatus === 'Outbid';
    return true;
  });

  const leadingCount = bids.filter((b) => b.participationStatus === 'Leading').length;
  const outbidCount = bids.filter((b) => b.participationStatus === 'Outbid').length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-on-surface">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-h1 text-2xl font-bold md:text-3xl">Phiên Đấu Giá Của Tôi</h1>
          <p className="mt-1 text-xs text-on-surface-variant"> Theo dõi các phiên đang tham gia, trạng thái cọc và đè giá theo thời gian thực </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <Link
            href="/my-auctions/deliveries"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-4 py-2 text-xs font-semibold text-[#8A6A1F] hover:bg-[#8A6A1F]/20"
            title="Vận đơn, ký quỹ và khiếu nại của các phiên có bản tranh vật lý"
          >
            <Truck size={14} /> Đơn giao tranh vật lý </Link>
          <Link
            href="/my-auctions/penalties"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2 text-xs font-semibold text-outline hover:text-[#241F1A]"
            title="Hồ sơ người mua báo cáo bạn và kết luận của Ban quản trị"
          >
            <ShieldAlert size={14} /> Tôi bị báo cáo </Link>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="inline-flex items-center gap-2 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2 text-xs font-semibold hover:bg-[#F0E7D8]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Cập nhật </button>
        </div>
      </div>

      {/* Người bán chỉ thấy thông báo trung tính: phiên đang được xem xét thêm, không có điểm/dấu hiệu */}
      <SellerRiskFlagsCard />

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-container rounded-3xl border border-[#8A6A1F]/30 bg-[#8A6A1F]/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8A6A1F]/20 text-[#8A6A1F]">
              <Lock size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Tổng tiền đang khóa cọc</span>
              <p className="font-mono text-xl font-bold text-[#8A6A1F]">
                {formatVnd(meta?.totalLockedAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-container rounded-3xl border border-[#2F6B63]/30 bg-[#2F6B63]/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#2F6B63]/20 text-[#2F6B63]">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Đang dẫn đầu</span>
              <p className="font-h1 text-xl font-bold text-[#2F6B63]">{leadingCount} phiên</p>
            </div>
          </div>
        </div>

        <div className="glass-container rounded-3xl border border-[#A8321C]/30 bg-[#A8321C]/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#A8321C]/20 text-[#A8321C]">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Bị đè giá</span>
              <p className="font-h1 text-xl font-bold text-[#A8321C]">{outbidCount} phiên</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Notice */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'all' ? 'bg-brand-periwinkle text-[#FFFCF6] shadow' : 'text-outline hover:text-[#241F1A]'
            }`}
          >
            Tất cả ({bids.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leading')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'leading' ? 'bg-[#2F6B63]/10 text-[#241F1A] shadow' : 'text-outline hover:text-[#241F1A]'
            }`}
          >
            Đang dẫn đầu ({leadingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outbid')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'outbid' ? 'bg-[#8A6A1F]/10 text-[#241F1A] shadow' : 'text-outline hover:text-[#241F1A]'
            }`}
          >
            Bị đè giá ({outbidCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watching')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
              activeTab === 'watching' ? 'bg-brand-periwinkle text-[#FFFCF6] shadow' : 'text-outline hover:text-[#241F1A]'
            }`}
          >
            <Bell size={12} /> Phiên tôi đang theo dõi ({watchingLoaded ? watched.length : '…'})
          </button>
        </div>

        <span className="hidden text-xs text-outline md:inline-flex md:items-center md:gap-1">
          <Sparkles size={13} className="text-brand-periwinkle" /> Cập nhật thời gian thực </span>
      </div>

      {activeTab === 'watching' ? (
        loadingWatches && !watchingLoaded ? (
          <PageLoader label="Đang tải phiên bạn đang theo dõi…" />
        ) : watched.length === 0 ? (
          <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-12 text-center text-outline">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Bạn chưa theo dõi phiên đấu giá nào.</p>
            <p className="mt-1 text-xs"> Bấm “Theo dõi” trong trang chi tiết phiên để nhận thông báo khi phiên sắp kết thúc. </p>
            <Link href="/auctions" className="mt-4 inline-flex items-center gap-2 text-xs text-brand-periwinkle hover:underline"> Khám phá các phiên đấu giá đang diễn ra <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {watched.map((item) => (
                <WatchedCard
                  key={item.auctionId}
                  item={item}
                  onUnwatch={handleUnwatch}
                  unwatching={unwatchingId === item.auctionId}
                />
              ))}
            </div>
            {watchCursor && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  disabled={loadingWatches}
                  onClick={() => void loadWatches(watchCursor)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
                >
                  {loadingWatches ? 'Đang tải...' : 'Tải thêm phiên đang theo dõi'}
                </button>
              </div>
            )}
          </>
        )
      ) : filteredBids.length === 0 ? (
        <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-12 text-center text-outline">
          <Gavel size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có phiên đấu giá nào trong mục này.</p>
          <Link href="/auctions" className="mt-4 inline-flex items-center gap-2 text-xs text-brand-periwinkle hover:underline"> Khám phá các phiên đấu giá đang diễn ra <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBids.map((b) => (
            <BiddingCard key={b.auctionId} bid={b} />
          ))}
        </div>
      )}

      {/* Pagination button */}
      {activeTab !== 'watching' && meta?.nextCursor && (
        <div className="mt-8 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => loadDashboard(meta.nextCursor ?? undefined)}
            className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Tải thêm phiên'}
          </button>
        </div>
      )}
    </div>
  );
}
