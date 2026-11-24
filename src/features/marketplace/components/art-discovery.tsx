'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Palette, Search, SlidersHorizontal, Sparkles, Tag, Upload, X } from 'lucide-react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import { localizeStyle } from '../utils/style-labels';
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
  const ratio = '4 / 5';

  return (
    <button
      type="button"
      onClick={() => onSelect(artwork.id)}
      className="art-card text-left"
      aria-label={`Mở tác phẩm ${artwork.title}`}
    >
      <div className="art-card__frame" style={{ aspectRatio: ratio }}>
        <div className="art-card__img">
          <Image
            src={artwork.thumbnailUrl || artwork.imageUrl}
            alt={artwork.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        {artwork.isAiGenerated ? (
          <span className="badge badge--soon absolute right-3 top-3 z-10">
            <Sparkles className="size-3" aria-hidden /> AI
          </span>
        ) : null}
        <span className="art-card__zoom" aria-hidden="true">
          <Search className="size-4" />
        </span>
      </div>
      <div className="art-card__meta">
        <span className="art-card__title">{artwork.title}</span>
        <span className="art-card__sub">
          <span>{artwork.creatorName || 'Dillustration Creator'}</span>
        </span>
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#FFFCF6]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm bằng hình ảnh"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-[#221E1A]/10 bg-[#FFFCF6] p-5 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#B24A26]">
              AI Visual Search
            </p>
            <h2 className="mt-2 font-h1 text-2xl font-bold text-[#241F1A]"> Tìm phong cách bằng hình ảnh </h2>
            <p className="mt-2 text-sm text-[#6E6459]"> Tải ảnh tham khảo để khám phá các tác phẩm có phong cách tương đồng. </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#6E6459] hover:bg-[#F0E7D8] hover:text-[#241F1A]"
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
              ? 'border-[#B24A26] bg-[#B24A26]/15'
              : 'border-[#221E1A]/20 bg-[#FFFCF6] hover:border-[#B24A26]/70'
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
          <span className="relative z-10 rounded-2xl bg-[#B24A26]/20 p-4">
            <Upload className="h-7 w-7 text-[#D7DBFF]" />
          </span>
          <span className="relative z-10 mt-4 text-sm font-semibold text-[#241F1A]"> Kéo thả ảnh vào đây hoặc chọn ảnh </span>
          <span className="relative z-10 mt-1 text-xs text-[#6E6459]">
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
              <Sparkles className="h-4 w-4 text-[#B24A26]" />
              <h3 className="font-h1 text-lg font-semibold text-[#241F1A]">Tác phẩm gợi ý</h3>
              <span className="text-xs text-[#6E6459]">{resultItems.length} kết quả tương đồng</span>
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
                  className="group overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] text-left"
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
                  <p className="truncate p-2 text-xs text-[#241F1A]">{artwork.title}</p>
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
  const [page, setPage] = useState(1);
  const [serverTotalCount, setServerTotalCount] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  // debounce 300ms để không bắn 1 request mỗi lần gõ phím
  const [serverQuery, setServerQuery] = useState('');

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

  // ── Phân trang THẬT ─────────────────────────────────────────────────────────
  // Server cắt dữ liệu theo `page/pageSize`; `filtered` chỉ áp cho các filter
  // không hỗ trợ ở API (giá, rating, slot) trên đúng trang đang xem.
  const PAGE_SIZE = 12;
  const isFollowingTab = feedTab === 'following';
  const displayed = isFollowingTab ? followingArtworks : filtered;
  const totalCount = isFollowingTab ? followingArtworks.length : serverTotalCount;
  const totalPages = isFollowingTab
    ? Math.max(1, Math.ceil(followingArtworks.length / PAGE_SIZE))
    : Math.max(1, serverTotalPages);
  const currentPage = Math.min(page, totalPages);
  const paged = isFollowingTab
    ? displayed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : displayed;

  // đổi filter/tab → quay về trang 1
  useEffect(() => {
    setPage(1);
  }, [query, selectedCategory, selectedTag, license, onlyOpenSlots, minPrice, maxPrice, minRating, feedTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => setServerQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // tải lại trang khi page / search / category đổi (gọi API thật)
  useEffect(() => {
    if (isFollowingTab) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const res = await marketplaceService.getArtworksPage({
          page,
          pageSize: PAGE_SIZE,
          search: serverQuery || undefined,
          categoryId: activeCategoryObj?.id,
        });
        if (!active) return;
        setArtworks(res.items);
        setServerTotalCount(res.totalCount);
        setServerTotalPages(res.totalPages);
      } catch {
        if (active) {
          setArtworks([]);
          setServerTotalCount(0);
          setServerTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
     
  }, [page, serverQuery, activeCategoryObj?.id, isFollowingTab]);

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
    <main className="wrap page shell text-[#241F1A]">
      <div className="mx-auto max-w-7xl">
        <header className="page-head">
          <div>
            <p className="eyebrow">Khám phá nghệ thuật</p>
            <h1>Chợ tranh dành riêng cho bạn</h1>
            <p className="page-head__sub"> Khám phá tác phẩm và những nghệ sĩ phù hợp với gu thẩm mỹ của bạn — chỉ tác phẩm đã kiểm duyệt. </p>
          </div>
          <div className="page-head__actions">
            <button
              type="button"
              onClick={() => setShowImageSearch(true)}
              className="btn btn--outline btn--sm"
            >
              <ImagePlus className="size-4" aria-hidden /> Tìm bằng hình ảnh </button>
          </div>
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
              className={`chip shrink-0 cursor-pointer ${
                !selectedCategory
                  ? '!border-[#B24A26] !bg-[#B24A26] !text-[#FFFCF6] font-semibold'
                  : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#B24A26]/40 hover:text-[#241F1A]'
              }`}
            > Tất cả danh mục </button>
            {categories.map((cat) => {
              const active =
                activeCategoryObj?.id === cat.id ||
                selectedCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(active ? '' : cat.slug)}
                  className={`chip shrink-0 cursor-pointer ${
                    active
                      ? '!border-[#B24A26] !bg-[#B24A26] !text-[#FFFCF6] font-semibold'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#B24A26]/40 hover:text-[#241F1A]'
                  }`}
                >
                  <span>{localizeStyle(cat.name)}</span>
                  {cat.artworkCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? 'bg-[#F7F2E9]/20 text-[#F7F2E9]' : 'bg-[#F0E7D8] text-[#746A5F]'
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
          <section className="relative mb-8 overflow-hidden rounded-[20px] border border-[#221E1A]/10 bg-[#F0E7D8] shadow-[0_24px_44px_-38px_rgba(74,52,30,0.85)]">
            {/* ảnh sự kiện chìm phía sau, phủ scrim giấy/navy để chữ luôn đọc được */}
            {featuredBanners[0].imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featuredBanners[0].imageUrl}
                alt=""
                aria-hidden="true"
                className="home-banner__img pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div aria-hidden="true" className="home-banner__scrim pointer-events-none absolute inset-0" />

            <div className="relative flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
              <div className="max-w-xl">
                <span className="badge badge--live uppercase tracking-[0.12em]">Sự kiện nổi bật</span>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.4rem,2.2vw,1.9rem)] leading-tight text-[#241F1A]">
                  {featuredBanners[0].title}
                </h2>
                <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-[#6E6459]">
                  {featuredBanners[0].subtitle}
                </p>
              </div>
              {/* CTA phải dẫn thật: API đã trả `ctaUrl` (vd /artworks/{id}) — trước đây là <button> không handler */}
              <Link
                href={featuredBanners[0].ctaUrl || '/explore'}
                className="btn btn--primary btn--sm shrink-0"
              >
                {featuredBanners[0].ctaLabel ?? 'Khám phá sự kiện'}
              </Link>
            </div>
          </section>
        )}

        {/* Search with Autocomplete & Filters */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          <div ref={searchBoxRef} className="relative flex-1">
            <div className="flex items-center gap-3 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 focus-within:border-[#B24A26]/70">
              <Search className="h-5 w-5 text-[#B24A26]" />
              <input
                value={query}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Tìm tác phẩm, danh mục, #tag hoặc tên nghệ sĩ..."
                className="w-full bg-transparent text-sm text-[#241F1A] outline-none placeholder:text-[#746A5F]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-[#746A5F] hover:text-[#241F1A]"
                  aria-label="Xóa từ khóa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {searchFocused &&
              (suggestions.categories.length > 0 || suggestions.tags.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 shadow-2xl space-y-3">
                  {suggestions.categories.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B24A26]">
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
                            className="rounded-full border border-[#B24A26]/35 bg-[#B24A26]/15 px-3 py-1 text-xs font-semibold text-[#E1E4FF] hover:bg-[#B24A26]/25 cursor-pointer"
                          >
                            {localizeStyle(cat.name)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.tags.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B24A26]">
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
                            className="rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1 text-xs text-[#6E6459] hover:border-[#B24A26]/40 hover:text-[#241F1A] cursor-pointer"
                          >
                            #{t.name}{' '}
                            <span className="text-[10px] text-[#746A5F]">({t.artworkCount})</span>
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
                ? 'border-[#B24A26] bg-[#B24A26]/15 text-[#241F1A]'
                : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:border-[#B24A26]/60'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc </button>
        </div>

        {/* Active tag pill */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="text-[#746A5F]">Đang lọc theo tag:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B24A26]/40 bg-[#B24A26]/15 px-3 py-1 font-semibold text-[#E1E4FF]">
              #{selectedTag}
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="hover:text-[#241F1A] cursor-pointer"
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B24A26]"> Khoảng giá </p>
                <div className="flex gap-2">
                  <input
                    aria-label="Giá tối thiểu"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Từ"
                    className="min-w-0 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-xs outline-none focus:border-[#B24A26]"
                  />
                  <input
                    aria-label="Giá tối đa"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Đến"
                    className="min-w-0 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-xs outline-none focus:border-[#B24A26]"
                  />
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B24A26]"> Đánh giá </p>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-xs outline-none"
                >
                  <option value={0}>Tất cả đánh giá</option>
                  <option value={4}>4★ trở lên</option>
                  <option value={4.5}>4.5★ trở lên</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 pt-6 text-sm text-[#6E6459]" title="Slot = số đơn họa sĩ còn nhận thêm trong tháng. Bật để chỉ xem họa sĩ đang nhận đơn.">
                <input
                  checked={onlyOpenSlots}
                  onChange={(event) => setOnlyOpenSlots(event.target.checked)}
                  type="checkbox"
                  className="h-4 w-4 accent-[#B24A26]"
                /> họa sĩ còn lượt </label>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B24A26]"> Bản quyền <span className="ml-1.5 font-normal normal-case tracking-normal text-[#635b51]" title="Cá nhân = dùng phi thương mại (in treo nhà, quà tặng, học tập). Thương mại = được dùng trong sản phẩm/dịch vụ bán ra."> (cá nhân / thương mại) </span>
                </p>
                <select
                  value={license}
                  onChange={(event) => setLicense(event.target.value as License)}
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-xs outline-none"
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
          <div className="flex rounded-full bg-[#FFFCF6] p-1">
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
                    ? 'bg-[#B24A26] font-semibold text-[#F7F2E9]'
                    : 'text-[#6E6459] hover:text-[#241F1A]'
                }`}
              >
                {tab === 'recommended' && <Sparkles className="mr-1 inline h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#6E6459]">{totalCount} tác phẩm phù hợp · trang {currentPage}/{totalPages}</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-sm text-[#6E6459]"> Đang tải chợ tranh... </div>
        ) : displayed.length ? (
          <>
          <div className="wall wall--grid">
            {paged.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                index={index}
                onSelect={setSelectedArtworkId}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
              <button type="button" className="btn btn--outline btn--sm" disabled={currentPage === 1} onClick={() => { setPage((v) => Math.max(1, v - 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>Trước</button>
              {Array.from({ length: totalPages }).map((_, n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={currentPage === n + 1 ? 'page' : undefined}
                  onClick={() => setPage(n + 1)}
                  className={`fpill min-w-10 justify-center ${currentPage === n + 1 ? '!bg-[#B24A26] !text-[#FFFCF6]' : ''}`}
                >
                  {n + 1}
                </button>
              ))}
              <button type="button" className="btn btn--outline btn--sm" disabled={currentPage === totalPages} onClick={() => { setPage((v) => Math.min(totalPages, v + 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>Sau</button>
            </nav>
          )}
          </>
        ) : (
          <div className="empty">
            <h3>Chưa tìm thấy tác phẩm phù hợp</h3>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-[#B24A26] hover:underline"
            > Xóa bộ lọc </button>
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
