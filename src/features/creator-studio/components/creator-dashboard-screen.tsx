'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleDollarSign, LoaderCircle, Wallet } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { RevenueChart, paymentService, walletService } from '@/features/payment';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { Commission, CommissionStatus } from '@/types/commission.types';

const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

function useDashboardResource<T>(load: () => Promise<T>, failure: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true); setError(null); setData(null);
      try { const result = await load(); if (active) setData(result); }
      catch { if (active) setError(failure); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [load, failure, attempt]);
  return { data, loading, error, retry: () => setAttempt(value => value + 1) };
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="mt-3 text-xs text-red-300"><p>{message}</p><button type="button" onClick={retry} className="mt-2 rounded-lg border border-white/15 px-3 py-1.5 text-[#A7ACD9]">Thử lại</button></div>;
}

const emptyCommissions: Commission[] = [];
const loadBalance = () => walletService.getOverview().then(value => value.wallet.balance);
const loadSlots = () => creatorProfileService.getMyProfile().then(value => value.availableSlots);
const loadCommissions = () => commissionService.getByCreator();
const loadRequests = () => commissionService.getCreatorRequests();

export function CreatorDashboardScreen() {
  const [range, setRange] = useState(30);
  const [showAll, setShowAll] = useState(false);
  const loadRevenue = useCallback(async () => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - range * 86400000).toISOString().slice(0, 10);
    const [summary, points, sources] = await Promise.all([paymentService.summary(from, to), paymentService.timeseries(from, to, 'day'), paymentService.breakdown(from, to)]);
    return { net: summary.netAmount, points, sources };
  }, [range]);
  const revenueState = useDashboardResource(loadRevenue, 'Không tải được doanh thu.');
  const balanceState = useDashboardResource(loadBalance, 'Không tải được số dư ví.');
  const slotsState = useDashboardResource(loadSlots, 'Không tải được số slot.');
  const ordersState = useDashboardResource(loadCommissions, 'Không tải được danh sách đơn hàng.');
  const requestsState = useDashboardResource(loadRequests, 'Không tải được yêu cầu đặt vẽ.');
  const revenue = revenueState.data;
  const balance = balanceState.data;
  const slots = slotsState.data;
  const commissions = ordersState.data ?? emptyCommissions;
  const requests = requestsState.data ?? [];
  const loading = ordersState.loading;
  const error = ordersState.error;
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'All'>('All');
  const workrooms = useMemo(() => commissions.filter(item => !['PendingAcceptance', 'Negotiating'].includes(item.status)), [commissions]);
  const visibleWorkrooms = useMemo(() => statusFilter === 'All' ? workrooms : workrooms.filter(item => item.status === statusFilter), [workrooms, statusFilter]);
  const counteroffers = useMemo(() => commissions.filter(item => item.status === 'Negotiating'), [commissions]);
  const metrics = useMemo(() => ({ active: commissions.filter((commission) => commission.status === 'InProgress' && commission.escrowStatus !== 'Pending').length, escrow: commissions.reduce((total, commission) => total + (commission.escrowHeldAmount ?? 0), 0) }), [commissions]);
  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h1 className="font-h1 text-2xl font-bold text-white">Tổng quan Studio</h1></div><div className="flex flex-wrap gap-2"><Link href="/creator/profile/edit" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors">Hồ sơ họa sĩ</Link><Link href="/creator/services" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors">Bảng giá & Dịch vụ</Link><Link href="/creator/requests" className="commission-primary rounded-xl px-5 py-2.5 text-center text-xs font-bold">Xem yêu cầu mới</Link></div></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label={`Thu nhập ròng · ${range} ngày`} value={revenue ? money(revenue.net) : '—'} icon={<CircleDollarSign className="h-4 w-4" />} />
      <Metric label="Đang giữ trong Escrow" value={loading || error ? '—' : money(metrics.escrow)} icon={<Wallet className="h-4 w-4" />} error={error} retry={ordersState.retry} />
      <div className="glass-container rounded-3xl border border-white/10 p-5"><p className="text-[11px] uppercase tracking-wider text-slate-400">Số dư ví khả dụng</p><p className="mt-2 font-h1 text-xl font-bold text-white">{balance === null ? '—' : money(balance)}</p>{balanceState.error && <LoadError message={balanceState.error} retry={balanceState.retry} />}<Link href="/payout" className="mt-2 inline-block text-xs text-[#A7ACD9]">Rút tiền →</Link></div>
      <div className="glass-container rounded-3xl border border-white/10 p-5"><p className="text-[11px] uppercase tracking-wider text-slate-400">Slot nhận đơn còn trống</p><p className="mt-2 font-h1 text-xl font-bold text-white">{slots ?? '—'} <span className="text-xs font-normal text-slate-400">slot</span></p>{slotsState.error && <LoadError message={slotsState.error} retry={slotsState.retry} />}<Link href="/creator/services" className="mt-2 inline-block text-xs text-[#A7ACD9]">Điều chỉnh số slot →</Link></div>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="glass-container rounded-3xl border border-white/10 p-6 lg:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><h2 className="font-h1 font-bold text-white">Biến động doanh thu theo thời gian</h2><p className="mt-1 text-xs text-slate-400">Thu nhập ròng · đưa chuột lên điểm để xem chi tiết</p></div><div className="flex gap-1">{[7, 30, 90].map(days => <button key={days} onClick={() => setRange(days)} aria-pressed={range === days} className={`rounded-full px-3 py-1.5 text-xs ${range === days ? 'bg-[#A7ACD9] text-[#1F2335]' : 'border border-white/10 text-slate-400'}`}>{days} ngày</button>)}</div></div>{revenueState.error ? <LoadError message={revenueState.error} retry={revenueState.retry} /> : revenue ? <RevenueChart points={revenue.points} /> : <p className="py-12 text-sm text-slate-400">Đang tải doanh thu…</p>}</section>
      <section className="glass-container space-y-4 rounded-3xl border border-white/10 p-6"><h2 className="font-h1 font-bold text-white">Cơ cấu nguồn thu</h2>{revenue?.sources.map(source => <div key={source.key} className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4"><div className="flex justify-between text-xs text-slate-300"><span>{source.label}</span><span>{source.orderCount} đơn</span></div><p className="font-h1 text-lg font-bold text-[#A7ACD9]">{money(source.netAmount)}</p><p className="text-xs text-slate-400">Doanh thu gộp: {money(source.grossAmount)}</p></div>)}{revenue?.sources.length === 0 && <p className="text-sm text-slate-400">Chưa có nguồn thu trong kỳ.</p>}</section>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section className="glass-container rounded-3xl border border-white/10 p-6"><div className="flex justify-between border-b border-white/10 pb-4"><h2 className="font-h1 font-bold text-white">Yêu cầu đặt vẽ mới nhất</h2><Link href="/creator/requests" className="text-xs text-[#A7ACD9]">Xem tất cả{!requestsState.loading && !requestsState.error ? ` (${requests.length})` : ''} →</Link></div>{requestsState.loading && <p className="py-10 text-sm text-slate-400">Đang tải yêu cầu…</p>}{requestsState.error && <LoadError message={requestsState.error} retry={requestsState.retry} />}{requests.slice(0, 3).map(item => <Link key={item.id} href="/creator/requests" className="mt-3 block rounded-2xl border border-white/10 bg-white/[0.02] p-4"><p className="text-sm font-semibold text-white">{item.title}</p><p className="mt-2 text-xs text-slate-400">{item.clientName} · {money(item.finalPrice ?? item.totalPrice)}</p></Link>)}{!requestsState.loading && !requestsState.error && requests.length === 0 && <p className="py-10 text-sm text-slate-400">Chưa có yêu cầu mới.</p>}</section>

    <div className="space-y-6">
    {counteroffers.length > 0 && <section className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 sm:p-6"><h2 className="font-h1 text-base font-bold text-white">Counter-offers awaiting Client</h2><div className="mt-4 space-y-3">{counteroffers.map(item => <div key={item.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-sm font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-300">@{item.clientName || item.clientId} · {money(item.finalPrice ?? item.totalPrice)} · Waiting for Client response</p></div>)}</div></section>}
    <section id="workrooms" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4"><h2 className="font-h1 text-base font-bold text-white">Đơn đang vẽ gần nhất</h2><div className="flex items-center gap-3"><select aria-label="Filter workrooms by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CommissionStatus | 'All')} className="rounded-lg border border-white/10 bg-[#1F2335] px-3 py-2 text-xs text-white"><option value="All">Tất cả trạng thái</option>{(['InProgress', 'SubmittedFinal', 'Delivered', 'Completed', 'Disputed', 'Cancelled'] as CommissionStatus[]).map(status => <option key={status} value={status}>{status}</option>)}</select><span className="text-xs text-slate-400">{loading || error ? '—' : `${visibleWorkrooms.length} đơn`}</span></div></div>{loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading workrooms…</div> : error ? <LoadError message={error} retry={ordersState.retry} /> : visibleWorkrooms.length === 0 ? <EmptyState /> : <div className="mt-5">{(showAll ? visibleWorkrooms : visibleWorkrooms.slice(0, 3)).map((commission) => <WorkroomCard key={commission.id} commission={commission} />)}</div>}{visibleWorkrooms.length > 3 && <button onClick={() => setShowAll(value => !value)} className="mt-4 text-xs font-semibold text-[#A7ACD9]">{showAll ? 'Thu gọn' : 'Xem tất cả đơn hàng →'}</button>}</section>
    </div></div>
  </div>;
}
function Metric({ label, value, icon, error, retry }: { label: string; value: string; icon: React.ReactNode; error?: string | null; retry?: () => void }) { return <div className="glass-container rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center justify-between text-[11px] font-medium text-slate-400"><span>{label}</span><span className="text-[#A7ACD9]">{icon}</span></div><p className="mt-2 font-h1 text-xl font-bold text-white">{value}</p>{error && retry && <LoadError message={error} retry={retry} />}</div>; }
function WorkroomCard({ commission }: { commission: Commission }) { const value = commission.finalPrice ?? commission.totalPrice ?? commission.price; const awaitingEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending'; return <div className="border-b border-white/10 py-5 last:border-0 last:pb-0 first:pt-0"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex gap-2"><span className="font-mono text-xs font-bold text-[#A7ACD9]">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-slate-300">{awaitingEscrow ? 'Awaiting client escrow' : commission.status}</span></div><h3 className="mt-2 text-sm font-bold text-white">{commission.title}</h3><p className="mt-1 text-xs text-slate-400">@{commission.clientName || commission.clientId} · Escrow {money(commission.escrowHeldAmount)} · Total {money(value)}</p></div>{!awaitingEscrow && <Link href={`/workroom/${commission.id}`} className="commission-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold">{(commission.status === 'Cancelled' || commission.status === 'Disputed') ? 'Dispute & workroom' : 'Open workroom'} <ArrowRight className="h-4 w-4" /></Link>}</div></div>; }
function EmptyState() { return <div className="py-14 text-center"><CircleDollarSign className="mx-auto h-9 w-9 text-[#A7ACD9]" /><h2 className="mt-3 font-h1 font-bold text-white">No studio workrooms yet</h2><p className="mt-1 text-sm text-slate-400">Accepted commission requests will appear here.</p></div>; }
