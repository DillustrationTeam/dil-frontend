'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionRiskService } from '../services/auction-risk.service';
import type { MyAuctionRiskFlagDto } from '../types/auction-risk.types';

function formatDate(iso: string) {
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

/**
 * Neutral notice for a seller whose auction is under extra review.
 *
 * Deliberately quiet: no score, no signal names, no accusation - just "this session is being looked
 * at, you do not need to do anything". Hidden entirely when the seller has no flagged auction, so it
 * never becomes a permanent piece of furniture on the dashboard.
 */
export function SellerRiskFlagsCard() {
  const { t } = useLanguage();
  const [flags, setFlags] = useState<MyAuctionRiskFlagDto[]>([]);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      try {
        const data = await auctionRiskService.myFlags();
        if (!ignore) setFlags(data);
      } catch {
        // 401/403/5xx: the card is an extra, the dashboard keeps working without it.
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  if (flags.length === 0) return null;

  return (
    <section className="seller-flag" aria-label={t('Phiên đang được xem xét')}>
      <div className="seller-flag__head">
        <Eye size={16} aria-hidden />
        <h2 className="seller-flag__title">
          {flags.length === 1
            ? t('1 phiên của bạn đang được xem xét thêm')
            : t(`${flags.length} phiên của bạn đang được xem xét thêm`)}
        </h2>
      </div>
      <p className="seller-flag__body">
        {t('Bộ phận kiểm duyệt đang xem lại các phiên dưới đây. Bạn không cần làm gì lúc này; phiên vẫn chạy bình thường.')}
      </p>
      <ul className="seller-flag__list">
        {flags.map((flag) => (
          <li key={flag.auctionId}>
            <Link href={`/auctions/${flag.auctionId}`} className="seller-flag__link">
              <span className="seller-flag__name">{flag.auctionTitle}</span>
              <span className="seller-flag__meta">
                {flag.status} · {formatDate(flag.detectedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
