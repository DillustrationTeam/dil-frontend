 'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { artworkAiService, type Recommendation } from '../services/artwork-ai.service';
export function ArtworkRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { const controller = new AbortController();
    void (async () => { await Promise.resolve(); setLoading(true); setError(false);
      try { const result = await artworkAiService.recommendations(controller.signal); if (!controller.signal.aborted) setItems(result); }
      catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })(); return () => controller.abort();
  }, [attempt]);
  return <section className="glass-container space-y-4 rounded-3xl border border-white/10 p-5 sm:p-6"><div><h2 className="font-h1 text-lg font-bold text-white">Gợi ý tranh dành cho bạn</h2><p className="mt-1 text-xs text-slate-400">Dựa trên tag của tranh bạn thích, đã lưu và Creator bạn theo dõi.</p></div>
    {loading ? <p className="text-sm text-slate-400">Đang tìm tranh phù hợp…</p> : error ? <div role="alert" className="text-sm text-red-300">Không tải được gợi ý. <button onClick={() => setAttempt(v => v + 1)} className="underline">Thử lại</button></div> : items.length === 0 ? <p className="text-sm text-slate-400">Chưa có tranh phù hợp. Hãy khám phá và thích tranh để tạo sở thích của bạn.</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(({artwork, reason}) => <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"><div className="relative aspect-[4/3]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" /></div><div className="space-y-1 p-3"><h3 className="truncate text-sm font-semibold text-white">{artwork.title}</h3><p className="text-xs text-slate-400">{artwork.creatorName}</p><p className="text-xs text-[#A7ACD9]">{reason}</p></div></Link>)}</div>}
  </section>;
}
