'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gavel,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { auctionService } from '../services/auction.service';
import { useAuctionClock } from '../hooks/use-auction-clock';
import type { MyActiveBidDto, MyActiveBidsMeta } from '../types/auction.types';
import { PageLoader } from '@/features/navigation';
import { useAuthStore } from '@/store/use-auth-store';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function BiddingCard({ bid }: { bid: MyActiveBidDto }) {
  const clock = useAuctionClock({ endAt: bid.endAt });
  const isLeading = bid.participationStatus === 'Leading';

  return (
    <div
      className={`glass-container flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
        isLeading ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
              isLeading
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
            }`}
          >
            {isLeading ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {isLeading ? 'Đang dẫn đầu' : 'Bị đè giá!'}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-amber-300">
            <Clock size={12} /> {clock.isEnded ? 'Đã kết thúc' : clock.formatted}
          </span>
        </div>

        <h3 className="font-h1 text-lg font-bold text-on-surface line-clamp-1">{bid.artworkTitle}</h3>
        <p className="mt-1 text-xs text-outline">Mã phiên: #{bid.auctionId.slice(0, 8).toUpperCase()}</p>

        <div className="my-4 space-y-2 rounded-2xl border border-white/5 bg-black/20 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-outline">Giá hiện tại:</span>
            <span className="font-mono font-bold text-brand-periwinkle">{formatVnd(bid.currentPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline">Tiền cọc đang giữ:</span>
            <span className="font-mono font-semibold text-amber-400">{formatVnd(bid.lockedAmount)}</span>
          </div>
          {!isLeading && (
            <div className="flex items-center justify-between text-amber-300 border-t border-white/5 pt-1.5">
              <span>Mức đặt tối thiểu tiếp theo:</span>
              <span className="font-mono font-bold">{formatVnd(bid.minimumNextBid)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-outline">
          Đặt lúc: {new Date(bid.lastBidAt).toLocaleTimeString('vi-VN')}
        </span>
        <Link
          href={`/auctions/${bid.auctionId}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-h1 text-xs font-bold transition ${
            isLeading
              ? 'border border-brand-periwinkle/30 bg-brand-periwinkle/10 text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy'
              : 'bg-amber-400 text-brand-navy hover:brightness-110 shadow-md'
          }`}
        >
          {isLeading ? 'Xem phiên' : 'Nâng giá ngay'} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export function BiddingDashboardScreen() {
  const userId = useAuthStore((state) => state.user?.id);
  const [bids, setBids] = useState<MyActiveBidDto[]>([]);
  const [meta, setMeta] = useState<MyActiveBidsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'leading' | 'outbid'>('all');

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
      setError(err instanceof Error ? err.message : 'Không tải được danh sách phiên đấu giá.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadDashboard();
    })();
  }, []);

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
          <p className="mt-1 text-xs text-on-surface-variant">
            Theo dõi các phiên đang tham gia, trạng thái cọc và đè giá theo thời gian thực
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Cập nhật
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-container rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Lock size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Tổng tiền đang khóa cọc</span>
              <p className="font-mono text-xl font-bold text-amber-300">
                {formatVnd(meta?.totalLockedAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-container rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Đang dẫn đầu</span>
              <p className="font-h1 text-xl font-bold text-emerald-400">{leadingCount} phiên</p>
            </div>
          </div>
        </div>

        <div className="glass-container rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-xs text-outline">Bị đè giá</span>
              <p className="font-h1 text-xl font-bold text-rose-400">{outbidCount} phiên</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Notice */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'all' ? 'bg-brand-periwinkle text-brand-navy shadow' : 'text-outline hover:text-white'
            }`}
          >
            Tất cả ({bids.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leading')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'leading' ? 'bg-emerald-400 text-brand-navy shadow' : 'text-outline hover:text-white'
            }`}
          >
            Đang dẫn đầu ({leadingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outbid')}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === 'outbid' ? 'bg-amber-400 text-brand-navy shadow' : 'text-outline hover:text-white'
            }`}
          >
            Bị đè giá ({outbidCount})
          </button>
        </div>

        <span className="hidden text-xs text-outline md:inline-flex md:items-center md:gap-1">
          <Sparkles size={13} className="text-brand-periwinkle" /> Cập nhật thời gian thực
        </span>
      </div>

      {filteredBids.length === 0 ? (
        <div className="glass-container rounded-3xl border border-white/10 p-12 text-center text-outline">
          <Gavel size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có phiên đấu giá nào trong mục này.</p>
          <Link href="/auctions" className="mt-4 inline-flex items-center gap-2 text-xs text-brand-periwinkle hover:underline">
            Khám phá các phiên đấu giá đang diễn ra <ArrowRight size={14} />
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
      {meta?.nextCursor && (
        <div className="mt-8 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => loadDashboard(meta.nextCursor ?? undefined)}
            className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Tải thêm phiên'}
          </button>
        </div>
      )}
    </div>
  );
}
