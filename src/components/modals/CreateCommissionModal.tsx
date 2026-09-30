'use client';

import { useEffect, useState } from 'react';
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
import { VoucherApplyPanel } from '@/features/payment';

const schema = z.object({
  title: z.string().trim().max(200, 'Tên dự án quá dài (tối đa 200 ký tự).').optional(),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả chi tiết yêu cầu đặt vẽ.'),
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
  const [licenseType, setLicenseType] = useState<'Personal' | 'Commercial'>('Personal');
  const [terms, setTerms] = useState<CreatorTermsDto | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', deadlineAt: '' },
  });
  const selectedPackage = packages.find(item => item.id === selectedPackageId);
  const multiplier = licenseType === 'Commercial' ? terms?.commercialLicenseMultiplier ?? 1.5 : 1;
  const estimatedTotal = (selectedPackage?.price ?? 0) * multiplier;

  useEffect(() => {
    creatorRateCardService.get(creatorId).then(setPackages)
      .catch(() => setError('Không tải được bảng giá Creator.'))
      .finally(() => setLoadingPackages(false));
    creatorProfileService.getTerms(creatorId).then(setTerms)
      .catch(() => setError('Không tải được điều khoản của Creator.'));
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
        licenseType,
        title: values.title?.trim() || `Đặt vẽ gói ${selectedPackage.name}`,
        description: values.description,
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
      <div role="dialog" aria-modal="true" aria-labelledby="commission-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#141722] shadow-2xl shadow-black/30">
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
            <input id="commission-title" className={`${field} ${errors.title ? 'border-red-500/70' : ''}`} placeholder="Ví dụ: Minh họa nhân vật Game (để trống sẽ tự lấy tên gói vẽ)" {...register('title')} />
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
                        <span>{money(stage.price)}</span>
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
                  <VoucherApplyPanel
                    refType="Commission"
                    orderAmount={estimatedTotal}
                  />
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
