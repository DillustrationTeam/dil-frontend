'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Trophy, Users, Sparkles, CheckCircle2, Flame, Eye, Edit3, Trash2 } from 'lucide-react';
import type { EventListItemDto } from '../../types/event.types';
import { eventStatusBadgeStyles, eventStatusLabels } from '../../types/event.types';
import { useEventCountdown } from '../../hooks/use-event-countdown';

interface EventCardProps {
  event: EventListItemDto;
  adminActions?: {
    onViewDetails?: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
  };
}

export function EventCard({ event, adminActions }: EventCardProps) {
  const countdown = useEventCountdown(event);

  const statusStr = typeof event.status === 'number'
    ? (event.status === 2 ? 'Open' : event.status === 3 ? 'Judging' : event.status === 4 ? 'Ended' : 'Draft')
    : String(event.status);

  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-outline';
  const statusLabel = eventStatusLabels[statusStr] || statusStr;

  return (
    <div className="group flex min-h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[#161926]/80 shadow-[0_24px_70px_rgba(6,8,18,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-periwinkle/50 hover:bg-[#1b1f31] hover:shadow-[0_28px_80px_rgba(167,172,217,0.18)]">
      <div>
        {/* Banner Image Container */}
        <Link href={`/events/${event.id}`} className="relative aspect-[16/10] w-full overflow-hidden bg-black/40 block cursor-pointer">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#1F2335] to-[#161926] text-xs text-outline">
              <Sparkles size={24} className="text-brand-periwinkle/50" />
            </div>
          )}

          {/* Gradient Scrim */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#161926] via-[#161926]/60 to-transparent" aria-hidden="true" />

          {/* Badges Overlay */}
          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md transition-all ${statusColor}`}>
                {statusLabel}
              </span>
              {event.isFeatured && (
                <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                  <Flame size={11} className="text-amber-400" />
                  Featured
                </span>
              )}
            </div>

            {/* Countdown Badge */}
            <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#11131d]/85 px-3 py-1 font-mono text-[11px] tabular-nums text-white shadow-lg backdrop-blur-md">
              <Clock size={12} className="text-brand-periwinkle animate-pulse" />
              <span>{countdown.formatted}</span>
            </span>
          </div>
        </Link>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 text-xs text-[#8A8FA9] mb-2">
            <span className="inline-flex items-center gap-1 font-medium text-slate-300">
              <CheckCircle2 size={13} className="text-[#A7ACD9]" />
              {event.createdByAdminName || 'Dillustration Official'}
            </span>
            <Link
              href={`/events/${event.id}`}
              className="flex items-center gap-1 text-brand-periwinkle font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            >
              <span className="text-[11px]">View details</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <Link href={`/events/${event.id}`} className="block">
            <h3 className="line-clamp-2 font-h1 text-lg font-bold text-white transition-colors group-hover:text-brand-periwinkle">
              {event.title}
            </h3>
          </Link>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#919099]">
            {event.description}
          </p>

          {/* Prize Pool Callout Box */}
          {event.prize && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shadow-inner">
                <Trophy size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/80 block">
                  Prize Pool
                </span>
                <p className="line-clamp-1 text-xs font-bold text-white">
                  {event.prize}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row or Admin Actions Footer */}
      <div className="px-6 pb-6 pt-2">
        {adminActions ? (
          <div className="flex items-center justify-around border-t border-white/10 pt-4">
            <button
              type="button"
              title="View Details"
              onClick={() => adminActions.onViewDetails?.()}
              className="flex items-center justify-center size-9 rounded-xl border border-white/10 bg-white/5 text-[#A7ACD9] hover:bg-brand-periwinkle/20 hover:border-brand-periwinkle/40 hover:text-brand-periwinkle transition-all cursor-pointer"
            >
              <Eye size={16} />
            </button>

            <button
              type="button"
              title="Update Event"
              onClick={() => adminActions.onUpdate?.()}
              className="flex items-center justify-center size-9 rounded-xl border border-white/10 bg-white/5 text-[#A7ACD9] hover:bg-blue-500/20 hover:border-blue-400/40 hover:text-blue-300 transition-all cursor-pointer"
            >
              <Edit3 size={16} />
            </button>

            <button
              type="button"
              title="Delete Event"
              onClick={() => adminActions.onDelete?.()}
              className="flex items-center justify-center size-9 rounded-xl border border-white/10 bg-white/5 text-[#A7ACD9] hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-400 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Users size={14} className="text-brand-periwinkle" />
              <span className="font-semibold text-white">{event.submissionCount}</span>
            </div>

            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Sparkles size={14} className="text-[#A7ACD9]" />
              <span className="font-semibold text-white">{(event.totalVoteCount ?? 0).toLocaleString('en-US')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
