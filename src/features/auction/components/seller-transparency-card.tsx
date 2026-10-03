'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle, ChevronDown, ChevronUp, Star, User } from 'lucide-react';
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
  const [stats, setStats] = useState<SellerStatisticsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const targetId = seller?.creatorProfileId || seller?.userId;
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
          setError('Không tải được thống kê người bán (Thiếu ID hoặc API chưa sẵn sàng)');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [seller?.userId, seller?.creatorProfileId]);

  if (!seller) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-outline">
        Thông tin người bán không khả dụng.
      </div>
    );
  }

  const profileHref = seller.creatorProfileId
    ? `/creator/${seller.creatorProfileId}`
    : `/creator/${seller.userId}`;

  return (
    <div className="glass-container rounded-3xl border border-white/10 p-5 text-on-surface">
      <div className={`flex items-center justify-between gap-3 ${expanded ? 'border-b border-white/10 pb-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-brand-periwinkle/20 text-brand-periwinkle font-bold">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-h1 text-sm font-bold text-on-surface">
              {seller.fullName || 'Nghệ sĩ ẩn danh'}
            </h3>
            <span className="text-[11px] text-outline">Người tạo phiên đấu giá</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={profileHref}
            className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-2 text-xs font-semibold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy"
          >
            Xem profile
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-on-surface-variant hover:bg-white/10"
          >
            {expanded ? 'Thu gọn' : 'Chi tiết'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <span className="flex items-center gap-1 text-[11px] text-outline">
            <CheckCircle size={12} className="text-emerald-400" /> Tỷ lệ hoàn thành
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-on-surface">
            {loading ? '...' : stats ? formatPercent(stats.commissionCompletionRate) : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <span className="flex items-center gap-1 text-[11px] text-outline">
            <Award size={12} className="text-brand-periwinkle" /> Đấu giá thành công
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-on-surface">
            {loading ? '...' : stats ? `${stats.successfulAuctionCount} phiên` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <span className="flex items-center gap-1 text-[11px] text-outline">
            <Star size={12} className="text-amber-400 fill-amber-400" /> Đánh giá trung bình
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-on-surface">
            {loading ? '...' : stats ? `${stats.averageRating.toFixed(1)} / 5.0` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <span className="flex items-center gap-1 text-[11px] text-outline">
            Total Reviews
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-on-surface">
            {loading ? '...' : stats ? `${stats.reviewCount} đánh giá` : '—'}
          </p>
        </div>
      </div>}

      {expanded && error && (
        <p className="mt-2 text-[10px] text-amber-300/80 italic">
          * {error}
        </p>
      )}
    </div>
  );
}
