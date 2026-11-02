'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { addonService, addonAllows, addonStage, addonMoney, addonSchema, type CreatorAddon, type CommissionAddon } from '@/services/addon.service';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { Commission } from '@/types/commission.types';

export function WorkroomAddons({ commission, isCreator, onUpdated, onPresenceChanged }: { commission: Commission; isCreator: boolean; onUpdated: (value: Commission) => void; onPresenceChanged: (present: boolean) => void }) {
  const [items, setItems] = useState<CommissionAddon[]>([]);
  const [options, setOptions] = useState<CreatorAddon[]>([]);
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const sequence = commission.currentStage ?? 1;
  const stage = addonStage(sequence, commission.milestones?.length ?? 3);
  const active = commission.status === 'InProgress' && (commission.escrowHeldAmount ?? 0) > 0;
  const updatedRef = useRef(onUpdated);
  useEffect(() => { updatedRef.current = onUpdated; }, [onUpdated]);
  useEffect(() => { onPresenceChanged(items.length > 0); }, [items.length, onPresenceChanged]);
  const refresh = useCallback(async () => {
    const [addons, current] = await Promise.all([addonService.list(commission.id), commissionService.getById(commission.id)]);
    setItems(addons); updatedRef.current(current);
  }, [commission.id]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [addons, configured, current] = await Promise.all([addonService.list(commission.id), addonService.creator(commission.creatorId), commissionService.getById(commission.id)]);
        if (!cancelled) { setItems(addons); setOptions(configured); updatedRef.current(current); }
      } catch (cause) { if (!cancelled) setError(extractErrorMessage(cause, 'Không tải được phụ phí.')); }
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden && !dialog.current?.open) void load(); }, 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [commission.id, commission.creatorId]);
  const eligible = options.filter(a => a.isActive && (!a.packageId || a.packageId === commission.packageId) && (addonAllows(a.allowedMilestone, stage)));
  const field = 'w-full rounded-xl border border-white/15 bg-[#1F2335] p-3 text-sm text-white';
  return <div className="space-y-3 text-sm">
    {active && <button type="button" disabled={busy} className="rounded-xl border border-[#A7ACD9]/40 bg-[#A7ACD9]/10 px-4 py-2 text-[#A7ACD9] disabled:opacity-40" onClick={() => { setError(''); setSelected(''); setTitle(''); setPrice(''); setDays('0'); dialog.current?.showModal(); }}>+ Đề xuất phụ phí (Add-on)</button>}
    {items.map(a => <article key={a.id} className="glass-container space-y-2 rounded-2xl border border-[#A7ACD9]/40 p-4">
      <h3 className="font-h1 text-sm">Đề xuất phụ phí mốc #{a.milestoneSequence}: {a.title}</h3>
      <p className="font-semibold text-[#A7ACD9]">+{addonMoney(a.price)} · Gia hạn: +{a.extendDays} ngày</p>
      {a.status === 'Accepted' ? <span className="text-emerald-400">{commission.escrowStatus === 'Pending' ? 'Đã chọn · Ký quỹ cùng đơn hàng' : 'Đã nạp Escrow'}</span> : a.status === 'Rejected' ? <span className="text-slate-400">Đã từ chối</span> : <>
        <span className="text-slate-400">{a.milestoneSequence !== sequence ? 'Đã qua mốc áp dụng' : 'Chờ khách hàng duyệt'}</span>
        {!isCreator && <div className="flex flex-wrap gap-3">{(['Accept', 'Reject'] as const).map(action => <button key={action} type="button" disabled={busy || (action === 'Accept' && (!active || a.milestoneSequence !== sequence))} className="rounded-xl border border-white/20 px-3 py-2 disabled:opacity-40" onClick={async () => {
          setBusy(true); setError('');
          try { await addonService.respond(commission.id, a.id, action); await refresh(); }
          catch (cause) { setError(extractErrorMessage(cause, 'Không xử lý được phụ phí.')); }
          finally { setBusy(false); }
        }}>{action === 'Accept' ? 'Thanh toán & Nạp ký quỹ' : 'Từ chối'}</button>)}</div>}
      </>}
    </article>)}
    {error && <p role="alert" className="text-red-300">{error}</p>}
    <dialog ref={dialog} aria-labelledby="addon-dialog-title" className="m-auto w-[min(92vw,480px)] rounded-3xl border border-white/20 bg-[#1F2335] p-6 text-white backdrop:bg-black/70" onCancel={e => { if (busy) e.preventDefault(); }}>
      <h2 id="addon-dialog-title" className="font-h1 text-lg">Đề xuất phụ phí · {stage}</h2>
      <form className="mt-4 space-y-3" onSubmit={async e => {
        e.preventDefault(); setError('');
        const option = eligible.find(a => a.id === selected);
        const parsed = addonSchema.safeParse(option ?? { title, price: Number(price), extendDays: Number(days), allowedMilestone: stage });
        if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
        if (!isCreator && !option) { setError('Chọn phụ phí do Creator cấu hình.'); return; }
        setBusy(true);
        try { await addonService.propose(commission.id, { ...parsed.data, creatorAddonId: option?.id }); await refresh(); dialog.current?.close(); }
        catch (cause) { setError(extractErrorMessage(cause, 'Không gửi được đề xuất.')); }
        finally { setBusy(false); }
      }}>
        <label className="block text-xs">Phụ phí được phép tại mốc hiện tại<select className={field} value={selected} onChange={e => setSelected(e.target.value)} disabled={busy}><option value="">{isCreator ? 'Nhập phụ phí phát sinh' : 'Chọn phụ phí'}</option>{eligible.map(a => <option key={a.id} value={a.id}>{a.title} · {addonMoney(a.price)} · +{a.extendDays} ngày</option>)}</select></label>
        {!selected && isCreator && <>
          <label className="block text-xs">Tên món<input className={field} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} /></label>
          <label className="block text-xs">Số tiền VND<input className={field} type="number" required min={1} step={1} value={price} onChange={e => setPrice(e.target.value)} disabled={busy} /></label>
          <label className="block text-xs">Số ngày gia hạn<input className={field} type="number" required min={0} max={365} step={1} value={days} onChange={e => setDays(e.target.value)} disabled={busy} /></label>
          <p className="text-xs text-[#A7ACD9]">{stage === 'Sketch' ? 'Cho phép thay đổi bố cục.' : stage === 'Lineart' ? 'Chỉ biến thể nhỏ; không thêm người hoặc đổi bối cảnh.' : 'Chỉ hậu kỳ, file, bản quyền; không thay đổi người, cảnh hoặc bố cục.'}</p>
        </>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <div className="flex gap-3"><button disabled={busy} className="rounded-xl bg-[#A7ACD9] px-4 py-2 text-[#1F2335] disabled:opacity-40">{busy ? 'Đang gửi…' : 'Gửi đề xuất'}</button><button type="button" disabled={busy} onClick={() => dialog.current?.close()}>Đóng</button></div>
      </form>
    </dialog>
  </div>;
}
