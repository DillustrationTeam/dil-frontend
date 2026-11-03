'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { marketplaceService, type MarketplaceArtwork, type RelatedCreatorDto } from '../services/marketplace.service';
import { HomeCollections } from './home-collections';

export function LiveHomeGallery() {
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [artists, setArtists] = useState<RelatedCreatorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    marketplaceService.getArtworks().then((items) => {
      if (!active) return;
      const approved = items.filter((item) => item.moderationStatus === 'Approved' && item.imageUrl);
      // Randomize equal-view artworks; highest-view artwork always opens the slideshow.
      const ranked = approved.map((artwork) => ({ artwork, tie: Math.random() }))
        .sort((a, b) => (b.artwork.viewCount ?? 0) - (a.artwork.viewCount ?? 0) || a.tie - b.tie)
        .map(({ artwork }) => artwork);
      setArtworks(ranked);
    }).catch(() => { if (active) setError('Không tải được tác phẩm. Vui lòng tải lại trang.'); })
      .finally(() => { if (active) setLoading(false); });
    marketplaceService.getCreators().then((items) => { if (active) setArtists(items); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const slides = artworks.slice(0, 10);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const featured = slides[index % Math.max(1, slides.length)];
  const creatorName = (artwork: MarketplaceArtwork) => artwork.creatorName || artists.find((artist) => artist.id === artwork.creatorProfileId)?.displayName || 'Dillustration Creator';

  return <main className="mx-auto max-w-7xl px-6 py-12 text-[#E4E1E5]">
    <section className="grid items-center gap-10 md:grid-cols-12">
      <div className="space-y-6 md:col-span-5"><p className="text-xs uppercase tracking-[.2em] text-[#A7ACD9]">Dillustration Gallery</p><h1 className="font-h1 text-4xl font-bold leading-tight text-white md:text-5xl">Khám phá nghệ thuật từ những creator bạn yêu thích.</h1><p className="text-[#C7C5CF]">Tác phẩm nổi bật được chọn từ gallery, ưu tiên ảnh có nhiều lượt xem nhất.</p><Link href="/explore" className="inline-flex rounded-full bg-[#A7ACD9] px-7 py-3 font-semibold text-[#1F2335]">Khám phá gallery</Link><div className="flex gap-8 text-sm text-[#919099]"><span><strong className="block text-2xl text-white">{artworks.length}</strong>Tác phẩm</span><span><strong className="block text-2xl text-white">{artists.length}</strong>Creator</span></div></div>
      <div className="md:col-span-7" role="region" aria-label="Trình chiếu tác phẩm nổi bật">
        <div className="glass-container overflow-hidden rounded-[32px] p-4">
          {featured ? <Link href={`/artworks/${featured.id}`} scroll={false} className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-[#161926]"><Image key={featured.id} src={featured.imageUrl} alt={featured.title} fill unoptimized priority className="object-contain" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-16"><h2 className="font-h1 text-xl font-bold text-white">{featured.title}</h2><p className="mt-1 text-sm text-white/80">{creatorName(featured)} · {featured.viewCount ?? 0} lượt xem</p></div></Link> : <div role="status" className="grid aspect-[16/10] place-items-center text-sm text-[#C7C5CF]">{loading ? 'Đang tải tác phẩm…' : error || 'Chưa có tác phẩm được duyệt.'}</div>}
        </div>
        {!!slides.length && <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" aria-label="Ảnh trước" onClick={() => { setPaused(true); setIndex((index + slides.length - 1) % slides.length); }} className="rounded-full border border-white/15 px-3 py-2">←</button>{slides.map((slide, position) => <button type="button" key={slide.id} aria-label={`Xem ảnh ${position + 1}: ${slide.title}`} aria-pressed={position === index} onClick={() => { setPaused(true); setIndex(position); }} className={`px-2 py-2 text-xs ${position === index ? 'border-b-2 border-[#A7ACD9] text-[#A7ACD9]' : 'text-[#919099]'}`}>{String(position + 1).padStart(2, '0')}</button>)}<button type="button" aria-label="Ảnh tiếp" onClick={() => { setPaused(true); setIndex((index + 1) % slides.length); }} className="rounded-full border border-white/15 px-3 py-2">→</button><button type="button" onClick={() => setPaused(!paused)} className="ml-auto text-xs text-[#A7ACD9]">{paused ? 'Tiếp tục' : 'Tạm dừng'}</button></div>}
      </div>
    </section>
    <section className="py-14" aria-labelledby="gallery-title"><div className="mb-6 flex items-center justify-between"><h2 id="gallery-title" className="font-h1 text-2xl font-bold text-white">Tác phẩm trong gallery</h2><Link href="/explore" className="text-sm text-[#A7ACD9]">Xem tất cả →</Link></div>{loading || error ? <p role="status" className="py-12 text-center text-[#919099]">{error || 'Đang tải gallery…'}</p> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{artworks.map((artwork) => <Link key={artwork.id} href={`/artworks/${artwork.id}`} scroll={false} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]"><div className="relative aspect-[4/3] bg-[#161926]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain transition-transform group-hover:scale-[1.03]" /></div><div className="p-4"><h3 className="font-semibold text-white">{artwork.title}</h3><p className="mt-1 text-xs text-[#919099]">{creatorName(artwork)} · {artwork.viewCount ?? 0} lượt xem</p></div></Link>)}</div>}</section>
    <HomeCollections artworks={artworks} loading={loading} error={error} />
    <section id="artists" className="scroll-mt-24 py-12"><h2 className="mb-6 font-h1 text-2xl font-bold text-white">Creator trong cộng đồng</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{artists.map((artist) => <Link key={artist.id} href={`/creators/${artist.id}`} className="rounded-2xl border border-white/10 p-5 hover:border-[#A7ACD9]/50"><h3 className="font-semibold text-white">{artist.displayName}</h3><p className="mt-2 text-sm text-[#919099]">{artist.headline || 'Illustrator'}</p><p className="mt-3 text-xs text-[#A7ACD9]">★ {artist.ratingAverage.toFixed(1)} · {artist.availableSlots} slots</p></Link>)}</div></section>
  </main>;
}
