'use client';

import Image from 'next/image';
import Link from 'next/link';

export function PageHeader({ title }: { title?: string }) {
  return (
    <header className="mb-8 flex items-center gap-4 border-b border-white/10 pb-5">
      <Link href="/" className="group flex items-center gap-2" title="Về trang chủ">
        <Image
          src="/weblogo.png"
          alt="dillustration"
          width={120}
          height={56}
          className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
        />
      </Link>
      {title && (
        <>
          <span className="h-6 w-px bg-white/10" />
          <span className="text-sm font-medium text-[#C7C5CF]">{title}</span>
        </>
      )}
    </header>
  );
}
