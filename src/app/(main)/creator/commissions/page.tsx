'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Clock, FolderKanban, LoaderCircle, Wallet } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';

const money = (value?: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

export default function CreatorDashboardPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [requests, setRequests] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([commissionService.getByCreator(), commissionService.getCreatorRequests()]).then(([creatorCommissions, incomingRequests]) => { setCommissions(creatorCommissions); setRequests(incomingRequests); }).catch(() => setError('Unable to load your studio data.')).finally(() => setLoading(false)); }, []);
  const metrics = useMemo(() => ({ active: commissions.filter((commission) => commission.status === 'InProgress').length, escrow: commissions.reduce((total, commission) => total + (commission.escrowHeldAmount ?? 0), 0) }), [commissions]);
  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h1 className="font-h1 text-2xl font-bold text-white">Studio overview</h1></div><Link href="/creator/requests" className="commission-primary rounded-xl px-5 py-2.5 text-center text-xs font-bold">Review requests</Link></section>
    <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3"><Metric label="Active commissions" value={`${metrics.active} orders`} icon={<FolderKanban className="h-4 w-4" />} /><Metric label="Escrow held" value={money(metrics.escrow)} icon={<Wallet className="h-4 w-4" />} /><Metric label="Requests to review" value={`${requests.length} requests`} icon={<Clock className="h-4 w-4" />} /></div>
    <section id="workrooms" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center justify-between border-b border-white/10 pb-4"><h2 className="font-h1 text-base font-bold text-white">Studio workrooms</h2><span className="text-xs text-slate-400">{commissions.length} total</span></div>{loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading workrooms…</div> : error ? <p className="py-12 text-center text-sm text-red-300">{error}</p> : commissions.length === 0 ? <EmptyState /> : <div className="mt-5">{commissions.map((commission) => <WorkroomCard key={commission.id} commission={commission} />)}</div>}</section>
  </div>;
}
function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between text-[11px] font-medium text-slate-400"><span>{label}</span><span className="text-[#A7ACD9]">{icon}</span></div><p className="mt-2 font-h1 text-xl font-bold text-white">{value}</p></div>; }
function WorkroomCard({ commission }: { commission: Commission }) { const value = commission.finalPrice ?? commission.totalPrice ?? commission.price; return <div className="border-b border-white/10 py-5 last:border-0 last:pb-0 first:pt-0"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex gap-2"><span className="font-mono text-xs font-bold text-[#A7ACD9]">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-slate-300">{commission.status}</span></div><h3 className="mt-2 text-sm font-bold text-white">{commission.title}</h3><p className="mt-1 text-xs text-slate-400">@{commission.clientName || commission.clientId} · Escrow {money(commission.escrowHeldAmount)} · Total {money(value)}</p></div><Link href={`/workroom/${commission.id}`} className="commission-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold">Open workroom <ArrowRight className="h-4 w-4" /></Link></div></div>; }
function EmptyState() { return <div className="py-14 text-center"><CircleDollarSign className="mx-auto h-9 w-9 text-[#A7ACD9]" /><h2 className="mt-3 font-h1 font-bold text-white">No studio workrooms yet</h2><p className="mt-1 text-sm text-slate-400">Accepted commission requests will appear here.</p></div>; }
