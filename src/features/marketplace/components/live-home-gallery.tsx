'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Eye, Gavel, Maximize2, Pause, Play } from 'lucide-react';

import { CountUp, Reveal } from '@/components/motion';
import { heroSession } from './hero-session';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { EventListItemDto } from '@/features/event/types/event.types';
import { normalizeEventStatus } from '@/features/event/types/event.types';
import { categoriesService, type CategoryDto } from '../services/categories.service';
import {
  marketplaceService,
  type MarketplaceArtwork,
  type RelatedCreatorDto,
} from '../services/marketplace.service';

const HERO_MS = 8000;
const WALL_TAKE = 8;

function fmtNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value ?? 0);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return 'Đang cập nhật';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function artworkImage(artwork: MarketplaceArtwork): string {
  return artwork.thumbnailUrl || artwork.imageUrl;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(-2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Một tiêu đề mục: eyebrow italic + h2 serif + link "xem tất cả". */
function SectionHead({
  eyebrow,
  title,
  sub,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="link-more">
          {linkLabel} <ArrowRight aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

/** Thẻ tác phẩm dùng trong rail và tường. */
function ArtCard({
  artwork,
  ratio,
  reason,
  priority = false,
}: {
  artwork: MarketplaceArtwork;
  ratio: string;
  reason?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/artworks/${artwork.id}`}
      scroll={false}
      className="art-card"
      style={{ display: 'block' }}
      aria-label={`${artwork.title} — mở tác phẩm`}
    >
      <div className="art-card__frame" style={{ aspectRatio: ratio }}>
        <div className="art-card__img">
          <Image
            src={artworkImage(artwork)}
            alt={artwork.title}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        <span className="art-card__zoom" aria-hidden="true">
          <Maximize2 />
        </span>
      </div>
      <div className="art-card__meta">
        <span className="art-card__title">{artwork.title}</span>
        <span className="art-card__sub">
          <span>
            {artwork.creatorName || 'Dillustration Creator'}
            {artwork.categoryName ? ` · ${artwork.categoryName}` : ''}
          </span>
        </span>
        {reason ? <span className="art-card__reason">{reason}</span> : null}
      </div>
    </Link>
  );
}

/**
 * Dải cuộn ngang + hai nút mũi tên ở hai ĐẦU dải (không dùng scrollbar mặc định).
 * Mỗi nút tự disable khi đã tới đầu/cuối; mũi tên ẩn trên màn hình cảm ứng.
 */
function ScrollRail({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const measureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    measureRef.current = update;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Dữ liệu về sau khi mount (dải rỗng lúc đầu) thì phải đo lại, nếu không nút
  // phải sẽ nằm mãi ở trạng thái disabled.
  useEffect(() => {
    measureRef.current();
  });

  const move = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 280) + 16;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="rail-wrap">
      <div className={className} ref={ref}>
        {children}
      </div>
      <button
        type="button"
        className="rail-arrow rail-arrow--left"
        aria-label="Cuộn sang trái"
        disabled={atStart}
        onClick={() => move(-1)}
      >
        <ArrowLeft />
      </button>
      <button
        type="button"
        className="rail-arrow rail-arrow--right"
        aria-label="Cuộn sang phải"
        disabled={atEnd}
        onClick={() => move(1)}
      >
        <ArrowRight />
      </button>
    </div>
  );
}

export function LiveHomeGallery() {
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [creators, setCreators] = useState<RelatedCreatorDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  /**
   * Hero co lại theo cuộn (PASS 18/20/22) + khoá một chiều (PASS 23).
   *
   * Hero cao `100dvh + 55vh`; phần dư là "đường chạy". Stage dính ở đỉnh viewport,
   * biến `--hp` (0 → 1) điều khiển chiều cao khung, bán kính bo, lề hai bên.
   *
   * Co xong là KHOÁ: cuộn lên không bung lại thành full-screen nữa, runway thu về
   * 100dvh để không còn khoảng giấy chết phía trên card. Chỉ ghi một custom
   * property trong rAF — không setState, không re-render.
   */
  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let locked = false;

    const lock = () => {
      locked = true;
      node.classList.add('is-locked', 'is-contracted');
      document.documentElement.classList.add('hero-contracted', 'hero-locked');
      node.classList.remove('is-expanded');
      node.style.setProperty('--hp', '1');
      document.documentElement.classList.add('hero-locked');
    };

    // --hp chạy 0→1 hết chiều dài runway (hero cao 100dvh + 55vh, stage dính đỉnh).
    const update = () => {
      raf = 0;
      if (locked) return;
      const runway = node.offsetHeight - window.innerHeight;
      const travelled = Math.min(Math.max(window.scrollY, 0), Math.max(runway, 1));
      const hp = runway > 8 ? travelled / runway : 0;
      if (hp >= 0.995) {
        lock();
        return;
      }
      node.style.setProperty('--hp', hp.toFixed(3));
      node.classList.toggle('is-expanded', hp < 0.45);
      node.classList.toggle('is-contracted', hp >= 0.45);
      document.documentElement.classList.toggle('hero-contracted', hp >= 0.45);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    // Điều hướng nội bộ quay lại trang chủ: vào thẳng dạng card, không bung full màn.
    // Chỉ một lần mount đầu tiên của phiên (tức là vừa reload vào `/`) mới chạy full màn.
    if (heroSession.entered) {
      lock();
      /* Chặn khôi phục scroll của trình duyệt/Next: đặt manual + chỉ reset trong 300ms
         đầu (Next restore trong vài frame). Không dùng interval dài — nó kéo người
         dùng về đầu trang khi họ vừa cuộn xuống, đúng cảm giác "khựng". */
      const previousRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';

      let userMoved = false;
      const markMoved = () => {
        userMoved = true;
      };
      const gestures: Array<keyof WindowEventMap> = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'];
      gestures.forEach((name) => window.addEventListener(name, markMoved, { passive: true, once: true }));

      const top = () => {
        if (!userMoved && window.scrollY !== 0) window.scrollTo(0, 0);
      };
      top();
      requestAnimationFrame(top);
      const timers = [60, 160, 300].map((delay) => window.setTimeout(top, delay));

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        gestures.forEach((name) => window.removeEventListener(name, markMoved));
        window.history.scrollRestoration = previousRestoration;
        document.documentElement.classList.remove('hero-locked', 'hero-contracted');
      };
    }
    heroSession.entered = true;

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.documentElement.classList.remove('hero-locked');
    };
  }, []);

  useEffect(() => {
    let active = true;

    marketplaceService
      .getArtworks()
      .then((items) => {
        if (!active) return;
        const approved = items.filter((item) => item.moderationStatus === 'Approved' && item.imageUrl);
        setArtworks(
          [...approved].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)),
        );
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
        if (!active) return;
        setCreators(
          [...items]
            .sort((a, b) => b.ratingAverage - a.ratingAverage || b.followerCount - a.followerCount)
            .slice(0, 8),
        );
      })
      .catch(() => undefined);

    categoriesService
      .getCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch(() => undefined);

    apiClient
      .get<ApiResponse<{ items: EventListItemDto[] }>>('/events', { params: { page: 1, pageSize: 3 } })
      .then((response) => {
        if (active && response.data.data?.items) setEvents(response.data.data.items);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  /* ---------- hero ---------- */
  const slides = useMemo(() => artworks.slice(0, 8), [artworks]);
  const featured = slides[index % Math.max(1, slides.length)];

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), HERO_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const goTo = useCallback(
    (next: number) => {
      setPaused(true);
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  /* the lamp: one CSS variable pair, no re-render */
  const onLampMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = frameRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    node.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  /* ---------- derived data ---------- */
  const board = useMemo(() => artworks.slice(0, 5), [artworks]);

  const wall = useMemo(() => artworks.slice(0, WALL_TAKE), [artworks]);

  /**
   * Mục lục dòng tranh. Lấy danh mục thật từ DB; nếu DB mới có 1–2 danh mục thì
   * bù bằng "style" của tác phẩm để mục lục không trống trơn.
   */
  const catIndex = useMemo(() => {
    type Row = { key: string; name: string; href: string; count: number; cover?: MarketplaceArtwork };
    const rows: Row[] = [];

    categories.forEach((category) => {
      const matched = artworks.filter(
        (artwork) =>
          artwork.categoryId === category.id ||
          artwork.categoryName?.toLowerCase() === category.name.toLowerCase() ||
          artwork.style?.toLowerCase() === category.name.toLowerCase(),
      );
      if (matched.length === 0) return;
      rows.push({
        key: `cat-${category.id}`,
        name: category.name,
        href: `/explore?category=${encodeURIComponent(category.slug)}`,
        count: matched.length,
        cover: matched[0],
      });
    });

    if (rows.length < 5) {
      const byStyle = new Map<string, MarketplaceArtwork[]>();
      artworks.forEach((artwork) => {
        const style = (artwork.style || '').trim();
        if (!style) return;
        byStyle.set(style, [...(byStyle.get(style) ?? []), artwork]);
      });
      byStyle.forEach((items, style) => {
        if (rows.some((row) => row.name.toLowerCase() === style.toLowerCase())) return;
        rows.push({
          key: `style-${style}`,
          name: style,
          href: `/explore?q=${encodeURIComponent(style)}`,
          count: items.length,
          cover: items[0],
        });
      });
    }

    return rows.sort((a, b) => b.count - a.count).slice(0, 7);
  }, [artworks, categories]);

  const reco = useMemo(() => {
    const anchor = slides[0];
    if (!anchor) return artworks.slice(0, 8);
    const tags = new Set((anchor.tags ?? []).map((tag) => tag.toLowerCase().trim()));
    const scored = artworks
      .filter((artwork) => artwork.id !== anchor.id)
      .map((artwork) => ({
        artwork,
        score: (artwork.tags ?? []).filter((tag) => tags.has(tag.toLowerCase().trim())).length,
      }))
      .sort((a, b) => b.score - a.score || (b.artwork.viewCount ?? 0) - (a.artwork.viewCount ?? 0))
      .map((entry) => entry.artwork);
    return scored.slice(0, 8);
  }, [artworks, slides]);

  const spotlightEvent = events[0];
  const eventStatus = spotlightEvent ? normalizeEventStatus(spotlightEvent.status) : 'Draft';

  const stats = [
    { value: artworks.length, label: 'tác phẩm đã duyệt' },
    { value: creators.length, label: 'Họa sĩ đang nhận đơn' },
    { value: catIndex.length || categories.length, label: 'dòng tranh trên sàn' },
  ];

  // Băng chữ lấy từ dữ liệu thật (danh mục + style + tag). Không đủ chữ thì ẩn hẳn
  // băng đi — thà không có còn hơn một dải gần như trống.
  const marqueeWords = useMemo(() => {
    const set = new Set<string>();
    catIndex.forEach((row) => set.add(row.name));
    artworks.forEach((artwork) => {
      if (artwork.style) set.add(artwork.style);
      (artwork.tags ?? []).slice(0, 2).forEach((tag) => set.add(tag));
    });
    return [...set].filter(Boolean).slice(0, 12);
  }, [catIndex, artworks]);

  // Mỗi nửa phải dài hơn viewport thì vòng lặp translateX(-50%) mới liền mạch.
  // Lặp đủ để một nửa có tối thiểu 24 mục — 2 danh mục cũng thành dải kín.
  const marqueeTrack = useMemo(() => {
    if (marqueeWords.length < 2) return [];
    const repeat = Math.max(3, Math.ceil(24 / marqueeWords.length));
    const half = Array.from({ length: repeat }, () => marqueeWords).flat();
    return [...half, ...half];
  }, [marqueeWords]);

  return (
    <main className="shell home-view" id="main">
      {/* ═══ HERO — a lit wall, full screen at rest ═══ */}
      <section
        className={`hero is-expanded${slides.length > 1 ? ' hero--with-thumbs' : ''}`}
        ref={heroRef}
        aria-roledescription="carousel"
        aria-label="Tác phẩm nổi bật"
      >
        <div className="hero__stage">
          <div
            className="hero__frame"
            ref={frameRef}
            onPointerMove={onLampMove}
            role="group"
            aria-roledescription="carousel"
          >
            {featured ? (
              slides.map((slide, position) => (
                <div
                  key={slide.id}
                  className={`hero__slide ${position === index % slides.length ? 'is-active' : ''}`}
                  aria-hidden={position === index % slides.length ? 'false' : 'true'}
                >
                  <div className="hero__art">
                    <Image
                      src={slide.imageUrl || artworkImage(slide)}
                      alt={slide.title}
                      fill
                      unoptimized
                      priority={position === 0}
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="hero__art skeleton" aria-hidden="true" />
            )}

            <div className="hero__spot" aria-hidden="true" />
            <div className="hero__scrim" aria-hidden="true" />

            {/* data-no-translate: LanguageProvider có auto-translator chạy trên mọi
                text node; câu chữ thương hiệu của hero phải giữ nguyên văn. */}
            <div className="hero__body" data-no-translate="true">
              <p className="eyebrow rise">Phòng tranh dilillustration</p>
              <h1 className="hero__title rise"> Khám phá tranh từ <em>creator</em> bạn yêu thích. </h1>
              <p className="hero__sub"> Một vòng tuyển chọn từ sàn tranh: tác phẩm được duyệt, họa sĩ đang nhận đơn, và những
 phiên đấu giá đang mở. </p>
              <div className="hero__actions">
                <Link href="/explore" className="btn btn--primary"> Khám phá sàn tranh <ArrowRight aria-hidden />
                </Link>
                <Link href="/auctions" className="btn btn--outline"> Xem phiên đấu giá </Link>
              </div>
              {featured ? (
                <div className="hero__foot">
                  <span className="who">{featured.title}</span>
                  <span className="sep" />
                  <span>{featured.creatorName || 'Dillustration Creator'}</span>
                  <span className="sep" />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtNumber(featured.viewCount ?? 0)} lượt xem
                  </span>
                </div>
              ) : (
                <p className="hero__foot">
                  {loading ? 'Đang tải tác phẩm…' : error || 'Chưa có tác phẩm được duyệt.'}
                </p>
              )}
            </div>
          </div>

          {slides.length > 1 ? (
          <div className="hero__thumbs">
            <div className="thumbs" role="group" aria-label="Chọn tác phẩm">
              {slides.map((slide, position) => (
                <button
                  key={slide.id}
                  type="button"
                  className="thumb"
                  aria-pressed={position === index % Math.max(1, slides.length)}
                  aria-label={`Tác phẩm ${position + 1}: ${slide.title}`}
                  onClick={() => goTo(position)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artworkImage(slide)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <div className="hero__nav">
              <button type="button" className="round-btn" aria-label="Tác phẩm trước" onClick={() => goTo(index - 1)}>
                <ArrowLeft />
              </button>
              <button
                type="button"
                className="round-btn"
                aria-label={paused ? 'Tiếp tục trình chiếu' : 'Tạm dừng trình chiếu'}
                aria-pressed={paused}
                onClick={() => setPaused((current) => !current)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
              <button type="button" className="round-btn" aria-label="Tác phẩm tiếp theo" onClick={() => goTo(index + 1)}>
                <ArrowRight />
              </button>
            </div>
          </div>
          ) : null}
        </div>
      </section>

      {/* ═══ MARQUEE — the page breathing ═══ */}
      {marqueeTrack.length > 0 ? (
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {marqueeTrack.map((word, position) => (
              <span key={`${word}-${position}`}>{word}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* ═══ STATS — one quiet line ═══ */}
      <section className="wrap">
        <p className="statsline">
          {stats.map((stat) => (
            <span key={stat.label}>
              <b>
                <CountUp value={stat.value} />
              </b>
              {stat.label}
            </span>
          ))}
        </p>
      </section>

      {/* ═══ EVENTS — one room at a time ═══ */}
      {spotlightEvent ? (
        <section className="section wrap">
          <Reveal>
            <SectionHead
              eyebrow="Sự kiện &amp; tranh"
              title="Mỗi lần một căn phòng"
              sub="Một cuộc thi, một danh sách rút gọn, và những tác phẩm hội đồng đang tranh luận."
              href="/events"
              linkLabel="Tất cả sự kiện"
            />
            <div className="evt-grid">
              <article className="evt">
                <div className="evt__art">
                  {spotlightEvent.bannerUrl ? (
                    <Image
                      src={spotlightEvent.bannerUrl}
                      alt={spotlightEvent.title}
                      fill
                      unoptimized
                      sizes="(max-width: 900px) 100vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="skeleton h-full w-full" aria-hidden="true" />
                  )}
                  <span className={`badge ${eventStatus === 'Open' ? 'badge--live' : 'badge--soon'}`}>
                    {fmtDate(spotlightEvent.submissionEndAt)}
                  </span>
                </div>
                <div className="evt__body">
                  <p className="eyebrow">Open call</p>
                  <h3>{spotlightEvent.title}</h3>
                  <p>
                    {spotlightEvent.description?.slice(0, 180) ||
                      'Một lời mời mở: gửi tác phẩm, chờ hội đồng chấm, và mở cửa phòng tranh.'}
                  </p>
                  <div className="evt__facts">
                    <span className="tag">{spotlightEvent.submissionCount} bài dự thi</span>
                    <span className="tag">Đóng {fmtDate(spotlightEvent.submissionEndAt)}</span>
                    {spotlightEvent.prize ? <span className="tag">{spotlightEvent.prize}</span> : null}
                  </div>
                  <Link href={`/events/${spotlightEvent.id}`} className="btn btn--outline btn--sm"> Đọc thể lệ <ArrowUpRight aria-hidden />
                  </Link>
                </div>
              </article>
              <div className="evt__side">
                {wall.slice(0, 2).map((artwork, position) => (
                  <ArtCard
                    key={artwork.id}
                    artwork={artwork}
                    ratio="1 / 1"
                    reason={position === 0 ? 'hội đồng chọn' : undefined}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* ═══ RANKING — text rows ═══ */}
      <section className="section wrap">
        <Reveal>
          <SectionHead
            eyebrow="Xếp hạng"
            title="Thịnh hành tuần này"
            sub="Xếp theo lượt xem thật trên toàn sàn."
            href="/explore"
            linkLabel="Xem tất cả"
          />
          <div className="board">
            {board.length === 0 ? (
              <p className="py-6 text-sm text-[#6E6459]">{loading ? 'Đang tải bảng xếp hạng…' : 'Chưa có dữ liệu.'}</p>
            ) : (
              board.map((artwork, position) => (
                <Link key={artwork.id} href={`/artworks/${artwork.id}`} scroll={false} className="board__row">
                  <span className="board__rank">{String(position + 1).padStart(2, '0')}</span>
                  <span className="board__title">
                    {artwork.title}
                    <small>
                      {artwork.creatorName || 'Dillustration Creator'}
                      {artwork.categoryName ? ` · ${artwork.categoryName}` : ''}
                    </small>
                  </span>
                  <span className="board__score">
                    {fmtNumber(artwork.viewCount ?? 0)}
                    <small>lượt xem</small>
                  </span>
                </Link>
              ))
            )}
          </div>
        </Reveal>
      </section>

      {/* ═══ CREATORS — the strip ═══ */}
      <section className="section wrap">
        <Reveal>
          <SectionHead
            eyebrow="Creator"
            title="Họa sĩ đang nhận đơn"
            sub="Hồ sơ đã xác thực, phản hồi trong 24 giờ."
            href="/creators"
            linkLabel="Tất cả họa sĩ"
          />
          {creators.length === 0 ? (
            <p className="text-sm text-[#6E6459]">{loading ? 'Đang tải họa sĩ…' : 'Chưa có họa sĩ nào.'}</p>
          ) : (
            <ScrollRail className="strip">
              {creators.map((creator) => {
                // Ảnh bìa phải là của CHÍNH creator này: banner họ đặt → tranh của họ.
                // Tuyệt đối không lấy tranh của creator khác (trước đây fallback `artworks[0]`
                // khiến 3-4 thẻ cùng một bức tranh).
                const ownArtwork = artworks.find((artwork) => artwork.creatorProfileId === creator.id);
                const coverSrc = creator.bannerUrl || (ownArtwork ? artworkImage(ownArtwork) : '');
                const tags = (creator.specialties || '')
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 3);
                return (
                  <Link key={creator.id} href={`/creators/${creator.id}`} className="creator">
                    <div className="creator__cover">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt=""
                          fill
                          unoptimized
                          sizes="17rem"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center font-[family-name:var(--font-display)] text-2xl text-[#746A5F]">
                          {initialsOf(creator.displayName)}
                        </div>
                      )}
                    </div>
                    <div className="creator__body">
                      <div className="creator__name">{creator.displayName}</div>
                      <div className="creator__meta">
                        <span>{creator.headline || 'Digital illustrator'}</span>
                        <span>·</span>
                        <span>★ {creator.ratingAverage.toFixed(1)}</span>
                        <span>·</span>
                        <span>{creator.followerCount} theo dõi</span>
                      </div>
                      <div className="creator__tags">
                        {(tags.length > 0 ? tags : ['commission', 'digital']).map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRail>
          )}
        </Reveal>
      </section>

      {/* ═══ FOR YOU — the rail ═══ */}
      <section className="section wrap">
        <Reveal>
          <SectionHead
            eyebrow="Dành cho bạn"
            title="Cùng một tay nghề, cùng một ánh sáng"
            sub={slides[0] ? `Vì bạn đang xem “${slides[0].title}”.` : 'Những tác phẩm được xem nhiều nhất.'}
            href="/explore"
            linkLabel="Chỉnh gu của bạn"
          />
          <ScrollRail className="rail">
            {reco.slice(0, 6).map((artwork) => (
              <div key={artwork.id} className="rail__item">
                <ArtCard artwork={artwork} ratio="3 / 4" reason="cùng bảng màu" />
              </div>
            ))}
          </ScrollRail>
        </Reveal>
      </section>

      {/* ═══ CATEGORIES — an index you read ═══ */}
      {catIndex.length > 0 ? (
        <section className="section wrap">
          <Reveal>
            <SectionHead
              eyebrow="Chọn theo gu"
              title={`${catIndex.length} lối vào bộ sưu tập`}
              sub="Chọn một dòng tranh — chỉ tác phẩm đã kiểm duyệt mới xuất hiện."
              href="/explore"
              linkLabel="Mở toàn bộ bộ lọc"
            />
            <ul className="cat-index">
              {catIndex.map((row) => (
                <li key={row.key}>
                  <Link href={row.href}>
                    <span className="cat-index__thumb">
                      {row.cover ? (
                        <Image
                          src={artworkImage(row.cover)}
                          alt=""
                          fill
                          unoptimized
                          sizes="3rem"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="cat-index__name">{row.name}</span>
                    <span className="cat-index__count">{row.count} tác phẩm</span>
                    <span className="cat-index__arrow" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      {/* ═══ WALL — everything on the floor ═══ */}
      <section className="section wrap" aria-labelledby="floor-title">
        <Reveal>
          <SectionHead
            eyebrow="Tất cả"
            title="Tác phẩm trên sàn"
            sub="Mở bất kỳ tác phẩm nào để xem toàn màn hình."
            href="/explore"
            linkLabel="Xem tất cả"
          />
        </Reveal>

        {loading ? (
          <div className="wall">
            {Array.from({ length: WALL_TAKE }).map((_, position) => (
              <div key={position} className="skeleton" style={{ aspectRatio: position % 3 === 1 ? '1 / 1' : '4 / 5' }} />
            ))}
          </div>
        ) : wall.length === 0 ? (
          <div className="empty">
            <Gavel className="empty__art" aria-hidden="true" />
            <h3>{error || 'Chưa có tác phẩm được duyệt'}</h3>
            <p>Khi họa sĩ đăng tác phẩm và được kiểm duyệt, tác phẩm sẽ xuất hiện ở đây.</p>
            <div className="empty__actions">
              <Link href="/explore" className="btn btn--primary btn--sm">
                <Eye size={14} aria-hidden /> Mở sàn tranh </Link>
              <Link href="/creators" className="btn btn--outline btn--sm">
                Xem creator
              </Link>
            </div>
          </div>
        ) : (
          <div className="wall">
            {wall.map((artwork, position) => (
              <Reveal key={artwork.id} delay={Math.min(position, 8) * 45}>
                <ArtCard
                  artwork={artwork}
                  ratio={position % 4 === 1 ? '1 / 1' : position % 4 === 3 ? '3 / 4' : '4 / 5'}
                  priority={position < 2}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
