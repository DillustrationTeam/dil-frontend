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
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Creator Spotlight</p>
          <h2 id="featured-creators-title" className="mt-1 font-h1 text-2xl font-bold text-white">
            Creator tuyển chọn
          </h2>
          <p className="mt-1 text-sm text-[#C7C5CF]">
            Những illustrator nổi bật với đánh giá cao từ cộng đồng.
          </p>
        </div>
        <Link href="/creators" className="text-sm text-[#A7ACD9] hover:underline">
          Tất cả creator →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#919099]">
          Chưa có creator nào.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creators/${creator.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] p-5 transition hover:border-[#A7ACD9]/50 hover:bg-white/[.06]"
            >
              {/* Top rating badge for top 2 */}
              {creator.ratingAverage >= 4.8 && (
                <span className="absolute right-3 top-3 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Top Creator
                </span>
              )}

              <CreatorAvatar name={creator.displayName} size={52} />

              <h3 className="mt-3 line-clamp-1 font-semibold text-white group-hover:text-[#A7ACD9]">
                {creator.displayName}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-[#919099]">
                {creator.headline || creator.specialties || 'Illustrator'}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {creator.ratingAverage.toFixed(1)}
                  <span className="text-[#919099]">({creator.ratingCount})</span>
                </span>
                <span className="flex items-center gap-1 text-[#919099]">
                  <Users className="h-3.5 w-3.5" />
                  {creator.followerCount.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    creator.availableSlots > 0
                      ? 'bg-emerald-950/60 text-emerald-300'
                      : 'bg-white/5 text-[#919099]'
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
