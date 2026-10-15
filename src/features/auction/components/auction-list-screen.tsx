'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Eye, Gavel, Plus, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionService, auctionError } from '../services/auction.service';
import { useAuctionClock } from '../hooks/use-auction-clock';
import { auctionStatusLabels, type AuctionFilters, type AuctionListItemDto } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

const statusBadgeColors: Record<string, string> = {
  Active: 'border-emerald-300/30 bg-emerald-950/70 text-emerald-200',
  Scheduled: 'border-white/15 bg-brand-navy/75 text-on-surface',
  Ended: 'border-white/15 bg-brand-navy/75 text-on-surface-variant',
  Settled: 'border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle',
  Cancelled: 'border-red-400/40 bg-red-500/15 text-red-300',
  Expired: 'border-white/20 bg-white/5 text-outline',
};

function AuctionCard({ item }: { item: AuctionListItemDto }) {
  const { lang, t } = useLanguage();
  const isScheduled = item.auctionStatus === 'Scheduled';
  const targetTime = isScheduled ? item.startAt : item.endAt;
  const clock = useAuctionClock({ endAt: targetTime });
  const hasEnded = !isScheduled && clock.isEnded;
  const displayStatus = hasEnded && item.auctionStatus === 'Active' ? 'Ended' : item.auctionStatus;
  const statusText = t(hasEnded && item.auctionStatus === 'Active'
    ? 'Chờ chốt kết quả'
    : auctionStatusLabels[displayStatus] || displayStatus);
  const statusColor = statusBadgeColors[displayStatus] || 'border-white/10 bg-white/5 text-outline';
  const actionText = t(hasEnded || item.auctionStatus === 'Settled' ? 'Xem kết quả' : 'Xem phiên đấu giá');

  return (
    <article className="group flex min-h-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(6,8,18,0.28)] transition duration-300 hover:-translate-y-1 hover:border-brand-periwinkle/35 hover:bg-white/[0.055]">
      <div>
        {/* Khung ảnh tác phẩm */}
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-black/40">
          {item.artwork?.thumbnailUrl || item.artwork?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.artwork.thumbnailUrl || item.artwork.imageUrl || ''}
              alt={item.artwork.artworkTitle || t('Tranh đấu giá')}
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-outline">
              {t('Chưa có ảnh xem trước')}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#151827]/80 to-transparent" aria-hidden="true" />
          <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${statusColor}`}>
            {statusText}
          </span>
          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#11131d]/80 px-3 py-1.5 font-mono text-[11px] tabular-nums text-white backdrop-blur-md">
            <Clock size={12} className="text-brand-periwinkle" />
            {isScheduled 
              ? (clock.isEnded ? t('Đang mở...') : clock.formatted)
              : (clock.isEnded ? t('Đã kết thúc') : clock.formatted)}
          </span>
        </div>

        {/* Thông tin chi tiết */}
        <div className="p-6 pb-5">
          <h3 className="line-clamp-1 font-h1 text-lg font-semibold tracking-[-0.02em] text-on-surface transition-colors group-hover:text-brand-periwinkle">
            {item.artwork?.artworkTitle || t('Tác phẩm độc bản')}
          </h3>
          <p className="mt-1.5 text-xs text-outline">
            {item.artwork?.style || t('Kỹ thuật số')} · {t('Bản gốc được xác thực')}
          </p>

          <div className="mt-5 flex items-end justify-between border-t border-white/8 pt-4">
            <div>
              <span className="text-[11px] font-medium tracking-wide text-outline">{t('Giá hiện tại')}</span>
              <p className="mt-1 font-h1 text-xl font-semibold tabular-nums text-brand-periwinkle">
                {formatVnd(item.currentPrice)}
              </p>
            </div>
            <div className="space-y-1 text-right text-xs text-outline">
              <span className="block font-medium text-on-surface-variant">
                {lang === 'VIE' ? `${item.bidCount} lượt trả giá` : `${item.bidCount} bid${item.bidCount === 1 ? '' : 's'}`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Eye size={12} /> {lang === 'VIE' ? `${item.watchCount} người theo dõi` : `${item.watchCount} watcher${item.watchCount === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Link
          href={`/auctions/${item.auctionId}`}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-medium text-on-surface transition duration-200 hover:border-brand-periwinkle/40 hover:bg-brand-periwinkle hover:text-brand-navy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-periwinkle"
        >
          {actionText} <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export function AuctionListScreen({ userId }: { userId: string | null }) {
  const { t } = useLanguage();
  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>('Active');
  const [sort, setSort] = useState<string>('ending_soon');
  const [keyword, setKeyword] = useState<string>('');

  async function loadAuctions(reset = true) {
    if (reset) setLoading(true);
    setError(null);
    try {
      const filters: AuctionFilters = {
        status: status || undefined,
        sort: sort || undefined,
      };
      const res = await auctionService.list(filters, reset ? undefined : nextCursor ?? undefined);
      if (reset) {
        setAuctions(res.items);
      } else {
        setAuctions((prev) => [...prev, ...res.items]);
      }
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      setError(t(auctionError(err) || 'Không tải được danh sách phiên đấu giá.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const loadAuctionsRef = useRef(loadAuctions);
  useEffect(() => {
    loadAuctionsRef.current = loadAuctions;
  });

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadAuctionsRef.current(true);
    })();
  }, [status, sort]);

  const filteredAuctions = keyword.trim()
    ? auctions.filter((a) => (a.artwork?.artworkTitle || '').toLowerCase().includes(keyword.trim().toLowerCase()))
    : auctions;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 text-on-surface sm:px-6 lg:pt-14">
      {/* Tiêu đề & Nút tạo */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-periwinkle">{t('Đấu giá tuyển chọn')}</p>
          <h1 className="text-wrap-balance font-h1 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
            {t('Đấu giá tác phẩm nghệ thuật')}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {t('Theo dõi phiên đấu giá, sở hữu tác phẩm độc bản.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userId && (
            <Link
              href="/auctions/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-5 py-3 text-sm font-semibold text-brand-navy shadow-[0_12px_30px_rgba(167,172,217,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus size={17} /> {t('Đăng tác phẩm đấu giá')}
            </Link>
          )}
          <button
            type="button"
            onClick={() => loadAuctions(true)}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-outline transition hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-periwinkle"
            title={t('Làm mới danh sách')}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-y border-white/10 py-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: 'Đang diễn ra', value: 'Active' },
            { label: 'Sắp diễn ra', value: 'Scheduled' },
            { label: 'Đã hoàn tất', value: 'Settled' },
            { label: 'Tất cả trạng thái', value: '' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                status === tab.value
                  ? 'bg-brand-periwinkle text-brand-navy shadow-[0_6px_18px_rgba(167,172,217,0.14)]'
                  : 'text-on-surface-variant hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('Tìm theo tên tranh...')}
              className="w-56 rounded-xl border border-white/10 bg-white/[0.035] py-2 pl-9 pr-4 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none focus:ring-2 focus:ring-brand-periwinkle/20"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-white/10 bg-brand-navy/80 px-3 py-2 text-xs text-on-surface focus:border-brand-periwinkle focus:outline-none focus:ring-2 focus:ring-brand-periwinkle/20"
          >
            <option value="ending_soon">{t('Sắp kết thúc')}</option>
            <option value="price_desc">{t('Giá cao nhất')}</option>
            <option value="price_asc">{t('Giá thấp nhất')}</option>
            <option value="bids_desc">{t('Nhiều lượt đặt giá')}</option>
            <option value="newest">{t('Mới nhất')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Grid danh sách */}
      {loading ? (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[30rem] animate-pulse rounded-[1.75rem] border border-white/5 bg-white/[0.025]" />
          ))}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="glass-container rounded-3xl border border-white/10 p-16 text-center">
          <Gavel size={44} className="mx-auto mb-3 text-outline" />
          <h2 className="font-h1 text-lg font-bold text-on-surface">{t('Không tìm thấy phiên đấu giá nào')}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t('Hãy thử thay đổi bộ lọc trạng thái hoặc mở phiên đấu giá mới ngay hôm nay.')}
          </p>
          <Link
            href="/auctions/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-5 py-2 font-h1 text-xs font-bold text-brand-navy"
          >
            <Plus size={14} /> {t('Mở phiên đấu giá mới')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAuctions.map((item) => (
            <AuctionCard key={item.auctionId} item={item} />
          ))}
        </div>
      )}

      {/* Phân trang xem thêm */}
      {nextCursor && (
        <div className="mt-10 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              loadAuctions(false);
            }}
            className="rounded-full border border-white/15 px-6 py-2.5 font-h1 text-xs font-bold text-on-surface hover:bg-white/10 disabled:opacity-50"
          >
            {t(loadingMore ? 'Đang tải thêm...' : 'Tải thêm phiên đấu giá')}
          </button>
        </div>
      )}
    </div>
  );
}
