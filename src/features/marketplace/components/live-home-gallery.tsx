'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Eye,
  Gavel,
  Images,
  Maximize2,
  Pause,
  Play,
  Trophy,
} from 'lucide-react';

import { CountUp, Reveal } from '@/components/motion';
import { decideHeroMode } from './hero-session';
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
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 'Đang cập nhật';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function artworkImage(artwork: MarketplaceArtwork): string {
  return artwork.thumbnailUrl || artwork.imageUrl;
}

/**
 * Giai đoạn của sự kiện, suy từ các mốc thời gian ban tổ chức đặt (không đoán).
 * Dùng cho nhãn nhỏ trên ảnh bìa — thay cho chữ "Open call" tiếng Anh cứng trước đây.
 */
function eventPhaseOf(event: EventListItemDto, now = Date.now()): string {
  const at = (iso?: string | null) => (iso ? new Date(iso).getTime() : NaN);
  const start = at(event.submissionStartAt);
  const end = at(event.submissionEndAt);
  const judgingEnd = at(event.judgingEndAt);
  const votingEnd = at(event.votingEndAt);
  const announced = at(event.resultAnnouncementAt);

  if (Number.isFinite(start) && now < start) return 'Sắp mở nhận bài';
  if (Number.isFinite(end) && now <= end) return 'Đang nhận bài';
  if (Number.isFinite(judgingEnd) && now <= judgingEnd) return 'Hội đồng đang chấm';
  if (Number.isFinite(votingEnd) && now <= votingEnd) return 'Đang bình chọn';
  if (Number.isFinite(announced) && now < announced) return 'Sắp công bố kết quả';
  return 'Đã công bố kết quả';
}

/**
 * Tiêu đề mục sự kiện: cùng một khối nhưng câu chữ đổi theo giai đoạn thật, để
 * người đọc biết chuyện gì đang diễn ra thay vì một câu thơ chung chung.
 */
