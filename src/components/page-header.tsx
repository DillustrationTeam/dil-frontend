'use client';

import { Wordmark } from '@/components/brand/wordmark';
import Image from 'next/image';
import Link from 'next/link';

export function PageHeader({ title }: { title?: string }) {
  return (
    <header className="mb-8 flex items-center gap-4 border-b border-[#221E1A]/10 pb-5">
      <Wordmark size="md" className="shrink-0" />
      {title && (
        <>
          <span className="h-6 w-px bg-[#F0E7D8]" />
          <span className="text-sm font-medium text-[#6E6459]">{title}</span>
        </>
      )}
    </header>
  );
}
