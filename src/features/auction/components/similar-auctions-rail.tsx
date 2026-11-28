'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { auctionRecommendationService } from '../services/auction-recommendation.service';
import type { RecommendedAuctionDto } from '../types/auction-recommendation.types';
import { AuctionCard } from './auction-card';

/**
 * "Phiên tương tự đang mở" on the auction detail page.
 *
 * Hides itself below two results: a single stranded card reads like a bug, and the detail page is
 * already dense with the bid panel.
 */
export function SimilarAuctionsRail({ auctionId }: { auctionId: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecommendedAuctionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const loggedRef = useRef<Set<string>>(new Set());
  const trackRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      setLoading(true);
      try {
        const data = await auctionRecommendationService.similar(auctionId, 6);
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
  }, [auctionId]);

  // CTR của rail "phiên tương tự" cũng phải đo được: log một lần cho mỗi card hiện ra.
  useEffect(() => {
    if (loading || items.length === 0) return;
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

        void auctionRecommendationService
          .logImpressions({
            items: seen.slice(0, 30).map((id) => ({ auctionId: id, rank: items.findIndex((i) => i.auction.auctionId === id) + 1 })),
            surface: 'detail-similar',
          })
          .catch(() => undefined);
      },
      { threshold: 0.5 },
    );

    track.querySelectorAll<HTMLElement>('[data-auction-id]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items, loading]);

  const logClick = useCallback(
    (auctionId: string) => {
      void auctionRecommendationService
        .logImpressions({
          items: [{ auctionId, rank: items.findIndex((i) => i.auction.auctionId === auctionId) + 1 }],
          surface: 'detail-similar',
          clicked: true,
        })
        .catch(() => undefined);
    },
    [items],
  );

  if (loading) {
    return (
      <section className="mt-6" aria-busy="true">
        <div className="rec-rail__track" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton h-[21rem] w-[min(78vw,260px)] shrink-0 rounded-[24px]" />
          ))}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {t('Đang tải phiên tương tự')}
        </span>
      </section>
    );
  }

  if (items.length < 2) return null;

  return (
    <section className="mt-6">
      <div className="section-head">
        <div>
          <p className="eyebrow">{t('Phiên tương tự đang mở')}</p>
        </div>
      </div>
      <ul className="rec-rail__track" ref={trackRef} aria-label={t('Phiên đấu giá tương tự')}>
        {items.map((item, index) => (
          <li key={item.auction.auctionId} data-auction-id={item.auction.auctionId} className="rec-rail__item" onClickCapture={() => logClick(item.auction.auctionId)}>
            <AuctionCard item={item.auction} index={index} reason={item.reason} animate={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
