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
  return <div role="alert" className="mt-3 text-xs text-[#A8321C]"><p>{message}</p><button type="button" onClick={retry} className="mt-2 rounded-lg border border-[#221E1A]/10 px-3 py-1.5 text-[#B24A26]">Thử lại</button></div>;
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
  const slotsState = useDashboardResource(loadSlots, 'Không tải được số lượt.');
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
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h1 className="font-h1 text-2xl font-bold text-[#241F1A]">Tổng quan xưởng vẽ</h1></div><div className="flex flex-wrap gap-2"><Link href="/creator/profile/edit" className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-2.5 text-center text-xs font-bold text-[#241F1A] hover:bg-[#F0E7D8] transition-colors">Hồ sơ họa sĩ</Link><Link href="/creator/services" className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-2.5 text-center text-xs font-bold text-[#241F1A] hover:bg-[#F0E7D8] transition-colors">Bảng giá & Dịch vụ</Link><Link href="/creator/requests" className="commission-primary rounded-xl px-5 py-2.5 text-center text-xs font-bold">Xem yêu cầu mới</Link></div></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label={`Thu nhập ròng · ${range} ngày`} value={revenue ? money(revenue.net) : '—'} icon={<CircleDollarSign className="h-4 w-4" />} />
      <Metric label="Đang giữ trong ký quỹ" value={loading || error ? '—' : money(metrics.escrow)} icon={<Wallet className="h-4 w-4" />} error={error} retry={ordersState.retry} />
      <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-5"><p className="text-[11px] uppercase tracking-wider text-[#746A5F]">Số dư ví khả dụng</p><p className="mt-2 font-h1 text-xl font-bold text-[#241F1A]">{balance === null ? '—' : money(balance)}</p>{balanceState.error && <LoadError message={balanceState.error} retry={balanceState.retry} />}<Link href="/payout" className="mt-2 inline-block text-xs text-[#B24A26]">Rút tiền →</Link></div>
      <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-5"><p className="text-[11px] uppercase tracking-wider text-[#746A5F]">Lượt nhận đơn còn trống</p><p className="mt-2 font-h1 text-xl font-bold text-[#241F1A]">{slots ?? '—'} <span className="text-xs font-normal text-[#746A5F]">slot</span></p>{slotsState.error && <LoadError message={slotsState.error} retry={slotsState.retry} />}<Link href="/creator/services" className="mt-2 inline-block text-xs text-[#B24A26]">Điều chỉnh số lượt →</Link></div>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="glass-container rounded-3xl border border-[#221E1A]/10 p-6 lg:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#221E1A]/10 pb-4"><div><h2 className="font-h1 font-bold text-[#241F1A]">Biến động doanh thu theo thời gian</h2><p className="mt-1 text-xs text-[#746A5F]">Thu nhập ròng · đưa chuột lên điểm để xem chi tiết</p></div><div className="flex gap-1">{[7, 30, 90].map(days => <button key={days} onClick={() => setRange(days)} aria-pressed={range === days} className={`rounded-full px-3 py-1.5 text-xs ${range === days ? 'bg-[#B24A26] text-[#F7F2E9]' : 'border border-[#221E1A]/10 text-[#746A5F]'}`}>{days} ngày</button>)}</div></div>{revenueState.error ? <LoadError message={revenueState.error} retry={revenueState.retry} /> : revenue ? <RevenueChart points={revenue.points} /> : <p className="py-12 text-sm text-[#746A5F]">Đang tải doanh thu…</p>}</section>
      <section className="glass-container space-y-4 rounded-3xl border border-[#221E1A]/10 p-6"><h2 className="font-h1 font-bold text-[#241F1A]">Cơ cấu nguồn thu</h2>{revenue?.sources.map(source => <div key={source.key} className="space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4"><div className="flex justify-between text-xs text-[#746A5F]"><span>{source.label}</span><span>{source.orderCount} đơn</span></div><p className="font-h1 text-lg font-bold text-[#B24A26]">{money(source.netAmount)}</p><p className="text-xs text-[#746A5F]">Doanh thu gộp: {money(source.grossAmount)}</p></div>)}{revenue?.sources.length === 0 && <p className="text-sm text-[#746A5F]">Chưa có nguồn thu trong kỳ.</p>}</section>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section className="glass-container rounded-3xl border border-[#221E1A]/10 p-6"><div className="flex justify-between border-b border-[#221E1A]/10 pb-4"><h2 className="font-h1 font-bold text-[#241F1A]">Yêu cầu đặt vẽ mới nhất</h2><Link href="/creator/requests" className="text-xs text-[#B24A26]">Xem tất cả{!requestsState.loading && !requestsState.error ? ` (${requests.length})` : ''} →</Link></div>{requestsState.loading && <p className="py-10 text-sm text-[#746A5F]">Đang tải yêu cầu…</p>}{requestsState.error && <LoadError message={requestsState.error} retry={requestsState.retry} />}{requests.slice(0, 3).map(item => <Link key={item.id} href="/creator/requests" className="mt-3 block rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4"><p className="text-sm font-semibold text-[#241F1A]">{item.title}</p><p className="mt-2 text-xs text-[#746A5F]">{item.clientName} · {money(item.finalPrice ?? item.totalPrice)}</p></Link>)}{!requestsState.loading && !requestsState.error && requests.length === 0 && <p className="py-10 text-sm text-[#746A5F]">Chưa có yêu cầu mới.</p>}</section>

    <div className="space-y-6">
    {counteroffers.length > 0 && <section className="rounded-2xl border border-[#8A6A1F]/35 bg-[#8A6A1F]/10 p-5 sm:p-6"><h2 className="font-h1 text-base font-bold text-[#241F1A]">Counter-offers awaiting Client</h2><div className="mt-4 space-y-3">{counteroffers.map(item => <div key={item.id} className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/10 p-4"><p className="text-sm font-bold text-[#241F1A]">{item.title}</p><p className="mt-1 text-xs text-[#746A5F]">@{item.clientName || item.clientId} · {money(item.finalPrice ?? item.totalPrice)} · Waiting for Client response</p></div>)}</div></section>}
    <section id="workrooms" className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 sm:p-6"><div className="flex items-center justify-between gap-3 border-b border-[#221E1A]/10 pb-4"><h2 className="font-h1 text-base font-bold text-[#241F1A]">Đơn đang vẽ gần nhất</h2><div className="flex items-center gap-3"><select aria-label="Filter workrooms by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CommissionStatus | 'All')} className="rounded-lg border border-[#221E1A]/10 bg-[#F7F2E9] px-3 py-2 text-xs text-[#241F1A]"><option value="All">Tất cả trạng thái</option>{(['InProgress', 'SubmittedFinal', 'Delivered', 'Completed', 'Disputed', 'Cancelled'] as CommissionStatus[]).map(status => <option key={status} value={status}>{status}</option>)}</select><span className="text-xs text-[#746A5F]">{loading || error ? '—' : `${visibleWorkrooms.length} đơn`}</span></div></div>{loading ? <div className="flex min-h-48 items-center justify-center text-sm text-[#746A5F]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading workrooms…</div> : error ? <LoadError message={error} retry={ordersState.retry} /> : visibleWorkrooms.length === 0 ? <EmptyState /> : <div className="mt-5">{(showAll ? visibleWorkrooms : visibleWorkrooms.slice(0, 3)).map((commission) => <WorkroomCard key={commission.id} commission={commission} />)}</div>}{visibleWorkrooms.length > 3 && <button onClick={() => setShowAll(value => !value)} className="mt-4 text-xs font-semibold text-[#B24A26]">{showAll ? 'Thu gọn' : 'Xem tất cả đơn hàng →'}</button>}</section>
    </div></div>
  </div>;
}
function Metric({ label, value, icon, error, retry }: { label: string; value: string; icon: React.ReactNode; error?: string | null; retry?: () => void }) { return <div className="glass-container rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5"><div className="flex items-center justify-between text-[11px] font-medium text-[#746A5F]"><span>{label}</span><span className="text-[#B24A26]">{icon}</span></div><p className="mt-2 font-h1 text-xl font-bold text-[#241F1A]">{value}</p>{error && retry && <LoadError message={error} retry={retry} />}</div>; }
function WorkroomCard({ commission }: { commission: Commission }) { const value = commission.finalPrice ?? commission.totalPrice ?? commission.price; const awaitingInitialEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending' && (commission.disbursedAmount ?? 0) === 0; const awaitingNextStageEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending' && (commission.disbursedAmount ?? 0) > 0; return <div className="border-b border-[#221E1A]/10 py-5 last:border-0 last:pb-0 first:pt-0"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex gap-2"><span className="font-mono text-xs font-bold text-[#B24A26]">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-[#FFFCF6] px-2 py-0.5 text-[10px] font-bold text-[#746A5F]">{awaitingInitialEscrow ? 'Chờ khách hàng nạp ký quỹ' : awaitingNextStageEscrow ? `Chờ ký quỹ mốc #${commission.currentStage ?? 1}` : commission.status}</span></div><h3 className="mt-2 text-sm font-bold text-[#241F1A]">{commission.title}</h3><p className="mt-1 text-xs text-[#746A5F]">@{commission.clientName || commission.clientId} · Ký quỹ {money(commission.escrowHeldAmount)} · Tổng {money(value)}</p></div>{!awaitingInitialEscrow && <Link href={`/workroom/${commission.id}`} className="commission-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold">{(commission.status === 'Cancelled' || commission.status === 'Disputed') ? 'Tranh chấp & phòng làm việc' : 'Mở phòng làm việc'} <ArrowRight className="h-4 w-4" /></Link>}</div></div>; }
function EmptyState() { return <div className="py-14 text-center"><CircleDollarSign className="mx-auto h-9 w-9 text-[#B24A26]" /><h2 className="mt-3 font-h1 font-bold text-[#241F1A]">No studio workrooms yet</h2><p className="mt-1 text-sm text-[#746A5F]">Accepted commission requests will appear here.</p></div>; }
