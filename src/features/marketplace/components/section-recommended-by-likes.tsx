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
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">For You</p>
          <h2 id="recs-title" className="mt-1 flex items-center gap-2 font-h1 text-2xl font-bold text-white">
            <Sparkles className="h-5 w-5 text-[#A7ACD9]" />
            Gợi ý theo tranh đã thích
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 py-14 text-center">
          <Lock className="h-10 w-10 text-[#A7ACD9]/60" />
          <p className="text-[#C7C5CF]">Đăng nhập để nhận gợi ý cá nhân hoá dựa trên tranh bạn đã thích.</p>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-[#A7ACD9] px-6 py-2.5 text-sm font-semibold text-[#1F2335] hover:opacity-90"
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">For You</p>
          <h2 id="recs-title" className="mt-1 flex items-center gap-2 font-h1 text-2xl font-bold text-white">
            <Sparkles className="h-5 w-5 text-[#A7ACD9]" />
            Gợi ý theo tranh đã thích
          </h2>
          <p className="mt-1 text-sm text-[#C7C5CF]">
            {isEmpty ? 'Hãy thích thêm tranh để nhận gợi ý tốt hơn — tạm thời hiển thị tranh phổ biến.' : 'Dựa trên phong cách &amp; tag của tranh bạn đã ❤️'}
          </p>
        </div>
        <Link href="/explore" className="text-sm text-[#A7ACD9] hover:underline">
          Khám phá thêm →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {artworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artworks/${artwork.id}`}
              scroll={false}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#131624] transition hover:border-[#A7ACD9]/50"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={artwork.thumbnailUrl || artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                  <p className="line-clamp-1 text-sm font-semibold text-white">{artwork.title}</p>
                  <p className="text-xs text-white/70">{artwork.creatorName || 'Creator'}</p>
                  {artwork.tags && artwork.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {artwork.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70"
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
