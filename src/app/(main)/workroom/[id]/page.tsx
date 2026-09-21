'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission, Milestone } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';
import { ArrowLeft, Check, Circle, FileText, FolderKanban, LoaderCircle, LockKeyhole } from 'lucide-react';
import { isAxiosError } from 'axios';

const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Chưa đặt hạn';

export default function WorkroomPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore(state => state.user?.id);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => setCommission(await commissionService.getById(id)), [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => setError('Không tải được Workroom hoặc bạn không có quyền xem đơn này.')).finally(() => setLoading(false));
  }, [refresh]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await refresh(); setMessage(success); }
    catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(apiError?.details?.join(' ') || apiError?.message || (cause instanceof Error ? cause.message : 'Thao tác thất bại. Vui lòng thử lại.'));
    }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-72 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Đang tải Workroom…</div>;
  if (!commission) return <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-[#A7ACD9]" /><h1 className="mt-4 font-h1 text-xl font-bold text-white">Workroom unavailable</h1><p className="mt-2 text-sm text-slate-400">{error || 'Không tìm thấy đơn vẽ.'}</p></div>;
  const isClient = commission.clientId === userId;
  const funded = commission.escrowStatus === 'Deposited' || commission.escrowStatus === 'PartialReleased' || commission.escrowStatus === 'Released';
  const awaitingAgreement = commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' || commission.status === 'Cancelled';
  const awaitingEscrow = commission.status === 'InProgress' && !funded;
  if (awaitingAgreement || awaitingEscrow) {
    const destination = isClient
      ? awaitingAgreement ? `/client/requests/${id}` : `/payment/checkout/${id}`
      : commission.status === 'PendingAcceptance' ? '/creator/requests' : '/creator/commissions';
    const detail = awaitingAgreement
      ? commission.status === 'Cancelled' ? 'Yêu cầu đã kết thúc.' : commission.status === 'Negotiating' ? 'Đề xuất giá đang chờ Client quyết định.' : 'Yêu cầu đang chờ Creator phản hồi.'
      : 'Đang chờ Client ký quỹ trước khi bắt đầu công việc.';
    return <main className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white">
      <LockKeyhole className="mx-auto h-10 w-10 text-[#A7ACD9]" />
      <h1 className="mt-4 font-h1 text-xl font-bold">Workroom chưa mở</h1>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
      <Link href={destination} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">{isClient ? awaitingAgreement ? 'Xem yêu cầu' : 'Đến trang ký quỹ' : 'Xem danh sách yêu cầu'}</Link>
    </main>;
  }
  const milestones = [...(commission.milestones ?? [])].sort((a, b) => a.sequence - b.sequence);
  const readyToDeliver = milestones.length > 0 && milestones.every(m => m.status === 'Approved') &&
    (commission.status === 'InProgress' || (commission.status === 'SubmittedFinal' && !milestones[milestones.length - 1].hasFinal));

  return <main className="mx-auto w-full max-w-7xl space-y-6 pb-10 text-white">
    <Link href={isClient ? '/client/commissions' : '/creator/commissions'} className="inline-flex items-center gap-2 text-xs font-bold text-[#A7ACD9] hover:text-white"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách đơn</Link>
    <header className="glass-container rounded-[28px] border border-white/10 p-6"><div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between"><div><span className="font-mono text-xs font-bold text-[#A7ACD9]">ORDER #CMD-{commission.id.slice(0, 8).toUpperCase()}</span><h1 className="mt-2 font-h1 text-2xl font-extrabold text-white">{commission.title}</h1><p className="mt-2 text-xs text-slate-400">Client: {commission.clientName || commission.clientId} · Creator: {commission.creatorName || commission.creatorId}</p></div><span className="w-fit rounded-full border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-bold text-[#d8dbff]">{commission.status}</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><Info label="Escrow held" value={money(commission.escrowHeldAmount)} /><Info label="Delivery target" value={formatDate(commission.deadlineAt)} /><Info label="Commission total" value={money(commission.finalPrice ?? commission.totalPrice)} /></dl><div className="mt-6 border-t border-white/10 pt-5"><h2 className="mb-3 font-h1 text-sm font-bold">Milestone timeline</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{milestones.map(m => <div key={m.id} className={`rounded-xl border p-3 text-xs ${m.status === 'Approved' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : m.sequence === commission.currentStage ? 'border-[#A7ACD9]/60 bg-[#A7ACD9]/15 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}><div className="flex items-center gap-2 font-bold">{m.status === 'Approved' ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{m.sequence}. {m.title}</div><p className="mt-1 pl-5 text-[11px]">{m.status} · {money(m.price)}</p></div>)}</div></div></header>

    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center justify-between border-b border-white/10 pb-4"><h2 className="font-h1 text-base font-bold text-white">Milestone progress</h2><span className="text-xs text-slate-400">{milestones.length} milestones</span></div>
      {milestones.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">Chưa có cột mốc.</p> : <div className="mt-2">{milestones.map(m => <MilestoneRow key={m.id} milestone={m} commission={commission} isClient={isClient} busy={busy} run={run} />)}</div>}
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#A7ACD9]" /><h2 className="font-h1 text-base font-bold text-white">Commission brief</h2></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{commission.description || 'Chưa có mô tả chi tiết.'}</p></section>

    {readyToDeliver && !isClient && <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><h2 className="text-lg font-bold">Bàn giao file cuối</h2><p className="mt-2 text-sm text-slate-400">File được đưa vào S3 riêng tư. Chỉ hai bên được tải sau khi Client nghiệm thu.</p><FileSourceForm busy={busy} onSubmit={(file, url) => run(() => commissionService.deliverFinal(id, file, url), 'Đã bàn giao file cuối; đang chờ Client nghiệm thu.')} /></section>}
    {commission.status === 'SubmittedFinal' && <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><h2 className="text-lg font-bold">File cuối đã bàn giao</h2><p className="mt-2 text-sm text-slate-400">{milestones[milestones.length - 1]?.hasFinal ? 'Hãy đối chiếu các bản nháp đã duyệt bên trên với yêu cầu. Khi xác nhận hoàn thành, hai bên mới được tải file cuối riêng tư.' : 'File cuối cũ cần Creator nộp lại vào kho riêng tư.'}</p>{isClient && milestones[milestones.length - 1]?.hasFinal && <button disabled={busy} onClick={() => run(() => commissionService.complete(id), 'Đã nghiệm thu. Hai bên có thể tải file cuối.')} className="commission-primary mt-4 rounded-xl px-4 py-2 text-sm">Xác nhận hoàn thành và mở tải file cuối</button>}</section>}
    {commission.status === 'Completed' && <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6"><h2 className="text-lg font-bold">Đơn đã hoàn thành</h2><button disabled={busy} onClick={() => run(async () => { window.location.href = await commissionService.getFinalDownloadUrl(id); }, 'Đang mở file…')} className="commission-primary mt-4 rounded-xl px-4 py-2 text-sm">Tải file cuối</button></section>}
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-white">{value}</dd></div>; }

function MilestoneRow({ milestone: m, commission, isClient, busy, run }: { milestone: Milestone; commission: Commission; isClient: boolean; busy: boolean; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const [feedback, setFeedback] = useState('');
  const canSubmit = !isClient && commission.status === 'InProgress' && commission.currentStage === m.sequence && (['Pending', 'RevisionRequested'].includes(m.status) || (m.status === 'Submitted' && !m.hasWip)) && ['Deposited', 'PartialReleased'].includes(commission.escrowStatus ?? '');
  const canReview = isClient && commission.status === 'InProgress' && commission.currentStage === m.sequence && m.status === 'Submitted' && !!m.hasWip;
  return <div className="border-b border-white/10 py-4 last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><span className="text-xs font-medium text-[#A7ACD9]">{m.sequence}.</span><h3 className="text-xs font-bold text-white">{m.title}</h3></div><p className="mt-2 text-xs text-slate-400">{money(m.price)} · {m.status} · {m.revisionCount ?? 0} lần sửa{m.submittedAt ? ` · Nộp ${formatDate(m.submittedAt)}` : ''}</p></div>{m.hasWip && <button disabled={busy} onClick={() => run(async () => { window.location.href = await commissionService.getWipPreviewUrl(commission.id, m.id); }, 'Đang mở bản nháp…')} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">Xem bản nháp</button>}</div>
    {m.revisionFeedback && <p className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100"><strong>Yêu cầu sửa gần nhất:</strong> {m.revisionFeedback}</p>}
    {m.status === 'Submitted' && !m.hasWip && <p className="mt-2 text-xs text-amber-200">Bản nháp cũ cần Creator nộp lại vào kho file riêng tư trước khi duyệt.</p>}
    {canSubmit && <FileSourceForm busy={busy} onSubmit={(file, url) => run(() => commissionService.submitMilestone(commission.id, m.id, file, url), 'Đã nộp bản nháp.')} />}
    {canReview && <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => run(() => commissionService.approveMilestone(commission.id, m.id), 'Đã duyệt cột mốc và giải ngân.')} className="commission-primary rounded-xl px-4 py-2 text-xs">Duyệt và giải ngân</button><input aria-label="Yêu cầu sửa" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Ghi rõ nội dung cần sửa" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-xs" /><button disabled={busy || !feedback.trim()} onClick={() => run(() => commissionService.requestRevision(commission.id, m.id, feedback.trim()), 'Đã yêu cầu sửa bản nháp.')} className="rounded-xl border border-white/20 px-4 py-2 text-xs disabled:opacity-50">Yêu cầu sửa</button></div>}
  </div>;
}

function FileSourceForm({ busy, onSubmit }: { busy: boolean; onSubmit: (file?: File, url?: string) => void }) {
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | undefined>();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  return <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); if (mode === 'file' && file && file.size > 100 * 1024 * 1024) { setError('File vượt quá 100 MB.'); return; } setError(''); onSubmit(mode === 'file' ? file : undefined, mode === 'link' ? url.trim() : undefined); }}>
    <fieldset className="flex gap-4 text-sm"><legend className="sr-only">Nguồn file</legend><label><input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} /> Tải file lên</label><label><input type="radio" checked={mode === 'link'} onChange={() => setMode('link')} /> Dán link HTTPS</label></fieldset>
    {mode === 'file' ? <input type="file" required onChange={e => setFile(e.target.files?.[0])} className="block max-w-full text-sm" /> : <input type="url" required pattern="https://.*" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/art.png" className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" />}
    <p className="text-xs text-slate-400">Tối đa 100 MB. Link phải trỏ trực tiếp tới file công khai.</p>
    {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    <button disabled={busy || (mode === 'file' ? !file : !url.startsWith('https://'))} className="commission-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Đang lưu…' : 'Nộp file'}</button>
  </form>;
}
