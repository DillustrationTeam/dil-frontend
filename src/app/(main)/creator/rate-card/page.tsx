'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreatorAddonManager } from '@/features/creator-studio/components/creator-addon-manager';
import axios from 'axios';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { creatorRateCardService, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const field = 'w-full rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] px-4 py-3 text-xs text-[#241F1A] outline-none focus:border-[#8C3718]';
const label = 'block text-[10px] font-bold uppercase tracking-wider text-[#6E6459]';

export default function CreatorRateCardPage() {
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    creatorProfileService.getMyProfile().then(profile => {
      setHasProfile(true);
      return creatorRateCardService.get(profile.id);
    })
      .then(setPackages).catch(cause => setError(
        axios.isAxiosError(cause) && cause.response?.status === 400
          ? 'Tài khoản này chưa có hồ sơ họa sĩ. Hãy tạo hồ sơ trước khi lưu bảng giá.'
          : 'Không tải được bảng giá. Vui lòng tải lại trang.'
      ))
      .finally(() => setLoading(false));
  }, []);

  const updatePackage = (id: string, patch: Partial<RateCardPackage>) => setPackages(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  const updateMilestone = (id: string, index: number, patch: Partial<RateCardPackage['milestones'][number]>) => setPackages(current => current.map(item => item.id === id ? {
    ...item, milestones: item.milestones.map((stage, i) => i === index ? { ...stage, ...patch } : stage),
  } : item));
  const addPackage = () => setPackages(current => [...current, { id: crypto.randomUUID(), name: '', description: '', price: 0, milestones: [{ sequence: 1, title: 'Bản nháp', price: 0 }] }]);
  const addMilestone = (id: string) => setPackages(current => current.map(item => item.id === id ? { ...item, milestones: [...item.milestones, { sequence: item.milestones.length + 1, title: '', price: 0 }] } : item));
  const removeMilestone = (id: string, index: number) => setPackages(current => current.map(item => item.id === id ? {
    ...item, milestones: item.milestones.filter((_, i) => i !== index).map((stage, i) => ({ ...stage, sequence: i + 1 })),
  } : item));
  const save = async () => {
    setError(''); setMessage('');
    const normalized = packages.map(item => ({ ...item, name: item.name.trim(), description: item.description?.trim(), milestones: item.milestones.map(stage => ({ ...stage, title: stage.title.trim() })) }));
    if (normalized.length > 10 || normalized.some(item => !item.name || item.name.length > 100 || (item.description?.length ?? 0) > 2000 || item.milestones.length < 1 || item.milestones.length > 10 || item.milestones.some(stage => !stage.title || stage.title.length > 200 || !Number.isSafeInteger(stage.price) || stage.price <= 0 || stage.price > 1_000_000_000_000))) {
      setError('Mỗi gói cần tên và 1–10 cột mốc có tên, giá nguyên dương (tối đa 1.000 tỷ VND). Tối đa 10 gói.');
      return;
    }
    setSaving(true);
    try {
      const saved = await creatorRateCardService.save(normalized.map(item => ({ ...item, price: item.milestones.reduce((sum, stage) => sum + stage.price, 0) })));
      setPackages(saved); setMessage('Đã lưu bảng giá. khách hàng sẽ thấy các gói này ở chi tiết tranh.');
    } catch (cause) {
      const details = axios.isAxiosError(cause) ? cause.response?.data?.error?.details : undefined;
      setError(Array.isArray(details) && details.length > 0 ? details.join(' ') : 'Không lưu được bảng giá. Vui lòng thử lại.');
    }
    finally { setSaving(false); }
  };

  return <main className="mx-auto w-full max-w-4xl space-y-7 px-2 py-6 sm:px-6">
    <header className="space-y-2 text-center"><p className="text-xs font-bold uppercase tracking-widest text-[#B24A26]">CREATOR STUDIO</p><h1 className="font-h1 text-3xl font-extrabold text-[#241F1A]">Rate Card & Milestones</h1><p className="text-xs text-[#6E6459]">Bạn định giá và chia tiền theo cột mốc. khách hàng chỉ chọn gói, không sửa các mốc này.</p></header>
    {loading ? <p className="text-center text-sm text-[#746A5F]">Đang tải bảng giá…</p> : <div className="space-y-5">{!hasProfile && <Link href="/creator-setup" className="inline-block text-xs text-[#8C3718] underline">Tạo hồ sơ họa sĩ</Link>}{packages.map((item, packageIndex) => <section key={item.id} className="space-y-5 rounded-[28px] border border-[#221E1A]/10 bg-[#FFFCF6]/85 p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3"><h2 className="font-h1 text-lg font-bold text-[#241F1A]">Gói {packageIndex + 1}</h2><button type="button" onClick={() => setPackages(current => current.filter(entry => entry.id !== item.id))} className="text-xs text-[#A8321C]">Xóa gói</button></div>
      <div className="space-y-2"><label className={label} htmlFor={`package-name-${item.id}`}>PACKAGE NAME</label><input id={`package-name-${item.id}`} className={field} value={item.name} onChange={event => updatePackage(item.id, { name: event.target.value })} placeholder="Ví dụ: Minh họa nhân vật" /></div>
      <div className="space-y-2"><label className={label} htmlFor={`package-description-${item.id}`}>DESCRIPTION</label><textarea id={`package-description-${item.id}`} className={field} rows={2} value={item.description ?? ''} onChange={event => updatePackage(item.id, { description: event.target.value })} placeholder="Phạm vi và quyền sử dụng" /></div>
      <div className="space-y-3 border-t border-[#221E1A]/10 pt-5"><h3 className="text-xs font-bold text-[#241F1A]">MILESTONE PLAN</h3>{item.milestones.map((stage, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]"><input aria-label={`Tên cột mốc ${index + 1} gói ${packageIndex + 1}`} className={field} value={stage.title} onChange={event => updateMilestone(item.id, index, { title: event.target.value })} /><input aria-label={`Giá cột mốc ${index + 1} gói ${packageIndex + 1}`} type="number" min={1} step={1} className={field} value={stage.price} onChange={event => updateMilestone(item.id, index, { price: Number(event.target.value) })} /><button type="button" disabled={item.milestones.length === 1} onClick={() => removeMilestone(item.id, index)} className="rounded-xl border border-[#221E1A]/10 px-3 py-2 text-xs text-[#746A5F] disabled:opacity-40">Xóa</button></div>)}<button type="button" disabled={item.milestones.length >= 10} onClick={() => addMilestone(item.id)} className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2 text-xs font-bold text-[#241F1A] disabled:opacity-40">Thêm cột mốc</button></div>
      <p className="text-right text-sm text-[#8C3718]">Giá gói: <strong>{money(item.milestones.reduce((sum, stage) => sum + stage.price, 0))}</strong></p>
    </section>)}<button type="button" disabled={!hasProfile || packages.length >= 10} onClick={addPackage} className="rounded-xl border border-[#B24A26]/40 bg-[#B24A26]/10 px-5 py-3 text-xs font-bold text-[#241F1A] disabled:opacity-40">Thêm gói giá</button><div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#221E1A]/10 pt-5"><Link href="/creator/commissions" className="text-xs text-[#8C3718] underline">Về xưởng vẽ</Link><button type="button" disabled={!hasProfile || saving} onClick={save} className="rounded-xl bg-[#F0E7D8] px-8 py-3.5 text-xs font-extrabold text-[#FFFCF6] disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu bảng giá'}</button></div></div>}
    {hasProfile && <CreatorAddonManager packages={packages} />}
    {error && <p role="alert" className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-3 text-xs text-[#A8321C]">{error}</p>}{message && <p role="status" className="text-xs text-[#2F6B63]">{message}</p>}
  </main>;
}
