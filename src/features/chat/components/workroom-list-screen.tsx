'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { commissionService } from '@/services/commission.service';
import type { Commission } from '@/types/commission.types';

export function WorkroomListScreen({ userId }: { userId: string | null }) {
  const roles = useAuthStore((state) => state.roles);
  const [items, setItems] = useState<Commission[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const isCreator = roles.some((role) => role.toLowerCase() === 'creator');
    const load = isCreator ? commissionService.getByCreator() : commissionService.getByClient();
    load.then((commissions) => { if (active) setItems(commissions); })
      .catch(() => { if (active) setError('Không tải được danh sách workroom.'); })
      .finally(() => { if (active) setLoadedUserId(userId); });
    return () => { active = false; };
  }, [roles, userId]);

  if (!userId) return <main className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-[#C7C5CF]"><p>Đăng nhập để xem workroom của bạn.</p><Link href="/login?returnUrl=%2Fworkroom" className="mt-4 inline-block text-[#A7ACD9] underline">Đăng nhập</Link></main>;

  return <main className="mx-auto max-w-5xl px-5 py-10 text-[#E4E1E5]"><header className="mb-6"><p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Workroom</p><h1 className="mt-2 font-h1 text-2xl font-bold text-white">Commission của bạn</h1></header>{loadedUserId !== userId ? <p className="flex items-center gap-2 py-12 text-sm text-[#919099]"><LoaderCircle className="h-4 w-4 animate-spin" />Đang tải…</p> : error ? <p role="alert" className="py-8 text-sm text-rose-300">{error}</p> : items.length ? <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.025] px-5">{items.map((item) => <Link key={item.id} href={`/workroom/${item.id}`} className="flex items-center gap-3 py-4"><MessageSquare className="h-5 w-5 shrink-0 text-[#A7ACD9]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-[#919099]">{item.status}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-[#A7ACD9]" /></Link>)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-[#919099]">Chưa có commission nào cần vào workroom.</p>}</main>;
}