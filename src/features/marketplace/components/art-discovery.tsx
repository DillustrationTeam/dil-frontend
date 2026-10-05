'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Search, SlidersHorizontal, Sparkles, Upload, X } from 'lucide-react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import { ArtworkDetailModal } from './artwork-detail';
import { useAuthStore } from '@/store/use-auth-store';

type FeedTab = 'recommended' | 'following';
type License = 'all' | 'personal' | 'commercial';

const styles = ['Anime', 'Realistic', 'Chibi', 'Fantasy', 'Portrait', 'Landscape'];

function contains(artwork: MarketplaceArtwork, value: string) {
  const haystack = [artwork.title, artwork.description, artwork.creatorName, artwork.style, ...(artwork.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
  return haystack.includes(value.toLocaleLowerCase());
}

function ArtworkCard({ artwork, onSelect }: { artwork: MarketplaceArtwork; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(artwork.id)}
      className="group mb-5 block w-full text-left break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-[#A7ACD9]/60 hover:bg-white/[0.07]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black/20">
        <Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain transition duration-700 group-hover:scale-[1.02]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121525]/85 to-transparent p-4 pt-16 opacity-0 transition group-hover:opacity-100">
          <span className="text-xs font-medium text-white">Xem chi tiết tác phẩm</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-h1 text-sm font-semibold text-white">{artwork.title}</h3>
            <p className="mt-1 text-xs text-[#C7C5CF]">{artwork.creatorName || 'Nghệ sĩ Dillustration'}</p>
          </div>
          {artwork.isAiGenerated && <Sparkles aria-label="AI generated" className="h-4 w-4 shrink-0 text-[#A7ACD9]" />}
        </div>
        {artwork.tags?.length ? <div className="flex flex-wrap gap-1.5">{artwork.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#A7ACD9]/10 px-2 py-1 text-[10px] text-[#C7C5CF]">#{tag}</span>)}</div> : null}
      </div>
    </button>
  );
}

function ImageSearchModal({ onClose, onSelectArtwork }: { onClose: () => void; onSelectArtwork: (id: string) => void }) {
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
      const matched = await marketplaceService.visualSearch({ referenceImageUrl: nextPreview, tags: ['digital-art'], take: 8 });
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
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0d16]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tìm kiếm bằng hình ảnh">
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/15 bg-[#20253b] p-5 shadow-2xl md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#A7ACD9]">AI Visual Search</p><h2 className="mt-2 font-h1 text-2xl font-bold text-white">Tìm phong cách bằng hình ảnh</h2><p className="mt-2 text-sm text-[#C7C5CF]">Tải ảnh tham khảo để khám phá các tác phẩm có phong cách tương đồng.</p></div><button onClick={onClose} className="rounded-full p-2 text-[#C7C5CF] hover:bg-white/10 hover:text-white" aria-label="Đóng"><X /></button></div>
      <button onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={drop} className={`relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed p-6 transition ${isDragging ? 'border-[#A7ACD9] bg-[#A7ACD9]/15' : 'border-white/25 bg-white/[.035] hover:border-[#A7ACD9]/70'}`}>
        {preview ? <Image src={preview} alt="Ảnh tham khảo đã tải lên" fill unoptimized className="object-contain opacity-65" /> : null}
        <span className="relative z-10 rounded-2xl bg-[#A7ACD9]/20 p-4"><Upload className="h-7 w-7 text-[#D7DBFF]" /></span><span className="relative z-10 mt-4 text-sm font-semibold text-white">Kéo thả ảnh vào đây hoặc chọn ảnh</span><span className="relative z-10 mt-1 text-xs text-[#C7C5CF]">PNG, JPG, WEBP · tối đa 10 MB</span><input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
      </button>
      {preview && <div className="mt-7"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#A7ACD9]" /><h3 className="font-h1 text-lg font-semibold text-white">Tác phẩm gợi ý</h3><span className="text-xs text-[#C7C5CF]">{resultItems.length} kết quả tương đồng</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{resultItems.slice(0, 8).map((artwork) => <button key={artwork.id} type="button" onClick={() => { onClose(); onSelectArtwork(artwork.id); }} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"><div className="relative aspect-square"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-cover transition group-hover:scale-105" /></div><p className="truncate p-2 text-xs text-white">{artwork.title}</p></button>)}</div></div>}
    </div>
  </div>;
}

export function ArtDiscovery({ initialSearch = false }: { initialSearch?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [followingArtworks, setFollowingArtworks] = useState<MarketplaceArtwork[]>([]);
  const [featuredBanners, setFeaturedBanners] = useState<{ title: string; subtitle: string; imageUrl: string; ctaLabel?: string; ctaUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedForAuth, setLoadedForAuth] = useState<boolean | null>(null);
  const [followingError, setFollowingError] = useState('');
  const [feedTab, setFeedTab] = useState<FeedTab>('recommended');
  const [query, setQuery] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [license, setLicense] = useState<License>('all');
  const [onlyOpenSlots, setOnlyOpenSlots] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [showFilters, setShowFilters] = useState(initialSearch);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadHome = async () => {
      const [homeResult, followingResult] = await Promise.allSettled([
        marketplaceService.getMarketplaceHome(12),
        isAuthenticated ? marketplaceService.getFollowingFeed(30) : Promise.resolve([]),
      ]);
      if (!active) return;

      if (homeResult.status === 'fulfilled') {
        setFeaturedBanners(homeResult.value.featuredBanners ?? []);
        setArtworks(homeResult.value.recommendedArtworks ?? []);
      } else {
        try {
          setArtworks(await marketplaceService.getArtworks());
        } catch {
          setArtworks([]);
        }
      }

      if (!isAuthenticated) {
        setFollowingArtworks([]);
        setFollowingError('');
      } else if (followingResult.status === 'fulfilled') {
        setFollowingArtworks(followingResult.value);
        setFollowingError('');
      } else {
        setFollowingArtworks([]);
        setFollowingError('Không thể tải feed đang theo dõi.');
      }
      setLoading(false);
      setLoadedForAuth(isAuthenticated);
    };

    void loadHome();
    return () => { active = false; };
  }, [isAuthenticated]);

  const filtered = useMemo(() => (feedTab === 'following' ? followingArtworks : artworks).filter((artwork) => {
    const matchesQuery = !query || contains(artwork, query);
    const matchesStyle = !selectedStyles.length || selectedStyles.some((style) => contains(artwork, style));
    const matchesLicense = license === 'all' || artwork.licenseType?.toLocaleLowerCase() === license;
    const matchesPrice = (!minPrice || (artwork.startingPrice != null && artwork.startingPrice >= Number(minPrice)))
      && (!maxPrice || (artwork.startingPrice != null && artwork.startingPrice <= Number(maxPrice)));
    return matchesQuery && matchesStyle && matchesLicense && matchesPrice
      && (!minRating || (artwork.creatorRating ?? 0) >= Number(minRating))
      && (!onlyOpenSlots || (artwork.availableSlots ?? 0) > 0);
  }), [artworks, followingArtworks, feedTab, query, selectedStyles, onlyOpenSlots, license, minPrice, maxPrice, minRating]);

  const displayed = filtered;
  const toggleStyle = (style: string) => setSelectedStyles((value) => value.includes(style) ? value.filter((item) => item !== style) : [...value, style]);

  return <main className="min-h-screen bg-[#1F2335] px-4 pb-20 pt-8 text-[#E4E1E5] sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Khám phá nghệ thuật</p><h1 className="mt-2 font-h1 text-3xl font-bold text-white sm:text-4xl">Chợ tranh dành riêng cho bạn</h1><p className="mt-3 max-w-xl text-sm text-[#C7C5CF]">Khám phá tác phẩm và những nghệ sĩ phù hợp với gu thẩm mỹ của bạn.</p></div><button onClick={() => setShowImageSearch(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A7ACD9]/50 bg-[#A7ACD9]/10 px-5 py-3 text-sm font-semibold text-[#E1E4FF] transition hover:bg-[#A7ACD9]/20"><ImagePlus className="h-4 w-4" />Tìm bằng hình ảnh</button></header>
    {featuredBanners.length > 0 && <section className="mb-8 overflow-hidden rounded-3xl border border-[#A7ACD9]/30 bg-gradient-to-r from-[#585a91] via-[#343a65] to-[#20253b] p-6 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="max-w-xl"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Sự kiện nổi bật</span><h2 className="mt-4 font-h1 text-2xl font-bold text-white">{featuredBanners[0].title}</h2><p className="mt-2 text-sm text-[#DDE0FF]">{featuredBanners[0].subtitle}</p></div><button className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#292e50] transition hover:bg-[#E7E9FF]">{featuredBanners[0].ctaLabel ?? 'Khám phá sự kiện'}</button></div></section>}
    <div className="mb-6 flex flex-col gap-3 lg:flex-row"><div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 focus-within:border-[#A7ACD9]/70"><Search className="h-5 w-5 text-[#A7ACD9]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tác phẩm, nghệ sĩ hoặc phong cách..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#919099]" /></div><button onClick={() => setShowFilters((value) => !value)} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition ${showFilters ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 text-white' : 'border-white/10 bg-white/5 text-[#C7C5CF] hover:border-[#A7ACD9]/60'}`}><SlidersHorizontal className="h-4 w-4" />Bộ lọc</button></div>
    {showFilters && <section className="glass-container mb-8 rounded-3xl p-5"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5"><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">Phong cách</p><div className="flex flex-wrap gap-2">{styles.map((style) => <button key={style} onClick={() => toggleStyle(style)} className={`rounded-full px-3 py-1.5 text-xs transition ${selectedStyles.includes(style) ? 'bg-[#A7ACD9] text-[#1F2335]' : 'bg-white/5 text-[#C7C5CF] hover:bg-white/10'}`}>{style}</button>)}</div></div><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">Khoảng giá</p><div className="flex gap-2"><input aria-label="Giá tối thiểu" type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Từ (VNĐ)" className="min-w-0 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none focus:border-[#A7ACD9]" /><input aria-label="Giá tối đa" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Đến (VNĐ)" className="min-w-0 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none focus:border-[#A7ACD9]" /></div></div><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">Đánh giá</p><select value={minRating} onChange={(event) => setMinRating(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none"><option value="">Tất cả đánh giá</option><option value="4">4★ trở lên</option><option value="4.5">4.5★ trở lên</option></select></div><label className="flex cursor-pointer items-center gap-3 pt-6 text-sm text-[#C7C5CF]"><input checked={onlyOpenSlots} onChange={(event) => setOnlyOpenSlots(event.target.checked)} type="checkbox" className="h-4 w-4 accent-[#A7ACD9]" />Artist còn slot</label><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#A7ACD9]">Bản quyền</p><select value={license} onChange={(event) => setLicense(event.target.value as License)} className="w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs outline-none"><option value="all">Tất cả</option><option value="personal">Cá nhân</option><option value="commercial">Thương mại</option></select></div></div></section>}
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex rounded-full bg-white/5 p-1">{([['recommended', 'Dành cho bạn'], ['following', 'Đang theo dõi']] as const).map(([tab, label]) => <button key={tab} onClick={() => setFeedTab(tab)} className={`rounded-full px-4 py-2 text-sm transition ${feedTab === tab ? 'bg-[#A7ACD9] font-semibold text-[#1F2335]' : 'text-[#C7C5CF] hover:text-white'}`}>{tab === 'recommended' && <Sparkles className="mr-1 inline h-3.5 w-3.5" />}{label}</button>)}</div><p className="text-sm text-[#C7C5CF]">{displayed.length} tác phẩm phù hợp</p></div>
    {feedTab === 'following' && !isAuthenticated ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center"><p className="font-h1 text-lg text-white">Đăng nhập để xem nghệ sĩ bạn theo dõi</p><Link href="/login" className="mt-3 inline-block text-sm text-[#A7ACD9] hover:underline">Đăng nhập</Link></div> : feedTab === 'following' && followingError ? <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-8 text-center text-sm text-rose-200">{followingError}</div> : loading || loadedForAuth !== isAuthenticated ? <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-sm text-[#C7C5CF]">Đang tải chợ tranh...</div> : displayed.length ? <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">{displayed.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} onSelect={setSelectedArtworkId} />)}</div> : feedTab === 'following' ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center"><p className="font-h1 text-lg text-white">Chưa có tác phẩm phù hợp từ nghệ sĩ bạn theo dõi</p><Link href="/#artists" className="mt-3 inline-block text-sm text-[#A7ACD9] hover:underline">Khám phá artist đang mở commission</Link></div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center"><p className="font-h1 text-lg text-white">Chưa tìm thấy tác phẩm phù hợp</p><button onClick={() => { setQuery(''); setSelectedStyles([]); setLicense('all'); setOnlyOpenSlots(false); setMinPrice(''); setMaxPrice(''); setMinRating(''); }} className="mt-3 text-sm text-[#A7ACD9] hover:underline">Xóa bộ lọc</button></div>}
  </div>
  {showImageSearch && <ImageSearchModal onClose={() => setShowImageSearch(false)} onSelectArtwork={setSelectedArtworkId} />}
  {selectedArtworkId && <ArtworkDetailModal id={selectedArtworkId} onClose={() => setSelectedArtworkId(null)} />}
  </main>;
}
