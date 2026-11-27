'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionRecommendationService } from '../services/auction-recommendation.service';
import type { RecommendedAuctionDto } from '../types/auction-recommendation.types';
import { AuctionCard } from './auction-card';

const COLLAPSE_KEY = 'dil.rec.collapsed';
const MIN_ITEMS = 2;
// A shelf longer than this stops being a curation and becomes a second grid.
const MAX_SHELF = 3;

/**
 * "Dành cho bạn" — a curated shelf above the market grid.
 *
 * Redesign decisions:
 *   - the shelf sits on its own paper band with a title instead of an eyebrow, so the rail reads as
 *     an editorial pick rather than a second, identical grid;
 *   - the shelf owns its picks: it reports them upward (`onVisibleChange`) and the market grid skips
 *     them, so the same auction can never appear twice on one screen;
 *   - if fewer than two unique cards remain, the shelf disappears rather than repeating the grid.
 */
export function RecommendationRail({
  userId,
  statusFilter,
  onVisibleChange,
  maxShelf = MAX_SHELF,
}: {
  userId: string | null;
  statusFilter?: string;
  /** Reports the auctions the shelf is showing, so the market grid can skip them. */
  onVisibleChange?: (auctionIds: string[]) => void;
  /** How many picks the caller can spare without starving the grid (default 3). */
  maxShelf?: number;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecommendedAuctionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const loggedRef = useRef<Set<string>>(new Set());
  const trackRef = useRef<HTMLUListElement | null>(null);

  const visible = items.slice(0, Math.max(0, maxShelf));
  const isPersonalised = Boolean(userId) && visible.some((item) => item.signals.length > 0);
  const hiddenByFilter = Boolean(statusFilter && statusFilter !== '' && statusFilter !== 'Active');

  // The shelf owns its picks; the grid below must not repeat them.
  const visibleKey = visible.map((item) => item.auction.auctionId).join(',');
  useEffect(() => {
    const ids = collapsed ? [] : visibleKey.split(',').filter(Boolean);
    onVisibleChange?.(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey, collapsed]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Private mode / storage disabled: keep the shelf open.
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      setLoading(true);
      try {
        const data = await auctionRecommendationService.recommended(12);
        if (!ignore) setItems(data);
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userId]);

  // Impression logging: one batch per render, only for cards that were actually seen, carrying the
  // score + rank the card was rendered with.
  useEffect(() => {
    if (loading || visible.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => (entry.target as HTMLElement).dataset.auctionId)
          .filter((id): id is string => Boolean(id))
          .filter((id) => !loggedRef.current.has(id));

        if (seen.length === 0) return;
        seen.forEach((id) => loggedRef.current.add(id));

        const items = seen.slice(0, 30).map((id) => {
          const index = visible.findIndex((item) => item.auction.auctionId === id);
          return { auctionId: id, score: visible[index]?.score, rank: index + 1 };
        });

        void auctionRecommendationService
          .logImpressions({ items, surface: 'auction-list' })
          .catch(() => undefined);
      },
      { threshold: 0.5 },
    );

    track.querySelectorAll<HTMLElement>('[data-auction-id]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading, visibleKey]);

  /** A click on a shelf card is the strongest CTR signal: record it before the navigation. */
  const logClick = useCallback(
    (auctionId: string) => {
      const index = visible.findIndex((item) => item.auction.auctionId === auctionId);
      void auctionRecommendationService
        .logImpressions({
          items: [{ auctionId, score: visible[index]?.score, rank: index + 1 }],
          surface: 'auction-list',
          clicked: true,
        })
        .catch(() => undefined);
    },
    [visible],
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Ignore storage failures; the toggle still works for this session.
      }
      return next;
    });
  }, []);

  if (hiddenByFilter) return null;

  if (loading) {
    return (
      <section className="auc-shelf" aria-busy="true">
        <div className="auc-shelf__head">
          <h2 className="auc-shelf__title">{t('Dành cho bạn')}</h2>
        </div>
        <div className="rec-rail__track" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton rec-rail__item h-[22rem]" />
          ))}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {t('Đang tải gợi ý đấu giá')}
        </span>
      </section>
    );
  }

  if (visible.length < MIN_ITEMS) return null;

  return (
    <section className="auc-shelf" aria-label={t('Phiên đấu giá gợi ý cho bạn')}>
      <div className="auc-shelf__head">
        <div className="auc-shelf__titles">
          <h2 className="auc-shelf__title">
            <Sparkles size={16} aria-hidden />
            {isPersonalised ? t('Dành cho bạn') : t('Đang được chú ý')}
          </h2>
          {/* Subtitle chỉ nói điều dữ liệu chứng minh được: khi chưa cá nhân hoá, kệ xếp theo thời
              gian kết thúc + lượt theo dõi, không được hứa "nhiều người theo dõi nhất". */}
          <p className="auc-shelf__meta">
            {isPersonalised
              ? t('Chọn theo phong cách và creator bạn từng quan tâm')
              : t('Sắp kết thúc, xếp theo lượt theo dõi')}
          </p>
        </div>
        <button type="button" onClick={toggleCollapsed} className="btn btn--ghost btn--sm">
          {collapsed ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />}
          {t(collapsed ? 'Hiện gợi ý' : 'Ẩn gợi ý')}
        </button>
      </div>

      {!collapsed && (
        <ul className={`rec-rail__track${visible.length <= 4 ? ' rec-rail__track--fill' : ''}`} ref={trackRef}>
          {visible.map((item, index) => (
            <li
              key={item.auction.auctionId}
              data-auction-id={item.auction.auctionId}
              className="rec-rail__item"
              onClickCapture={() => logClick(item.auction.auctionId)}
            >
              {/* A cold-start reason ("Đang được chú ý") says nothing about the card itself - only
                  render a reason that is actually backed by a matching signal. */}
              <AuctionCard
                item={item.auction}
                index={index}
                reason={item.signals.some((signal) => signal !== 'risk-downranked') ? item.reason : undefined}
                animate={false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
