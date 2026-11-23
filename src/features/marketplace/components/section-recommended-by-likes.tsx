'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, Heart, Lock } from 'lucide-react';
import type { MarketplaceArtwork } from '../services/marketplace.service';
import { marketplaceService } from '../services/marketplace.service';
import { useAuthStore } from '@/store/use-auth-store';

export function SectionRecommendedByLikes() {
  const { isAuthenticated } = useAuthStore();
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    // Try to get personalised feed from liked artworks tags
    Promise.all([
      marketplaceService.getMyFavorites().catch(() => [] as MarketplaceArtwork[]),
      marketplaceService.getArtworks().catch(() => [] as MarketplaceArtwork[]),
    ]).then(([favorites, all]) => {
      if (!active) return;

      const approved = (all as MarketplaceArtwork[]).filter(
        (a) => a.moderationStatus === 'Approved' && a.imageUrl
      );

      if (favorites.length === 0) {
        // Show popular artworks as fallback
        const popular = [...approved]
          .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
          .slice(0, 6);
        setArtworks(popular);
        setIsEmpty(true);
      } else {
        // Collect tags from liked artworks
        const likedIds = new Set(favorites.map((f) => f.id));
        const likedTags = new Set<string>();
        favorites.forEach((f) => f.tags?.forEach((t) => likedTags.add(t.toLowerCase().trim())));

        // Score each artwork by tag overlap
        const scored = approved
          .filter((a) => !likedIds.has(a.id))
          .map((a) => {
            const overlap = (a.tags ?? []).filter((t) => likedTags.has(t.toLowerCase().trim())).length;
            return { artwork: a, score: overlap };
          })
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score || (b.artwork.viewCount ?? 0) - (a.artwork.viewCount ?? 0))
          .map((s) => s.artwork)
          .slice(0, 8);

        setArtworks(scored.length > 0 ? scored : approved.slice(0, 8));
        setIsEmpty(scored.length === 0);
      }
      setLoading(false);
    });

    return () => { active = false; };
  }, [isAuthenticated]);

  // Not logged in — show teaser
  if (!isAuthenticated) {
    return (
      <section className="py-14" aria-labelledby="recs-title">
        <div className="mb-6">
          <p className="eyebrow">For You</p>
          <h2 id="recs-title" className="mt-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            <Sparkles className="h-5 w-5 text-[var(--lumen)]" />
            Gợi ý theo tranh đã thích
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-[var(--hair-2)] bg-[var(--ink-2)] py-14 text-center">
          <Lock className="h-10 w-10 text-[var(--lumen)]" />
          <p className="text-[var(--ash)]">Đăng nhập để nhận gợi ý cá nhân hoá dựa trên tranh bạn đã thích.</p>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-[var(--ivory)] px-6 py-2.5 text-sm font-semibold text-[var(--ink)] hover:opacity-90 shadow-md transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14" aria-labelledby="recs-title">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="eyebrow">For You</p>
          <h2 id="recs-title" className="mt-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            <Sparkles className="h-5 w-5 text-[var(--lumen)]" />
            Gợi ý theo tranh đã thích
          </h2>
          <p className="mt-1 text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
            {isEmpty ? 'Hãy thích thêm tranh để nhận gợi ý tốt hơn — tạm thời hiển thị tranh phổ biến.' : 'Dựa trên phong cách & tag của tranh bạn đã lưu'}
          </p>
        </div>
        <Link href="/explore" className="text-sm font-medium text-[var(--lumen)] hover:underline">
          Khám phá thêm →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-[var(--ink-2)] border border-[var(--hair)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {artworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artworks/${artwork.id}`}
              scroll={false}
              className="group relative overflow-hidden rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] transition hover:border-[var(--hair-2)] hover:shadow-lg"
            >
              <div className="relative aspect-[3/4] bg-[var(--ink-3)]">
                <Image
                  src={artwork.thumbnailUrl || artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                  <p className="line-clamp-1 text-sm font-medium text-white">{artwork.title}</p>
                  <p className="text-xs text-white/70">{artwork.creatorName || 'Creator'}</p>
                  {artwork.tags && artwork.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {artwork.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/90"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Like count pill */}
              {artwork.likeCount !== undefined && artwork.likeCount > 0 && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                  <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                  {artwork.likeCount}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
