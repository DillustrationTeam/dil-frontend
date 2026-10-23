'use client';

import { useEffect, useState } from 'react';
import { addonService, addonSchema, addonMoney, type CreatorAddon, type AddonPreset } from '@/services/addon.service';
import { creatorProfileService } from '../services/creator-profile.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { RateCardPackage } from '../services/creator-rate-card.service';

export function CreatorAddonManager({ packages }: { packages: RateCardPackage[] }) {
  const [items, setItems] = useState<CreatorAddon[]>([]);
  const [presets, setPresets] = useState<AddonPreset[]>([]);
  const [profileId, setProfileId] = useState('');
  const [editing, setEditing] = useState<string>();
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stage, setStage] = useState<string>('Sketch');
  const [days, setDays] = useState('0');
  const [packageId, setPackageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const profile = await creatorProfileService.getMyProfile();
        const [addons, catalog] = await Promise.all([addonService.creator(profile.id), addonService.presets()]);
        if (active) { setProfileId(profile.id); setItems(addons); setPresets(catalog); }
      } catch (e) { if (active) setError(extractErrorMessage(e, 'Không tải được phụ phí.')); }
    }
    void load(); return () => { active = false; };
  }, []);
  const reset = () => { setEditing(undefined); setPresetKey(null); setTitle(''); setPrice(''); setDays('0'); setPackageId(''); setStage('Sketch'); };
  const field = 'rounded-xl border border-white/15 bg-[#1F2335] p-3 text-sm text-white';
  return <section className="glass-container space-y-4 rounded-3xl p-6 text-white">
    <h2 className="font-h1 text-lg">Phụ phí theo mốc</h2>
    <p className="text-sm text-[#A7ACD9]">Chọn mẫu của sàn hoặc tạo phụ phí tùy chỉnh. Lưu bảng giá trước khi gắn phụ phí vào một gói mới.</p>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{presets.map(p => <label key={p.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141724] p-4 text-sm hover:border-[#A7ACD9]/40"><input type="checkbox" checked={presetKey === p.key} disabled={busy} onChange={e => { reset(); if (e.target.checked) { setPresetKey(p.key); setTitle(p.title); setStage(p.allowedMilestone); } }} />{p.title} · {p.allowedMilestone}</label>)}</div>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); setError(''); setNotice('');
      const parsed = addonSchema.safeParse({ title, price: Number(price), allowedMilestone: stage, extendDays: Number(days) });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
      setBusy(true);
      try { await addonService.save({ ...parsed.data, id: editing, presetKey, packageId: packageId || null, isActive: items.find(item => item.id === editing)?.isActive ?? true }); setItems(await addonService.creator(profileId)); reset(); setNotice('Đã lưu phụ phí.'); }
      catch (cause) { setError(extractErrorMessage(cause, 'Không lưu được phụ phí.')); }
      finally { setBusy(false); }
    }}>
      <label className="grid gap-1 text-xs">Tên phụ phí<input className={field} value={title} disabled={!!presetKey || busy} onChange={e => setTitle(e.target.value)} required maxLength={200} /></label>
      <label className="grid gap-1 text-xs">Giá VND<input className={field} type="number" min={1} step={1} value={price} onChange={e => setPrice(e.target.value)} required disabled={busy} /></label>
      <fieldset className="rounded-2xl border border-white/10 p-4"><legend className="px-2 text-xs text-[#A7ACD9]">Mốc áp dụng · chọn nhiều mốc</legend><div className="flex flex-wrap gap-3">{['Sketch', 'Lineart', 'Final', 'Any'].map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stage.split(',').includes(value)} disabled={!!presetKey || busy} onChange={e => { if (value === 'Any') setStage(e.target.checked ? 'Any' : ''); else { const selected = stage.split(',').filter(s => s !== 'Any' && s !== value); if (e.target.checked) selected.push(value); setStage(['Sketch', 'Lineart', 'Final'].filter(s => selected.includes(s)).join(',')); } }} />{value === 'Any' ? 'Mọi mốc' : value}</label>)}</div>{presetKey && <p className="mt-2 text-xs text-slate-400">Mẫu của sàn giữ mốc quy định. Chọn Nhập mới để tạo phụ phí tùy chỉnh.</p>}</fieldset>
      <label className="grid gap-1 text-xs">Gia hạn (ngày)<input className={field} type="number" min={0} max={365} step={1} value={days} onChange={e => setDays(e.target.value)} required disabled={busy} /></label>
      <label className="grid gap-1 text-xs">Gói dịch vụ<select className={field} value={packageId} onChange={e => setPackageId(e.target.value)} disabled={busy}><option value="">Tất cả gói</option>{packageId && !packages.some(p => p.id === packageId) && <option value={packageId}>Gói đã xóa · giữ phạm vi cũ</option>}{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="flex items-end gap-3"><button disabled={busy || !profileId} className="rounded-xl bg-[#A7ACD9] p-3 text-sm text-[#1F2335] disabled:opacity-50">{busy ? 'Đang lưu…' : editing ? 'Cập nhật phụ phí' : 'Thêm phụ phí'}</button><button type="button" onClick={reset} className="p-3 text-sm">Nhập mới</button></div>
    </form>
    {items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm"><span>{item.title} · {addonMoney(item.price)} · {item.allowedMilestone}{!item.isActive && ' · Đã tắt'}</span><div className="flex gap-3"><button disabled={busy} onClick={() => { setEditing(item.id); setPresetKey(item.presetKey ?? null); setTitle(item.title); setPrice(String(item.price)); setStage(item.allowedMilestone); setDays(String(item.extendDays)); setPackageId(item.packageId ?? ''); }}>Sửa</button><button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await addonService.save({ ...item, presetKey: item.presetKey, isActive: !item.isActive }); setItems(await addonService.creator(profileId)); } catch (cause) { setError(extractErrorMessage(cause, 'Không cập nhật được.')); } finally { setBusy(false); } }}>{item.isActive ? 'Tắt' : 'Bật'}</button></div></div>)}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
  </section>;
}
