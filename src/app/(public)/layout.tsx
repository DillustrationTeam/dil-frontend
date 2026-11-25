'use client';

import React, { Suspense } from 'react';
import { PublicHeader } from '@/components/navigation/PublicHeader';

export default function PublicLayout({
  children,
  artworkModal,
}: {
  children: React.ReactNode;
  artworkModal: React.ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <div className="shell min-h-screen bg-[#F7F2E9] font-body text-[#241F1A] selection:bg-[#B24A26]/25 selection:text-[#241F1A]">
        <PublicHeader />
        <main>{children}</main>
      </div>
      {artworkModal}
    </Suspense>
  );
}
