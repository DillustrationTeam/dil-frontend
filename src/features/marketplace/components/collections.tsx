'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, FolderPlus, Globe2, Heart, Lock } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { extractErrorMessage } from '@/lib/api-client';
import { CollectionDto, marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import { collectionNameSchema } from './artwork-actions';

function ArtworkGrid({ items, collectionId, busyItems, onRemove }: { items: MarketplaceArtwork[]; collectionId?: string; busyItems: string[]; onRemove: (artworkId: string, collectionId?: string) => Promise<void> }) {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((artwork) => <article key={artwork.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"><Link href={`/artworks/${artwork.id}`} className="block"><div className="relative aspect-[4/5] bg-black/20"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain" /></div></Link><div className="flex items-center justify-between gap-2 p-3"><Link href={`/artworks/${artwork.id}`} className="truncate text-sm text-white hover:text-[#A7ACD9]">{artwork.title}</Link><button type="button" disabled={busyItems.includes(`${collectionId || 'like'}:${artwork.id}`)} onClick={() => void onRemove(artwork.id, collectionId)} aria-label={collectionId ? `Gỡ ${artwork.title} khỏi album` : `Bỏ yêu thích ${artwork.title}`} title={collectionId ? 'Gỡ khỏi album' : 'Bỏ yêu thích'} className="rounded-lg p-2 text-[#A7ACD9] disabled:opacity-40">{collectionId ? <Bookmark className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4 fill-[#d989a7] text-[#d989a7]" />}</button></div></article>)}</div>;
}

export function Collections({ mode = 'all', embedded = false }: { mode?: 'all' | 'saved' | 'liked'; embedded?: boolean }) {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [favorites, setFavorites] = useState<MarketplaceArtwork[]>([]);
  const [albums, setAlbums] = useState<CollectionDto[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [name, setName] = useState('');
  const [publicAlbum, setPublicAlbum] = useState(false);
  const [loading, setLoading] = useState(true);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [error, setError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyItems, setBusyItems] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const locks = useRef(new Set<string>());
  const generation = useRef(0);
  const currentSelected = useRef(selected);
  useEffect(() => { currentSelected.current = selected; }, [selected]);

  useEffect(() => {
    const current = ++generation.current;
    const load = async () => {
      setLoading(true); setError(''); setFavorites([]); setAlbums([]); setSelected(null); setName(''); setBusyItems([]); setCreating(false);
      locks.current.clear();
      if (!authenticated) { setLoading(false); return; }
      try {
        const [liked, collections] = await Promise.all([marketplaceService.getMyFavorites(), marketplaceService.getMyCollections()]);
        if (generation.current === current) { setFavorites(liked); setAlbums(collections); }
      } catch (cause) {
        if (generation.current === current) setError(extractErrorMessage(cause, 'Không thể tải thư viện.'));
      } finally { if (generation.current === current) setLoading(false); }
    };
    void load();
    return () => { generation.current = current + 1; };
  }, [authenticated, userId, retry]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setArtworks([]); setAlbumError(''); setAlbumLoading(Boolean(selected));
      if (!selected || !authenticated) return;
      try {
        const items = await marketplaceService.getCollectionArtworks(selected);
        if (active) setArtworks(items);
      } catch (cause) { if (active) setAlbumError(extractErrorMessage(cause, 'Không thể tải nội dung album.')); }
      finally { if (active) setAlbumLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [selected, authenticated, userId]);

  const addAlbum = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = collectionNameSchema.safeParse(name);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (locks.current.has('create') || !authenticated) return;
    const current = generation.current;
    locks.current.add('create'); setCreating(true);
    try {
      const created = await marketplaceService.createCollection({ name: parsed.data, isPublic: publicAlbum });
      if (generation.current !== current) return;
      setAlbums((items) => [created, ...items]); setSelected(created.id); setName(''); setPublicAlbum(false);
      toast.success('Đã tạo album.');
    } catch (cause) { if (generation.current === current) toast.error(extractErrorMessage(cause, 'Không thể tạo album.')); }
    finally { if (generation.current === current) { locks.current.delete('create'); setCreating(false); } }
  };

  const remove = async (artworkId: string, collectionId?: string) => {
    const key = `${collectionId || 'like'}:${artworkId}`;
    if (locks.current.has(key) || !authenticated) return;
    const current = generation.current;
    locks.current.add(key); setBusyItems((items) => [...items, key]);
    try {
      if (collectionId) await marketplaceService.removeArtworkFromCollection(collectionId, artworkId);
      else await marketplaceService.setArtworkLiked(artworkId, false);
      if (generation.current !== current) return;
      if (collectionId) {
        if (currentSelected.current === collectionId) setArtworks((items) => items.filter((item) => item.id !== artworkId));
        setAlbums((items) => items.map((item) => item.id === collectionId ? { ...item, artworkCount: Math.max(0, item.artworkCount - 1) } : item));
      } else setFavorites((items) => items.filter((item) => item.id !== artworkId));
      toast.success(collectionId ? 'Đã gỡ tranh khỏi album.' : 'Đã bỏ yêu thích.');
    } catch (cause) { if (generation.current === current) toast.error(extractErrorMessage(cause, 'Không thể lưu thay đổi.')); }
    finally { if (generation.current === current) { locks.current.delete(key); setBusyItems((items) => items.filter((item) => item !== key)); } }
  };


  const album = albums.find((item) => item.id === selected);
  return <div className={embedded ? "text-[#E4E1E5]" : "min-h-screen bg-[#1F2335] px-4 py-10 text-[#E4E1E5] sm:px-6"}><div className="mx-auto max-w-6xl">
    {!embedded && <><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Thư viện cá nhân</p><h1 className="mt-2 font-h1 text-3xl font-bold text-white">Bộ sưu tập & yêu thích</h1><p className="mt-3 text-sm text-[#C7C5CF]">Tranh đã lưu được tổ chức trong album; tranh đã thích nằm ở danh sách riêng.</p></>}
    {!authenticated ? <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center"><p>Đăng nhập để xem thư viện của bạn.</p><Link href="/login" className="mt-3 inline-block text-[#A7ACD9]">Đăng nhập</Link></div> : loading ? <p className="py-12 text-center">Đang tải thư viện...</p> : error ? <div role="alert" className="mt-8 rounded-2xl border border-rose-300/20 p-6 text-rose-200">{error} <button type="button" onClick={() => setRetry((n) => n + 1)} className="underline">Thử lại</button></div> : <>
      {mode !== "liked" && <section className="mt-9"><div className="mb-4 flex items-center justify-between"><h2 className="font-h1 text-xl font-bold text-white">Album của bạn</h2><span className="text-sm text-[#919099]">{albums.length} album</span></div><div className="grid gap-4 md:grid-cols-3">
        <form onSubmit={addAlbum} className="glass-container rounded-3xl p-5"><FolderPlus className="h-6 w-6 text-[#A7ACD9]" /><h3 className="mt-4 font-h1 text-base font-semibold text-white">Tạo album mới</h3><input aria-label="Tên album" value={name} required maxLength={100} disabled={creating} onChange={(event) => setName(event.target.value)} placeholder="Tên album" className="mt-3 w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm outline-none focus:border-[#A7ACD9]" /><label className="mt-3 flex items-center gap-2 text-xs text-[#C7C5CF]"><input checked={publicAlbum} disabled={creating} onChange={(event) => setPublicAlbum(event.target.checked)} type="checkbox" className="accent-[#A7ACD9]" />Công khai album</label><button disabled={creating} className="mt-4 w-full rounded-xl bg-[#A7ACD9] py-2.5 text-sm font-semibold text-[#1F2335] disabled:opacity-50">{creating ? 'Đang tạo...' : 'Tạo album'}</button></form>
        {albums.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`flex min-h-44 flex-col justify-between rounded-3xl border bg-gradient-to-br from-[#454977] to-[#252a45] p-5 text-left transition ${selected === item.id ? 'border-[#A7ACD9] ring-1 ring-[#A7ACD9]' : 'border-white/10 hover:border-[#A7ACD9]/60'}`}><span className="self-start rounded-full bg-black/20 p-2">{item.isPublic ? <Globe2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</span><span className="mt-4 min-w-0"><span className="block break-words font-h1 text-lg font-bold text-white">{item.name}</span><span className="mt-1 block text-xs text-[#DDE0FF]">{item.artworkCount} tác phẩm · {item.isPublic ? 'Công khai' : 'Riêng tư'}</span></span></button>)}
      </div></section>}
      {mode !== "liked" && selected ? <section className="mt-9"><h2 className="mb-4 font-h1 text-xl font-bold text-white">{album?.name || 'Album'}</h2>{albumLoading ? <p>Đang tải tác phẩm...</p> : albumError ? <p role="alert" className="text-rose-200">{albumError} <button type="button" onClick={() => setRetry((n) => n + 1)} className="underline">Tải lại thư viện</button></p> : artworks.length ? <ArtworkGrid items={artworks} collectionId={selected} busyItems={busyItems} onRemove={remove} /> : <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-[#C7C5CF]">Album chưa có tác phẩm. Dùng nút “Lưu tranh” khi xem chi tiết tranh.</p>}</section> : null}
      {mode !== "saved" && <section className="mt-12"><div className="mb-4 flex items-center gap-2"><Heart className="h-5 w-5 fill-[#d989a7] text-[#d989a7]" /><h2 className="font-h1 text-xl font-bold text-white">Tác phẩm đã thích</h2><span className="text-sm text-[#919099]">({favorites.length})</span></div>{favorites.length ? <ArtworkGrid items={favorites} busyItems={busyItems} onRemove={remove} /> : <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center"><p className="font-h1 text-lg">Chưa có tác phẩm yêu thích</p><Link href="/explore" className="mt-2 inline-block text-sm text-[#A7ACD9]">Khám phá chợ tranh</Link></div>}</section>}
    </>}
  </div></div>;
}
