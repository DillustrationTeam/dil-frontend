'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import type { MarketplaceArtwork } from '../services/marketplace.service';

// Canonical style buckets — map common tags/keywords → display label
const STYLE_BUCKETS: { key: string; label: string; keywords: string[] }[] = [
  { key: 'anime', label: 'Anime / Manga', keywords: ['anime', 'manga', 'chibi', 'kawaii', 'shounen', 'shojo'] },
  { key: 'realistic', label: 'Realistic', keywords: ['realistic', 'realism', 'portrait', 'photorealistic', 'hyperrealism'] },
  { key: 'fantasy', label: 'Fantasy', keywords: ['fantasy', 'dragon', 'elf', 'magic', 'rpg', 'dungeon', 'wizard'] },
  { key: 'scifi', label: 'Sci-Fi', keywords: ['sci-fi', 'scifi', 'cyberpunk', 'mecha', 'space', 'futuristic', 'robot'] },
  { key: 'chibi', label: 'Chibi / Cute', keywords: ['chibi', 'cute', 'adorable', 'pastel'] },
  { key: 'illustration', label: 'Illustration', keywords: ['illustration', 'storybook', 'character design', 'concept art'] },
  { key: 'sketch', label: 'Sketch / Lineart', keywords: ['sketch', 'lineart', 'line art', 'pencil', 'ink', 'monochrome'] },
  { key: 'watercolor', label: 'Watercolor', keywords: ['watercolor', 'watercolour', 'gouache', 'painting'] },
  { key: 'pixel', label: 'Pixel Art', keywords: ['pixel', 'pixel art', '8-bit', '16-bit', 'retro game'] },
  { key: 'horror', label: 'Dark / Horror', keywords: ['horror', 'dark', 'gothic', 'creepy', 'occult'] },
];

function detectStyle(artwork: MarketplaceArtwork): string | null {
  const haystack = [
    ...(artwork.tags ?? []),
    artwork.style ?? '',
    artwork.title ?? '',
  ]
    .join(' ')
    .toLowerCase();

  for (const bucket of STYLE_BUCKETS) {
    if (bucket.keywords.some((kw) => haystack.includes(kw))) {
      return bucket.key;
    }
  }
  return null;
}

interface Props {
  artworks: MarketplaceArtwork[];
  loading: boolean;
}

export function SectionExploreByStyle({ artworks, loading }: Props) {
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  // Build style → artworks map
  const styleMap = useMemo(() => {
    const map = new Map<string, MarketplaceArtwork[]>();
    const approved = artworks.filter((a) => a.moderationStatus === 'Approved' && a.imageUrl);
    for (const artwork of approved) {
      const key = detectStyle(artwork);
      if (key) {
        const existing = map.get(key) ?? [];
        existing.push(artwork);
        map.set(key, existing);
      }
    }
    return map;
  }, [artworks]);

  const availableBuckets = STYLE_BUCKETS.filter((b) => (styleMap.get(b.key)?.length ?? 0) > 0);
  const selectedKey = activeStyle ?? availableBuckets[0]?.key ?? null;
  const displayed = (selectedKey ? styleMap.get(selectedKey) ?? [] : []).slice(0, 8);

  return (
    <section className="py-14" aria-labelledby="style-explore-title">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Browse by Style</p>
          <h2 id="style-explore-title" className="mt-1 flex items-center gap-2 font-h1 text-2xl font-bold text-white">
            <Palette className="h-5 w-5 text-[#A7ACD9]" />
            Khám phá theo phong cách
          </h2>
          <p className="mt-1 text-sm text-[#C7C5CF]">Lọc nhanh theo thể loại nghệ thuật bạn yêu thích.</p>
        </div>
        <Link href="/explore" className="text-sm text-[#A7ACD9] hover:underline">
          Xem tất cả →
        </Link>
      </div>

      {/* Style pill tabs */}
      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      ) : availableBuckets.length === 0 ? (
        <p className="text-sm text-[#919099]">Chưa đủ dữ liệu để phân loại theo phong cách.</p>
      ) : (
        <>
          <div
            className="mb-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Phong cách nghệ thuật"
          >
            {availableBuckets.map((bucket) => {
              const count = styleMap.get(bucket.key)?.length ?? 0;
              const isActive = bucket.key === selectedKey;
              return (
                <button
                  key={bucket.key}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveStyle(bucket.key)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-[#A7ACD9] bg-[#A7ACD9] font-semibold text-[#1F2335]'
                      : 'border-white/10 text-[#C7C5CF] hover:border-[#A7ACD9]/30 hover:bg-white/5'
                  }`}
                >
                  {bucket.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive ? 'bg-[#1F2335]/30' : 'bg-white/10'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Artworks grid */}
          {displayed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#919099]">
              Chưa có tranh trong phong cách này.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayed.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  scroll={false}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#131624] transition hover:border-[#A7ACD9]/50"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.thumbnailUrl || artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{artwork.title}</p>
                    <p className="mt-0.5 text-xs text-[#919099]">{artwork.creatorName || 'Creator'}</p>
                    {artwork.style && (
                      <span className="mt-2 inline-block rounded-full bg-[#A7ACD9]/15 px-2 py-0.5 text-[10px] text-[#A7ACD9]">
                        {artwork.style}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {displayed.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href={`/explore?q=${encodeURIComponent(availableBuckets.find(b => b.key === selectedKey)?.label.split(' / ')[0] || selectedKey || '')}`}
                className="inline-flex rounded-full border border-white/15 px-6 py-2.5 text-sm text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-[#A7ACD9]"
              >
                Xem tất cả tranh phong cách này →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
