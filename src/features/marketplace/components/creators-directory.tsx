'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Palette, Search, Star, Users } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import {
  marketplaceService,
  type RelatedCreatorDto,
} from '../services/marketplace.service';
import { categoriesService, type CategoryDto } from '../services/categories.service';

function initialsOf(name?: string | null) {
  const parts = (name || 'CR').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CreatorsDirectory({ initialCategory = '' }: { initialCategory?: string }) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [onlyOpenSlots, setOnlyOpenSlots] = useState(false);
  const [creators, setCreators] = useState<RelatedCreatorDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    categoriesService
      .getCategories()
      .then((list) => {
        if (!active) return;
        setCategories(list);
        if (initialCategory) {
          const key = initialCategory.trim().toLowerCase();
          const matched = list.find(
            (c) =>
              c.id.toLowerCase() === key ||
              c.slug.toLowerCase() === key ||
              c.name.toLowerCase() === key
          );
          if (matched) setSelectedCategoryId(matched.id);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initialCategory]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      marketplaceService
        .getCreators({
          categoryId: selectedCategoryId || undefined,
          search: search.trim() || undefined,
          onlyOpenSlots,
        })
        .then((items) => {
          if (active) setCreators(items);
        })
        .catch(() => {
          if (active) setCreators([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedCategoryId, search, onlyOpenSlots]);

  return (
    <main className="min-h-screen bg-[var(--ink)] px-4 pb-20 pt-8 text-[var(--ivory)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">
              Commission Directory
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--ivory)] sm:text-4xl">
              {isVie ? 'Tìm họa sĩ phù hợp yêu cầu đặt vẽ' : 'Find the right artist for your commission'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ash)] font-[family-name:var(--font-ui)]">
              {isVie
                ? 'Lọc theo danh mục chuyên môn từ bảng giá dịch vụ và portfolio để chọn đúng họa sĩ cho dự án của bạn.'
                : 'Filter by specialty from rate cards and portfolios to commission the ideal artist for your project.'}
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] px-5 py-2.5 text-sm font-medium text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:text-[var(--lumen)]"
          >
            <Palette className="h-4 w-4 text-[var(--lumen)]" />
            <span>{isVie ? 'Khám phá tác phẩm' : 'Explore artworks'}</span>
          </Link>
        </header>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <nav
            aria-label={isVie ? 'Lọc họa sĩ theo danh mục' : 'Filter creators by category'}
            className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar"
          >
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setSelectedCategoryId('');
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                !selectedCategoryId
                  ? 'border-[var(--ivory)] bg-[var(--ivory)] text-[var(--ink)] shadow-sm'
                  : 'border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ash)] hover:border-[var(--hair-2)] hover:text-[var(--ivory)]'
              }`}
            >
              {isVie ? 'Tất cả họa sĩ' : 'All Creators'}
            </button>
            {categories.map((cat) => {
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setSelectedCategoryId(active ? '' : cat.id);
                  }}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'border-[var(--ivory)] bg-[var(--ivory)] text-[var(--ink)] shadow-sm'
                      : 'border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ash)] hover:border-[var(--hair-2)] hover:text-[var(--ivory)]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        )}

        {/* Search & Slot Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-3 focus-within:border-[var(--lumen)]">
            <Search className="h-4 w-4 text-[var(--lumen)]" />
            <input
              value={search}
              onChange={(e) => {
                setLoading(true);
                setSearch(e.target.value);
              }}
              placeholder={isVie ? 'Tìm tên họa sĩ, phong cách hoặc chuyên môn...' : 'Search creator name, style or specialty...'}
              className="w-full bg-transparent text-sm text-[var(--ivory)] outline-none placeholder:text-[var(--ash)]"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-3 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)]">
            <input
              type="checkbox"
              checked={onlyOpenSlots}
              onChange={(e) => {
                setLoading(true);
                setOnlyOpenSlots(e.target.checked);
              }}
              className="h-4 w-4 accent-[var(--lumen)]"
            />
            <span>{isVie ? 'Chỉ hiện họa sĩ còn slot nhận đơn' : 'Only show creators with available slots'}</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div className="rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-12 text-center text-sm text-[var(--ash)]">
            {isVie ? 'Đang tìm danh sách họa sĩ...' : 'Loading creators...'}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--hair-2)] bg-[var(--ink-2)]/50 p-12 text-center space-y-3">
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ivory)]">
              {isVie ? 'Không tìm thấy họa sĩ phù hợp' : 'No creators found'}
            </p>
            <p className="text-xs text-[var(--ash)]">
              {isVie
                ? 'Hãy thử chọn danh mục khác hoặc bỏ giới hạn từ khóa tìm kiếm.'
                : 'Try selecting another category or clearing your search query.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setSelectedCategoryId('');
                setSearch('');
                setOnlyOpenSlots(false);
              }}
              className="text-sm text-[var(--lumen)] hover:underline cursor-pointer"
            >
              {isVie ? 'Xóa bộ lọc' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hair-2)] hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--hair)] bg-[var(--ink-3)] font-bold text-[var(--lumen)]">
                      {creator.bannerUrl ? (
                        <Image
                          src={creator.bannerUrl}
                          alt={creator.displayName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        initialsOf(creator.displayName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-[family-name:var(--font-display)] text-base font-medium text-[var(--ivory)] transition-colors group-hover:text-[var(--lumen)]">
                        {creator.displayName}
                      </h2>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ash)]">
                        {creator.headline || creator.specialties || 'Digital Illustrator'}
                      </p>
                    </div>
                  </div>

                  {/* Category badges */}
                  {creator.categories && creator.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {creator.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded-full border border-[var(--hair)] bg-[var(--ink-3)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ivory)]"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hair)] pt-3 text-xs text-[var(--ash)]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {creator.ratingAverage.toFixed(1)} ({creator.ratingCount})
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--ash)]">
                        <Users className="h-3.5 w-3.5" />
                        <span>{creator.followerCount.toLocaleString('vi-VN')}</span>
                      </span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        creator.availableSlots > 0
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          : 'border-[var(--hair)] bg-[var(--ink-3)] text-[var(--ash)]'
                      }`}
                    >
                      {creator.availableSlots > 0
                        ? (isVie ? `Còn ${creator.availableSlots} slot` : `${creator.availableSlots} slots open`)
                        : (isVie ? 'Hết slot' : 'Busy')}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/creators/${creator.id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--lumen)] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--lumen-hi)]"
                >
                  <span className="text-white">{isVie ? 'Xem hồ sơ & Đặt vẽ' : 'View Profile & Commission'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
