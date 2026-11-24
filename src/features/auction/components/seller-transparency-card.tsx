'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle, ChevronDown, ChevronUp, Star, User } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionService } from '../services/auction.service';
import type { SellerStatisticsDto } from '../types/auction.types';

export interface SellerTransparencyProps {
  seller: {
    userId: string;
    fullName: string | null;
    creatorProfileId?: string | null;
  } | null;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function SellerTransparencyCard({ seller }: SellerTransparencyProps) {
  const { lang, t } = useLanguage();
  const isVie = lang === 'VIE';
  const [stats, setStats] = useState<SellerStatisticsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // API thống kê tra theo CreatorProfiles.Id, không phải userId — thiếu hồ sơ thì
    // không gọi để tránh lỗi 400/404 thừa trong console.
    const targetId = seller?.creatorProfileId;
    if (!targetId) return;

    let isMounted = true;
    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const data = await auctionService.getSellerStatistics(targetId, controller.signal);
        if (isMounted) setStats(data);
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('[FE-05] Seller statistics fetch warning:', err);
          setError(isVie ? 'Không tải được thống kê người bán' : 'Could not load seller statistics');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [seller?.userId, seller?.creatorProfileId, isVie]);

  if (!seller) {
    return (
      <div className="rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-4 text-xs text-[var(--ash)]">
        {isVie ? 'Thông tin người bán không khả dụng.' : 'Seller information not available.'}
      </div>
    );
  }

  // Trang profile công khai là `/creators/{creatorProfileId}` và API tra cứu theo
  // CreatorProfiles.Id — KHÔNG phải userId. Dùng userId sẽ ra 404/400.
  const profileHref = seller.creatorProfileId ? `/creators/${seller.creatorProfileId}` : null;

  return (
    <div className="rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-5 text-[var(--ivory)] transition-all">
      <div className={`flex items-center justify-between gap-3 ${expanded ? 'border-b border-[var(--hair)] pb-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--ink-3)] text-[var(--lumen)] font-bold">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ivory)]">
              {seller.fullName || (isVie ? 'Nghệ sĩ ẩn danh' : 'Anonymous Artist')}
            </h3>
            <span className="text-[11px] text-[var(--ash)]">{isVie ? 'Người tạo phiên đấu giá' : 'Auction Creator'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profileHref ? (
            <Link
              href={profileHref}
              className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:text-[var(--lumen)]"
            >
              {isVie ? 'Xem profile' : 'View profile'}
            </Link>
          ) : (
            <span
              title={isVie ? 'Người bán chưa tạo hồ sơ Creator nên chưa có trang profile.' : 'Seller has not created a Creator profile yet.'}
              className="cursor-not-allowed rounded-full border border-[var(--hair)] bg-[var(--ink-3)]/50 px-3.5 py-1.5 text-xs font-semibold text-[var(--ash)]"
            >
              {isVie ? 'Chưa có hồ sơ' : 'No profile'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3 text-xs font-semibold text-[var(--ivory)] hover:border-[var(--lumen)] hover:text-[var(--lumen)] transition cursor-pointer"
          >
            {expanded ? (isVie ? 'Thu gọn' : 'Collapse') : (isVie ? 'Chi tiết' : 'Details')}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
            <span className="flex items-center gap-1 text-[11px] text-[var(--ash)]">
              <CheckCircle size={12} className="text-emerald-500" /> {isVie ? 'Tỷ lệ hoàn thành' : 'Completion Rate'}
            </span>
            <p className="mt-1 font-[family-name:var(--font-ui)] text-sm font-bold tabular-nums text-[var(--ivory)]">
              {loading ? '...' : stats ? formatPercent(stats.commissionCompletionRate) : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
            <span className="flex items-center gap-1 text-[11px] text-[var(--ash)]">
              <Award size={12} className="text-[var(--lumen)]" /> {isVie ? 'Đấu giá thành công' : 'Successful Auctions'}
            </span>
            <p className="mt-1 font-[family-name:var(--font-ui)] text-sm font-bold tabular-nums text-[var(--ivory)]">
              {loading ? '...' : stats ? `${stats.successfulAuctionCount} ${isVie ? 'phiên' : 'sessions'}` : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
            <span className="flex items-center gap-1 text-[11px] text-[var(--ash)]">
              <Star size={12} className="text-[var(--gold)] fill-[var(--gold)]" /> {isVie ? 'Đánh giá trung bình' : 'Average Rating'}
            </span>
            <p className="mt-1 font-[family-name:var(--font-ui)] text-sm font-bold tabular-nums text-[var(--ivory)]">
              {loading ? '...' : stats ? `${stats.averageRating.toFixed(1)} / 5.0` : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--hair)] bg-[var(--ink-3)] p-3">
            <span className="flex items-center gap-1 text-[11px] text-[var(--ash)]">
              {isVie ? 'Tổng số đánh giá' : 'Total Reviews'}
            </span>
            <p className="mt-1 font-[family-name:var(--font-ui)] text-sm font-bold tabular-nums text-[var(--ivory)]">
              {loading ? '...' : stats ? `${stats.reviewCount} ${isVie ? 'đánh giá' : 'reviews'}` : '—'}
            </p>
          </div>
        </div>
      )}

      {expanded && error && (
        <p className="mt-2 text-[10px] text-amber-500/90 italic">
          * {error}
        </p>
      )}
    </div>
  );
}
