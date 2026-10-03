'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { extractErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { ArtworkInteractions, CollectionDto, marketplaceService } from '../services/marketplace.service';

export const collectionNameSchema = z.string().trim().min(1, 'Nhập tên album.').max(100, 'Tên album tối đa 100 ký tự.');

export function ArtworkActions({ artworkId }: { artworkId: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [status, setStatus] = useState<ArtworkInteractions | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const identity = `${artworkId}:${isAuthenticated}:${userId ?? ''}`;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [albums, setAlbums] = useState<CollectionDto[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState('');
  const [name, setName] = useState('');
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);
  const generation = useRef(0);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const current = ++generation.current;
    lock.current = false;
    const load = async () => {
      setStatus(null); setError(''); setPicker(false); setBusy(false);
      try {
        const result = await marketplaceService.getArtworkInteractions(artworkId);
        if (generation.current === current) { setStatus(result); setLoadedFor(`${artworkId}:${isAuthenticated}:${userId ?? ''}`); }
      } catch (cause) {
        if (generation.current === current) setError(extractErrorMessage(cause, 'Không thể tải trạng thái tương tác.'));
      }
    };
    void load();
    return () => { generation.current = current + 1; };
  }, [artworkId, isAuthenticated, userId, retry]);

  const requireAuth = () => {
    if (isAuthenticated) return true;
    toast.error('Đăng nhập để thích hoặc lưu tranh.');
    return false;
  };

  const mutate = async (action: () => Promise<void>) => {
    if (!requireAuth() || lock.current || !status || loadedFor !== identity) return;
    const current = generation.current;
    lock.current = true; setBusy(true);
    try { await action(); }
    catch (cause) { if (generation.current === current) toast.error(extractErrorMessage(cause, 'Không thể lưu thay đổi. Vui lòng thử lại.')); }
    finally { if (generation.current === current) { lock.current = false; setBusy(false); } }
  };

  const like = () => mutate(async () => {
    const current = generation.current;
    const next = await marketplaceService.setArtworkLiked(artworkId, !status!.isLiked);
    if (generation.current === current) setStatus(next);
  });

  const openPicker = async () => {
    if (!requireAuth() || lock.current || !status || loadedFor !== identity) return;
    const current = generation.current;
    setPicker(true); setAlbumsLoading(true); setAlbumsError(''); setAlbums([]); setName('');
    try {
      const result = await marketplaceService.getMyCollections();
      if (generation.current === current) setAlbums(result);
    } catch (cause) {
      if (generation.current === current) setAlbumsError(extractErrorMessage(cause, 'Không thể tải album.'));
    } finally { if (generation.current === current) setAlbumsLoading(false); }
  };

  const toggleAlbum = (album: CollectionDto) => mutate(async () => {
    const current = generation.current;
    const saved = status!.collectionIds.includes(album.id);
    const next = saved
      ? await marketplaceService.removeArtworkFromCollection(album.id, artworkId)
      : await marketplaceService.addArtworkToCollection(album.id, artworkId);
    if (generation.current !== current) return;
    setStatus(next);
    setAlbums((items) => items.map((item) => item.id === album.id ? { ...item, artworkCount: Math.max(0, item.artworkCount + (saved ? -1 : 1)) } : item));
    toast.success(saved ? 'Đã gỡ tranh khỏi album.' : 'Đã lưu tranh vào album.');
  });

  const createAlbum = (event: FormEvent) => {
    event.preventDefault();
    const parsed = collectionNameSchema.safeParse(name);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    void mutate(async () => {
      const current = generation.current;
      const album = await marketplaceService.createCollection({ name: parsed.data, isPublic: false });
      if (generation.current !== current) return;
      setAlbums((items) => [album, ...items]); setName('');
      // Keep the created album visible if saving the artwork subsequently fails.
      const next = await marketplaceService.addArtworkToCollection(album.id, artworkId);
      if (generation.current !== current) return;
      setStatus(next);
      setAlbums((items) => items.map((item) => item.id === album.id ? { ...item, artworkCount: 1 } : item));
      toast.success('Đã tạo album và lưu tranh.');
    });
  };

  useEffect(() => {
    if (!picker) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!lock.current) setPicker(false); }
      if (event.key === 'Tab') {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? []);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (first && last && event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (first && last && !event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', escape, true);
    return () => { window.removeEventListener('keydown', escape, true); if (previous?.isConnected) previous.focus(); };
  }, [picker]);

  const bookmarked = Boolean(status?.collectionIds.length);
  return <div className="min-w-0 flex-1 space-y-2">
    <div className="flex gap-2">
      <button type="button" aria-pressed={status?.isLiked ?? false} disabled={busy || !status || loadedFor !== identity} onClick={() => void like()} title="Thả tim cho tác phẩm" className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold disabled:opacity-50 ${status?.isLiked ? 'bg-[#d989a7] text-white' : 'bg-white/10 text-[#E4E1E5] hover:bg-white/15'}`}><Heart className={`h-4 w-4 shrink-0 ${status?.isLiked ? 'fill-current' : ''}`} />{status?.isLiked ? 'Đã thích' : 'Yêu thích'}{status ? <span className="text-xs">{status.likeCount}</span> : <Loader2 className="h-4 w-4 animate-spin" />}</button>
      <button type="button" aria-pressed={bookmarked} disabled={busy || !status || loadedFor !== identity} onClick={() => void openPicker()} title="Lưu tranh vào album để xem lại" className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm disabled:opacity-50 ${bookmarked ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 text-white' : 'border-white/15 text-[#C7C5CF]'}`}><Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />{bookmarked ? 'Đã lưu' : 'Lưu tranh'}</button>
    </div>
    {error ? <p role="alert" className="text-xs text-rose-200">{error} <button type="button" onClick={() => setRetry((n) => n + 1)} className="underline">Thử lại</button></p> : null}
    {!isAuthenticated ? <Link href="/login" className="inline-block text-xs text-[#A7ACD9] hover:underline">Đăng nhập để thích và lưu tranh</Link> : null}
    {picker ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onClick={(event) => { if (event.target === event.currentTarget && !lock.current) setPicker(false); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Lưu tranh vào bộ sưu tập" className="w-full max-w-md rounded-3xl border border-white/15 bg-[#1F2335] p-5 shadow-2xl">
        <header className="flex items-center justify-between gap-3"><h2 className="font-h1 text-lg font-semibold text-white">Lưu vào bộ sưu tập</h2><button type="button" disabled={busy} onClick={() => setPicker(false)} aria-label="Đóng chọn album" className="rounded-xl p-2 text-[#C7C5CF] disabled:opacity-50"><X className="h-5 w-5" /></button></header>
        <p className="mt-2 text-xs text-[#C7C5CF]">Chọn album để lưu; bỏ chọn để gỡ tranh khỏi album.</p>
        <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
          {albumsLoading ? <p className="text-sm text-[#C7C5CF]">Đang tải album...</p> : albumsError ? <p role="alert" className="text-sm text-rose-200">{albumsError} <button type="button" onClick={() => void openPicker()} className="underline">Thử lại</button></p> : albums.length ? albums.map((album) => <label key={album.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><input type="checkbox" checked={status?.collectionIds.includes(album.id) ?? false} disabled={busy} onChange={() => void toggleAlbum(album)} className="accent-[#A7ACD9]" /><span className="min-w-0"><span className="block truncate text-sm text-white">{album.name}</span><span className="text-xs text-[#919099]">{album.artworkCount} tác phẩm · {album.isPublic ? 'Công khai' : 'Riêng tư'}</span></span></label>) : <p className="text-sm text-[#C7C5CF]">Bạn chưa có album. Tạo album bên dưới để lưu tranh.</p>}
        </div>
        <form onSubmit={createAlbum} className="mt-5 border-t border-white/10 pt-4"><label className="block text-xs text-[#C7C5CF]" htmlFor={`album-name-${artworkId}`}>Tạo album riêng tư mới</label><div className="mt-2 flex gap-2"><input id={`album-name-${artworkId}`} value={name} maxLength={100} required disabled={busy} onChange={(event) => setName(event.target.value)} placeholder="Tên album" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white" /><button type="submit" disabled={busy || albumsLoading || Boolean(albumsError)} className="rounded-xl bg-[#A7ACD9] px-3 py-2 text-sm font-semibold text-[#1F2335] disabled:opacity-50">{busy ? 'Đang lưu...' : 'Tạo & lưu'}</button></div></form>
        <Link href="/collections" className="mt-4 inline-block text-xs text-[#A7ACD9] hover:underline">Xem thư viện của bạn →</Link>
      </section>
    </div> : null}
  </div>;
}
