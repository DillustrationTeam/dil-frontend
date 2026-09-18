'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, FileText, FolderKanban, LoaderCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { Commission, Milestone } from '@/types/commission.types';

const money = (value?: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'No deadline set';

export default function WorkroomPage() {
  const params = useParams<{ id: string }>();
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commissionService.getById(params.id).then(setCommission).catch(() => setError('Unable to load this workroom.')).finally(() => setLoading(false));
  }, [params.id]);

  const milestones = useMemo(() => [...(commission?.milestones ?? [])].sort((a, b) => a.sequence - b.sequence), [commission]);
  if (loading) return <div className="flex min-h-72 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading workroom…</div>;
  if (error || !commission) return <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-[#A7ACD9]" /><h1 className="mt-4 font-h1 text-xl font-bold text-white">Workroom unavailable</h1><p className="mt-2 text-sm text-slate-400">{error ?? 'This commission could not be found.'}</p></div>;
  if (commission.status === 'AwaitingEscrowDeposit') return <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-[#A7ACD9]" /><h1 className="mt-4 font-h1 text-xl font-bold text-white">Escrow deposit required</h1><p className="mt-2 text-sm text-slate-400">The creator accepted this request. The workroom will open once the escrow deposit is complete.</p><Link href={`/payment/checkout/${commission.id}`} className="commission-primary mt-6 inline-flex rounded-xl px-5 py-3 text-xs font-bold">Deposit escrow</Link></div>;

  const total = commission.finalPrice ?? commission.totalPrice ?? commission.price;
  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between"><div><span className="font-mono text-xs font-bold text-[#A7ACD9]">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span><h1 className="mt-1 font-h1 text-2xl font-bold text-white">{commission.title}</h1><p className="mt-2 text-sm text-slate-400">@{commission.clientName || commission.clientId} · @{commission.creatorName || commission.creatorId}</p></div><span className="w-fit rounded-full bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-bold text-[#d8dbff]">{commission.status}</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><Info label="Escrow held" value={money(commission.escrowHeldAmount)} /><Info label="Delivery target" value={formatDate(commission.deadlineAt)} /><Info label="Commission total" value={money(total)} /></dl></section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center justify-between border-b border-white/10 pb-4"><h2 className="font-h1 text-base font-bold text-white">Milestone progress</h2><span className="text-xs text-slate-400">{milestones.length} milestones</span></div>{milestones.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No milestones have been added to this commission.</p> : <div className="mt-2">{milestones.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} />)}</div>}</section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#A7ACD9]" /><h2 className="font-h1 text-base font-bold text-white">Commission brief</h2></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{commission.description || 'No detailed brief was provided.'}</p></section>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-white">{value}</dd></div>; }
function MilestoneCard({ milestone }: { milestone: Milestone }) { const fileUrl = milestone.finalDeliverableUrl ?? milestone.watermarkedUrl ?? milestone.wipPreviewUrl; return <div className="flex flex-col gap-4 border-b border-white/10 py-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="text-xs font-medium text-[#A7ACD9]">{milestone.sequence}.</span><span className="text-xs font-bold text-white">{milestone.title}</span></div><p className="mt-2 text-xs text-slate-400">{money(milestone.price)} · {milestone.status}{milestone.submittedAt ? ` · Submitted ${formatDate(milestone.submittedAt)}` : ''}</p></div>{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"><Download className="h-4 w-4" /> View file</a> : <span className="text-xs text-slate-500">No file submitted</span>}</div>; }
