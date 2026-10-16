'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Clock, FolderKanban, LoaderCircle, ShieldCheck, Star } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { Commission, CommissionStatus } from '@/types/commission.types';

const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
const isActive = (status: Commission['status']) => !['Completed', 'Cancelled'].includes(status);

export default function ClientDashboardPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'All'>('All');

  useEffect(() => {
    commissionService.getByClient().then(setCommissions).catch(() => setError('Unable to load your commissions.')).finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => ({
    active: commissions.filter((commission) => isActive(commission.status)).length,
    escrow: commissions.reduce((total, commission) => total + (commission.escrowHeldAmount ?? 0), 0),
    awaiting: commissions.filter((commission) => commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' || (commission.status === 'InProgress' && commission.escrowStatus === 'Pending')).length,
    completed: commissions.filter((commission) => commission.status === 'Completed').length,
  }), [commissions]);
  const visibleCommissions = useMemo(() => statusFilter === 'All' ? commissions : commissions.filter(item => item.status === statusFilter), [commissions, statusFilter]);

  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
      <Metric label="Active commissions" value={`${metrics.active} orders`} icon={<FolderKanban className="h-4 w-4" />} />
      <Metric label="Escrow held" value={money(metrics.escrow)} icon={<ShieldCheck className="h-4 w-4" />} />
      <Metric label="Awaiting response" value={`${metrics.awaiting} requests`} icon={<Clock className="h-4 w-4" />} />
      <Metric label="Completed" value={`${metrics.completed} works`} icon={<Star className="h-4 w-4" />} />
    </div>
    <section id="workrooms" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4"><h1 className="font-h1 text-base font-bold text-white">Your commissions</h1><div className="flex items-center gap-3"><select aria-label="Filter commissions by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CommissionStatus | 'All')} className="rounded-lg border border-white/10 bg-[#1F2335] px-3 py-2 text-xs text-white"><option value="All">All statuses</option>{(['PendingAcceptance', 'Negotiating', 'InProgress', 'SubmittedFinal', 'Delivered', 'Completed', 'Cancelled', 'Disputed'] as CommissionStatus[]).map(status => <option key={status} value={status}>{status}</option>)}</select><span className="text-xs text-slate-400">{visibleCommissions.length} shown</span></div></div>
      {loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading commissions…</div> : error ? <p className="py-12 text-center text-sm text-red-300">{error}</p> : visibleCommissions.length === 0 ? <EmptyState /> : <div className="mt-5 grid gap-4">{visibleCommissions.map((commission) => <CommissionCard key={commission.id} commission={commission} />)}</div>}
    </section>
  </div>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between text-[11px] font-medium text-slate-400"><span>{label}</span><span className="text-[#A7ACD9]">{icon}</span></div><p className="mt-2 font-h1 text-xl font-bold text-white">{value}</p></div>; }
function CommissionCard({ commission }: { commission: Commission }) {
  const price = commission.finalPrice ?? commission.totalPrice ?? commission.price;
  const awaitingEscrow = commission.status === 'InProgress' && commission.escrowStatus === 'Pending';
  const hasDisputeOrEscrow = Boolean(commission.dispute || (commission.escrowHeldAmount && commission.escrowHeldAmount > 0));
  const isRequest = ['PendingAcceptance', 'Negotiating'].includes(commission.status) || (commission.status === 'Cancelled' && !hasDisputeOrEscrow);
  const destination = isRequest ? `/client/requests/${commission.id}` : awaitingEscrow ? `/payment/checkout/${commission.id}` : `/workroom/${commission.id}`;
  const action = commission.status === 'Negotiating' ? 'Review counter-offer' : isRequest ? 'View request' : awaitingEscrow ? 'Deposit escrow' : (commission.status === 'Cancelled' || commission.status === 'Disputed') ? 'View dispute & workroom' : 'Open workroom';
  return <div className="border-b border-white/10 py-5 last:border-0 last:pb-0 first:pt-0"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#A7ACD9]">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-slate-300">{awaitingEscrow ? 'Awaiting escrow deposit' : commission.status}</span></div><h2 className="mt-2 text-sm font-bold text-white">{commission.title}</h2><p className="mt-1 text-xs text-slate-400">@{commission.creatorName || commission.creatorId} · {money(price)}</p>{awaitingEscrow && <p className="mt-2 text-xs text-[#d8dbff]">Your creator accepted this request. Deposit escrow to start the workroom.</p>}</div><Link href={destination} className="commission-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition">{action} <ArrowRight className="h-4 w-4" /></Link></div></div>;
}
function EmptyState() { return <div className="py-14 text-center"><CircleDollarSign className="mx-auto h-9 w-9 text-[#A7ACD9]" /><h2 className="mt-3 font-h1 font-bold text-white">No commissions yet</h2><p className="mt-1 text-sm text-slate-400">Your requests and active projects will appear here.</p></div>; }
