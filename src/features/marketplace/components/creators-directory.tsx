'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Palette, Search, Star, Users } from 'lucide-react';
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
    <main className="min-h-screen bg-[#1F2335] px-4 pb-20 pt-8 text-[#E4E1E5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">
              Commission Directory
            </p>
            <h1 className="mt-2 font-h1 text-3xl font-bold text-white sm:text-4xl">
              Tìm họa sĩ phù hợp yêu cầu đặt vẽ
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#C7C5CF]">
              Lọc theo danh mục chuyên môn từ bảng giá dịch vụ và portfolio để chọn đúng họa sĩ cho dự án của bạn.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#DDE0FF] transition hover:border-[#A7ACD9]/50 hover:text-white"
          >
            <Palette className="h-4 w-4 text-[#A7ACD9]" />
            <span>Khám phá tác phẩm</span>
          </Link>
        </header>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <nav
            aria-label="Lọc họa sĩ theo danh mục"
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
                  ? 'border-[#A7ACD9] bg-[#A7ACD9] text-[#1F2335] shadow'
                  : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-white'
              }`}
            >
              Tất cả họa sĩ
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
                      ? 'border-[#A7ACD9] bg-[#A7ACD9] text-[#1F2335] shadow'
                      : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-white'
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
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 focus-within:border-[#A7ACD9]/70">
            <Search className="h-4 w-4 text-[#A7ACD9]" />
            <input
              value={search}
              onChange={(e) => {
                setLoading(true);
                setSearch(e.target.value);
              }}
              placeholder="Tìm tên họa sĩ, phong cách hoặc chuyên môn..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#919099]"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-[#DDE0FF]">
            <input
              type="checkbox"
              checked={onlyOpenSlots}
              onChange={(e) => {
                setLoading(true);
                setOnlyOpenSlots(e.target.checked);
              }}
              className="h-4 w-4 accent-[#A7ACD9]"
            />
            <span>Chỉ hiện họa sĩ còn slot nhận đơn</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-sm text-[#C7C5CF]">
            Đang tìm danh sách họa sĩ...
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center space-y-3">
            <p className="font-h1 text-lg text-white">Không tìm thấy họa sĩ phù hợp</p>
            <p className="text-xs text-[#919099]">
              Hãy thử chọn danh mục khác hoặc bỏ giới hạn từ khóa tìm kiếm.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setSelectedCategoryId('');
                setSearch('');
                setOnlyOpenSlots(false);
              }}
              className="text-sm text-[#A7ACD9] hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#171a2a]/85 p-5 transition hover:-translate-y-0.5 hover:border-[#A7ACD9]/50"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#A7ACD9]/15 font-bold text-[#C5C9F8]">
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
                      <h2 className="truncate font-h1 text-base font-bold text-white">
                        {creator.displayName}
                      </h2>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#919099]">
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
                          className="rounded-full border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#DDE0FF]"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-[#C7C5CF]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {creator.ratingAverage.toFixed(1)} ({creator.ratingCount})
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#919099]">
                        <Users className="h-3.5 w-3.5" />
                        <span>{creator.followerCount}</span>
                      </span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        creator.availableSlots > 0
                          ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/15 bg-white/5 text-[#919099]'
                      }`}
                    >
                      {creator.availableSlots > 0
                        ? `Còn ${creator.availableSlots} slot`
                        : 'Đang bận'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/creators/${creator.id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A7ACD9] px-4 py-2.5 text-xs font-bold text-[#1F2335] transition hover:bg-[#c5c9f8]"
                >
                  <span>Xem hồ sơ &amp; Đặt vẽ</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
