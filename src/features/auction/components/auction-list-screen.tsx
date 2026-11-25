'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Eye, Frame, Gavel, Plus, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionService, auctionError } from '../services/auction.service';
import { useAuctionClock } from '../hooks/use-auction-clock';
import { auctionStatusLabels, type AuctionFilters, type AuctionListItemDto } from '../types/auction.types';
import { Magnetic, Reveal, Words } from '@/components/motion';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

/** Ba trạng thái thị giác của một phiên: đang chạy, sắp mở, đã khép. */
function statusTone(status: string): string {
  if (status === 'Active') return 'acard__status--live';
  if (status === 'Scheduled') return 'acard__status--soon';
  return 'acard__status--ended';
}

function AuctionCard({ item, index }: { item: AuctionListItemDto; index: number }) {
  const { lang, t } = useLanguage();
  const isScheduled = item.auctionStatus === 'Scheduled';
  const isFinished = ['Settled', 'Ended', 'Cancelled', 'Expired', 'AwaitingPhysical', 'InTransit', 'Completed', 'Disputed'].includes(item.auctionStatus);
  const targetTime = isScheduled ? item.startAt : item.endAt;
  const clock = useAuctionClock({ endAt: targetTime });
  const hasEnded = isFinished || (!isScheduled && clock.isEnded);
  const displayStatus = (!isFinished && hasEnded && item.auctionStatus === 'Active') ? 'Ended' : item.auctionStatus;
  const statusText = t(hasEnded && item.auctionStatus === 'Active'
    ? 'Chờ chốt kết quả'
    : auctionStatusLabels[displayStatus] || displayStatus);
  const actionText = t(hasEnded || item.auctionStatus === 'Settled' ? 'Xem kết quả' : 'Xem phiên đấu giá');
  const isLive = displayStatus === 'Active' && !hasEnded;

  return (
    <Reveal delay={Math.min(index, 8) * 45}>
      <article className={`acard h-full ${isLive ? 'beam' : ''}`}>
        <div>
          {/* Khung ảnh tác phẩm */}
          <div className="acard__media">
            {item.artwork?.thumbnailUrl || item.artwork?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.artwork.thumbnailUrl || item.artwork.imageUrl || '/weblogo.png'}
                alt={item.artwork.artworkTitle || t('Tranh đấu giá')}
              />
            ) : (
              <div className="grid size-full place-items-center text-xs text-[#746A5F]">
                {t('Chưa có ảnh xem trước')}
              </div>
            )}
            <span className={`acard__status ${statusTone(displayStatus)}`}>{statusText}</span>
            {item.hasPhysicalCopy && (
              <span className="acard__physical">
                <Frame aria-hidden /> {t('Có bản vật lý')}
              </span>
            )}
            <span className="acard__clock">
              <Clock aria-hidden />
              {isFinished
                ? (item.auctionStatus === 'Settled' ? t('Đã chốt') : item.auctionStatus === 'Cancelled' ? t('Đã hủy') : t('Đã kết thúc'))
                : isScheduled
                  ? (clock.isEnded ? t('Đang mở...') : clock.formatted)
                  : (clock.isEnded ? t('Đã kết thúc') : clock.formatted)}
            </span>
          </div>

          {/* Thông tin chi tiết */}
          <div className="acard__body">
            <h3 className="acard__title">{item.artwork?.artworkTitle || t('Tác phẩm độc bản')}</h3>
            <p className="acard__sub">
              {item.artwork?.style || t('Kỹ thuật số')} · {t('Bản gốc được xác thực')}
            </p>

            <div className="acard__meta">
              <div>
                <span className="acard__label">{t('Giá hiện tại')}</span>
                <span className="acard__price">{formatVnd(item.currentPrice)}</span>
              </div>
              <div className="acard__counts">
                <span>
                  <Gavel aria-hidden />
                  {lang === 'VIE' ? `${item.bidCount} lượt trả giá` : `${item.bidCount} bid${item.bidCount === 1 ? '' : 's'}`}
                </span>
                <span>
                  <Eye aria-hidden />
                  {lang === 'VIE' ? `${item.watchCount} theo dõi` : `${item.watchCount} watcher${item.watchCount === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link href={`/auctions/${item.auctionId}`} className="acard__cta">
          {actionText} <ArrowUpRight aria-hidden />
        </Link>
      </article>
    </Reveal>
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
    <div className="wrap page">
      {/* Tiêu đề & Nút tạo */}
      <header className="page-head">
        <div>
          <p className="eyebrow">{t('Đấu giá tuyển chọn')}</p>
          <h1>
            <Words>{t('Đấu giá tác phẩm nghệ thuật')}</Words>
          </h1>
          <p className="page-head__sub">
            {t('Theo dõi phiên đấu giá, sở hữu tác phẩm độc bản.')}
          </p>
        </div>
        <div className="page-head__actions">
          {userId && (
            <Magnetic>
              <Link href="/auctions/create" className="btn btn--primary">
                <Plus size={17} aria-hidden /> {t('Đăng tác phẩm đấu giá')}
              </Link>
            </Magnetic>
          )}
          <button
            type="button"
            onClick={() => loadAuctions(true)}
            disabled={loading}
            className="icon-btn"
            title={t('Làm mới danh sách')}
            aria-label={t('Làm mới danh sách')}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Thanh bộ lọc */}
      <div className="filterbar">
        <div className="filterbar__tabs" role="tablist" aria-label={t('Trạng thái phiên đấu giá')}>
          {[
            { label: 'Đang diễn ra', value: 'Active' },
            { label: 'Sắp diễn ra', value: 'Scheduled' },
            { label: 'Đã hoàn tất', value: 'Settled' },
            { label: 'Tất cả trạng thái', value: '' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className="fpill"
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        <div className="filterbar__tools">
          <div className="input-wrap">
            <Search aria-hidden />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('Tìm theo tên tranh...')}
              aria-label={t('Tìm theo tên tranh')}
              className="input min-h-11 w-56 text-sm"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={t('Sắp xếp')}
            className="input"
          >
            <option value="ending_soon">{t('Sắp kết thúc')}</option>
            <option value="price_desc">{t('Giá cao nhất')}</option>
            <option value="price_asc">{t('Giá thấp nhất')}</option>
            {/* Không có option "Nhiều lượt đặt giá": backend chưa hỗ trợ sort theo bidCount,
                chọn xong thứ tự không đổi nên gây hiểu nhầm là bộ lọc hỏng. */}
            <option value="newest">{t('Mới nhất')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-[#A8321C]/30 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}

      {/* Grid danh sách */}
      {loading ? (
        <div className="auction-grid" aria-busy="true" aria-live="polite">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-[26rem]" />
          ))}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="empty">
          <Gavel size={44} className="empty__art" aria-hidden />
          <h2>{t('Không tìm thấy phiên đấu giá nào')}</h2>
          <p>{t('Hãy thử thay đổi bộ lọc trạng thái hoặc mở phiên đấu giá mới ngay hôm nay.')}</p>
          <div className="empty__actions">
            <Link href="/auctions/create" className="btn btn--primary btn--sm">
              <Plus size={14} aria-hidden /> {t('Mở phiên đấu giá mới')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="auction-grid">
          {filteredAuctions.map((item, index) => (
            <AuctionCard key={item.auctionId} item={item} index={index} />
          ))}
        </div>
      )}

      {/* Phân trang xem thêm */}
      {nextCursor && (
        <div className="loadmore">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              loadAuctions(false);
            }}
            className="btn btn--outline"
          >
            {t(loadingMore ? 'Đang tải thêm...' : 'Tải thêm phiên đấu giá')}
          </button>
        </div>
      )}
    </div>
  );
}