function eventHeadlineOf(event: EventListItemDto, phase: string): string {
  const count = event.submissionCount ?? 0;
  switch (phase) {
    case 'Sắp mở nhận bài':
      return 'Cuộc thi mới sắp mở nhận bài';
    case 'Đang nhận bài':
      return count > 0 ? `${count} bài dự thi đã gửi` : 'Đang mở nhận bài dự thi';
    case 'Hội đồng đang chấm':
      return count > 0
        ? `${count} bài dự thi đang được hội đồng chấm`
        : 'Hội đồng đang chấm bài';
    case 'Đang bình chọn':
      return 'Cộng đồng đang bình chọn';
    case 'Sắp công bố kết quả':
      return 'Sắp công bố kết quả cuộc thi';
    case 'Đã công bố kết quả':
      return 'Kết quả cuộc thi đã công bố';
    default:
      return 'Cuộc thi đang mở trên sàn';
  }
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

    // Quyết định vào dạng card hay full màn cho CẢ chu kỳ mount này.
    // - Vừa reload vào `/` (cờ `entered` còn false)  -> full màn, cuộn mới co.
    // - Quay lại từ route khác (đã `entered`)         -> vào thẳng card.
    // - React StrictMode (dev) chạy effect 2 lần liền (mount -> cleanup -> mount);
    //   lần thứ hai phải DÙNG LẠI quyết định của lần đầu, không tự quyết lại, nếu không
    //   lần đầu bị bỏ full màn còn lần quay lại lại bị bung full màn.
    if (decideHeroMode(performance.now()) === 'locked') {
      lock();
      return () => {
        document.documentElement.classList.remove('hero-locked', 'hero-contracted');
      };
    }

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

    // `getArtworks()` mặc định chỉ trả 12 tác phẩm đầu → bảng xếp hạng và số đếm
    // danh mục trên trang chủ chỉ phản ánh 12/31 tác phẩm. Lấy một lượt đủ lớn để
    // mọi con số trên trang chủ là con số của cả sàn.
    marketplaceService
      .getArtworksPage({ page: 1, pageSize: 48 })
      .then((res) => {
        if (!active) return;
        const approved = res.items.filter(
          (item) => item.moderationStatus === 'Approved' && item.imageUrl,
        );
        setArtworks([...approved].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)));
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

    // `GET /events` trả `data` là MẢNG TRẦN (không phải `{ items }`). Đọc cả hai
    // hình dạng, nếu không phòng sự kiện trên trang chủ luôn rỗng.
    apiClient
      .get<ApiResponse<EventListItemDto[] | { items: EventListItemDto[] }>>('/events', {
        params: { page: 1, pageSize: 3 },
      })
      .then((response) => {
        if (!active) return;
        const payload = response.data.data;
        const list = Array.isArray(payload) ? payload : (payload?.items ?? []);
        setEvents(list);
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

    return rows.sort((a, b) => b.count - a.count).slice(0, 8);
  }, [artworks, categories]);

  /**
   * Gợi ý = tranh khác CÙNG THẺ với tranh đang mở, xếp theo lượt xem.
   *
   * Mỗi mục mang theo `sharedTag` thật (chuỗi y như trong DB) để:
   * - card ghi lý do thật ("cùng #cyberpunk") thay vì "cùng bảng màu" bịa;
   * - link "xem tất cả" trỏ đúng /explore?tag=<thẻ đó> — cùng nguồn dữ liệu với
   *   bộ lọc thẻ của trang sàn, nên hai nơi không bao giờ lệch nhau.
   */
  const reco = useMemo(() => {
    const anchor = slides[0];
    if (!anchor) return [] as { artwork: MarketplaceArtwork; sharedTag?: string; sameStyle: boolean }[];
    const anchorTags = (anchor.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
    const anchorStyle = (anchor.style || '').trim().toLowerCase();

    return artworks
      .filter((artwork) => artwork.id !== anchor.id)
      .map((artwork) => {
        const sharedTag = (artwork.tags ?? []).find((tag) =>
          anchorTags.some((candidate) => candidate.toLowerCase() === tag.trim().toLowerCase()),
        );
        const sameStyle = Boolean(anchorStyle) && (artwork.style || '').trim().toLowerCase() === anchorStyle;
        return { artwork, sharedTag, sameStyle, score: (sharedTag ? 2 : 0) + (sameStyle ? 1 : 0) };
      })
      .sort((a, b) => b.score - a.score || (b.artwork.viewCount ?? 0) - (a.artwork.viewCount ?? 0))
      .slice(0, 8)
      .map(({ artwork, sharedTag, sameStyle }) => ({ artwork, sharedTag, sameStyle }));
  }, [artworks, slides]);

  /** Thẻ xuất hiện nhiều nhất trong tập gợi ý — dùng cho link "xem tất cả". */
  const recoTopTag = useMemo(() => {
    const counts = new Map<string, number>();
    reco.forEach(({ sharedTag }) => {
      if (!sharedTag) return;
      const key = sharedTag.trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? '';
  }, [reco]);

  const recoAnchor = slides[0];
  const recoAnchorStyle = (recoAnchor?.style || '').trim();
  /**
   * Có bao nhiêu tranh gợi ý THẬT SỰ cùng dòng với tranh đang mở. Dùng để chọn
   * tiêu đề/link, để phần chữ trên trang không khẳng định một quan hệ không tồn tại
   * (DB hiện không có thẻ nào, nên phần lớn trường hợp sẽ rơi về "được xem nhiều").
   */
  const recoSharesStyle = reco.some((item) => item.sameStyle);
  const recoHref = recoTopTag
    ? `/explore?tag=${encodeURIComponent(recoTopTag)}`
    : recoSharesStyle && recoAnchorStyle
      ? `/explore?q=${encodeURIComponent(recoAnchorStyle)}`
      : '/explore?sort=views';

  const spotlightEvent = events[0];
  const eventStatus = spotlightEvent ? normalizeEventStatus(spotlightEvent.status) : 'Draft';

  const stats = [
    { value: artworks.length, label: 'tác phẩm đã duyệt' },
    { value: creators.length, label: 'Họa sĩ trên sàn' },
    { value: catIndex.length || categories.length, label: 'dòng tranh trên sàn' },
  ];

  return (
    <div className="shell home-view" id="main">
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

            {/* Hero để translator xử lý: câu chữ đã có cặp VI->EN trong
                context/translations/vie-to-eng.ts, nên tab tiếng Anh không còn tiếng Việt. */}
            <div className="hero__body">
              <p className="eyebrow rise">Phòng tranh dilillustration</p>
              <h1 className="hero__title rise"> Khám phá tranh từ <em>họa sĩ</em> bạn yêu thích. </h1>
              <p className="hero__sub">Một vòng tuyển chọn từ sàn tranh: tác phẩm được duyệt, họa sĩ đã xác thực, và những phiên đấu giá đang mở.</p>
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
                  <span>{featured.categoryName || featured.style || 'Tranh kỹ thuật số'}</span>
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
              eyebrow="Sự kiện trên sàn"
              title="Cuộc thi tranh đang mở"
              sub={`Nhận bài, chấm điểm, công bố kết quả — cuộc thi gần nhất đóng nhận bài ngày ${fmtDate(spotlightEvent.submissionEndAt)}.`}
              href="/events"
              linkLabel="Xem tất cả sự kiện"
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
                    {eventPhaseOf(spotlightEvent)}
                  </span>
                </div>
                <div className="evt__body">
                  <p className="eyebrow">{eventPhaseOf(spotlightEvent)}</p>
                  <h3 className="evt__title">{spotlightEvent.title}</h3>
                  <p className="evt__desc">
                    {spotlightEvent.description?.slice(0, 140) ||
                      'Một lời mời mở: gửi tác phẩm, chờ hội đồng chấm, và mở cửa phòng tranh.'}
                  </p>

                  <ul className="evt__facts">
                    <li className="evt__fact inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/12 bg-[#F7F2E9]/70 px-2.5 py-1 text-xs text-[#6E6459]">
                      <Images size={13} aria-hidden /> {`${spotlightEvent.submissionCount} bài dự thi`}
                    </li>
                    <li className="evt__fact inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/12 bg-[#F7F2E9]/70 px-2.5 py-1 text-xs text-[#6E6459]">
                      <Clock size={13} aria-hidden /> {`Đóng ${fmtDate(spotlightEvent.submissionEndAt)}`}
                    </li>
                  </ul>

                  <Link href={`/events/${spotlightEvent.id}`} className="btn btn--outline btn--sm evt__cta">
                    Đọc thể lệ <ArrowUpRight aria-hidden />
                  </Link>
                </div>
              </article>
              {/* Hai sự kiện còn lại — cùng dáng thẻ vuông ArtCard như bản thiết kế */}
              <div className="evt__side">
                {events.slice(1, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="art-card"
                    style={{ display: 'block' }}
                  >
                    <div className="art-card__frame" style={{ aspectRatio: '5 / 4' }}>
                      <div className="art-card__img">
                        {event.bannerUrl ? (
                          <Image
                            src={event.bannerUrl}
                            alt={event.title}
                            fill
                            unoptimized
                            sizes="(max-width: 900px) 50vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="skeleton h-full w-full" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                    <div className="art-card__meta">
                      <span className="art-card__title truncate">{event.title}</span>
                      <div className="art-card__sub">
                        <span>
                          {`${event.submissionCount} bài · ${
                            new Date(event.submissionEndAt).getTime() < Date.now() ? 'đã đóng' : 'đóng'
                          } ${fmtDate(event.submissionEndAt)}`}
                        </span>
                      </div>
                    </div>
                  </Link>
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
            title="Được xem nhiều nhất"
            sub="Xếp theo tổng lượt xem trên toàn sàn."
            href="/explore?sort=views"
            linkLabel="Xếp hạng đầy đủ"
          />
          <div className="board">
            {board.length === 0 ? (
              <p className="py-6 text-sm text-[#6E6459]">{loading ? 'Đang tải bảng xếp hạng…' : 'Chưa có dữ liệu.'}</p>
            ) : (
              board.map((artwork, position) => {
                /**
                 * Không in lượt xem tuyệt đối ở bảng xếp hạng. Thứ hạng đã nói lên
                 * vị trí; thanh dưới đây chỉ là TỈ LỆ so với tác phẩm dẫn đầu của
                 * chính bảng này (không phải con số thật của sàn).
                 */
                const top = Math.max(1, board[0]?.viewCount ?? 1);
                const heat = Math.max(6, Math.round(((artwork.viewCount ?? 0) / top) * 100));
                return (
                  <Link key={artwork.id} href={`/artworks/${artwork.id}`} scroll={false} className="board__row">
                    <span className="board__rank">{String(position + 1).padStart(2, '0')}</span>
                    <span className="board__title">
                      {artwork.title}
                      <small>
                        {artwork.creatorName || 'Dillustration Creator'}
                        {artwork.categoryName ? ` · ${artwork.categoryName}` : ''}
                      </small>
                    </span>
                    <span
                      className="board__heat"
                      role="img"
                      aria-label={position === 0 ? 'Dẫn đầu bảng tuần này' : `Hạng ${position + 1} bảng tuần này`}
                      title="Mức độ được xem so với tác phẩm dẫn đầu"
                    >
                      <i style={{ inlineSize: `${heat}%` }} />
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Reveal>
      </section>

      {/* ═══ CREATORS — the strip ═══ */}
      <section className="section wrap">
        <Reveal>
          <SectionHead
            eyebrow="Họa sĩ"
            title="Họa sĩ trên sàn"
            sub="Hồ sơ đã xác thực trên sàn."
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
            title={
              recoTopTag || recoSharesStyle
                ? 'Cùng một tay nghề, cùng một ánh sáng'
                : 'Được xem nhiều trên sàn'
            }
            sub={
              recoAnchor
                ? `Vì bạn đang xem “${recoAnchor.title}”${
                    recoTopTag
                      ? ` · cùng thẻ #${recoTopTag}`
                      : recoSharesStyle && recoAnchorStyle
                        ? ` · cùng dòng ${recoAnchorStyle}`
                        : ' · những tác phẩm được xem nhiều khác'
                  }.`
                : 'Những tác phẩm được xem nhiều nhất.'
            }
            href={recoHref}
            linkLabel={
              recoTopTag
                ? `Xem tất cả #${recoTopTag}`
                : recoSharesStyle && recoAnchorStyle
                  ? `Xem dòng ${recoAnchorStyle}`
                  : 'Xếp hạng đầy đủ'
            }
          />
          <ScrollRail className="rail">
            {reco.slice(0, 6).map(({ artwork, sharedTag, sameStyle }) => (
              <div key={artwork.id} className="rail__item">
                <ArtCard
                  artwork={artwork}
                  ratio="3 / 4"
                  /* Chỉ ghi lý do khi nó ĐÚNG: cùng thẻ, hoặc cùng dòng tranh với tranh
                     đang mở. Không có điểm chung thì để trống, không bịa "cùng bảng màu". */
                  reason={
                    sharedTag
                      ? `cùng thẻ #${sharedTag}`
                      : sameStyle && artwork.style
                        ? `cùng dòng ${artwork.style}`
                        : undefined
                  }
                />
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
                          sizes="4rem"
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
                Xem họa sĩ
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
    </div>
  );
}
