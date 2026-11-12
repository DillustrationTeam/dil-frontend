'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import type { MarketplaceArtwork } from '../services/marketplace.service';
import { categoriesService, type CategoryDto } from '../services/categories.service';

interface Props {
  artworks: MarketplaceArtwork[];
  loading: boolean;
}

export function SectionExploreByStyle({ artworks, loading }: Props) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    categoriesService
      .getCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const categoryBuckets = useMemo(() => {
    const approved = artworks.filter((a) => a.moderationStatus === 'Approved' && a.imageUrl);
    if (categories.length === 0) return [];

    return categories
      .map((cat) => {
        const matched = approved.filter(
          (a) =>
            a.categoryId === cat.id ||
            a.categoryName?.toLowerCase() === cat.name.toLowerCase() ||
            a.style?.toLowerCase() === cat.name.toLowerCase()
        );
        return { category: cat, artworks: matched };
      })
      .filter((bucket) => bucket.artworks.length > 0);
  }, [artworks, categories]);

  const selectedBucket =
    categoryBuckets.find((b) => b.category.slug === activeSlug) ?? categoryBuckets[0] ?? null;
  const displayed = (selectedBucket?.artworks ?? []).slice(0, 8);

  return (
    <section className="py-14" aria-labelledby="style-explore-title">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Browse by Category</p>
          <h2 id="style-explore-title" className="mt-1 flex items-center gap-2 font-h1 text-2xl font-bold text-white">
            <Palette className="h-5 w-5 text-[#A7ACD9]" />
            Khám phá theo danh mục lớn
          </h2>
          <p className="mt-1 text-sm text-[#C7C5CF]">Lọc nhanh theo gu tranh và thể loại nghệ thuật bạn yêu thích.</p>
        </div>
        <Link href="/explore" className="text-sm text-[#A7ACD9] hover:underline">
          Xem tất cả →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      ) : categoryBuckets.length === 0 ? (
        <p className="text-sm text-[#919099]">Chưa đủ dữ liệu để phân loại theo danh mục.</p>
      ) : (
        <>
          <div
            className="mb-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Danh mục lớn"
          >
            {categoryBuckets.map(({ category, artworks: catArtworks }) => {
              const isActive = selectedBucket?.category.slug === category.slug;
              return (
                <button
                  key={category.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveSlug(category.slug)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition cursor-pointer ${
                    isActive
                      ? 'border-[#A7ACD9] bg-[#A7ACD9] font-semibold text-[#1F2335]'
                      : 'border-white/10 text-[#C7C5CF] hover:border-[#A7ACD9]/30 hover:bg-white/5'
                  }`}
                >
                  {category.name}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive ? 'bg-[#1F2335]/30' : 'bg-white/10'
                    }`}
                  >
                    {catArtworks.length}
                  </span>
                </button>
              );
            })}
          </div>

          {displayed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#919099]">
              Chưa có tranh trong danh mục này.
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
                    {(artwork.categoryName || artwork.style) && (
                      <span className="mt-2 inline-block rounded-full bg-[#A7ACD9]/15 px-2 py-0.5 text-[10px] font-semibold text-[#A7ACD9]">
                        {artwork.categoryName || artwork.style}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {displayed.length > 0 && selectedBucket && (
            <div className="mt-6 text-center">
              <Link
                href={`/explore?category=${encodeURIComponent(selectedBucket.category.slug)}`}
                className="inline-flex rounded-full border border-white/15 px-6 py-2.5 text-sm text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-[#A7ACD9]"
              >
                Xem tất cả tranh {selectedBucket.category.name} →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
