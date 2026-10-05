'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, FileCheck, Image as ImageIcon, CreditCard } from 'lucide-react';
import { AdminActionRequiredQueueDto } from '@/features/admin/types/admin.types';

interface ActionRequiredQueueProps {
  queue?: AdminActionRequiredQueueDto | null;
}

export function ActionRequiredQueue({ queue }: ActionRequiredQueueProps) {
  if (!queue) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <Link
        href="/admin/disputes"
        className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-red-500/30 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Disputes</p>
            <p className="font-h1 font-bold text-white text-sm">
              <span className="font-h1 font-extrabold text-white">{queue.pendingDisputesCount}</span> Pending
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/admin/creator-verifications"
        className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-purple-500/30 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Creators</p>
            <p className="font-h1 font-bold text-white text-sm">
              <span className="font-h1 font-extrabold text-white">{queue.pendingCreatorApplicationsCount}</span> Pending
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/admin/moderation"
        className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-amber-500/30 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">AI Flagged</p>
            <p className="font-h1 font-bold text-white text-sm">
              <span className="font-h1 font-extrabold text-white">{queue.flaggedArtworksCount}</span> Artworks
            </p>
          </div>
        </div>
      </Link>

      <div className="glass-container bg-[#161926]/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#8A8FA9] uppercase font-bold">Payouts</p>
            <p className="font-h1 font-bold text-white text-sm">
              <span className="font-h1 font-extrabold text-white">{queue.pendingPayoutsCount}</span> In Queue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
