'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Calendar,
} from 'lucide-react';
import {
  getEventStatusLabel,
  normalizeEventStatus,
  type EventListItemDto,
} from '../../types/event.types';
import { useEventCountdown } from '../../hooks/use-event-countdown';
import { isFeaturedCarouselEvent, sortEventItems } from '../../services/event.service';
import { PrizeList } from './prize-list';
import { useLanguage } from '@/context/language-context';

interface EventSpotlightHeroProps {
  events?: EventListItemDto[] | null;
  event?: EventListItemDto | null;
  maxItems?: number;
}

/** Trạng thái → modifier của `.badge` trong hệ Ink & Vermilion. */
function statusBadgeClass(status?: string | number | null): string {
  const norm = normalizeEventStatus(status);
  if (norm === 'Open') return 'badge badge--live';
  if (norm === 'Judging') return 'badge badge--soon';
  return 'badge badge--done';
}

export function EventSpotlightHero({
  events,
  event,
  maxItems = 5,
}: EventSpotlightHeroProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  // Normalize items: ONLY show top latest featured events that have not ended, up to maxItems (default 5)
  const items = React.useMemo(() => {
    const rawList = events && events.length > 0 ? events : event ? [event] : [];
    return sortEventItems(rawList.filter(isFeaturedCarouselEvent), 'latest').slice(0, maxItems);
  }, [events, event, maxItems]);

  const [rawActiveIndex, setRawActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = items.length;
  const activeIndex = total > 0 ? (rawActiveIndex >= total ? 0 : rawActiveIndex) : 0;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setRawActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setRawActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play interval (every 7 seconds)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || total <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  // Keyboard navigation when focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  if (total === 0) return null;

  const currentEvent = items[activeIndex] || items[0];

  return (
    <section
      aria-label={isVie ? 'Bảng tin cuộc thi nổi bật' : 'Featured art contests'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="ev-spot focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lumen)] focus-visible:ring-offset-2"
    >
      {/* Top bar: featured tag · slide counter · controls */}
      <div className="ev-spot__top">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge--soon">
            <Flame size={12} aria-hidden />
            {isVie ? 'Cuộc thi nổi bật' : 'Featured contest'}
          </span>

          {total > 1 && (
            <span className="ev-spot__count">
              <b>{String(activeIndex + 1).padStart(2, '0')}</b>
              <span>/</span>
              <span>{String(total).padStart(2, '0')}</span>
              {isPaused ? (
                <span className="badge">
                  <Pause size={10} aria-hidden />
                  {isVie ? 'Tạm dừng' : 'Paused'}
                </span>
              ) : (
                <span className="badge">
                  <span className="dot dot--pulse" aria-hidden />
                  {isVie ? 'Tự động' : 'Auto'}
                </span>
              )}
            </span>
          )}
        </div>

        {total > 1 && (
          <div className="ev-spot__nav">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="icon-btn cursor-pointer"
              title={isPaused ? (isVie ? 'Tiếp tục tự động chuyển' : 'Resume auto-play') : (isVie ? 'Tạm dừng tự động chuyển' : 'Pause auto-play')}
              aria-label={isPaused ? (isVie ? 'Tiếp tục tự động chuyển' : 'Resume auto-play') : (isVie ? 'Tạm dừng tự động chuyển' : 'Pause auto-play')}
            >
              {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
            </button>

            <button
              type="button"
              onClick={prevSlide}
              className="icon-btn cursor-pointer"
              title={isVie ? 'Cuộc thi nổi bật trước' : 'Previous featured contest'}
              aria-label={isVie ? 'Cuộc thi nổi bật trước' : 'Previous featured contest'}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="icon-btn cursor-pointer"
              title={isVie ? 'Cuộc thi nổi bật kế tiếp' : 'Next featured contest'}
              aria-label={isVie ? 'Cuộc thi nổi bật kế tiếp' : 'Next featured contest'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <SlideItem key={currentEvent.id} event={currentEvent} />

      {/* Slide dots */}
      {total > 1 && (
        <div className="ev-spot__dots">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setRawActiveIndex(idx)}
              aria-current={idx === activeIndex}
              aria-label={`${isVie ? 'Tới sự kiện' : 'Go to slide'} ${idx + 1}`}
              className="ev-spot__dot"
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Sub-component for individual slide content with localized countdown
function SlideItem({ event }: { event: EventListItemDto }) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const countdown = useEventCountdown(event);

  // Ảnh có thể 404 → ẩn <img> để alt text không đè lên badge
  const [imageFailed, setImageFailed] = useState(false);

  const organizer =
    event.createdByAdminName || (isVie ? 'Hội đồng & ban giám khảo Dillustration' : 'Dillustration board & jury');

  const timeUnits = [
    { value: countdown.days, label: isVie ? 'Ngày' : 'Days' },
    { value: String(countdown.hours).padStart(2, '0'), label: isVie ? 'Giờ' : 'Hours' },
    { value: String(countdown.minutes).padStart(2, '0'), label: isVie ? 'Phút' : 'Mins' },
    { value: String(countdown.seconds).padStart(2, '0'), label: isVie ? 'Giây' : 'Secs' },
  ];

  return (
    <div className="ev-spot__grid">
      {/* Left: title, blurb, prize, CTA */}
      <div>
        <div className="ev-spot__meta">
          <span>
            <Calendar aria-hidden />
            {new Date(event.submissionStartAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            –{' '}
            {new Date(event.submissionEndAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>
            {event.submissionCount} {isVie ? 'bài dự thi' : 'entries'}
          </span>
          {event.totalVoteCount ? (
            <span>
              {event.totalVoteCount.toLocaleString('en-US')} {isVie ? 'lượt bình chọn' : 'votes'}
            </span>
          ) : null}
        </div>

        <h2 className="ev-spot__title">{event.title}</h2>

        {event.description ? <p className="ev-spot__desc">{event.description}</p> : null}

        {event.prize && (
          <div className="ev-spot__prize">
            <span className="ev-spot__prize-icon">
              <Trophy aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ev-spot__prize-label">
                {isVie ? 'Cơ cấu giải thưởng' : 'Prize pool'}
              </p>
              <PrizeList prize={event.prize} size="md" />
            </div>
          </div>
        )}

        <div className="ev-spot__actions">
          <Link href={`/events/${event.id}`} className="btn btn--primary">
            <span>{isVie ? 'Xem chi tiết sự kiện' : 'View event details'}</span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="ev-spot__trust">
          <span>
            <ShieldCheck aria-hidden />
            {isVie ? 'Bảo hộ bản quyền IP nguyên bản' : 'Original IP protected'}
          </span>
          <span>
            <Sparkles aria-hidden />
            {isVie ? 'Đã xác minh & quét AI' : 'Verified & AI-screened'}
          </span>
        </div>
      </div>

      {/* Right: banner + countdown */}
      <div>
        <div className="ev-spot__media">
          {event.bannerUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <span className="ev-card__blank" aria-hidden="true">
              <Trophy size={34} />
            </span>
          )}

          <div className="ev-spot__media-badges">
            <span className={statusBadgeClass(event.status)}>{getEventStatusLabel(event.status, isVie)}</span>
          </div>

          <div className="ev-spot__media-foot">
            <small>{isVie ? 'Tổ chức bởi' : 'Organized by'}</small>
            <strong className="truncate">{organizer}</strong>
          </div>
        </div>

        <div className="ev-spot__clock">
          {timeUnits.map((unit) => (
            <div key={unit.label} className="ev-spot__unit">
              <b>{unit.value}</b>
              <span>{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { EventSpotlightHero as EventFeaturedCarousel };
