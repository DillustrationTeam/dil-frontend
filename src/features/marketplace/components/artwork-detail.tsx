'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Bookmark, Heart, MessageCircle, Send, Share2, ShieldCheck } from 'lucide-react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';

export function ArtworkDetail({ id }: { id: string }) {
  const [artwork, setArtwork] = useState<MarketplaceArtwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ name: string; text: string; time: string }[]>([]);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorAcceptingOrders, setCreatorAcceptingOrders] = useState<boolean | null>(null);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const detail = await marketplaceService.getArtworkDetail(id);
        setArtwork(detail.artwork);
        setSaved(detail.isFavorited);
        marketplaceService.getCreatorById(detail.artwork.creatorProfileId).then((profile) => {
          setCreatorName(profile.displayName);
          setCreatorAcceptingOrders(profile.isAcceptingOrders);
        }).catch(() => undefined);
      } catch {
        setArtwork(null);
      }

      try {
        const data = await marketplaceService.getArtworkComments(id);
        setComments(data.map((item) => ({ name: item.authorName || 'Dillustration member', text: item.body, time: new Date(item.createdAt).toLocaleDateString('vi-VN') })));
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);
  const save = async () => { if (!artwork) return; try { const result = saved ? await marketplaceService.unfavoriteArtwork(artwork.id) : await marketplaceService.toggleFavorite(artwork.id); setSaved(Boolean(result.favorited)); } catch { /* no-op */ } };
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!comment.trim()) return; try { const next = await marketplaceService.createArtworkComment(id, comment.trim()); setComments((items) => [{ name: next.authorName || 'Bạn', text: next.body, time: new Date(next.createdAt).toLocaleDateString('vi-VN') }, ...items]); setComment(''); } catch { setComments((items) => [{ name: 'Bạn', text: comment.trim(), time: 'Vừa xong' }, ...items]); setComment(''); } };
  if (loading) return <div className="p-16 text-center text-[#C7C5CF]">Đang tải tác phẩm...</div>;
  if (!artwork) return <div className="p-16 text-center text-[#C7C5CF]">Không tìm thấy tác phẩm.</div>;
  return <main className="min-h-screen bg-[#1F2335] px-4 py-8 text-[#E4E1E5] sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><Link href="/explore" className="mb-6 inline-block text-sm text-[#A7ACD9] hover:underline">← Quay lại khám phá</Link><div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_390px]"><section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#131624]"><div className="relative aspect-[4/5] max-h-[78vh]"><Image src={artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain" /><div className="watermark absolute inset-0 flex rotate-[-24deg] items-center justify-center text-4xl font-black tracking-[.3em] text-white sm:text-6xl">DILLUSTRATION</div><div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#111424]/75 px-3 py-2 text-xs text-[#E4E1E5] backdrop-blur"><ShieldCheck className="h-4 w-4 text-[#A7ACD9]" />Ảnh có watermark bảo vệ</div></div></section><aside className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#A7ACD9]">Artwork detail</p><h1 className="mt-2 font-h1 text-3xl font-bold text-white">{artwork.title}</h1><p className="mt-2 text-sm text-[#C7C5CF]">bởi <Link href={`/creators/${artwork.creatorProfileId}`} className="font-medium text-[#D6D9FF] hover:underline">{creatorName || artwork.creatorName || 'Nghệ sĩ Dillustration'}</Link></p></div><div className="glass-container rounded-3xl p-5"><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-[#919099]">Phong cách</dt><dd className="mt-1 text-white">{artwork.tags?.[0] || 'Digital art'}</dd></div><div><dt className="text-[#919099]">Đăng tải</dt><dd className="mt-1 text-white">{new Date(artwork.createdAt).toLocaleDateString('vi-VN')}</dd></div><div><dt className="text-[#919099]">Lượt xem</dt><dd className="mt-1 text-white">{artwork.viewCount.toLocaleString()}</dd></div><div><dt className="text-[#919099]">Bản quyền</dt><dd className="mt-1 text-white">Cá nhân</dd></div></dl></div>{artwork.description && <p className="rounded-3xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-[#C7C5CF]">{artwork.description}</p>}<button type="button" disabled={creatorAcceptingOrders === false} onClick={() => setIsCommissionOpen(true)} className="w-full rounded-2xl bg-[#A7ACD9] px-4 py-3 text-sm font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-50">{creatorAcceptingOrders === false ? 'Creator đang tạm ngưng nhận đơn' : 'Commission this artist'}</button><div className="flex gap-3"><button onClick={() => setLiked(!liked)} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${liked ? 'bg-[#d989a7] text-white' : 'bg-white/10 text-[#E4E1E5]'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />{liked ? 'Đã thích' : 'Yêu thích'}</button><button onClick={save} className={`rounded-2xl border px-4 py-3 transition ${saved ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 text-white' : 'border-white/15 text-[#C7C5CF]'}`} aria-label="Lưu vào bộ sưu tập"><Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} /></button><button onClick={() => navigator.share?.({ title: artwork.title, url: location.href })} className="rounded-2xl border border-white/15 px-4 py-3 text-[#C7C5CF]" aria-label="Chia sẻ"><Share2 className="h-5 w-5" /></button></div></aside></div><section className="mt-10 max-w-3xl"><div className="mb-5 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-[#A7ACD9]" /><h2 className="font-h1 text-xl font-bold text-white">Bình luận ({comments.length})</h2></div><form onSubmit={submit} className="mb-5 flex gap-3"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Viết bình luận của bạn..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#A7ACD9]" /><button className="rounded-2xl bg-[#A7ACD9] px-4 text-[#1F2335]" aria-label="Gửi bình luận"><Send className="h-4 w-4" /></button></form><div className="space-y-3">{comments.map((item, index) => <article key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between"><strong className="text-sm text-white">{item.name}</strong><span className="text-xs text-[#919099]">{item.time}</span></div><p className="mt-2 text-sm text-[#C7C5CF]">{item.text}</p></article>)}</div></section></div>{isCommissionOpen && <CreateCommissionModal creatorId={artwork.creatorProfileId} creatorName={creatorName || artwork.creatorName || 'Creator'} onClose={() => setIsCommissionOpen(false)} />}</main>;
}
