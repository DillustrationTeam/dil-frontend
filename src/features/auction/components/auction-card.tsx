'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock, Eye, Frame, Gavel, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Reveal } from '@/components/motion';
import { useAuctionClock } from '../hooks/use-auction-clock';
import { auctionStatusLabels, type AuctionListItemDto } from '../types/auction.types';

/**
 * The auction card, shared by the market grid, the "for you" shelf and the similar rail.
 *
 * Structure notes (redesign):
 *   - the whole card is one link (`__hit`) instead of a bordered CTA box: a card that already has a
 *     border and a shadow must not draw a second frame around its own button;
 *   - price and counters sit on one baseline each, both `nowrap` - long VND amounts used to wrap and
 *     break the row rhythm;
 *   - counters are numbers with icons, not sentences, so language switching cannot produce
 *     "1 watchers".
 */
export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

/** Ba trạng thái thị giác của một phiên: đang chạy, sắp mở, đã khép. */
function statusTone(status: string): string {
  if (status === 'Active') return 'acard__status--live';
  if (status === 'Scheduled') return 'acard__status--soon';
  return 'acard__status--ended';
}

export function AuctionCard({
  item,
  index = 0,
  reason,
  animate = true,
}: {
  item: AuctionListItemDto;
  index?: number;
  reason?: string;
  animate?: boolean;
}) {
  const { t } = useLanguage();
  const isScheduled = item.auctionStatus === 'Scheduled';
  const isFinished = [
    'Settled',
    'Ended',
    'Cancelled',
    'Expired',
    'AwaitingPhysical',
    'InTransit',
    'Completed',
    'Disputed',
  ].includes(item.auctionStatus);
  const targetTime = isScheduled ? item.startAt : item.endAt;
  const clock = useAuctionClock({ endAt: targetTime });
  const hasEnded = isFinished || (!isScheduled && clock.isEnded);
  const displayStatus = !isFinished && hasEnded && item.auctionStatus === 'Active' ? 'Ended' : item.auctionStatus;
  const statusText = t(
    hasEnded && item.auctionStatus === 'Active'
      ? 'Chờ chốt kết quả'
      : auctionStatusLabels[displayStatus] || displayStatus,
  );
  const title = item.artwork?.artworkTitle || t('Tác phẩm độc bản');
  const actionText = t(hasEnded || item.auctionStatus === 'Settled' ? 'Xem kết quả' : 'Xem phiên');
  const isLive = displayStatus === 'Active' && !hasEnded;

  const clockText = isFinished
    ? item.auctionStatus === 'Settled'
      ? t('Đã chốt')
      : item.auctionStatus === 'Cancelled'
        ? t('Đã hủy')
        : t('Đã kết thúc')
    : isScheduled
      ? clock.isEnded
        ? t('Đang mở...')
        : clock.formatted
      : clock.isEnded
        ? t('Đã kết thúc')
        : clock.formatted;

  const card = (
    <article className={`acard${isLive ? ' acard--live' : ''}`}>
      <Link
        href={`/auctions/${item.auctionId}`}
        className="acard__hit"
        aria-label={`${title} — ${formatVnd(item.currentPrice)} — ${statusText}`}
      />

      <div className="acard__media">
        {item.artwork?.thumbnailUrl || item.artwork?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.artwork.thumbnailUrl || item.artwork.imageUrl || '/weblogo.png'}
            alt=""
            loading={index < 4 ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="acard__placeholder">{t('Chưa có ảnh xem trước')}</div>
        )}

        <span className={`acard__status ${statusTone(displayStatus)}`}>{statusText}</span>
        {item.hasPhysicalCopy && (
          <span className="acard__physical">
            <Frame aria-hidden /> {t('Bản vật lý')}
          </span>
        )}
        <span className="acard__clock">
          <Clock aria-hidden />
          {clockText}
        </span>
      </div>

      <div className="acard__body">
        <h3 className="acard__title" title={title}>
          {title}
        </h3>
        <p className="acard__sub">
          {item.artwork?.style || t('Kỹ thuật số')} · {t('Bản gốc được xác thực')}
        </p>

        {reason && (
          <p className="acard__why" title={reason}>
            <Sparkles size={12} aria-hidden />
            <span>{t(reason)}</span>
          </p>
        )}

        <div className="acard__meta">
          <div>
            <span className="acard__label">{t('Giá hiện tại')}</span>
            <span className="acard__price">{formatVnd(item.currentPrice)}</span>
          </div>
          <p className="acard__counts" title={t('Lượt đặt giá · Người theo dõi')}>
            <span>
              <Gavel aria-hidden />
              {item.bidCount}
            </span>
            <span aria-hidden className="acard__sep">
              ·
            </span>
            <span>
              <Eye aria-hidden />
              {item.watchCount}
            </span>
          </p>
        </div>
      </div>

      <span className="acard__cta" aria-hidden="true">
        {actionText}
        <ArrowUpRight aria-hidden />
      </span>
    </article>
  );

  return animate ? <Reveal delay={Math.min(index, 8) * 45}>{card}</Reveal> : card;
}
