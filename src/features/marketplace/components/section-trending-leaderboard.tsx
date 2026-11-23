'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp, Eye, Heart, Trophy } from 'lucide-react';
import type { MarketplaceArtwork } from '../services/marketplace.service';
import { marketplaceService } from '../services/marketplace.service';

type SortKey = 'views' | 'likes';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-black font-[family-name:var(--font-display)]">1</span>;
  if (rank === 2) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-black font-[family-name:var(--font-display)]">2</span>;
  if (rank === 3) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white font-[family-name:var(--font-display)]">3</span>;
  return <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hair)] bg-[var(--ink-2)] text-sm font-medium text-[var(--ash)] font-[family-name:var(--font-display)]">{rank}</span>;
}

export function SectionTrendingLeaderboard() {
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('views');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    marketplaceService
      .getArtworks()
      .then((items) => {
        if (!active) return;
        const approved = items.filter((a) => a.moderationStatus === 'Approved' && a.imageUrl);
        setArtworks(approved);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const sorted = [...artworks]
    .sort((a, b) =>
      sortBy === 'views'
        ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
        : (b.likeCount ?? 0) - (a.likeCount ?? 0)
    )
    .slice(0, 10);

  return (
    <section className="py-14" aria-labelledby="trending-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2 id="trending-title" className="mt-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            <TrendingUp className="h-5 w-5 text-[var(--lumen)]" />
            Bảng xếp hạng thịnh hành
          </h2>
        </div>
        {/* Sort toggle */}
        <div className="flex overflow-hidden rounded-full border border-[var(--hair)] text-sm bg-[var(--ink-2)]">
          {(['views', 'likes'] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={`flex items-center gap-1.5 px-4 py-2 transition cursor-pointer ${
                sortBy === key
                  ? 'bg-[var(--ivory)] font-semibold text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ash)] hover:text-[var(--ivory)] hover:bg-[var(--ink-3)]'
              }`}
            >
              {key === 'views' ? <Eye className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
              {key === 'views' ? 'Lượt xem' : 'Lượt thích'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--ink-2)] border border-[var(--hair)]" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
          Chưa có dữ liệu xếp hạng.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((artwork, idx) => (
            <Link
              key={artwork.id}
              href={`/artworks/${artwork.id}`}
              scroll={false}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-3 transition hover:border-[var(--hair-2)] hover:shadow-md"
            >
              <RankBadge rank={idx + 1} />
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--ink-3)]">
                <Image
                  src={artwork.thumbnailUrl || artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-[var(--ivory)] group-hover:text-[var(--lumen)] transition-colors">
                  {artwork.title}
                </p>
                <p className="line-clamp-1 text-xs text-[var(--ash)]">{artwork.creatorName || 'Creator'}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs text-[var(--lumen)] font-mono font-medium">
                  <Eye className="h-3 w-3" />
                  {(artwork.viewCount ?? 0).toLocaleString('vi-VN')}
                </span>
                {artwork.likeCount !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-[var(--ash)] font-mono">
                    <Heart className="h-3 w-3" />
                    {artwork.likeCount.toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
              {idx === 0 && (
                <Trophy className="h-5 w-5 shrink-0 text-amber-500" aria-label="Hạng nhất" />
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
