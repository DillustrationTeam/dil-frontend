'use client';

import Image from 'next/image';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Palette, Search, SlidersHorizontal, Sparkles, Tag, Upload, X } from 'lucide-react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import {
  categoriesService,
  type CategoryDto,
  type SearchSuggestionsDto,
} from '../services/categories.service';
import { ArtworkDetailModal } from './artwork-detail';

type FeedTab = 'recommended' | 'following';
type License = 'all' | 'personal' | 'commercial';

function contains(artwork: MarketplaceArtwork, value: string) {
  const normalized = value.replace(/^#+/, '').trim().toLocaleLowerCase();
  if (!normalized) return true;
  const haystack = [
    artwork.title,
    artwork.description,
    artwork.creatorName,
    artwork.categoryName,
    artwork.style,
    ...(artwork.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
  return haystack.includes(normalized);
}

function ArtworkCard({
  artwork,
  index,
  onSelect,
}: {
  artwork: MarketplaceArtwork;
  index: number;
  onSelect: (id: string) => void;
}) {
  const categoryLabel = artwork.categoryName || artwork.style;

  return (
    <button
      type="button"
      onClick={() => onSelect(artwork.id)}
      className="group mb-5 block w-full text-left break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-[#A7ACD9]/60 hover:bg-white/[0.07]"
    >
      <div
        className={`relative overflow-hidden ${
          index % 3 === 0 ? 'aspect-[4/5]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/4.7]'
        }`}
      >
        <Image
          src={artwork.thumbnailUrl || artwork.imageUrl}
          alt={artwork.title}
          fill
          unoptimized
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {categoryLabel && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-[#A7ACD9]/45 bg-[#121525]/85 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#E1E4FF] backdrop-blur-md">
            {categoryLabel}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121525]/85 to-transparent p-4 pt-16 opacity-0 transition group-hover:opacity-100">
          <span className="text-xs font-medium text-white">Xem chi tiết tác phẩm</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-h1 truncate text-sm font-semibold text-white">{artwork.title}</h3>
            <p className="mt-1 truncate text-xs text-[#C7C5CF]">
              {artwork.creatorName || 'Nghệ sĩ Dillustration'}
            </p>
          </div>
          {artwork.isAiGenerated && (
            <Sparkles aria-label="AI generated" className="h-4 w-4 shrink-0 text-[#A7ACD9]" />
          )}
        </div>
        {artwork.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {artwork.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#A7ACD9]/10 px-2 py-0.5 text-[10px] text-[#C7C5CF]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function ImageSearchModal({
  onClose,
  onSelectArtwork,
}: {
  onClose: () => void;
  onSelectArtwork: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [resultItems, setResultItems] = useState<MarketplaceArtwork[]>([]);

  const setFile = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (preview) URL.revokeObjectURL(preview);
    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    try {
      const matched = await marketplaceService.visualSearch({
        referenceImageUrl: nextPreview,
        tags: ['digital-art'],
        take: 8,
      });
      setResultItems(matched);
    } catch {
      setResultItems([]);
    }
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0]);
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setFile(event.dataTransfer.files[0]);
  };
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0d16]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm bằng hình ảnh"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/15 bg-[#20253b] p-5 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#A7ACD9]">
              AI Visual Search
            </p>
            <h2 className="mt-2 font-h1 text-2xl font-bold text-white">
              Tìm phong cách bằng hình ảnh
            </h2>
            <p className="mt-2 text-sm text-[#C7C5CF]">
              Tải ảnh tham khảo để khám phá các tác phẩm có phong cách tương đồng.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#C7C5CF] hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
          >
            <X />
          </button>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={drop}
          className={`relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed p-6 transition ${
            isDragging
              ? 'border-[#A7ACD9] bg-[#A7ACD9]/15'
              : 'border-white/25 bg-white/[.035] hover:border-[#A7ACD9]/70'
          }`}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Ảnh tham khảo đã tải lên"
              fill
              unoptimized
              className="object-cover opacity-65"
            />
          ) : null}
          <span className="relative z-10 rounded-2xl bg-[#A7ACD9]/20 p-4">
            <Upload className="h-7 w-7 text-[#D7DBFF]" />
          </span>
          <span className="relative z-10 mt-4 text-sm font-semibold text-white">
            Kéo thả ảnh vào đây hoặc chọn ảnh
          </span>
          <span className="relative z-10 mt-1 text-xs text-[#C7C5CF]">
            PNG, JPG, WEBP · tối đa 10 MB
          </span>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={upload}
          />
        </button>
        {preview && (
          <div className="mt-7">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A7ACD9]" />
              <h3 className="font-h1 text-lg font-semibold text-white">Tác phẩm gợi ý</h3>
              <span className="text-xs text-[#C7C5CF]">{resultItems.length} kết quả tương đồng</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {resultItems.slice(0, 8).map((artwork) => (
                <button
                  key={artwork.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectArtwork(artwork.id);
                  }}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.thumbnailUrl || artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      unoptimized
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <p className="truncate p-2 text-xs text-white">{artwork.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArtDiscovery({
  initialSearch = false,
  initialQuery = '',
  initialCategory = '',
  initialTag = '',
}: {
  initialSearch?: boolean;
  initialQuery?: string;
  initialCategory?: string;
  initialTag?: string;
}) {
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [followingArtworks, setFollowingArtworks] = useState<MarketplaceArtwork[]>([]);
  const [featuredBanners, setFeaturedBanners] = useState<
    { title: string; subtitle: string; imageUrl: string; ctaLabel?: string; ctaUrl?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<FeedTab>('recommended');
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [license, setLicense] = useState<License>('all');
  const [onlyOpenSlots, setOnlyOpenSlots] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(initialSearch);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  // Autocomplete state
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsDto>({ categories: [], tags: [] });
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!searchFocused) return;
    let active = true;
    const timer = window.setTimeout(() => {
      categoriesService
        .getSearchSuggestions(query)
        .then((res) => {
          if (active) setSuggestions(res);
        })
        .catch(() => undefined);
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, searchFocused]);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const [home, allArtworks, creators, categoryList] = await Promise.all([
          marketplaceService.getMarketplaceHome(12),
          marketplaceService.getArtworks(),
          marketplaceService.getCreators(),
          categoriesService.getCategories().catch(() => []),
        ]);
        setFeaturedBanners(home.featuredBanners ?? []);
        setCategories(categoryList);
        setArtworks(
          allArtworks.map((artwork) => {
            const creator = creators.find((item) => item.id === artwork.creatorProfileId);
            return {
              ...artwork,
              creatorName: artwork.creatorName || creator?.displayName,
              creatorHeadline: artwork.creatorHeadline || creator?.headline,
              creatorRating: artwork.creatorRating || creator?.ratingAverage || 0,
              availableSlots: artwork.availableSlots ?? creator?.availableSlots ?? 0,
            };
          })
        );
        setFollowingArtworks(home.followingArtworks ?? []);
      } catch {
        try {
          const [fallback, categoryList] = await Promise.all([
            marketplaceService.getArtworks(),
            categoriesService.getCategories().catch(() => []),
          ]);
          setArtworks(fallback);
          setCategories(categoryList);
          setFollowingArtworks([]);
        } catch {
          setArtworks([]);
          setFollowingArtworks([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, []);

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    const key = selectedCategory.trim().toLowerCase();
    return (
      categories.find(
        (c) =>
          c.id.toLowerCase() === key ||
          c.slug.toLowerCase() === key ||
          c.name.toLowerCase() === key
      ) ?? null
    );
  }, [categories, selectedCategory]);

  const filtered = useMemo(() => {
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;

    return artworks.filter((artwork) => {
      const matchesQuery = !query || contains(artwork, query);

      let matchesCategory = true;
      if (selectedCategory) {
        if (activeCategoryObj) {
          matchesCategory =
            artwork.categoryId === activeCategoryObj.id ||
            artwork.categoryName?.toLowerCase() === activeCategoryObj.name.toLowerCase() ||
            artwork.style?.toLowerCase() === activeCategoryObj.name.toLowerCase();
        } else {
          matchesCategory = contains(artwork, selectedCategory);
        }
      }

      const matchesTag =
        !selectedTag ||
        (artwork.tags ?? []).some(
          (t) => t.toLowerCase() === selectedTag.replace(/^#+/, '').toLowerCase()
        );

      const matchesLicense =
        license === 'all' ||
        (artwork.licenseType
          ? artwork.licenseType.toLowerCase() === license
          : contains(artwork, license));

      const matchesOpenSlots = !onlyOpenSlots || (artwork.availableSlots ?? 0) > 0;
      const matchesMinPrice = minP == null || Number.isNaN(minP) || (artwork.startingPrice ?? 0) >= minP;
      const matchesMaxPrice = maxP == null || Number.isNaN(maxP) || (artwork.startingPrice ?? 0) <= maxP;
      const matchesRating = minRating <= 0 || (artwork.creatorRating ?? 0) >= minRating;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesTag &&
        matchesLicense &&
        matchesOpenSlots &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRating
      );
    });
  }, [
    artworks,
    query,
    selectedCategory,
    activeCategoryObj,
    selectedTag,
    license,
    onlyOpenSlots,
    minPrice,
    maxPrice,
    minRating,
  ]);

  const displayed = feedTab === 'following' ? followingArtworks : filtered;

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setLicense('all');
    setOnlyOpenSlots(false);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
  };

  return (
    <main className="min-h-screen bg-[#1F2335] px-4 pb-20 pt-8 text-[#E4E1E5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">
              Khám phá nghệ thuật
            </p>
            <h1 className="mt-2 font-h1 text-3xl font-bold text-white sm:text-4xl">
              Chợ tranh dành riêng cho bạn
            </h1>
            <p className="mt-3 max-w-xl text-sm text-[#C7C5CF]">
              Khám phá tác phẩm và những nghệ sĩ phù hợp với gu thẩm mỹ của bạn.
            </p>
          </div>
          <button
            onClick={() => setShowImageSearch(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A7ACD9]/50 bg-[#A7ACD9]/10 px-5 py-3 text-sm font-semibold text-[#E1E4FF] transition hover:bg-[#A7ACD9]/20"
          >
            <ImagePlus className="h-4 w-4" />
            Tìm bằng hình ảnh
          </button>
        </header>

        {/* Category Pills Bar (1-click filter) */}
        {categories.length > 0 && (
          <nav
            aria-label="Lọc theo danh mục lớn"
            className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                !selectedCategory
                  ? 'border-[#A7ACD9] bg-[#A7ACD9] text-[#1F2335] shadow'
                  : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-white'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((cat) => {
              const active =
                activeCategoryObj?.id === cat.id ||
                selectedCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(active ? '' : cat.slug)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'border-[#A7ACD9] bg-[#A7ACD9] text-[#1F2335] shadow'
                      : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.artworkCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? 'bg-[#1F2335]/20 text-[#1F2335]' : 'bg-white/10 text-[#919099]'
                      }`}
                    >
                      {cat.artworkCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {featuredBanners.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-[#A7ACD9]/30 bg-gradient-to-r from-[#585a91] via-[#343a65] to-[#20253b] p-6 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Sự kiện nổi bật
                </span>
                <h2 className="mt-4 font-h1 text-2xl font-bold text-white">
                  {featuredBanners[0].title}
                </h2>
                <p className="mt-2 text-sm text-[#DDE0FF]">{featuredBanners[0].subtitle}</p>
              </div>
              <button className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#292e50] transition hover:bg-[#E7E9FF]">
                {featuredBanners[0].ctaLabel ?? 'Khám phá sự kiện'}
              </button>
            </div>
          </section>
        )}

        {/* Search with Autocomplete & Filters */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          <div ref={searchBoxRef} className="relative flex-1">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 focus-within:border-[#A7ACD9]/70">
              <Search className="h-5 w-5 text-[#A7ACD9]" />
              <input
                value={query}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Tìm tác phẩm, danh mục, #tag hoặc tên nghệ sĩ..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#919099]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-[#919099] hover:text-white"
                  aria-label="Xóa từ khóa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {searchFocused &&
              (suggestions.categories.length > 0 || suggestions.tags.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-white/15 bg-[#171a2a] p-4 shadow-2xl space-y-3">
                  {suggestions.categories.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A7ACD9]">
                        <Palette className="h-3 w-3" />
                        <span>Danh mục lớn</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.slug);
                              setQuery('');
                              setSearchFocused(false);
                            }}
                            className="rounded-full border border-[#A7ACD9]/35 bg-[#A7ACD9]/15 px-3 py-1 text-xs font-semibold text-[#E1E4FF] hover:bg-[#A7ACD9]/25 cursor-pointer"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.tags.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A7ACD9]">
                        <Tag className="h-3 w-3" />
                        <span>Tag con phổ biến</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.tags.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTag(t.name);
                              setQuery('');
                              setSearchFocused(false);
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#C7C5CF] hover:border-[#A7ACD9]/40 hover:text-white cursor-pointer"
                          >
                            #{t.name}{' '}
                            <span className="text-[10px] text-[#919099]">({t.artworkCount})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          <button
            onClick={() => setShowFilters((value) => !value)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition cursor-pointer ${
              showFilters
                ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 text-white'
                : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/60'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>

        {/* Active tag pill */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="text-[#919099]">Đang lọc theo tag:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7ACD9]/40 bg-[#A7ACD9]/15 px-3 py-1 font-semibold text-[#E1E4FF]">
              #{selectedTag}
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="hover:text-white cursor-pointer"
                aria-label="Xóa lọc tag"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}

        {showFilters && (
          <section className="glass-container mb-8 rounded-3xl p-5">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">
                  Khoảng giá
                </p>
                <div className="flex gap-2">
                  <input
                    aria-label="Giá tối thiểu"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Từ"
                    className="min-w-0 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none focus:border-[#A7ACD9]"
                  />
                  <input
                    aria-label="Giá tối đa"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Đến"
                    className="min-w-0 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none focus:border-[#A7ACD9]"
                  />
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">
                  Đánh giá
                </p>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none"
                >
                  <option value={0}>Tất cả đánh giá</option>
                  <option value={4}>4★ trở lên</option>
                  <option value={4.5}>4.5★ trở lên</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 pt-6 text-sm text-[#C7C5CF]">
                <input
                  checked={onlyOpenSlots}
                  onChange={(event) => setOnlyOpenSlots(event.target.checked)}
                  type="checkbox"
                  className="h-4 w-4 accent-[#A7ACD9]"
                />
                Artist còn slot
              </label>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">
                  Bản quyền
                </p>
                <select
                  value={license}
                  onChange={(event) => setLicense(event.target.value as License)}
                  className="w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="personal">Cá nhân</option>
                  <option value="commercial">Thương mại</option>
                </select>
              </div>
            </div>
          </section>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-full bg-white/5 p-1">
            {(
              [
                ['recommended', 'Dành cho bạn'],
                ['following', 'Đang theo dõi'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setFeedTab(tab)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  feedTab === tab
                    ? 'bg-[#A7ACD9] font-semibold text-[#1F2335]'
                    : 'text-[#C7C5CF] hover:text-white'
                }`}
              >
                {tab === 'recommended' && <Sparkles className="mr-1 inline h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#C7C5CF]">{displayed.length} tác phẩm phù hợp</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-sm text-[#C7C5CF]">
            Đang tải chợ tranh...
          </div>
        ) : displayed.length ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {displayed.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                index={index}
                onSelect={setSelectedArtworkId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center">
            <p className="font-h1 text-lg text-white">Chưa tìm thấy tác phẩm phù hợp</p>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-[#A7ACD9] hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
      {showImageSearch && (
        <ImageSearchModal
          onClose={() => setShowImageSearch(false)}
          onSelectArtwork={setSelectedArtworkId}
        />
      )}
      {selectedArtworkId && (
        <ArtworkDetailModal id={selectedArtworkId} onClose={() => setSelectedArtworkId(null)} />
      )}
    </main>
  );
}
