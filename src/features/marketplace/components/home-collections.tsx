'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MarketplaceArtwork } from '@/features/marketplace/services/marketplace.service';

export function HomeCollections({ artworks, loading, error }: { artworks: MarketplaceArtwork[]; loading: boolean; error: string }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-[#A7ACD9]">Gallery</p><h2 className="mt-2 font-h1 text-2xl font-bold text-white">Tác phẩm mới</h2></div><Link href="/explore" className="text-sm text-[#A7ACD9] hover:underline">Xem tất cả</Link></div>
      {loading ? <p className="py-8 text-sm text-[#919099]">Đang tải tác phẩm…</p> : error ? <p role="alert" className="py-8 text-sm text-rose-300">{error}</p> : artworks.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{artworks.slice(0, 8).map((artwork) => <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"><div className="relative aspect-[4/5]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-cover transition group-hover:scale-[1.02]" /></div><p className="truncate p-3 text-sm text-white">{artwork.title}</p></Link>)}</div> : <p className="py-8 text-sm text-[#919099]">Chưa có tác phẩm mới.</p>}
    </section>
  );
}