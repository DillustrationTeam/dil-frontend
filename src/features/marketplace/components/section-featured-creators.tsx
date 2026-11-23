'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Star, Users, Layers } from 'lucide-react';
import type { RelatedCreatorDto } from '../services/marketplace.service';
import { marketplaceService } from '../services/marketplace.service';

function CreatorAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm"
      style={{ width: size, height: size, background: `hsl(${hue},55%,38%)`, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}

export function SectionFeaturedCreators() {
  const [creators, setCreators] = useState<RelatedCreatorDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    marketplaceService
      .getCreators()
      .then((items) => {
        if (!active) return;
        // Sort by rating then follower count
        const sorted = [...items]
          .sort((a, b) => b.ratingAverage - a.ratingAverage || b.followerCount - a.followerCount)
          .slice(0, 8);
        setCreators(sorted);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="py-14" aria-labelledby="featured-creators-title">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="eyebrow">Creator Spotlight</p>
          <h2 id="featured-creators-title" className="mt-1 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            Creator tuyển chọn
          </h2>
          <p className="mt-1 text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
            Những illustrator nổi bật với đánh giá cao từ cộng đồng.
          </p>
        </div>
        <Link href="/creators" className="text-sm font-medium text-[var(--lumen)] hover:underline">
          Tất cả creator →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--ink-2)] border border-[var(--hair)]" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
          Chưa có creator nào.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creators/${creator.id}`}
              className="group relative overflow-hidden rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-5 transition hover:border-[var(--hair-2)] hover:shadow-lg"
            >
              {/* Top rating badge for top 2 */}
              {creator.ratingAverage >= 4.8 && (
                <span className="absolute right-3 top-3 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Top Creator
                </span>
              )}

              <CreatorAvatar name={creator.displayName} size={52} />

              <h3 className="mt-3 line-clamp-1 font-medium text-[var(--ivory)] group-hover:text-[var(--lumen)] transition-colors">
                {creator.displayName}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--ash)]">
                {creator.headline || creator.specialties || 'Illustrator'}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  {creator.ratingAverage.toFixed(1)}
                  <span className="text-[var(--ash)] font-normal">({creator.ratingCount})</span>
                </span>
                <span className="flex items-center gap-1 text-[var(--ash)]">
                  <Users className="h-3.5 w-3.5" />
                  {creator.followerCount.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    creator.availableSlots > 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                      : 'bg-[var(--ink-3)] text-[var(--ash)]'
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  {creator.availableSlots > 0 ? `${creator.availableSlots} slots trống` : 'Hết slot'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
