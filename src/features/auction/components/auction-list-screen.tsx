'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Eye, Frame, Gavel, Plus, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionService, auctionError } from '../services/auction.service';
import { useAuctionClock } from '../hooks/use-auction-clock';
import { auctionStatusLabels, type AuctionFilters, type AuctionListItemDto } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

const statusLabelsByLang: Record<string, { VIE: string; ENG: string }> = {
  Active: { VIE: 'Đang diễn ra', ENG: 'Live' },
  Scheduled: { VIE: 'Sắp diễn ra', ENG: 'Upcoming' },
  Ended: { VIE: 'Đã kết thúc', ENG: 'Ended' },
  Settled: { VIE: 'Đã chốt (File số)', ENG: 'Settled (Digital file)' },
  Cancelled: { VIE: 'Đã hủy', ENG: 'Cancelled' },
  Expired: { VIE: 'Hết hạn thanh toán', ENG: 'Payment expired' },
  AwaitingPhysical: { VIE: 'Chờ xác nhận tranh vật lý', ENG: 'Awaiting physical copy' },
  InTransit: { VIE: 'Đang giao tranh vật lý', ENG: 'Shipping physical copy' },
  Completed: { VIE: 'Hoàn tất giao dịch', ENG: 'Completed' },
  Disputed: { VIE: 'Đang khiếu nại', ENG: 'Disputed' },
};

