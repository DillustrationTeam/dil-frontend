'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock, Eye, Gavel, Plus, RefreshCw, Search } from 'lucide-react';
import { auctionService } from '../services/auction.service';
import { auctionStatusLabels, type AuctionFilters, type AuctionListItemDto } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function getTimeRemaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return 'Đã kết thúc';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `Còn ${days} ngày`;
  }
  return `Còn ${hours}h ${mins}m`;
}

const statusBadgeColors: Record<string, string> = {
  Active: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
  Scheduled: 'border-sky-400/40 bg-sky-500/15 text-sky-300',
  Ended: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
  Settled: 'border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle',
  Cancelled: 'border-red-400/40 bg-red-500/15 text-red-300',
  Expired: 'border-white/20 bg-white/5 text-outline',
};

export function AuctionListScreen({ userId }: { userId: string | null }) {
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
      setError(err instanceof Error ? err.message : 'Không tải được danh sách phiên đấu giá.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Giữ loader trong ref: effect chỉ chạy lại theo bộ lọc, không phụ thuộc
  // identity của hàm (tránh react-hooks/exhaustive-deps).
  const loadAuctionsRef = useRef(loadAuctions);
  useEffect(() => {
    loadAuctionsRef.current = loadAuctions;
  });

  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      await loadAuctionsRef.current(true);
    })();
  }, [status, sort]);

  const filteredAuctions = keyword.trim()
    ? auctions.filter((a) => (a.artwork?.artworkTitle || '').toLowerCase().includes(keyword.trim().toLowerCase()))
    : auctions;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 text-on-surface">
      {/* Tiêu đề & Nút tạo */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-h1 text-2xl font-bold tracking-tight">Sàn đấu giá tác phẩm nghệ thuật</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Đấu giá trực tiếp các bức tranh kỹ thuật số độc bản có bản quyền xác thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mở phiên đấu giá cần đăng nhập — ẩn với khách. */}
          {userId && (
            <Link
              href="/auctions/create"
              className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-5 py-2.5 font-h1 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110"
            >
              <Plus size={16} /> Mở phiên đấu giá
            </Link>
          )}
          <button
            type="button"
            onClick={() => loadAuctions(true)}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-outline hover:text-white"
            title="Làm mới danh sách"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="glass-container mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 p-4">
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
                  ? 'bg-brand-periwinkle text-brand-navy'
                  : 'border border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {tab.label}
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
              placeholder="Tìm theo tên tranh..."
              className="rounded-full border border-white/10 bg-brand-navy/60 py-1.5 pl-8 pr-4 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-white/10 bg-brand-navy/80 px-3 py-1.5 text-xs text-on-surface focus:border-brand-periwinkle focus:outline-none"
          >
            <option value="ending_soon">Sắp kết thúc</option>
            <option value="price_desc">Giá cao nhất</option>
            <option value="price_asc">Giá thấp nhất</option>
            <option value="bids_desc">Nhiều lượt đặt giá</option>
            <option value="newest">Mới nhất</option>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-container h-80 animate-pulse rounded-3xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="glass-container rounded-3xl border border-white/10 p-16 text-center">
          <Gavel size={44} className="mx-auto mb-3 text-outline" />
          <h2 className="font-h1 text-lg font-bold text-on-surface">Không tìm thấy phiên đấu giá nào</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Hãy thử thay đổi bộ lọc trạng thái hoặc mở phiên đấu giá mới ngay hôm nay.
          </p>
          <Link
            href="/auctions/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-5 py-2 font-h1 text-xs font-bold text-brand-navy"
          >
            <Plus size={14} /> Mở phiên đấu giá mới
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAuctions.map((item) => {
            const statusText = auctionStatusLabels[item.auctionStatus] || item.auctionStatus;
            const statusColor = statusBadgeColors[item.auctionStatus] || 'border-white/10 bg-white/5 text-outline';
            const remaining = getTimeRemaining(item.endAt);

            return (
              <article
                key={item.auctionId}
                className="glass-container group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 transition duration-300 hover:border-brand-periwinkle/50"
              >
                <div>
                  {/* Khung ảnh tác phẩm */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                    {item.artwork?.thumbnailUrl || item.artwork?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.artwork.thumbnailUrl || item.artwork.imageUrl || ''}
                        alt={item.artwork.artworkTitle || 'Tranh đấu giá'}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-outline">
                        Chưa có ảnh xem trước
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${statusColor}`}>
                      {statusText}
                    </span>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-black/40 bg-black/60 px-2.5 py-0.5 text-[11px] text-white backdrop-blur-md">
                      <Clock size={12} className="text-brand-periwinkle" /> {remaining}
                    </span>
                  </div>

                  {/* Thông tin chi tiết */}
                  <div className="p-5">
                    <h3 className="line-clamp-1 font-h1 text-base font-bold text-on-surface group-hover:text-brand-periwinkle">
                      {item.artwork?.artworkTitle || 'Tác phẩm độc bản'}
                    </h3>
                    <p className="mt-1 text-xs text-outline">
                      Phong cách: {item.artwork?.style || 'Kỹ thuật số'}
                    </p>

                    <div className="mt-4 flex items-baseline justify-between border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[11px] text-outline">Giá hiện tại</span>
                        <p className="font-h1 text-lg font-bold text-brand-periwinkle">
                          {formatVnd(item.currentPrice)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-outline">
                        <span className="block font-medium text-on-surface-variant">{item.bidCount} lượt đặt</span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Eye size={11} /> {item.watchCount} quan tâm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/auctions/${item.auctionId}`}
                    className="block w-full rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 py-2.5 text-center font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy"
                  >
                    Xem chi tiết & Đặt giá
                  </Link>
                </div>
              </article>
            );
          })}
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
            {loadingMore ? 'Đang tải thêm...' : 'Tải thêm phiên đấu giá'}
          </button>
        </div>
      )}
    </div>
  );
}
