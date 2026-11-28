'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Star, Users, Layers } from 'lucide-react';
import type { RelatedCreatorDto } from '../services/marketplace.service';
import { marketplaceService } from '../services/marketplace.service';

function CreatorAvatar({ name, avatarUrl, size = 48 }: { name: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-[#241F1A]"
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#B24A26]">Creator Spotlight</p>
          <h2 id="featured-creators-title" className="mt-1 font-h1 text-2xl font-bold text-[#241F1A]"> họa sĩ tuyển chọn </h2>
          <p className="mt-1 text-sm text-[#6E6459]"> Những illustrator nổi bật với đánh giá cao từ cộng đồng. </p>
        </div>
        <Link href="/creators" className="text-sm text-[#B24A26] hover:underline">
          Tất cả họa sĩ →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#FFFCF6]" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#221E1A]/10 p-8 text-center text-sm text-[#746A5F]"> Chưa có họa sĩ nào. </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creators/${creator.id}`}
              className="group relative overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 transition hover:border-[#B24A26]/50 hover:bg-[#FFFCF6]"
            >
              {/* Top rating badge for top 2 */}
              {creator.ratingAverage >= 4.8 && (
                <span className="absolute right-3 top-3 rounded-full bg-[#8A6A1F]/20 px-2 py-0.5 text-[10px] font-semibold text-[#8A6A1F]">
                  Top Creator
                </span>
              )}

              <CreatorAvatar name={creator.displayName} avatarUrl={creator.avatarUrl ?? creator.bannerUrl} size={52} />

              <h3 className="mt-3 line-clamp-1 font-semibold text-[#241F1A] group-hover:text-[#B24A26]">
                {creator.displayName}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-[#746A5F]">
                {creator.headline || creator.specialties || 'Illustrator'}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[#8A6A1F]">
                  <Star className="h-3.5 w-3.5 fill-[#8A6A1F]" />
                  {creator.ratingAverage.toFixed(1)}
                  <span className="text-[#746A5F]">({creator.ratingCount})</span>
                </span>
                <span className="flex items-center gap-1 text-[#746A5F]">
                  <Users className="h-3.5 w-3.5" />
                  {creator.followerCount.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    creator.availableSlots > 0
                      ? 'bg-[#2F6B63]/20 text-[#2F6B63]'
                      : 'bg-[#FFFCF6] text-[#746A5F]'
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  {creator.availableSlots > 0 ? `${creator.availableSlots} slots trống` : 'Hết lượt'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
