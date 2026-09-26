'use client';

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

const QUICK_SCREENS = [
  { label: 'Marketplace (SCR-05)', href: '/' },
  { label: 'Moderation (SCR-20)', href: '/admin/moderation', active: true },
  { label: 'Creator Apps (SCR-21)', href: '/admin/creator-applications' },
  { label: 'Arbitration (SCR-22)', href: '/admin/disputes' },
  { label: 'Fee Policy (SCR-18)', href: '/admin/fee-policy' },
  { label: 'Admin KPIs (SCR-24)', href: '/admin' },
];

export function ModerationQuickNav() {
  return (
    <nav
      aria-label="Screen Navigator"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0f1017]/95 backdrop-blur-xl border border-white/20 p-2.5 sm:p-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 text-xs max-w-5xl w-[92%] mx-auto justify-between px-4 sm:px-6"
    >
      <div className="flex items-center gap-2 font-bold font-h1 text-[#C5C9F8] shrink-0">
        <Compass className="w-4 h-4 text-[#C5C9F8]" />
        <span className="hidden sm:inline">Screen Navigator</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 text-[11px] no-scrollbar">
        {QUICK_SCREENS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
              s.active
                ? 'bg-red-500 text-black shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
