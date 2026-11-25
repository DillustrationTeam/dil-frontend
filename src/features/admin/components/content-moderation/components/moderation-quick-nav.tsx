'use client';

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

const QUICK_SCREENS = [
  { label: 'Marketplace', href: '/' },
  { label: 'Moderation', href: '/admin/moderation', active: true },
  { label: 'Creator Apps', href: '/admin/creator-verifications' },
  { label: 'Arbitration', href: '/admin/disputes' },
  { label: 'Fee Policy', href: '/admin/fee-policy' },
  { label: 'Forensic Watermark', href: '/admin/forensic' },
  { label: 'Admin KPIs', href: '/admin' },
];

export function ModerationQuickNav() {
  return (
    <nav
      aria-label="Screen Navigator"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#FFFCF6]/95 backdrop-blur-xl border border-[#221E1A]/20 p-2.5 sm:p-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 text-xs max-w-5xl w-[92%] mx-auto justify-between px-4 sm:px-6"
    >
      <div className="flex items-center gap-2 font-bold font-h1 text-[#8C3718] shrink-0">
        <Compass className="w-4 h-4 text-[#8C3718]" />
        <span className="hidden sm:inline">Screen Navigator</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 text-[11px] no-scrollbar">
        {QUICK_SCREENS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
              s.active
                ? 'bg-[#A8321C]/12 text-[#F7F2E9] shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[#241F1A]'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
