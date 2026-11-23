'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { MarketplaceArtwork } from '../services/marketplace.service';
import { categoriesService, type CategoryDto } from '../services/categories.service';

interface Props {
  artworks: MarketplaceArtwork[];
  loading: boolean;
}

export function SectionExploreByStyle({ artworks, loading }: Props) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
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
          <p className="eyebrow">Browse by Category</p>
          <h2 id="style-explore-title" className="mt-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
            <Palette className="h-5 w-5 text-[var(--lumen)]" />
            {isVie ? 'Khám phá theo danh mục lớn' : 'Explore by Major Category'}
          </h2>
          <p className="mt-1 text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
            {isVie
              ? 'Lọc nhanh theo gu tranh và thể loại nghệ thuật bạn yêu thích.'
              : 'Quickly filter by the art styles and genres you love.'}
          </p>
        </div>
        <Link href="/explore" className="text-sm font-medium text-[var(--lumen)] hover:underline">
          Xem tất cả →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[var(--ink-2)] border border-[var(--hair)]" />
          ))}
        </div>
      ) : categoryBuckets.length === 0 ? (
        <p className="text-sm text-[var(--ash)]">Chưa đủ dữ liệu để phân loại theo danh mục.</p>
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
                      ? 'border-[var(--ivory)] bg-[var(--ivory)] font-semibold text-[var(--ink)] shadow-sm'
                      : 'border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ash)] hover:border-[var(--hair-2)] hover:text-[var(--ivory)]'
                  }`}
                >
                  {category.name}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive ? 'bg-[var(--ink)] text-[var(--ivory)]' : 'bg-[var(--ink-3)] text-[var(--ash)]'
                    }`}
                  >
                    {catArtworks.length}
                  </span>
                </button>
              );
            })}
          </div>

          {displayed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--hair)] p-8 text-center text-sm text-[var(--ash)]">
              Chưa có tranh trong danh mục này.
            </p>
          ) : (
            <div className="wall" data-cols="3">
              {displayed.map((artwork) => (
                <article key={artwork.id} className="art-card">
                  <Link
                    href={`/artworks/${artwork.id}`}
                    scroll={false}
                    className="art-card__open block relative"
                    aria-label={`View ${artwork.title} by ${artwork.creatorName || 'Creator'}`}
                  >
                    <span className="art-card__frame block aspect-square">
                      <span className="art-card__img relative block w-full h-full">
                        <Image
                          src={artwork.thumbnailUrl || artwork.imageUrl}
                          alt={artwork.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </span>
                      <span className="art-card__veil"></span>
                      {(artwork.categoryName || artwork.style) && (
                        <span className="absolute top-2.5 right-2.5 z-10 pointer-events-none rounded-full bg-[var(--ink-2)]/90 backdrop-blur-md border border-[var(--hair)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--lumen)] shadow-sm">
                          {artwork.categoryName || artwork.style}
                        </span>
                      )}
                      <span className="art-card__quick">
                        <span className="art-card__zoom flex items-center justify-center" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </span>
                      </span>
                    </span>
                  </Link>
                  <div className="art-card__meta">
                    <h3 className="art-card__title font-[family-name:var(--font-display)] font-medium text-[var(--ivory)] truncate">
                      <Link href={`/artworks/${artwork.id}`} scroll={false} className="hover:text-[var(--lumen)] transition-colors">
                        {artwork.title}
                      </Link>
                    </h3>
                    <div className="art-card__sub text-xs text-[var(--ash)] flex items-center gap-1.5">
                      <span className="truncate">{artwork.creatorName || 'Creator'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {displayed.length > 0 && selectedBucket && (
            <div className="mt-6 text-center">
              <Link
                href={`/explore?category=${encodeURIComponent(selectedBucket.category.slug)}`}
                className="inline-flex rounded-full border border-[var(--hair-2)] px-6 py-2.5 text-sm font-medium text-[var(--ivory)] hover:border-[var(--lumen)] transition"
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