function AuctionCard({ item }: { item: AuctionListItemDto }) {
  const { lang, t } = useLanguage();
  const isVie = lang === 'VIE';
  const isScheduled = item.auctionStatus === 'Scheduled';
  const isFinished = ['Settled', 'Ended', 'Cancelled', 'Expired', 'AwaitingPhysical', 'InTransit', 'Completed', 'Disputed'].includes(item.auctionStatus);
  const targetTime = isScheduled ? item.startAt : item.endAt;
  const clock = useAuctionClock({ endAt: targetTime });
  const hasEnded = isFinished || (!isScheduled && clock.isEnded);
  const displayStatus = (!isFinished && hasEnded && item.auctionStatus === 'Active') ? 'Ended' : item.auctionStatus;
  
  const statusConfig = statusLabelsByLang[displayStatus];
  const statusText = hasEnded && item.auctionStatus === 'Active'
    ? (isVie ? 'Chờ chốt kết quả' : 'Awaiting results')
    : statusConfig
      ? (isVie ? statusConfig.VIE : statusConfig.ENG)
      : (auctionStatusLabels[displayStatus] || displayStatus);

  const actionText = hasEnded || item.auctionStatus === 'Settled'
    ? (isVie ? 'Xem kết quả' : 'View result')
    : (isVie ? 'Xem phiên đấu giá' : 'View auction');

  return (
    <article className="group flex min-h-full flex-col justify-between overflow-hidden rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hair-2)] hover:shadow-xl">
      <div>
        {/* Khung ảnh tác phẩm */}
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-[var(--ink-3)]">
          {item.artwork?.thumbnailUrl || item.artwork?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.artwork.thumbnailUrl || item.artwork.imageUrl || '/weblogo.png'}
              alt={item.artwork.artworkTitle || t('Tranh đấu giá')}
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-[var(--ash)]">
              {t('Chưa có ảnh xem trước')}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--ink-2)]/90 to-transparent" aria-hidden="true" />

          {/* Tags in top-right corner: status tag on top, physical copy tag underneath */}
          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
            <span className="rounded-full border border-[var(--hair)] bg-[var(--ink-2)]/90 px-3 py-1 font-[family-name:var(--font-ui)] text-[11px] font-semibold text-[var(--lumen)] shadow-sm backdrop-blur-md">
              {statusText}
            </span>
            {item.hasPhysicalCopy && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--ink-2)]/90 px-2.5 py-1 font-[family-name:var(--font-ui)] text-[11px] font-bold text-[var(--gold)] shadow-md backdrop-blur-md">
                <Frame size={13} className="shrink-0 text-[var(--gold)]" aria-hidden />
                <span>{isVie ? 'Bản vật lý' : 'Physical copy'}</span>
              </span>
            )}
          </div>

          {/* Clock pill matching dillustration-redesign.html .bid-card__clock / .acard__clock using Karla font */}
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)]/95 px-2.5 py-1 font-[family-name:var(--font-ui)] text-[11px] font-medium tabular-nums text-[var(--ivory)] backdrop-blur-md shadow-md">
            <Clock size={12} className="text-[var(--ash)]" />
            <span>
              {isFinished
                ? (item.auctionStatus === 'Settled'
                    ? (isVie ? 'Đã chốt' : 'Settled')
                    : item.auctionStatus === 'Cancelled'
                      ? (isVie ? 'Đã hủy' : 'Cancelled')
                      : (isVie ? 'Đã kết thúc' : 'Ended'))
                : isScheduled 
                  ? (clock.isEnded ? (isVie ? 'Đang mở...' : 'Opening...') : clock.formatted)
                  : (clock.isEnded ? (isVie ? 'Đã kết thúc' : 'Ended') : clock.formatted)}
            </span>
          </span>
        </div>

        {/* Thông tin chi tiết */}
        <div className="p-6 pb-5">
          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ivory)] transition-colors group-hover:text-[var(--lumen)]">
            {item.artwork?.artworkTitle || t('Tác phẩm độc bản')}
          </h3>
          <p className="mt-1 text-xs text-[var(--ash)]">
            {item.artwork?.style || t('Kỹ thuật số')} · {t('Bản gốc được xác thực')}
          </p>

          <div className="mt-5 flex items-end justify-between border-t border-[var(--hair)] pt-4">
            <div>
              <span className="text-[11px] font-medium tracking-wide text-[var(--ash)]">{t('Giá hiện tại')}</span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-medium tabular-nums text-[var(--lumen)]">
                {formatVnd(item.currentPrice)}
              </p>
            </div>
            <div className="space-y-1 text-right text-xs text-[var(--ash)]">
              <span className="block font-medium text-[var(--ivory)]">
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
          className="flex w-full items-center justify-between rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-4 py-3 text-sm font-semibold text-[var(--ivory)] transition-all duration-200 hover:border-[var(--lumen)] hover:bg-[var(--lumen)] hover:text-white active:scale-[0.98]"
        >
          <span>{actionText}</span> <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export function AuctionListScreen({ userId }: { userId: string | null }) {
  const { t, lang } = useLanguage();
  const isVie = lang === 'VIE';
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
    <main className="min-h-screen bg-[var(--ink)] px-4 pb-20 pt-8 text-[var(--ivory)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Tiêu đề & Nút tạo */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{isVie ? 'Đấu giá tuyển chọn' : 'Curated auctions'}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--ivory)] sm:text-4xl">
              {isVie ? 'Đấu giá tác phẩm nghệ thuật' : 'Bid on original artwork'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
              {isVie
                ? 'Theo dõi phiên đấu giá, sở hữu tác phẩm độc bản. Minh bạch và bảo chứng trên Dillustration.'
                : 'Follow auction sessions and collect one-of-a-kind originals with verified authenticity.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {userId && (
              <Link
                href="/auctions/create"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--lumen)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--lumen-hi)]"
              >
                <Plus size={16} className="text-white" />
                <span className="text-white">{isVie ? 'Đăng tác phẩm đấu giá' : 'Post auction'}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => loadAuctions(true)}
              disabled={loading}
              className="flex size-10 items-center justify-center rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--ink-3)] active:scale-95 disabled:opacity-50"
              title={isVie ? 'Làm mới danh sách' : 'Refresh auctions'}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Thanh bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[var(--hair)] py-4">
          <div className="flex flex-wrap gap-2 text-xs" role="tablist" aria-label="Auction state filter">
            {[
              { label: isVie ? 'Đang diễn ra' : 'Live', value: 'Active' },
              { label: isVie ? 'Sắp diễn ra' : 'Scheduled', value: 'Scheduled' },
              { label: isVie ? 'Đã hoàn tất' : 'Settled', value: 'Settled' },
              { label: isVie ? 'Tất cả trạng thái' : 'All states', value: '' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  status === tab.value
                    ? 'border border-[var(--ivory)] bg-[var(--ivory)] text-[var(--ink)] shadow-sm'
                    : 'border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ash)] hover:border-[var(--hair-2)] hover:text-[var(--ivory)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lumen)]" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={isVie ? 'Tìm theo tên tranh...' : 'Search by title...'}
                className="w-56 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] py-2 pl-9 pr-4 text-xs text-[var(--ivory)] placeholder:text-[var(--ash)] focus:border-[var(--lumen)] focus:outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-2 text-xs font-medium text-[var(--ivory)] focus:border-[var(--lumen)] focus:outline-none"
            >
              <option value="ending_soon" className="bg-[var(--ink-2)] text-[var(--ivory)]">{isVie ? 'Sắp kết thúc' : 'Ending soon'}</option>
              <option value="price_desc" className="bg-[var(--ink-2)] text-[var(--ivory)]">{isVie ? 'Giá cao nhất' : 'Highest price'}</option>
              <option value="price_asc" className="bg-[var(--ink-2)] text-[var(--ivory)]">{isVie ? 'Giá thấp nhất' : 'Lowest price'}</option>
              <option value="newest" className="bg-[var(--ink-2)] text-[var(--ivory)]">{isVie ? 'Mới nhất' : 'Newest'}</option>
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Grid danh sách */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)]" />
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--hair-2)] bg-[var(--ink-2)]/50 p-16 text-center space-y-3">
            <Gavel size={44} className="mx-auto text-[var(--lumen)] opacity-80" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ivory)]">
              {isVie ? 'Không tìm thấy phiên đấu giá nào' : 'No auction sessions found'}
            </h2>
            <p className="text-xs text-[var(--ash)]">
              {isVie
                ? 'Hãy thử thay đổi bộ lọc trạng thái hoặc mở phiên đấu giá mới ngay hôm nay.'
                : 'Try changing the status filter or create a new auction session.'}
            </p>
            {userId && (
              <Link
                href="/auctions/create"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--lumen)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--lumen-hi)]"
              >
                <Plus size={14} className="text-white" />
                <span className="text-white">{isVie ? 'Mở phiên đấu giá mới' : 'Open a new session'}</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] px-6 py-2.5 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:text-[var(--lumen)] disabled:opacity-50"
            >
              {loadingMore
                ? (isVie ? 'Đang tải thêm...' : 'Loading more...')
                : (isVie ? 'Tải thêm phiên đấu giá' : 'Load more auctions')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
