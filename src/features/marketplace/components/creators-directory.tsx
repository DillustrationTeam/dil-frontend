'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Palette, Search, Star, Users } from 'lucide-react';
import {
  marketplaceService,
  type MarketplaceArtwork,
  type RelatedCreatorDto,
} from '../services/marketplace.service';
import { categoriesService, type CategoryDto } from '../services/categories.service';

/** DB chưa có cột avatarUrl → dùng bannerUrl, không có thì sinh avatar từ tên. */
function avatarFor(creator: { displayName: string; bannerUrl?: string | null }) {
  if (creator.bannerUrl) return creator.bannerUrl;
  const seed = encodeURIComponent(creator.displayName || 'creator');
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=f0e7d8,e5d8c2`;
}

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
  /** creatorId → 3 tác phẩm mới nhất (đã duyệt) */
  const [recentByCreator, setRecentByCreator] = useState<Record<string, MarketplaceArtwork[]>>({});

  // Tác phẩm mới nhất của từng họa sĩ — tải 1 lần, gom theo cả profileId và tên.
  useEffect(() => {
    let active = true;
    marketplaceService
      .getArtworks()
      .then((items) => {
        if (!active) return;
        const grouped: Record<string, MarketplaceArtwork[]> = {};
        const push = (key: string | undefined | null, artwork: MarketplaceArtwork) => {
          if (!key) return;
          const list = grouped[key] ?? (grouped[key] = []);
          if (list.length < 3 && !list.some((a) => a.id === artwork.id)) list.push(artwork);
        };
        [...items]
          .filter((a) => a.moderationStatus === 'Approved' && (a.thumbnailUrl || a.imageUrl))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .forEach((artwork) => {
            push(artwork.creatorProfileId, artwork);
            push((artwork.creatorName || '').trim().toLowerCase(), artwork);
          });
        setRecentByCreator(grouped);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
    <main className="min-h-screen bg-[#F7F2E9] px-4 pb-20 pt-8 text-[#241F1A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#B24A26]">
              Commission Directory
            </p>
            <h1 className="mt-2 font-h1 text-3xl font-bold text-[#241F1A] sm:text-4xl"> Tìm họa sĩ phù hợp yêu cầu đặt vẽ </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6E6459]"> Lọc theo danh mục chuyên môn từ bảng giá dịch vụ và hồ sơ tác phẩm để chọn đúng họa sĩ cho dự án của bạn. </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-2.5 text-sm font-medium text-[#A8321C] transition hover:border-[#B24A26]/50 hover:text-[#241F1A]"
          >
            <Palette className="h-4 w-4 text-[#B24A26]" />
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
                  ? 'border-[#B24A26] bg-[#B24A26] text-[#F7F2E9] shadow'
                  : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#B24A26]/40 hover:text-[#241F1A]'
              }`}
            > Tất cả họa sĩ </button>
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
                      ? 'border-[#B24A26] bg-[#B24A26] text-[#F7F2E9] shadow'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#B24A26]/40 hover:text-[#241F1A]'
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
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 focus-within:border-[#B24A26]/70">
            <Search className="h-4 w-4 text-[#B24A26]" />
            <input
              value={search}
              onChange={(e) => {
                setLoading(true);
                setSearch(e.target.value);
              }}
              placeholder="Tìm tên họa sĩ, phong cách hoặc chuyên môn..."
              className="w-full bg-transparent text-sm text-[#241F1A] outline-none placeholder:text-[#746A5F]"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-xs font-semibold text-[#A8321C]">
            <input
              type="checkbox"
              checked={onlyOpenSlots}
              onChange={(e) => {
                setLoading(true);
                setOnlyOpenSlots(e.target.checked);
              }}
              className="h-4 w-4 accent-[#B24A26]"
            />
            <span>Chỉ hiện họa sĩ còn lượt nhận đơn</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-sm text-[#6E6459]"> Đang tìm danh sách họa sĩ... </div>
        ) : creators.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center space-y-3">
            <p className="font-h1 text-lg text-[#241F1A]">Không tìm thấy họa sĩ phù hợp</p>
            <p className="text-xs text-[#746A5F]"> Hãy thử chọn danh mục khác hoặc bỏ giới hạn từ khóa tìm kiếm. </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setSelectedCategoryId('');
                setSearch('');
                setOnlyOpenSlots(false);
              }}
              className="text-sm text-[#B24A26] hover:underline cursor-pointer"
            > Xóa bộ lọc </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6]/85 p-5 transition hover:-translate-y-0.5 hover:border-[#B24A26]/50"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#221E1A]/12 bg-[#B24A26]/12 text-sm font-semibold text-[#8C3718]">
                      {avatarFor(creator) ? (
                        <Image
                          src={avatarFor(creator)}
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
                      <h2 className="truncate font-h1 text-base font-bold text-[#241F1A]">
                        {creator.displayName}
                      </h2>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#746A5F]">
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
                          className="rounded-full border border-[#B24A26]/30 bg-[#B24A26]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#A8321C]"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#221E1A]/10 pt-3 text-xs text-[#6E6459]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#8A6A1F]">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {creator.ratingAverage.toFixed(1)} ({creator.ratingCount})
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#746A5F]">
                        <Users className="h-3.5 w-3.5" />
                        <span>{creator.followerCount}</span>
                      </span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        creator.availableSlots > 0
                          ? 'border-[#2F6B63]/40 bg-[#2F6B63]/15 text-[#2F6B63]'
                          : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F]'
                      }`}
                    >
                      {creator.availableSlots > 0
                        ? `Còn ${creator.availableSlots} slot`
                        : 'Đang bận'}
                    </span>
                  </div>
                </div>

                {/* 3 tác phẩm mới nhất */}
                {(recentByCreator[creator.id] ?? recentByCreator[(creator.displayName || '').trim().toLowerCase()])?.length ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(recentByCreator[creator.id] ?? recentByCreator[(creator.displayName || '').trim().toLowerCase()] ?? []).map((art) => (
                      <Link
                        key={art.id}
                        href={`/artworks/${art.id}`}
                        scroll={false}
                        className="group relative block aspect-square overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]"
                        title={art.title}
                      >
                        <Image
                          src={art.thumbnailUrl || art.imageUrl}
                          alt={art.title}
                          fill
                          unoptimized
                          sizes="33vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#746A5F]">Chưa có tác phẩm nào được duyệt.</p>
                )}

                <Link
                  href={`/creators/${creator.id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B24A26] px-4 py-2.5 text-xs font-bold text-[#F7F2E9] transition hover:bg-[#8C3718]"
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
