'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';

const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

export default function ClientRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore(state => state.user?.id);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    commissionService.getById(id).then(setCommission)
      .catch(() => setError('Không tải được yêu cầu này.'))
      .finally(() => setLoading(false));
  }, [id]);

  const respond = async (accept: boolean) => {
    setBusy(true);
    setError('');
    try {
      await commissionService.respondToCounteroffer(id, accept);
      if (accept) router.replace(`/payment/checkout/${id}`);
      else setCommission(await commissionService.getById(id));
    } catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(apiError?.details?.join(' ') || apiError?.message || 'Không thể phản hồi đề xuất. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl p-8 text-sm text-slate-400">Đang tải yêu cầu…</div>;
  if (!commission || commission.clientId !== userId) return <div role="alert" className="mx-auto max-w-3xl p-8 text-sm text-red-300">{error || 'Bạn không có quyền xem yêu cầu này.'}</div>;

  const negotiating = commission.status === 'Negotiating';
  const awaitingCreator = commission.status === 'PendingAcceptance';
  const awaitingEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending';
  const price = commission.finalPrice ?? commission.totalPrice;

  return <main className="mx-auto w-full max-w-3xl space-y-6 pb-10 text-white">
    <Link href="/client/commissions" className="text-xs font-bold text-[#A7ACD9] hover:text-white">← Danh sách yêu cầu</Link>
    <section className="glass-container rounded-[28px] border border-white/10 p-6 sm:p-8">
      <p className="font-mono text-xs font-bold text-[#A7ACD9]">REQUEST #CMD-{commission.id.slice(0, 8).toUpperCase()}</p>
      <h1 className="mt-3 font-h1 text-2xl font-bold">{commission.title}</h1>
      <p className="mt-2 text-sm text-slate-400">Creator: {commission.creatorName || commission.creatorId}</p>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs text-slate-400">{negotiating ? 'Giá Creator đề xuất' : 'Giá yêu cầu'}</p>
        <p className="mt-1 font-h1 text-2xl font-bold">{money(price)}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{commission.description}</p>
      </div>
      {awaitingCreator && <p className="mt-6 rounded-xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 p-4 text-sm text-[#d8dbff]">Đã gửi yêu cầu. Đang chờ Creator phản hồi.</p>}
      {negotiating && <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 p-5">
        <h2 className="font-h1 text-lg font-bold">Creator đã gửi đề xuất giá mới</h2>
        <p className="mt-2 text-sm text-slate-300">Chấp nhận giá để chuyển sang bước ký quỹ. Workroom chỉ mở sau khi ký quỹ thành công.</p>
        <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} onClick={() => void respond(true)} className="commission-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-50">Chấp nhận giá</button><button disabled={busy} onClick={() => void respond(false)} className="rounded-xl border border-white/20 px-5 py-2.5 text-sm disabled:opacity-50">Từ chối</button></div>
      </div>}
      {awaitingEscrow && <Link href={`/payment/checkout/${id}`} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">Ký quỹ để mở Workroom</Link>}
      {commission.status === 'Cancelled' && <p className="mt-6 text-sm text-slate-400">Yêu cầu đã kết thúc.</p>}
      {!awaitingCreator && !negotiating && !awaitingEscrow && !['Cancelled'].includes(commission.status) && <Link href={`/workroom/${id}`} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">Mở Workroom</Link>}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    </section>
  </main>;
}
