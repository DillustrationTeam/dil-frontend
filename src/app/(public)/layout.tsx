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
      <div className="min-h-screen bg-[#1F2335] text-[#e4e1e5] font-body selection:bg-[#A7ACD9]/30 selection:text-white">
        <PublicHeader />
        <main>{children}</main>
      </div>
      {artworkModal}
    </Suspense>
  );
}
