'use client';

import { addonService, addonAllows, addonStage, addonMoney, type CreatorAddon } from '@/services/addon.service';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, Sparkles, Loader2, Check, RefreshCw, Dice5, UploadCloud, Link2, Plus, FolderOpen } from 'lucide-react';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import { commissionService } from '@/services/commission.service';
import { validateReferenceFile, validateReferenceLink, type ReferenceType } from '@/lib/validation/link-validator';
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
const field = 'w-full px-4 py-3 bg-[var(--ink-3)] rounded-xl border border-[var(--hair-2)] text-[var(--ivory)] text-xs font-semibold placeholder:text-[var(--ash)] focus:outline-none focus:border-[var(--lumen)] transition-colors font-[family-name:var(--font-ui)]';
const label = 'block text-[11px] font-semibold text-[var(--ivory)] font-[family-name:var(--font-ui)]';

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

  // States & handlers cho Tệp & Liên kết tham khảo (Reference Materials / Ref)
  interface ReferenceItem {
    id: string;
    url: string;
    name: string;
    size?: number;
    type: ReferenceType;
    isUploading?: boolean;
  }
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (referenceItems.length + files.length > 10) {
      setLinkError('Chỉ được đính kèm tối đa 10 tệp/liên kết tham chiếu cho một đơn vẽ.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    for (const file of files) {
      const val = validateReferenceFile(file);
      if (!val.isValid) {
        setLinkError(val.error || 'Tệp không hợp lệ.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setIsUploadingFile(true);
    setLinkError(null);

    try {
      for (const file of files) {
        const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const ext = file.name.split('.').pop()?.toLowerCase();
        const type: ReferenceType = ext === 'pdf' ? 'pdf' : 'image';

        const uploaded = await commissionService.uploadAttachment(file);
        setReferenceItems((prev) => [
          ...prev,
          {
            id: tempId,
            url: uploaded.url,
            name: file.name,
            size: file.size,
            type,
            isUploading: false,
          },
        ]);
      }
    } catch (err: unknown) {
      setLinkError(extractErrorMessage(err, 'Tải tệp đính kèm thất bại. Vui lòng thử lại.'));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    setLinkError(null);
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    if (referenceItems.length >= 10) {
      setLinkError('Chỉ được đính kèm tối đa 10 tệp/liên kết tham chiếu.');
      return;
    }

    const val = validateReferenceLink(trimmed);
    if (!val.isValid || !val.normalizedUrl) {
      setLinkError(val.error || 'Liên kết không hợp lệ.');
      return;
    }

    if (referenceItems.some((i) => i.url.toLowerCase() === val.normalizedUrl!.toLowerCase())) {
      setLinkError('Liên kết này đã có trong danh sách đính kèm.');
      return;
    }

    setReferenceItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: val.normalizedUrl!,
        name: val.domain ? `${val.domain} (${(val.type || 'LINK').toUpperCase()})` : trimmed,
        type: val.type || 'link',
        isUploading: false,
      },
    ]);
    setLinkInput('');
  };

  const handleRemoveItem = (id: string) => {
    setReferenceItems((prev) => prev.filter((item) => item.id !== id));
  };

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
      const refUrls = referenceItems.filter((i) => !i.isUploading && i.url).map((i) => i.url);
      const created = await commissionService.create({
        creatorId,
        packageId: selectedPackage.id,
        addonIds: selectedAddons.map(a => a.id),
        licenseType,
        title: values.title?.trim() || `Đặt vẽ gói ${selectedPackage.name}`,
        description: values.description,
        voucherCode: values.voucherCode || undefined,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : undefined,
        referenceImages: refUrls,
      });
      onClose();
      router.push(`/client/requests/${created.id}`);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không tạo được đơn đặt vẽ. Vui lòng kiểm tra lại thông tin.'));
    }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4 font-[family-name:var(--font-ui)]" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="commission-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ivory)] shadow-2xl shadow-black/50 backdrop-blur-2xl font-[family-name:var(--font-ui)]">
        <header className="border-b border-[var(--hair)] bg-[var(--ink-3)] px-5 py-4 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[var(--ash)] font-[family-name:var(--font-ui)]">COMMISSION REQUEST · BƯỚC {step} / 2</p>
              <h2 id="commission-modal-title" className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ivory)]">Đặt vẽ với {creatorName}</h2>
              <p className="mt-1 text-xs text-[var(--ash)] font-[family-name:var(--font-ui)]">Creator xác nhận trước; Client ký quỹ sau khi thống nhất giá.</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng form Commission" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] text-[var(--ash)] hover:text-[var(--lumen)] hover:border-[var(--lumen)] disabled:opacity-50 transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-[family-name:var(--font-ui)]">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition ${step === 1 ? "border-[var(--lumen)] bg-[var(--lumen)]/15 text-[var(--ivory)]" : "border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ash)] hover:text-[var(--ivory)]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-[var(--lumen)] text-white" : "bg-emerald-600/30 text-emerald-400"}`}>{acceptedCreatorTerms ? "✓" : "1"}</span>
              <span className="truncate">1. Đọc điều khoản (ToS)</span>
            </button>
            <button
              type="button"
              disabled={!terms || !acceptedCreatorTerms}
              onClick={() => goToStep(2)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${step === 2 ? "border-[var(--lumen)] bg-[var(--lumen)]/15 text-[var(--ivory)]" : "border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ash)] hover:text-[var(--ivory)]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-[var(--lumen)] text-white" : "bg-[var(--ink-3)] text-[var(--ash)]"}`}>2</span>
              <span className="truncate">2. Chọn gói vẽ &amp; gửi yêu cầu</span>
            </button>
          </div>
        </header>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 font-[family-name:var(--font-ui)]">
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
                <p className="py-8 text-center text-xs text-[var(--ash)]">Đang tải điều khoản dịch vụ của Creator…</p>
              )}

              <div className="space-y-2 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[var(--ivory)] font-[family-name:var(--font-ui)]">
                  <input
                    type="checkbox"
                    checked={acceptedCreatorTerms}
                    disabled={!terms || busy}
                    onChange={(e) => { setAcceptedCreatorTerms(e.target.checked); if (e.target.checked) setTermsError(null); }}
                    className="mt-0.5 size-4 accent-[var(--lumen)]"
                  />
                  <span>Tôi đã đọc, hiểu và đồng ý với phạm vi nhận vẽ, bản quyền sử dụng và các điều khoản riêng trong Điều khoản dịch vụ (ToS) của <strong>{creatorName}</strong>.</span>
                </label>
                {termsError && <p role="alert" className="text-xs font-medium text-red-300">{termsError}</p>}
              </div>

              <div className="flex justify-end border-t border-[var(--hair)] pt-5">
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
                  className="rounded-full bg-[var(--lumen)] px-7 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-[var(--lumen-hi)] disabled:opacity-45"
                >
                  Tiếp tục chọn gói vẽ →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(submit)} className="space-y-6 font-[family-name:var(--font-ui)]">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3 text-xs">
                <span className="text-emerald-400 font-medium">✓ Đã đọc &amp; đồng ý ToS của <strong className="text-emerald-300">{creatorName}</strong> (v{terms?.extended?.version ?? 1})</span>
                <button type="button" onClick={() => goToStep(1)} className="shrink-0 font-medium text-[var(--ash)] hover:text-[var(--ivory)] transition-colors underline-offset-4 hover:underline">Xem lại ToS</button>
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] hover:bg-[var(--ink-1)] text-[var(--lumen)] px-3 py-1 text-[11px] font-bold transition-all hover:border-[var(--lumen)] shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Gợi ý brief chuẩn artist từ ý tưởng thô"
                  >
                    {aiBriefing && !isRandomIdea ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--lumen)]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[var(--lumen)]" />
                    )}
                    <span>AI Brief Helper</span>
                  </button>
                </div>
                <textarea id="commission-brief" rows={4} className={`${field} ${errors.description ? 'border-red-500/70' : ''}`} placeholder="Mô tả chi tiết phong cách, màu sắc, kích thước và yêu cầu nhân vật…" {...register('description')} />
                {errors.description && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description.message}</p>}

                {aiSuggestion && (
                  <div className="mt-3 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/40 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[var(--hair)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--ink-3)] border border-[var(--hair-2)] flex items-center justify-center text-[var(--lumen)]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[var(--ivory)] tracking-wide">
                          Gợi ý Brief từ AI
                        </span>
                        {isRandomIdea && (
                          <span className="rounded-full bg-[var(--lumen)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--lumen)] border border-[var(--hair-2)]">
                            Ý tưởng ngẫu nhiên
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiSuggestion(null)}
                        className="w-6 h-6 rounded-full bg-[var(--ink-3)] hover:bg-[var(--ink-1)] text-[var(--ash)] hover:text-[var(--ivory)] flex items-center justify-center text-xs transition-colors"
                        title="Đóng xem trước"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[var(--ink-3)] p-3.5 font-[family-name:var(--font-ui)] text-xs leading-relaxed text-[var(--ivory)] border border-[var(--hair-2)] selection:bg-[var(--lumen)]/30">
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
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lumen)] hover:bg-[var(--lumen-hi)] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Áp dụng gợi ý này</span>
                      </button>

                      <button
                        type="button"
                        disabled={aiBriefing}
                        onClick={() => handleAiBriefHelper(false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] hover:bg-[var(--ink-1)] hover:border-[var(--lumen)] px-3 py-1.5 text-xs font-semibold text-[var(--ivory)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] hover:bg-[var(--ink-1)] hover:border-[var(--lumen)] px-3 py-1.5 text-xs font-semibold text-[var(--lumen)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {aiBriefing && isRandomIdea ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Dice5 className="w-3.5 h-3.5 text-[var(--lumen)]" />
                        )}
                        <span>Gợi ý ngẫu nhiên</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TÀI LIỆU & HÌNH ẢNH THAM KHẢO (REFERENCE / REF) */}
              <div className="space-y-3 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className={label}>ẢNH / TÀI LIỆU THAM KHẢO</label>
                    <p className="mt-0.5 text-[11px] text-[var(--ash)]">
                      Đính kèm ảnh mẫu hoặc liên kết tham khảo cho họa sĩ.
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[var(--ash)] font-[family-name:var(--font-ui)]">
                    {referenceItems.length}/10 tệp
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Tải tệp lên */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => void handleFilesSelected(e)}
                    />
                    <button
                      type="button"
                      disabled={busy || isUploadingFile || referenceItems.length >= 10}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-3 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--ink-3)] disabled:opacity-45"
                    >
                      {isUploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--lumen)]" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-[var(--lumen)]" />
                      )}
                      <span>{isUploadingFile ? 'Đang tải tệp lên…' : 'Tải ảnh mẫu (PNG, JPG, PDF ≤ 10MB)'}</span>
                    </button>
                  </div>

                  {/* Dán link */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => {
                          setLinkInput(e.target.value);
                          if (linkError) setLinkError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLink();
                          }
                        }}
                        placeholder="Dán liên kết Drive, Pinterest, Imgur…"
                        className="w-full rounded-xl border border-[var(--hair-2)] bg-[var(--ink-2)] px-3.5 py-3 text-xs text-[var(--ivory)] placeholder:text-[var(--ash)] focus:border-[var(--lumen)] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy || !linkInput.trim() || referenceItems.length >= 10}
                      onClick={handleAddLink}
                      title="Thêm liên kết"
                      className="shrink-0 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-2)] px-3.5 py-3 text-xs font-bold text-[var(--ivory)] transition hover:bg-[var(--ink-3)] hover:border-[var(--lumen)] disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {linkError && (
                  <p role="alert" className="flex items-center gap-1.5 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {linkError}
                  </p>
                )}

                {/* Danh sách tệp/link đã thêm */}
                {referenceItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                    {referenceItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-[var(--hair-2)] bg-[var(--ink-2)] p-2 pr-7 text-xs transition hover:border-[var(--lumen)]"
                      >
                        {item.type === 'image' && item.url ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--ink-3)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ink-3)] text-[var(--lumen)]">
                            {item.type === 'drive' ? <FolderOpen className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-[var(--ivory)]">{item.name}</p>
                          <p className="text-[10px] text-[var(--ash)]">
                            {item.isUploading
                              ? 'Đang tải lên…'
                              : item.size
                                ? `${(item.size / (1024 * 1024)).toFixed(1)} MB`
                                : item.type === 'drive'
                                  ? 'Google Drive'
                                  : item.type === 'pinterest'
                                    ? 'Pinterest'
                                    : 'Liên kết web'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--ash)] transition hover:bg-rose-500/20 hover:text-rose-300"
                          title="Xóa tệp tham khảo này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <fieldset className="space-y-4 border-t border-[var(--hair)] pt-6">
                <div>
                  <legend className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ivory)]">BẢNG GIÁ DỊCH VỤ CREATOR (RATE CARD)</legend>
                  <p className="mt-1.5 text-xs text-[var(--ash)] py-1">Chọn gói vẽ do Creator cấu hình. Giá và các mốc thanh toán do Creator quyết định.</p>
                </div>
                {loadingPackages ? (
                  <p className="text-xs text-[var(--ash)] py-2">Đang tải bảng giá…</p>
                ) : packages.length === 0 ? (
                  <p className="text-xs text-amber-200 py-2">Creator chưa cấu hình bảng giá nên chưa thể nhận yêu cầu mới.</p>
                ) : (
                  packages.map(item => {
                    const slot = getPackageSlotInfo(item);
                    return (
                      <label key={item.id} className={`block rounded-xl border p-4 text-xs transition ${slot.isFull ? 'cursor-not-allowed opacity-55 border-[var(--hair-2)] bg-[var(--ink-3)]' : selectedPackageId === item.id ? 'cursor-pointer border-[var(--lumen)] bg-[var(--lumen)]/10' : 'cursor-pointer border-[var(--hair-2)] bg-[var(--ink-3)] hover:border-[var(--lumen)]'}`}>
                        <span className="flex flex-wrap items-center gap-2.5">
                          <input type="radio" name="rate-package" disabled={slot.isFull} checked={selectedPackageId === item.id && !slot.isFull} onChange={() => { setSelectedPackageId(item.id); if (packageError) setPackageError(null); }} className="accent-[var(--lumen)]" />
                          <strong className="text-[var(--ivory)] font-bold">{item.name}</strong>
                          {item.categoryName && (
                            <span className="rounded-md border border-[var(--hair-2)] bg-[var(--ink-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ash)]">
                              {item.categoryName}
                            </span>
                          )}
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${!slot.isLimited
                            ? 'border-sky-400/25 bg-sky-500/10 text-sky-300'
                            : slot.isFull
                              ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                              : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
                            }`}>
                            {slot.isLimited ? slot.label : '∞ Không giới hạn'}
                          </span>
                          <span className="ml-auto font-bold text-[var(--lumen)]">{money(item.price)}</span>
                        </span>
                        {item.description && <span className="mt-2.5 block text-xs leading-relaxed text-[var(--ash)] whitespace-pre-line py-1.5">{item.description}</span>}
                        {(item.milestones?.length ?? 0) > 0 && (
                          <ul className="mt-3.5 space-y-2 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-2)] p-3.5 text-xs">
                            {[...item.milestones].sort((a, b) => a.sequence - b.sequence).map((m) => (
                              <li key={m.sequence} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 rounded-lg bg-[var(--ink-3)] px-3 py-2 text-[var(--ash)] border border-[var(--hair-2)]/60">
                                <span className="min-w-0 break-words font-medium"><strong className="text-[var(--ivory)] font-semibold">Mốc #{m.sequence}:</strong> {m.title}</span>
                                <span className="shrink-0 font-semibold text-[var(--ash)] whitespace-nowrap">
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

                {selectedPackage && <div className="space-y-4 border-t border-[var(--hair)] pt-6">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ivory)]">PHỤ PHÍ TÙY CHỌN</h3>
                    <p className="mt-1.5 text-xs text-[var(--ash)] py-1">Phụ phí được ký quỹ cùng đơn hàng và thực hiện tại mốc đã ghi.</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    {availableAddons.map(a => <label key={a.id} className="flex items-center gap-3 text-xs text-[var(--ivory)] py-1"><input type="checkbox" checked={addonIds.includes(a.id)} disabled={busy} onChange={e => setAddonIds(ids => e.target.checked ? [...ids, a.id] : ids.filter(id => id !== a.id))} className="accent-[var(--lumen)]" />{a.title} · {a.allowedMilestone} · +{addonMoney(a.price)} · +{a.extendDays} ngày</label>)}
                  </div>
                </div>}
                <div className="space-y-4 border-t border-[var(--hair)] pt-6">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ivory)]">MỤC ĐÍCH SỬ DỤNG</h3>
                    <p className="mt-1.5 text-xs text-[var(--ash)] py-1">Chọn mục đích sử dụng cho tác phẩm để áp dụng hệ số bản quyền phù hợp.</p>
                  </div>
                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    {(['Personal', 'Commercial'] as const).map(value => (
                      <label key={value} className={`cursor-pointer rounded-xl border p-4 text-xs transition ${licenseType === value ? 'border-[var(--lumen)] bg-[var(--lumen)]/10' : 'border-[var(--hair-2)] bg-[var(--ink-3)] hover:border-[var(--lumen)]'}`}>
                        <span className="flex items-center gap-2">
                          <input type="radio" name="license-type" checked={licenseType === value} onChange={() => setLicenseType(value)} className="accent-[var(--lumen)]" />
                          <strong className="text-[var(--ivory)]">{value === 'Personal' ? 'Cá nhân' : 'Thương mại'}</strong>
                        </span>
                        <span className="mt-2.5 block text-xs leading-relaxed text-[var(--ash)] py-1">{value === 'Personal' ? 'Không sử dụng để kinh doanh.' : `Áp dụng hệ số ${terms?.commercialLicenseMultiplier ?? 1.5}×.`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedPackage && (
                  <div className="space-y-6 pt-5">
                    <div className="rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-5 sm:p-6">
                      <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ivory)] pb-1">Kế hoạch các mốc vẽ (Artwork milestone plan)</h3>
                      <ol className="mt-4 space-y-3">
                        {selectedPackage.milestones.map(stage => (
                          <li key={stage.sequence} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 rounded-xl bg-[var(--ink-2)] px-4 py-3 text-xs text-[var(--ash)] border border-[var(--hair-2)]/70 shadow-sm">
                            <span className="min-w-0 break-words font-medium"><strong className="text-[var(--ivory)] font-semibold">{stage.sequence}. {stage.title}</strong><span className="ml-2 text-[var(--ash)] whitespace-nowrap">· {stage.maxRevisions ?? 3} lần sửa</span></span>
                            <span className="text-[var(--ivory)] font-bold whitespace-nowrap">{money(milestoneEstimate(stage))}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-4 text-xs text-[var(--ash)] py-2">HD original files are delivered after all sketches are approved.</p>
                      <div className="mt-5 space-y-2.5 border-t border-[var(--hair)] pt-5 text-xs">
                        <p className="flex justify-between text-[var(--ash)] py-1"><span>Package price</span><span className="text-[var(--ivory)]">{money(selectedPackage.price)}</span></p>
                        <p className="flex justify-between text-[var(--ash)] py-1"><span>License multiplier</span><span className="text-[var(--ivory)]">× {multiplier}</span></p>
                        <p className="flex justify-between font-bold text-[var(--ivory)] py-1"><span>Estimated total</span><span className="text-[var(--lumen)] font-bold text-sm">{money(estimatedTotal)}</span></p>
                        {estimatedTotal >= 2_000_000 && <p className="pt-2.5 text-[11px] text-[var(--ash)] py-1">Đơn từ 2.000.000đ chỉ cần ký quỹ trước Mốc #1 ({money(milestoneEstimate(selectedPackage.milestones[0]))}) khi bắt đầu.</p>}
                      </div>
                    </div>

                    <div className="pt-3">
                      <label className={label} htmlFor="commission-voucher">MÃ GIẢM GIÁ (KHÔNG BẮT BUỘC)</label>
                      <div className="mt-2">
                        <input id="commission-voucher" className={field} placeholder="Nhập mã giảm giá" {...register('voucherCode')} />
                      </div>
                      {errors.voucherCode && <p role="alert" className="mt-1 text-xs text-red-300">{errors.voucherCode.message}</p>}
                      <p className="mt-2.5 text-xs text-[var(--ash)] py-1">Hệ thống kiểm tra mã khi tạo yêu cầu và chỉ sử dụng lượt khi ký quỹ.</p>
                    </div>
                  </div>
                )}
              </fieldset>


              {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></span>{!terms && <button type="button" onClick={() => void creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError(''); }).catch((cause) => setError(extractErrorMessage(cause, 'Không tải được điều khoản của Creator.')))} className="shrink-0 rounded-lg border border-red-300/30 bg-white/5 px-2.5 py-1 font-semibold text-white hover:bg-white/10">Thử tải lại</button>}</div>}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hair)] pt-5">
                <button type="button" disabled={busy} onClick={() => goToStep(1)} className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-5 py-2.5 text-xs font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)] disabled:opacity-50">
                  ← Quay lại đọc ToS
                </button>
                <button disabled={busy || !selectedPackage || !terms} className="rounded-full bg-[var(--lumen)] px-7 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-[var(--lumen-hi)] disabled:opacity-50">
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
