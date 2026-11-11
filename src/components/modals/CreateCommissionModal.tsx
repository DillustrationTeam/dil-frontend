'use client';

import { addonService, addonAllows, addonStage, addonMoney, type CreatorAddon } from '@/services/addon.service';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, Sparkles, Loader2, Check, RefreshCw, Dice5 } from 'lucide-react';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import { commissionService } from '@/services/commission.service';
import { creatorRateCardService, getPackageSlotInfo, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { CreatorTermsOverview } from '@/components/terms/CreatorTermsOverview';
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

export default function CreateCommissionModal({ creatorId, creatorName, onClose, initialPackageId, initialTerms }: { creatorId: string; creatorName: string; onClose: () => void; initialPackageId?: string; initialTerms?: CreatorTermsDto | null }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId || '');
  const [licenseType, setLicenseType] = useState<'Personal' | 'Commercial'>('Personal');
  const [terms, setTerms] = useState<CreatorTermsDto | null>(initialTerms ?? null);
  const [step, setStep] = useState<1 | 2>(1);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [acceptedCreatorTerms, setAcceptedCreatorTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isRandomIdea, setIsRandomIdea] = useState(false);

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', deadlineAt: '', voucherCode: '' },
  });
  const selectedPackage = packages.find(item => item.id === selectedPackageId);
  const multiplier = licenseType === 'Commercial' ? terms?.commercialLicenseMultiplier ?? 1.5 : 1;
  const [addons, setAddons] = useState<CreatorAddon[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const availableAddons = addons.filter(a => a.isActive && (!a.packageId || a.packageId === selectedPackageId) && selectedPackage?.milestones.some(m => addonAllows(a.allowedMilestone, addonStage(m.sequence, selectedPackage.milestones.length))));
  const selectedAddons = availableAddons.filter(a => addonIds.includes(a.id));
  const estimatedTotal = (selectedPackage?.price ?? 0) * multiplier + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const milestoneEstimate = (stage: RateCardPackage['milestones'][number]) => stage.price * multiplier + selectedAddons
    .filter(addon => selectedPackage?.milestones.find(m => addonAllows(addon.allowedMilestone, addonStage(m.sequence, selectedPackage.milestones.length)))?.sequence === stage.sequence)
    .reduce((sum, addon) => sum + addon.price, 0);

  useEffect(() => {
    addonService.creator(creatorId).then(items => { setAddons(items); setAddonIds([]); }).catch(() => setError('Không tải được phụ phí của Creator.'));
    creatorRateCardService.get(creatorId).then(setPackages)
      .catch(() => setError('Không tải được bảng giá Creator.'))
      .finally(() => setLoadingPackages(false));
    creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError((prev) => prev.includes('điều khoản') ? '' : prev); })
      .catch((cause) => setError(extractErrorMessage(cause, 'Không tải được điều khoản của Creator.')));
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

  const handleAiBriefHelper = async (random: boolean = false) => {
    const currentTitle = getValues('title');
    const currentDesc = getValues('description');
    if (!currentTitle?.trim() && !currentDesc?.trim()) {
      setError('Vui lòng nhập ít nhất tên dự án hoặc vài từ khóa ý tưởng để AI gợi ý brief.');
      return;
    }
    setAiBriefing(true);
    setIsRandomIdea(random);
    setError('');
    try {
      const res = await aiService.briefHelper({
        title: currentTitle,
        description: currentDesc,
        style: selectedPackage?.name,
        budget: estimatedTotal,
        surpriseMe: random,
      });
      if (res?.content) {
        setAiSuggestion(res.content);
      }
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không thể gọi AI hỗ trợ brief lúc này.'));
    } finally {
      setAiBriefing(false);
    }
  };

  const goToStep = (next: 1 | 2) => {
    setStep(next);
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (values: Form) => {
    setError('');
    setPackageError(null);
    setTermsError(null);

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
        <header className="border-b border-white/10 bg-[#1F2335]/70 px-5 py-4 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7ACD9]">COMMISSION REQUEST · BƯỚC {step} / 2</p>
              <h2 id="commission-modal-title" className="mt-1 font-h1 text-xl font-bold text-white">Đặt vẽ với {creatorName}</h2>
              <p className="mt-1 text-xs text-[#8A8FA9]">Creator xác nhận trước; Client ký quỹ sau khi thống nhất giá.</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng form Commission" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white disabled:opacity-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition ${step === 1 ? "border-[#A7ACD9] bg-[#A7ACD9]/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-[#A7ACD9] text-[#1F2335]" : "bg-emerald-500/20 text-emerald-300"}`}>{acceptedCreatorTerms ? "✓" : "1"}</span>
              <span className="truncate">1. Đọc điều khoản (ToS)</span>
            </button>
            <button
              type="button"
              disabled={!terms || !acceptedCreatorTerms}
              onClick={() => goToStep(2)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${step === 2 ? "border-[#A7ACD9] bg-[#A7ACD9]/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-[#A7ACD9] text-[#1F2335]" : "bg-white/10 text-slate-300"}`}>2</span>
              <span className="truncate">2. Chọn gói vẽ &amp; gửi yêu cầu</span>
            </button>
          </div>
        </header>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          {step === 1 ? (
            <div className="space-y-5">
              {terms ? (
                <CreatorTermsOverview terms={terms} creatorName={creatorName} />
              ) : error ? (
                <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></span>
                  <button type="button" onClick={() => void creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError(""); }).catch((cause) => setError(extractErrorMessage(cause, "Không tải được điều khoản của Creator.")))} className="shrink-0 rounded-lg border border-red-300/30 bg-white/5 px-2.5 py-1 font-semibold text-white hover:bg-white/10">Thử tải lại</button>
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-slate-400">Đang tải điều khoản dịch vụ của Creator…</p>
              )}

              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-200">
                  <input
                    type="checkbox"
                    checked={acceptedCreatorTerms}
                    disabled={!terms || busy}
                    onChange={(e) => { setAcceptedCreatorTerms(e.target.checked); if (e.target.checked) setTermsError(null); }}
                    className="mt-0.5 size-4 accent-[#A7ACD9]"
                  />
                  <span>Tôi đã đọc, hiểu và đồng ý với phạm vi nhận vẽ, bản quyền sử dụng và các điều khoản riêng trong Điều khoản dịch vụ (ToS) của <strong>{creatorName}</strong>.</span>
                </label>
                {termsError && <p role="alert" className="text-xs font-medium text-red-300">{termsError}</p>}
              </div>

              <div className="flex justify-end border-t border-white/10 pt-5">
                <button
                  type="button"
                  disabled={!terms}
                  onClick={() => {
                    if (!acceptedCreatorTerms) {
                      setTermsError("Vui lòng xác nhận đã đọc và đồng ý với Điều khoản dịch vụ (ToS) của Creator trước khi tiếp tục.");
                      return;
                    }
                    goToStep(2);
                  }}
                  className="rounded-xl bg-[#A7ACD9] px-7 py-3 text-xs font-extrabold text-[#1F2335] shadow-lg transition hover:bg-[#b8bde4] disabled:opacity-45"
                >
                  Tiếp tục chọn gói vẽ →
                </button>
              </div>
            </div>
          ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-2.5 text-xs">
            <span className="text-emerald-200">✓ Đã đọc &amp; đồng ý ToS của <strong>{creatorName}</strong> (v{terms?.extended?.version ?? 1})</span>
            <button type="button" onClick={() => goToStep(1)} className="shrink-0 font-semibold text-[#C5C9F8] underline-offset-4 hover:underline">Xem lại ToS</button>
          </div>
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
            <div className="flex items-center justify-between gap-2">
              <label className={label} htmlFor="commission-brief">MÔ TẢ YÊU CẦU CHI TIẾT <span className="text-red-400">*</span></label>
              <button
                type="button"
                disabled={aiBriefing}
                onClick={() => handleAiBriefHelper(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 text-brand-periwinkle px-3 py-1 text-[11px] font-bold transition-all hover:border-brand-periwinkle/60 shadow-sm shadow-brand-periwinkle/5 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Gợi ý brief chuẩn artist từ ý tưởng thô"
              >
                {aiBriefing && !isRandomIdea ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-periwinkle" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-brand-periwinkle" />
                )}
                <span>AI Brief Helper</span>
              </button>
            </div>
            <textarea id="commission-brief" rows={4} className={`${field} ${errors.description ? 'border-red-500/70' : ''}`} placeholder="Mô tả chi tiết phong cách, màu sắc, kích thước và yêu cầu nhân vật…" {...register('description')} />
            {errors.description && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description.message}</p>}

            {aiSuggestion && (
              <div className="mt-3 rounded-2xl border border-brand-periwinkle/25 bg-[#181B28]/95 backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/40 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-periwinkle/15 border border-brand-periwinkle/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-brand-periwinkle" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      Gợi ý Brief từ AI
                    </span>
                    {isRandomIdea && (
                      <span className="rounded-full bg-brand-periwinkle/15 px-2 py-0.5 text-[10px] font-medium text-brand-periwinkle border border-brand-periwinkle/25">
                        Ý tưởng ngẫu nhiên
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-[#8A8FA9] hover:text-white flex items-center justify-center text-xs transition-colors"
                    title="Đóng xem trước"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3.5 font-body text-xs leading-relaxed text-[#E4E1E5] border border-white/10 selection:bg-brand-periwinkle/30">
                  {aiSuggestion}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={aiBriefing}
                    onClick={() => {
                      setValue('description', aiSuggestion, { shouldValidate: true });
                      setAiSuggestion(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-periwinkle hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-brand-navy shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Áp dụng gợi ý này</span>
                  </button>

                  <button
                    type="button"
                    disabled={aiBriefing}
                    onClick={() => handleAiBriefHelper(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {aiBriefing && !isRandomIdea ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Tạo lại</span>
                  </button>

                  <button
                    type="button"
                    disabled={aiBriefing}
                    onClick={() => handleAiBriefHelper(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 px-3 py-1.5 text-xs font-semibold text-brand-periwinkle transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {aiBriefing && isRandomIdea ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Dice5 className="w-3.5 h-3.5 text-brand-periwinkle" />
                    )}
                    <span>Gợi ý ngẫu nhiên</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <fieldset className="space-y-3 border-t border-white/10 pt-5">
            <legend className="font-h1 text-sm font-bold text-white">BẢNG GIÁ DỊCH VỤ CREATOR (RATE CARD)</legend>
            <p className="text-xs text-[#8A8FA9]">Chọn gói vẽ do Creator cấu hình. Giá và các mốc thanh toán do Creator quyết định.</p>
            {loadingPackages ? (
              <p className="text-xs text-slate-400">Đang tải bảng giá…</p>
            ) : packages.length === 0 ? (
              <p className="text-xs text-amber-200">Creator chưa cấu hình bảng giá nên chưa thể nhận yêu cầu mới.</p>
            ) : (
              packages.map(item => {
                const slot = getPackageSlotInfo(item);
                return (
                  <label key={item.id} className={`block rounded-xl border p-4 text-xs ${slot.isFull ? 'cursor-not-allowed opacity-55 border-white/10 bg-white/[0.02]' : selectedPackageId === item.id ? 'cursor-pointer border-[#A7ACD9] bg-[#A7ACD9]/10' : 'cursor-pointer border-white/10 bg-white/5'}`}>
                    <span className="flex flex-wrap items-center gap-2.5">
                      <input type="radio" name="rate-package" disabled={slot.isFull} checked={selectedPackageId === item.id && !slot.isFull} onChange={() => { setSelectedPackageId(item.id); if (packageError) setPackageError(null); }} />
                      <strong className="text-white">{item.name}</strong>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                        !slot.isLimited
                          ? 'border-sky-400/25 bg-sky-500/10 text-sky-300'
                          : slot.isFull
                            ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                            : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {slot.isLimited ? slot.label : '∞ Không giới hạn'}
                      </span>
                      <span className="ml-auto font-bold text-[#C5C9F8]">{money(item.price)}</span>
                    </span>
                    {item.description && <span className="mt-2 block text-slate-400 whitespace-pre-line">{item.description}</span>}
                    {(item.milestones?.length ?? 0) > 0 && (
                      <ul className="mt-2.5 space-y-1 rounded-lg border border-white/10 bg-black/25 p-2.5 text-[11px]">
                        {[...item.milestones].sort((a, b) => a.sequence - b.sequence).map((m) => (
                          <li key={m.sequence} className="flex items-center justify-between gap-2 text-slate-300">
                            <span><strong className="text-white">Mốc #{m.sequence}:</strong> {m.title}</span>
                            <span className="shrink-0 text-slate-400">
                              {money(m.price)} · {m.maxRevisions ?? item.maxRevisions ?? 3} lần sửa
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </label>
                );
              })
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
            </div>

            {selectedPackage && (
              <>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-xs font-bold text-white">Kế hoạch các mốc vẽ (Milestone plan)</h3>
                  <ol className="mt-3 space-y-2">
                    {selectedPackage.milestones.map(stage => (
                      <li key={stage.sequence} className="flex justify-between gap-3 text-xs text-slate-300">
                        <span>{stage.sequence}. {stage.title}<span className="ml-2 text-slate-400">· {stage.maxRevisions ?? 3} lần sửa</span></span>
                        <span>{money(milestoneEstimate(stage))}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-[#8A8FA9]">File gốc HD được bàn giao sau khi duyệt xong tất cả các bản phác thảo.</p>
                  <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs">
                    <p className="flex justify-between text-slate-400"><span>Giá gói</span><span>{money(selectedPackage.price)}</span></p>
                    <p className="flex justify-between text-slate-400"><span>Hệ số bản quyền</span><span>× {multiplier}</span></p>
                    <p className="flex justify-between font-bold text-white"><span>Tổng dự kiến</span><span>{money(estimatedTotal)}</span></p>
                    {estimatedTotal >= 2_000_000 && <p className="pt-1 text-[11px] text-[#A7ACD9]">Đơn từ 2.000.000đ chỉ cần ký quỹ trước Mốc #1 ({money(milestoneEstimate(selectedPackage.milestones[0]))}) khi bắt đầu.</p>}
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


          {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></span>{!terms && <button type="button" onClick={() => void creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError(''); }).catch((cause) => setError(extractErrorMessage(cause, 'Không tải được điều khoản của Creator.')))} className="shrink-0 rounded-lg border border-red-300/30 bg-white/5 px-2.5 py-1 font-semibold text-white hover:bg-white/10">Thử tải lại</button>}</div>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button type="button" disabled={busy} onClick={() => goToStep(1)} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
              ← Quay lại đọc ToS
            </button>
            <button disabled={busy || !selectedPackage || !terms} className="rounded-xl bg-white px-8 py-3.5 text-xs font-extrabold text-[#0d0e15] shadow-xl transition-all hover:bg-[#C5C9F8] disabled:opacity-50">
              {busy ? "Đang gửi…" : "Gửi yêu cầu đặt vẽ"}
            </button>
          </div>
        </form>
          )}
        </div>
      </div>
    </div>
  );
}
