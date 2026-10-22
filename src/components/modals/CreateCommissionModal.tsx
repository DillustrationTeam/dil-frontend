'use client';

import { addonService, addonStage, addonMoney, type CreatorAddon } from '@/services/addon.service';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { creatorRateCardService, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { CreatorTermsDto } from '@/features/creator-studio/types/creator-profile.types';
import { extractErrorMessage } from '@/lib/api-client';
import { acquireBodyScrollLock } from '@/lib/body-scroll-lock';

const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tên dự án.').max(200, 'Tên dự án quá dài (tối đa 200 ký tự).'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả chi tiết yêu cầu đặt vẽ.'),
  deadlineAt: z.string().optional(),
  voucherCode: z.string().trim().max(50, 'Mã giảm giá quá dài.').optional(),
});
type Form = z.infer<typeof schema>;

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const field = 'w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#C5C9F8] transition-colors';
const label = 'block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]';

export default function CreateCommissionModal({ creatorId, creatorName, onClose }: { creatorId: string; creatorName: string; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [licenseType, setLicenseType] = useState<'Personal' | 'Commercial'>('Personal');
  const [terms, setTerms] = useState<CreatorTermsDto | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', deadlineAt: '', voucherCode: '' },
  });
  const selectedPackage = packages.find(item => item.id === selectedPackageId);
  const multiplier = licenseType === 'Commercial' ? terms?.commercialLicenseMultiplier ?? 1.5 : 1;
  const [addons, setAddons] = useState<CreatorAddon[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const availableAddons = addons.filter(a => a.isActive && (!a.packageId || a.packageId === selectedPackageId) && selectedPackage?.milestones.some(m => a.allowedMilestone === 'Any' || addonStage(m.sequence, selectedPackage.milestones.length) === a.allowedMilestone));
  const selectedAddons = availableAddons.filter(a => addonIds.includes(a.id));
  const estimatedTotal = (selectedPackage?.price ?? 0) * multiplier + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const milestoneEstimate = (stage: RateCardPackage['milestones'][number]) => stage.price * multiplier + selectedAddons
    .filter(addon => selectedPackage?.milestones.find(m => addon.allowedMilestone === 'Any' || addonStage(m.sequence, selectedPackage.milestones.length) === addon.allowedMilestone)?.sequence === stage.sequence)
    .reduce((sum, addon) => sum + addon.price, 0);

  useEffect(() => {
    addonService.creator(creatorId).then(items => { setAddons(items); setAddonIds([]); }).catch(() => setError('Không tải được phụ phí của Creator.'));
    creatorRateCardService.get(creatorId).then(setPackages)
      .catch(() => setError('Không tải được bảng giá Creator.'))
      .finally(() => setLoadingPackages(false));
    creatorProfileService.getTerms(creatorId).then(setTerms)
      .catch(() => setError('Không tải được điều khoản của Creator.'));
  }, [creatorId]);

  const closeDialog = useEffectEvent(() => { if (!busy) onClose(); });
  useEffect(() => {
    const releaseScrollLock = acquireBodyScrollLock();
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') ?? []).filter(item => item.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      const outside = !dialogRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || outside)) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { releaseScrollLock(); window.removeEventListener('keydown', onKeyDown); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);

  const submit = async (values: Form) => {
    setError('');
    setPackageError(null);

    if (!selectedPackage) {
      setPackageError('Vui lòng chọn 1 gói vẽ trong bảng giá của Creator.');
      return;
    }

    setBusy(true);
    try {
      const created = await commissionService.create({
        creatorId,
        packageId: selectedPackage.id,
        addonIds: selectedAddons.map(a => a.id),
        licenseType,
        title: values.title?.trim() || `Đặt vẽ gói ${selectedPackage.name}`,
        description: values.description,
        voucherCode: values.voucherCode || undefined,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : undefined,
      });
      onClose();
      router.push(`/client/requests/${created.id}`);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không tạo được đơn đặt vẽ. Vui lòng kiểm tra lại thông tin.'));
    }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="commission-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#141722] shadow-2xl shadow-black/30">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#1F2335]/70 px-5 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7ACD9]">COMMISSION REQUEST</p>
            <h2 id="commission-modal-title" className="mt-1 font-h1 text-xl font-bold text-white">Đặt vẽ với {creatorName}</h2>
            <p className="mt-1 text-xs text-[#8A8FA9]">Creator xác nhận trước; Client ký quỹ sau khi thống nhất giá.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng form Commission" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white disabled:opacity-50"><X className="h-4 w-4" /></button>
        </header>

        <form onSubmit={handleSubmit(submit)} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-8">
          <div className="space-y-2">
            <label className={label} htmlFor="commission-title">TÊN DỰ ÁN</label>
            <input id="commission-title" className={`${field} ${errors.title ? 'border-red-500/70' : ''}`} placeholder="Ví dụ: Minh họa nhân vật Game" {...register('title')} />
            {errors.title && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className={label} htmlFor="commission-deadline">HẠN DỰ KIẾN (DELIVERY TARGET)</label>
            <input id="commission-deadline" type="date" className={field} {...register('deadlineAt')} />
          </div>

          <div className="space-y-2">
            <label className={label} htmlFor="commission-brief">MÔ TẢ YÊU CẦU CHI TIẾT <span className="text-red-400">*</span></label>
            <textarea id="commission-brief" rows={4} className={`${field} ${errors.description ? 'border-red-500/70' : ''}`} placeholder="Mô tả chi tiết phong cách, màu sắc, kích thước và yêu cầu nhân vật…" {...register('description')} />
            {errors.description && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description.message}</p>}
          </div>

          <fieldset className="space-y-3 border-t border-white/10 pt-5">
            <legend className="font-h1 text-sm font-bold text-white">BẢNG GIÁ DỊCH VỤ CREATOR (RATE CARD)</legend>
            <p className="text-xs text-[#8A8FA9]">Chọn gói vẽ do Creator cấu hình. Giá và các mốc thanh toán do Creator quyết định.</p>
            {loadingPackages ? (
              <p className="text-xs text-slate-400">Đang tải bảng giá…</p>
            ) : packages.length === 0 ? (
              <p className="text-xs text-amber-200">Creator chưa cấu hình bảng giá nên chưa thể nhận yêu cầu mới.</p>
            ) : (
              packages.map(item => (
                <label key={item.id} className={`block cursor-pointer rounded-xl border p-4 text-xs ${selectedPackageId === item.id ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/5'}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="rate-package" checked={selectedPackageId === item.id} onChange={() => { setSelectedPackageId(item.id); if (packageError) setPackageError(null); }} />
                    <strong className="text-white">{item.name}</strong>
                    <span className="ml-auto font-bold text-[#C5C9F8]">{money(item.price)}</span>
                  </span>
                  {item.description && <span className="mt-2 block text-slate-400">{item.description}</span>}
                </label>
              ))
            )}

            {packageError && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300 font-medium"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {packageError}</p>}

            {selectedPackage && <div className="space-y-3 border-t border-white/10 pt-5">
              <h3 className="font-h1 text-sm font-bold text-white">PHỤ PHÍ TÙY CHỌN</h3>
              <p className="text-xs text-[#A7ACD9]">Phụ phí được ký quỹ cùng đơn hàng và thực hiện tại mốc đã ghi.</p>
              {availableAddons.map(a => <label key={a.id} className="flex items-center gap-3 text-xs text-white"><input type="checkbox" checked={addonIds.includes(a.id)} disabled={busy} onChange={e => setAddonIds(ids => e.target.checked ? [...ids, a.id] : ids.filter(id => id !== a.id))} />{a.title} · {a.allowedMilestone} · +{addonMoney(a.price)} · +{a.extendDays} ngày</label>)}
            </div>}
            <div className="space-y-3 border-t border-white/10 pt-5">
              <h3 className="font-h1 text-sm font-bold text-white">MỤC ĐÍCH SỬ DỤNG</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['Personal', 'Commercial'] as const).map(value => (
                  <label key={value} className={`cursor-pointer rounded-xl border p-4 text-xs ${licenseType === value ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/5'}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="license-type" checked={licenseType === value} onChange={() => setLicenseType(value)} />
                      <strong className="text-white">{value === 'Personal' ? 'Cá nhân' : 'Thương mại'}</strong>
                    </span>
                    <span className="mt-2 block text-slate-400">{value === 'Personal' ? 'Không sử dụng để kinh doanh.' : `Áp dụng hệ số ${terms?.commercialLicenseMultiplier ?? 1.5}×.`}</span>
                  </label>
                ))}
              </div>
              {terms?.revisionPolicy && <p className="text-xs text-slate-400"><strong className="text-slate-300">Chính sách chỉnh sửa:</strong> {terms.revisionPolicy}</p>}
              {terms?.cancellationPolicy && <p className="text-xs text-slate-400"><strong className="text-slate-300">Chính sách hủy:</strong> {terms.cancellationPolicy}</p>}
            </div>

            {selectedPackage && (
              <>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-xs font-bold text-white">Kế hoạch các mốc vẽ (Milestone plan)</h3>
                  <ol className="mt-3 space-y-2">
                    {selectedPackage.milestones.map(stage => (
                      <li key={stage.sequence} className="flex justify-between gap-3 text-xs text-slate-300">
                        <span>{stage.sequence}. {stage.title}</span>
                        <span>{money(milestoneEstimate(stage))}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-[#8A8FA9]">File gốc HD được bàn giao sau khi duyệt xong tất cả các bản phác thảo.</p>
                  <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs">
                    <p className="flex justify-between text-slate-400"><span>Giá gói</span><span>{money(selectedPackage.price)}</span></p>
                    <p className="flex justify-between text-slate-400"><span>Hệ số bản quyền</span><span>× {multiplier}</span></p>
                    <p className="flex justify-between font-bold text-white"><span>Tổng dự kiến</span><span>{money(estimatedTotal)}</span></p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className={label} htmlFor="commission-voucher">MÃ GIẢM GIÁ (KHÔNG BẮT BUỘC)</label>
                  <input id="commission-voucher" className={field} placeholder="Nhập mã giảm giá" {...register('voucherCode')} />
                  {errors.voucherCode && <p role="alert" className="text-xs text-red-300">{errors.voucherCode.message}</p>}
                  <p className="mt-2 text-xs text-slate-400">Hệ thống kiểm tra mã khi tạo yêu cầu và chỉ sử dụng lượt khi ký quỹ.</p>
                </div>
              </>
            )}
          </fieldset>

          {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}

          <div className="flex justify-end border-t border-white/10 pt-5">
            <button disabled={busy || !selectedPackage || !terms} className="rounded-xl bg-white px-8 py-3.5 text-xs font-extrabold text-[#0d0e15] shadow-xl transition-all hover:bg-[#C5C9F8] disabled:opacity-50">
              {busy ? 'Đang gửi…' : 'Gửi yêu cầu đặt vẽ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
