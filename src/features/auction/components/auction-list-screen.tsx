'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Gavel, Plus, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionService, auctionError } from '../services/auction.service';
import type { AuctionFilters, AuctionListItemDto } from '../types/auction.types';
import { Magnetic, Words } from '@/components/motion';
import { AuctionCard } from './auction-card';
import { RecommendationRail } from './recommendation-rail';

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

  // Shelf ids come from the recommendation rail. The grid hides exactly those, so one auction never
  // appears twice on the page. The rail also caps itself (`maxShelf`) to leave at least 2 for the grid.
  const [shelfIds, setShelfIds] = useState<string[]>([]);
  const gridItems = shelfIds.length
    ? filteredAuctions.filter((item) => !shelfIds.includes(item.auctionId))
    : filteredAuctions;

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

      {/* Thanh công cụ: trạng thái + tìm kiếm + sắp xếp trên CÙNG một hàng, dính dưới header */}
      <div className="auc-tools">
        <div className="auc-seg" role="tablist" aria-label={t('Trạng thái phiên đấu giá')}>
          {[
            { label: 'Đang diễn ra', value: 'Active' },
            { label: 'Sắp diễn ra', value: 'Scheduled' },
            { label: 'Đã hoàn tất', value: 'Settled' },
            { label: 'Tất cả', value: '' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className="auc-seg__item"
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        <div className="auc-tools__right">
          <label className="auc-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('Tìm theo tên tranh')}
              aria-label={t('Tìm theo tên tranh')}
            />
          </label>

          <label className="auc-sort">
            <span className="sr-only">{t('Sắp xếp')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('Sắp xếp')}>
              <option value="ending_soon">{t('Sắp kết thúc')}</option>
              <option value="price_desc">{t('Giá cao nhất')}</option>
              <option value="price_asc">{t('Giá thấp nhất')}</option>
              {/* Không có option "Nhiều lượt đặt giá": backend chưa hỗ trợ sort theo bidCount,
                  chọn xong thứ tự không đổi nên gây hiểu nhầm là bộ lọc hỏng. */}
              <option value="newest">{t('Mới nhất')}</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div role="alert" className="auc-alert">
          {error}
        </div>
      )}

      {/* Kệ gợi ý: kệ giữ các phiên của mình, lưới bên dưới bỏ qua đúng những phiên đó.
          maxShelf giữ lại tối thiểu 2 phiên cho lưới để trang không bị "kệ nuốt hết". */}
      <RecommendationRail
        userId={userId}
        statusFilter={status}
        onVisibleChange={setShelfIds}
        maxShelf={Math.max(0, Math.min(3, filteredAuctions.length - 2))}
      />

      <div className="auc-markethead">
        <h2 className="auc-markethead__title">
          {status === 'Scheduled'
            ? t('Sắp mở')
            : status === 'Settled'
              ? t('Đã hoàn tất')
              : status === ''
                ? t('Tất cả phiên')
                : t('Đang diễn ra')}
        </h2>
        <p className="auc-markethead__meta">
          {loading ? t('Đang tải…') : `${gridItems.length} ${t('phiên')}`}
        </p>
      </div>

      {/* Lưới chợ */}
      {loading ? (
        <div className="auction-grid" aria-busy="true" aria-live="polite">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-[27rem] rounded-[24px]" />
          ))}
        </div>
      ) : gridItems.length === 0 ? (
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
          {gridItems.map((item, index) => (
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
