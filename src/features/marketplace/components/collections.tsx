'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FolderPlus, Globe2, Heart, Lock, MoreHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';

const favoriteKey = 'dillustration:favorites';
type Album = { id: number; name: string; isPublic: boolean };
const defaultAlbums: Album[] = [{ id: 1, name: 'Inspiration cho dự án', isPublic: false }, { id: 2, name: 'Nghệ sĩ yêu thích', isPublic: true }];

export function Collections() {
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [albums, setAlbums] = useState<Album[]>(defaultAlbums);
  const [name, setName] = useState('');
  const [publicAlbum, setPublicAlbum] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const favorites = await marketplaceService.getMyFavorites();
        setArtworks(favorites);
      } catch {
        setArtworks([]);
      }

      try {
        const collections = await marketplaceService.getMyCollections();
        setAlbums(collections.map((item) => ({
          id: Number.parseInt(item.id.slice(0, 8), 16) || Date.now(),
          name: item.name,
          isPublic: item.isPublic,
        })));
      } catch {
        setAlbums(defaultAlbums);
      }
    };

    void load();
  }, []);
  const addAlbum = async (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return; try { const created = await marketplaceService.createCollection({ name: name.trim(), isPublic: publicAlbum }); setAlbums((items) => [{ id: Number.parseInt(created.id.slice(0, 8), 16) || Date.now(), name: created.name, isPublic: created.isPublic }, ...items]); setName(''); setPublicAlbum(false); } catch { setAlbums((items) => [...items, { id: Date.now(), name: name.trim(), isPublic: publicAlbum }]); setName(''); setPublicAlbum(false); } };
  const removeFavorite = async (id: string) => { try { await marketplaceService.unfavoriteArtwork(id); setArtworks((items) => items.filter((item) => item.id !== id)); } catch { setArtworks((items) => items.filter((item) => item.id !== id)); } };
  return <main className="min-h-screen bg-[#1F2335] px-4 py-10 text-[#E4E1E5] sm:px-6"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Thư viện cá nhân</p><h1 className="mt-2 font-h1 text-3xl font-bold text-white">Bộ sưu tập & yêu thích</h1><p className="mt-3 text-sm text-[#C7C5CF]">Lưu giữ các tác phẩm để quay lại bất cứ lúc nào.</p><section className="mt-9"><div className="mb-4 flex items-center justify-between"><h2 className="font-h1 text-xl font-bold text-white">Album của bạn</h2><span className="text-sm text-[#919099]">{albums.length} album</span></div><div className="grid gap-4 md:grid-cols-3"><form onSubmit={addAlbum} className="glass-container rounded-3xl p-5"><FolderPlus className="h-6 w-6 text-[#A7ACD9]" /><h3 className="mt-4 font-h1 text-base font-semibold text-white">Tạo album mới</h3><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên album" className="mt-3 w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm outline-none focus:border-[#A7ACD9]" /><label className="mt-3 flex items-center gap-2 text-xs text-[#C7C5CF]"><input checked={publicAlbum} onChange={(event) => setPublicAlbum(event.target.checked)} type="checkbox" className="accent-[#A7ACD9]" />Công khai album</label><button className="mt-4 w-full rounded-xl bg-[#A7ACD9] py-2.5 text-sm font-semibold text-[#1F2335]">Tạo album</button></form>{albums.map((album, index) => <article key={album.id} className="relative min-h-52 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#454977] to-[#252a45] p-5"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at ${index ? '80' : '25'}% 20%, #fff, transparent 28%)` }} /><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full bg-black/20 p-2">{album.isPublic ? <Globe2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</span><MoreHorizontal className="h-5 w-5 text-[#DDE0FF]" /></div><div><h3 className="font-h1 text-lg font-bold text-white">{album.name}</h3><p className="mt-1 text-xs text-[#DDE0FF]">0 tác phẩm · {album.isPublic ? 'Công khai' : 'Riêng tư'}</p></div></div></article>)}</div></section><section className="mt-12"><div className="mb-4 flex items-center gap-2"><Heart className="h-5 w-5 fill-[#d989a7] text-[#d989a7]" /><h2 className="font-h1 text-xl font-bold text-white">Tác phẩm đã thích</h2><span className="text-sm text-[#919099]">({artworks.length})</span></div>{artworks.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{artworks.map((artwork) => <div key={artwork.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5"><Link href={`/artworks/${artwork.id}`}><div className="relative aspect-[4/5]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-cover transition group-hover:scale-105" /></div></Link><div className="flex items-center justify-between gap-2 p-3"><p className="truncate text-sm text-white">{artwork.title}</p><button onClick={() => removeFavorite(artwork.id)} className="text-[#d989a7]" aria-label="Bỏ yêu thích"><Heart className="h-4 w-4 fill-current" /></button></div></div>)}</div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center"><Heart className="mx-auto h-8 w-8 text-[#A7ACD9]" /><p className="mt-3 font-h1 text-lg text-white">Chưa có tác phẩm yêu thích</p><Link href="/explore" className="mt-2 inline-block text-sm text-[#A7ACD9] hover:underline">Khám phá chợ tranh</Link></div>}</section></div></main>;
}
