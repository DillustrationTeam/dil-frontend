'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MarketplaceArtwork } from '../services/marketplace.service';

const categoryKey = (tag: string) => tag.trim().toLocaleLowerCase('vi');

export function HomeCollections({ artworks, loading, error }: { artworks: MarketplaceArtwork[]; loading: boolean; error: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const categories = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    for (const artwork of artworks) {
      const tags = new Set((artwork.tags ?? []).map(tag => tag.trim()).filter(Boolean));
      const keys = new Set<string>();
      for (const tag of tags) {
        const key = categoryKey(tag);
        if (keys.has(key)) continue;
        keys.add(key);
        const prior = groups.get(key);
        groups.set(key, { label: prior?.label ?? tag, count: (prior?.count ?? 0) + 1 });
      }
    }
    return Array.from(groups, ([key, value]) => ({ key, ...value })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'vi'));
  }, [artworks]);
  const filtered = selected === null ? artworks : artworks.filter(artwork => artwork.tags?.some(tag => categoryKey(tag) === selected));

  return <section id="bento" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-[#B24A26]">Curated Collections</p><h2 className="mt-2 font-h1 text-3xl font-bold text-[#241F1A]">Bộ sưu tập theo danh mục</h2><p className="mt-2 text-sm text-[#6E6459]">Khám phá tranh theo chủ đề do họa sĩ gắn thẻ.</p></div>
      <button type="button" onClick={() => setSelected(null)} className="text-sm text-[#B24A26] hover:underline">Xem tất cả danh mục</button>
    </div>
    <div aria-label="Lọc bộ sưu tập theo danh mục" className="mb-6 flex flex-wrap gap-2">
      <button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)} className={`rounded-full border px-4 py-2 text-sm ${selected === null ? 'border-[#B24A26] bg-[#B24A26] text-[#F7F2E9]' : 'border-[#221E1A]/10 text-[#6E6459] hover:bg-[#FFFCF6]'}`}>Tất cả ({artworks.length})</button>
      {categories.map(category => <button type="button" key={category.key} aria-pressed={selected === category.key} onClick={() => setSelected(category.key)} className={`rounded-full border px-4 py-2 text-sm ${selected === category.key ? 'border-[#B24A26] bg-[#B24A26] text-[#F7F2E9]' : 'border-[#221E1A]/10 text-[#6E6459] hover:bg-[#FFFCF6]'}`}>{category.label} ({category.count})</button>)}
    </div>
    <p aria-live="polite" className="mb-4 text-sm text-[#746A5F]">{loading ? 'Đang tải bộ sưu tập…' : error || `${filtered.length} tác phẩm`}</p>
    {!loading && !error && filtered.length === 0 && <p className="rounded-3xl border border-dashed border-[#221E1A]/10 p-8 text-center text-[#6E6459]">Chưa có tranh trong danh mục này.</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map(artwork => <Link key={artwork.id} href={`/artworks/${artwork.id}`} scroll={false} className="glass-container group overflow-hidden rounded-[28px] border border-[#221E1A]/10 hover:border-[#B24A26]/50">
        <div className="relative aspect-[4/3] bg-[#FFFCF6]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain transition-transform group-hover:scale-[1.02]" /></div>
        <div className="p-4"><h3 className="font-h1 text-lg font-semibold text-[#241F1A]">{artwork.title}</h3><p className="mt-1 text-sm text-[#6E6459]">{artwork.creatorName || 'Creator'}</p><p className="mt-2 text-xs text-[#B24A26]">{artwork.tags?.join(' · ') || 'Chưa phân loại'}</p></div>
      </Link>)}
    </div>
  </section>;
}
