'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { marketplaceService, type MarketplaceArtwork, type RelatedCreatorDto } from '../services/marketplace.service';
import { SectionEventSpotlight } from './section-event-spotlight';
import { SectionTrendingLeaderboard } from './section-trending-leaderboard';
import { SectionFeaturedCreators } from './section-featured-creators';
import { SectionRecommendedByLikes } from './section-recommended-by-likes';
import { SectionExploreByStyle } from './section-explore-by-style';

/** Thin horizontal rule that separates sections visually */
function SectionDivider() {
  return <hr className="border-[var(--hair)]" />;
}

export function LiveHomeGallery() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [artists, setArtists] = useState<RelatedCreatorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    marketplaceService
      .getArtworks()
      .then((items) => {
        if (!active) return;
        const approved = items.filter((item) => item.moderationStatus === 'Approved' && item.imageUrl);
        // Randomize equal-view artworks; highest-view artwork always opens the slideshow.
        const ranked = approved
          .map((artwork) => ({ artwork, tie: Math.random() }))
          .sort((a, b) => (b.artwork.viewCount ?? 0) - (a.artwork.viewCount ?? 0) || a.tie - b.tie)
          .map(({ artwork }) => artwork);
        setArtworks(ranked);
      })
      .catch(() => {
        if (active) setError('Không tải được tác phẩm. Vui lòng tải lại trang.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    marketplaceService
      .getCreators()
      .then((items) => {
        if (active) setArtists(items);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const slides = artworks.slice(0, 10);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const featured = slides[index % Math.max(1, slides.length)];
  const creatorName = (artwork: MarketplaceArtwork) =>
    artwork.creatorName ||
    artists.find((artist) => artist.id === artwork.creatorProfileId)?.displayName ||
    'Dillustration Creator';

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-10 text-[var(--ivory)] font-[family-name:var(--font-ui)]">
      {/* ─── HERO SLIDESHOW MATCHING DILLUSTRATION-REDESIGN.HTML ────────── */}
      <section className="hero wrap" id="heroRunway">
        <div className="hero__stage" id="heroStage">
          <div className="hero__frame" role="group" aria-roledescription="carousel" aria-label="Featured work">
            <div id="heroSlides">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`hero__slide ${i === index ? 'is-active' : ''}`}
                  data-slide={i}
                  aria-hidden={i !== index}
                >
                  <div className="hero__art">
                    <span className="pic w-full h-full block relative">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        unoptimized
                        priority={i === 0}
                        className="object-cover"
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hero__spot" aria-hidden="true"></div>
            <div className="hero__scrim"></div>

            <div className="hero__badge">
              <span className="hero__index">
                {String(index + 1).padStart(2, '0')} <span>/ {String(slides.length || 1).padStart(2, '0')}</span>
              </span>
              <div className="hero__progress">
                <i key={index} className={paused ? '' : 'is-running'} style={{ width: paused ? '100%' : undefined }}></i>
              </div>
            </div>

            <div className="hero__body">
              <p className="eyebrow">{isVie ? 'Thư viện Dillustration' : 'The dilillustration gallery'}</p>
              <h1 className="hero__title">
                {isVie ? (
                  <>Khám phá nghệ thuật từ những <em>họa sĩ</em> bạn đã yêu mến.</>
                ) : (
                  <>Discover art from the <em>creators</em> you already love.</>
                )}
              </h1>
              <p className="hero__sub">
                {isVie
                  ? 'Tuyển tập xoay vòng từ gallery. Dừng lại chiêm ngưỡng, tìm kiếm cảm hứng và đặt vẽ trực tiếp.'
                  : 'A rotating selection from the gallery floor. Look slowly, then decide.'}
              </p>
              <div className="hero__actions">
                <Link className="btn btn--primary" href="/explore">
                  <span>{isVie ? 'Khám phá thị trường' : 'Explore the market'}</span>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </Link>
                <Link className="btn btn--outline" href="/auctions">
                  {isVie ? 'Xem các phiên đấu giá' : 'View live auctions'}
                </Link>
              </div>
              {featured && (
                <div className="hero__foot" id="heroFoot">
                  <span className="who">{featured.title}</span>
                  <span className="sep"></span>
                  <span>{creatorName(featured)}</span>
                  <span className="sep"></span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {featured.viewCount ?? 0} {isVie ? 'lượt xem' : 'views'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="hero__thumbs">
            <div className="thumbs" role="group" aria-label="Choose a work">
              {slides.map((a, i) => (
                <button
                  key={a.id}
                  className="thumb cursor-pointer"
                  type="button"
                  data-thumb={i}
                  aria-pressed={i === index}
                  aria-label={`Artwork ${i + 1}: ${a.title}`}
                  onClick={() => {
                    setPaused(true);
                    setIndex(i);
                  }}
                >
                  <Image
                    src={a.thumbnailUrl || a.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="hero__nav">
              <button
                className="round-btn cursor-pointer"
                type="button"
                data-act="hero-prev"
                aria-label={isVie ? 'Tác phẩm trước' : 'Previous artwork'}
                onClick={() => {
                  setPaused(true);
                  setIndex((index + slides.length - 1) % slides.length);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
                </svg>
              </button>
              <button
                className="round-btn cursor-pointer"
                type="button"
                data-act="hero-toggle"
                aria-label={paused ? 'Tiếp tục trình chiếu' : 'Tạm dừng trình chiếu'}
                aria-pressed={paused}
                id="heroToggle"
                onClick={() => setPaused(!paused)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {paused ? <path d="M7 4.5v15l13-7.5z"/> : <><path d="M8 5v14"/><path d="M16 5v14"/></>}
                </svg>
              </button>
              <button
                className="round-btn cursor-pointer"
                type="button"
                data-act="hero-next"
                aria-label={isVie ? 'Tác phẩm kế tiếp' : 'Next artwork'}
                onClick={() => {
                  setPaused(true);
                  setIndex((index + 1) % slides.length);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statsline banner: approved works / active creators matching redesign */}
      <section className="wrap my-6">
        <p className="statsline">
          <span>
            <b className="tabular-nums font-[family-name:var(--font-display)]">{artworks.length}</b>
            {isVie ? 'tác phẩm đã duyệt' : 'approved works'}
          </span>
          <span>
            <b className="tabular-nums font-[family-name:var(--font-display)]">{artists.length}</b>
            {isVie ? 'họa sĩ hoạt động' : 'active creators'}
          </span>
          <span>
            <b className="tabular-nums font-[family-name:var(--font-display)]">128</b>
            {isVie ? 'phiên giao dịch hoàn tất' : 'sessions settled'}
          </span>
        </p>
      </section>

      <SectionDivider />

      {/* ─── SECTION 1: EVENT SPOTLIGHT + ART TUYỂN CHỌN ───────────────── */}
      <SectionEventSpotlight />

      <SectionDivider />

      {/* ─── SECTION 2: BẢNG XẾP HẠNG THỊNH HÀNH ───────────────────────── */}
      <SectionTrendingLeaderboard />

      <SectionDivider />

      {/* ─── SECTION 3: CREATOR TUYỂN CHỌN ──────────────────────────────── */}
      <SectionFeaturedCreators />

      <SectionDivider />

      {/* ─── SECTION 4: GỢI Ý THEO TRANH ĐÃ THÍCH ───────────────────────── */}
      <SectionRecommendedByLikes />

      <SectionDivider />

      {/* ─── SECTION 5: KHÁM PHÁ THEO PHONG CÁCH ─────────────────────────── */}
      <SectionExploreByStyle artworks={artworks} loading={loading} />

      <SectionDivider />

      {/* ─── GALLERY GRID (all artworks) ─────────────────────────────────── */}
      <section className="py-14" aria-labelledby="gallery-title">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Works on the floor</p>
            <h2 id="gallery-title" className="mt-1 font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-[var(--ivory)]">
              Tác phẩm trong gallery
            </h2>
          </div>
          <Link href="/explore" className="text-sm font-medium text-[var(--lumen)] hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {loading || error ? (
          <p role="status" className="py-12 text-center text-[var(--ash)]">
            {error || 'Đang tải gallery…'}
          </p>
        ) : (
          <div className="wall" data-cols="3">
            {artworks.map((artwork) => (
              <article key={artwork.id} className="art-card">
                <Link
                  href={`/artworks/${artwork.id}`}
                  scroll={false}
                  className="art-card__open block relative"
                  aria-label={`View ${artwork.title} by ${creatorName(artwork)}`}
                >
                  <span className="art-card__frame block aspect-[4/3]">
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
                    <span className="truncate">{creatorName(artwork)}</span>
                    <span>·</span>
                    <span className="shrink-0">{artwork.viewCount ?? 0} lượt xem</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
