'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import axios from 'axios';
import { commissionService } from '@/services/commission.service';
import { creatorRateCardService, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';

const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tên dự án.').max(200),
  description: z.string().trim().min(1, 'Nhập mô tả yêu cầu.'),
  deadlineAt: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const field = 'w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#C5C9F8] transition-colors';
const label = 'block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]';

export default function CreateCommissionModal({ creatorId, creatorName, onClose }: { creatorId: string; creatorName: string; onClose: () => void }) {
  const router = useRouter();
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', deadlineAt: '' },
  });
  const selectedPackage = packages.find(item => item.id === selectedPackageId);

  useEffect(() => {
    creatorRateCardService.get(creatorId).then(setPackages)
      .catch(() => setError('Không tải được bảng giá Creator.'))
      .finally(() => setLoadingPackages(false));
  }, [creatorId]);

  useEffect(() => {
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [onClose]);

  const submit = async (values: Form) => {
    setError('');
    if (!selectedPackage) {
      setError('Chọn một gói trong bảng giá Creator.');
      return;
    }
    setBusy(true);
    try {
      const created = await commissionService.create({
        creatorId,
        packageId: selectedPackage.id,
        ...values,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : undefined,
      });
      onClose();
      router.push(`/client/requests/${created.id}`);
    } catch (cause) {
      const details = axios.isAxiosError(cause) ? cause.response?.data?.error?.details : undefined;
      setError(Array.isArray(details) && details.length > 0
        ? details.join(' ')
        : 'Không tạo được đơn. Vui lòng thử lại.');
    }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="commission-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#141722] shadow-2xl shadow-black/30">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#1F2335]/70 px-5 py-5 sm:px-8">
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#A7ACD9]">COMMISSION REQUEST</p><h2 id="commission-modal-title" className="mt-1 font-h1 text-xl font-bold text-white">Đặt vẽ với {creatorName}</h2><p className="mt-1 text-xs text-[#8A8FA9]">Creator xác nhận trước; Client ký quỹ sau khi thống nhất giá.</p></div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng form Commission" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white disabled:opacity-50"><X className="h-4 w-4" /></button>
      </header>
      <form onSubmit={handleSubmit(submit)} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-8">
        <div className="space-y-2"><label className={label} htmlFor="commission-title">PROJECT TITLE</label><input id="commission-title" className={field} placeholder="Ví dụ: Minh họa nhân vật" {...register('title')} />{errors.title && <small className="text-red-300">{errors.title.message}</small>}</div>
        <div className="space-y-2"><label className={label} htmlFor="commission-deadline">DELIVERY TARGET</label><input id="commission-deadline" type="date" className={field} {...register('deadlineAt')} /></div>
        <div className="space-y-2"><label className={label} htmlFor="commission-brief">DETAILED BRIEF</label><textarea id="commission-brief" rows={4} className={field} placeholder="Mô tả phong cách, kích thước và yêu cầu…" {...register('description')} />{errors.description && <small className="text-red-300">{errors.description.message}</small>}</div>
        <fieldset className="space-y-3 border-t border-white/10 pt-5"><legend className="font-h1 text-sm font-bold text-white">CREATOR RATE CARD</legend><p className="text-xs text-[#8A8FA9]">Chọn gói Creator đã cấu hình. Giá và milestone do Creator quyết định.</p>{loadingPackages ? <p className="text-xs text-slate-400">Đang tải bảng giá…</p> : packages.length === 0 ? <p className="text-xs text-amber-200">Creator chưa cấu hình bảng giá nên chưa thể nhận yêu cầu mới.</p> : packages.map(item => <label key={item.id} className={`block cursor-pointer rounded-xl border p-4 text-xs ${selectedPackageId === item.id ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/5'}`}><span className="flex items-center gap-3"><input type="radio" name="rate-package" checked={selectedPackageId === item.id} onChange={() => setSelectedPackageId(item.id)} /><strong className="text-white">{item.name}</strong><span className="ml-auto font-bold text-[#C5C9F8]">{money(item.price)}</span></span>{item.description && <span className="mt-2 block text-slate-400">{item.description}</span>}</label>)}{selectedPackage && <div className="rounded-xl border border-white/10 bg-black/20 p-4"><h3 className="text-xs font-bold text-white">Milestone plan</h3><ol className="mt-3 space-y-2">{selectedPackage.milestones.map(stage => <li key={stage.sequence} className="flex justify-between gap-3 text-xs text-slate-300"><span>{stage.sequence}. {stage.title}</span><span>{money(stage.price)}</span></li>)}</ol><p className="mt-3 text-xs text-[#8A8FA9]">File cuối được bàn giao riêng sau các bản nháp.</p></div>}</fieldset>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200">{error}</p>}
        <div className="flex justify-end border-t border-white/10 pt-5"><button disabled={busy || !selectedPackage} className="rounded-xl bg-white px-8 py-3.5 text-xs font-extrabold text-[#0d0e15] shadow-xl transition-all hover:bg-[#C5C9F8] disabled:opacity-50">{busy ? 'Đang gửi…' : 'Gửi yêu cầu'}</button></div>
      </form>
    </div>
  </div>;
}
