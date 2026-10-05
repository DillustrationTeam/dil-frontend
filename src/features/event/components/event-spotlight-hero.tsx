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
import type { EventListItemDto } from '../types/event.types';
import { useEventCountdown } from '../hooks/use-event-countdown';
import { isEventInSubmissionStage } from '../services/event.service';

interface EventSpotlightHeroProps {
  events?: EventListItemDto[] | null;
  event?: EventListItemDto | null;
  maxItems?: number;
}

export function EventSpotlightHero({
  events,
  event,
  maxItems = 5,
}: EventSpotlightHeroProps) {
  // Normalize items: ONLY show contests currently in the submission stage, up to maxItems (default 5)
  const items = React.useMemo(() => {
    const rawList = events && events.length > 0 ? events : event ? [event] : [];
    const submissionOnly = rawList.filter(isEventInSubmissionStage);
    return submissionOnly.slice(0, maxItems);
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
      aria-label="Featured Art Contests Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#1b1f36] via-[#161926] to-[#121420] p-6 sm:p-8 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle/40 select-none"
    >
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-brand-periwinkle/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-amber-500/10 blur-[100px]" />

      {/* Top Controls Header: Badge, Slide Counter & Carousel Arrows */}
      <div className="relative z-20 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Left: Badge + Count Indicator */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm">
            <Flame size={14} className="text-amber-400 animate-bounce" />
            <span className="uppercase tracking-widest text-[11px] font-bold">Featured Art Contest</span>
          </div>

          {total > 1 && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#A7ACD9]">
              <span className="tabular-nums text-white">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-white/30">/</span>
              <span className="tabular-nums text-white/60">
                {String(total).padStart(2, '0')}
              </span>
              {isPaused ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-amber-300">
                  <Pause size={10} /> Paused
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" /> Auto
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Carousel Navigation Arrows & Play/Pause */}
        {total > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A7ACD9] transition hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
              title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
              aria-label={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
            >
              {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
            </button>

            <button
              type="button"
              onClick={prevSlide}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A7ACD9] transition hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
              title="Previous featured contest"
              aria-label="Previous featured contest"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A7ACD9] transition hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
              title="Next featured contest"
              aria-label="Next featured contest"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Slide Content: Left Details & Right Visual */}
      <SlideItem key={currentEvent.id} event={currentEvent} />

      {/* Slide Dots Indicator (Clean & Minimal, without bottom event list) */}
      {total > 1 && (
        <div className="relative z-20 mt-6 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setRawActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 bg-brand-periwinkle shadow-[0_0_12px_rgba(167,172,217,0.5)]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Sub-component for individual slide content with localized countdown
function SlideItem({ event }: { event: EventListItemDto }) {
  const countdown = useEventCountdown(event);

  return (
    <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center animate-fadeIn">
      {/* Left Column: Contest Info, Prize & CTA */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold text-[#8A8FA9]">
            <span className="flex items-center gap-1.5 text-brand-periwinkle">
              <Calendar size={13} />
              {new Date(event.submissionStartAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              -{' '}
              {new Date(event.submissionEndAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="text-white/80">{event.submissionCount} entries</span>
            {event.totalVoteCount ? (
              <>
                <span>•</span>
                <span className="text-white/80">{event.totalVoteCount} votes</span>
              </>
            ) : null}
          </div>

          <h1 className="font-h1 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            {event.title}
          </h1>
        </div>

        <p className="text-sm sm:text-base text-[#A7ACD9] leading-relaxed max-w-2xl line-clamp-3">
          {event.description}
        </p>

        {/* Prize Pool Callout */}
        {event.prize && (
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-amber-400/25 bg-amber-500/5 p-4 sm:p-5 backdrop-blur-md shadow-[0_4px_25px_rgba(251,191,36,0.08)]">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.35)]">
              <Trophy size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Prestigious Prize Pool
              </p>
              <p className="font-h1 text-lg sm:text-xl font-extrabold text-white">
                {event.prize}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-7 py-3.5 text-sm font-bold text-brand-navy shadow-[0_12px_35px_rgba(167,172,217,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(167,172,217,0.4)] active:translate-y-0"
          >
            <span>View Event Details</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Trust Points */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-1 text-xs text-[#8A8FA9]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-400" /> Original IP Protected
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-brand-periwinkle" /> Verified & AI-Screened
          </span>
        </div>
      </div>

      {/* Right Column: Hero Banner Image & Big Countdown Box */}
      <div className="lg:col-span-5 space-y-5">
        <div className="group relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-[#242942] to-[#121420] flex items-center justify-center">
              <Trophy size={48} className="text-brand-periwinkle/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

          {/* Top Banner Tag: Status */}
          <div className="absolute top-4 left-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                String(event.status).toLowerCase() === 'open'
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                  : String(event.status).toLowerCase() === 'judging'
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                  : 'bg-slate-500/20 border border-slate-400/40 text-slate-300'
              }`}
            >
              {event.status}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
              Organized by
            </p>
            <p className="text-sm font-bold text-white drop-shadow">
              {event.createdByAdminName || 'Dillustration Board & Jury'}
            </p>
          </div>
        </div>

        {/* Big Countdown Box */}
        <div className="rounded-3xl border border-white/10 bg-[#161926]/90 p-5 backdrop-blur-xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[#A7ACD9]">
            {countdown.phaseLabel}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <span className="block font-h1 text-2xl sm:text-3xl font-bold tabular-nums text-white">
                {countdown.days}
              </span>
              <span className="text-[10px] uppercase font-bold text-outline">Days</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <span className="block font-h1 text-2xl sm:text-3xl font-bold tabular-nums text-white">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-outline">Hours</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <span className="block font-h1 text-2xl sm:text-3xl font-bold tabular-nums text-white">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-outline">Mins</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <span className="block font-h1 text-2xl sm:text-3xl font-bold tabular-nums text-brand-periwinkle animate-pulse">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-outline">Secs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { EventSpotlightHero as EventFeaturedCarousel };
