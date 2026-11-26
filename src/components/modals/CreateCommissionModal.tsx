'use client';

import { addonService, addonAllows, addonStage, addonMoney, type CreatorAddon } from '@/services/addon.service';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { X, AlertCircle, Sparkles, Loader2, Check, RefreshCw, Dice5, UploadCloud, Link2, Plus, FolderOpen, Maximize2 } from 'lucide-react';
import ReferenceLightboxModal from '@/components/modals/ReferenceLightboxModal';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import { commissionService } from '@/services/commission.service';
import { validateReferenceFile, validateReferenceLink, type ReferenceType } from '@/lib/validation/link-validator';
import { creatorRateCardService, getPackageSlotInfo, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { CreatorTermsOverview } from '@/components/terms/CreatorTermsOverview';
import { useLanguage } from '@/context/language-context';
import { CreatorTermsDto } from '@/features/creator-studio/types/creator-profile.types';
import { aiReferenceSketchService } from '@/features/commission/services/ai-reference-sketch.service';
import type { LayoutHintDto, ReferenceSketchGenerationDto, ReferenceSketchImageDto, ReferenceSketchProgressEvent, ReferenceSketchQuotaDto, ReferenceSketchStatus } from '@/features/commission/types/ai-reference-sketch.types';
import { notificationHubUrl } from '@/features/notification/services/notification-hub';
import { extractErrorMessage, ensureFreshAccessToken } from '@/lib/api-client';
import { acquireBodyScrollLock } from '@/lib/body-scroll-lock';

const AI_SKETCH_STAGE_LABELS: Record<string, string> = {
  policy_check: 'Đang kiểm tra yêu cầu…',
  writing_prompt: 'Đang lên phương án bố cục…',
  generating: 'Đang phác thảo…',
  done: 'Hoàn tất',
};
const aiSketchStageLabel = (stage: string | null) => (stage ? AI_SKETCH_STAGE_LABELS[stage] ?? 'Đang xử lý…' : 'Đang xử lý…');

const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tên dự án.').max(200, 'Tên dự án quá dài (tối đa 200 ký tự).'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả chi tiết yêu cầu đặt vẽ.'),
  deadlineAt: z.string().optional(),
  voucherCode: z.string().trim().max(50, 'Mã giảm giá quá dài.').optional(),
});
type Form = z.infer<typeof schema>;

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const field = 'w-full px-4 py-3.5 bg-[#F0E7D8] rounded-xl border border-[#221E1A]/10 text-[#241F1A] text-xs font-semibold focus:outline-none focus:border-[#8C3718] transition-colors';
const label = 'block text-[10px] uppercase font-bold tracking-wider text-[#6E6459]';

export default function CreateCommissionModal({ creatorId, creatorName, onClose, initialPackageId, initialTerms }: { creatorId: string; creatorName: string; onClose: () => void; initialPackageId?: string; initialTerms?: CreatorTermsDto | null }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
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

  // AI phác thảo bố cục reference (AI Reference Sketch) — docs/ai-reference/PLAN.md
  const [layoutHint, setLayoutHint] = useState('');
  const [isFreestyle, setIsFreestyle] = useState(false);
  const [quota, setQuota] = useState<ReferenceSketchQuotaDto | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<ReferenceSketchStatus | null>(null);
  const [genStage, setGenStage] = useState<string | null>(null);
  const [genPercent, setGenPercent] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [genBlockReason, setGenBlockReason] = useState<{ vi: string; en: string } | null>(null);
  const [aiImages, setAiImages] = useState<ReferenceSketchImageDto[]>([]);
  const [aiPreview, setAiPreview] = useState<{ url: string; label: string } | null>(null);
  const [selectedAiImageIds, setSelectedAiImageIds] = useState<string[]>([]);
  const [layoutHints, setLayoutHints] = useState<LayoutHintDto[] | null>(null);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsError, setHintsError] = useState<string | null>(null);
  const generationIdRef = useRef<string | null>(null);
  const lastAiEventAtRef = useRef(0);
  const aiPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    if (referenceItems.length + selectedAiImageIds.length + files.length > 10) {
      setLinkError('Chỉ được đính kèm tối đa 10 tệp/liên kết tham chiếu (kể cả ảnh AI đã chọn) cho một đơn vẽ.');
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

    if (referenceItems.length + selectedAiImageIds.length >= 10) {
      setLinkError('Chỉ được đính kèm tối đa 10 tệp/liên kết tham chiếu (kể cả ảnh AI đã chọn).');
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

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', deadlineAt: '', voucherCode: '' },
  });
  const selectedPackage = packages.find(item => item.id === selectedPackageId);
  const multiplier = licenseType === 'Commercial' ? terms?.commercialLicenseMultiplier ?? 1.5 : 1;
  const [addons, setAddons] = useState<CreatorAddon[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const availableAddons = addons.filter(a => a.isActive && (!a.packageId || a.packageId === selectedPackageId) && selectedPackage?.milestones.some(m => addonAllows(a.allowedMilestone, addonStage(m.sequence, selectedPackage.milestones.length))));
  const selectedAddons = availableAddons.filter(a => addonIds.includes(a.id));
  // Giảm giá AI phác thảo (docs/ai-reference/PLAN.md T12) — chỉ áp dụng khi không freestyle và đã
  // chọn ≥1 ảnh AI, khớp đúng điều kiện server dùng ở CommissionService.CreateCommissionAsync.
  // Addon KHÔNG bị giảm (cộng sau, giống cách server xử lý) nên không nhân aiDiscountFactor vào đó.
  const aiDiscountApplies = !isFreestyle && selectedAiImageIds.length > 0 && (quota?.discountPercent ?? 0) > 0;
  const aiDiscountFactor = aiDiscountApplies ? 1 - (quota!.discountPercent / 100) : 1;
  const estimatedTotal = (selectedPackage?.price ?? 0) * multiplier * aiDiscountFactor + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const milestoneEstimate = (stage: RateCardPackage['milestones'][number]) => stage.price * multiplier * aiDiscountFactor + selectedAddons
    .filter(addon => selectedPackage?.milestones.find(m => addonAllows(addon.allowedMilestone, addonStage(m.sequence, selectedPackage.milestones.length)))?.sequence === stage.sequence)
    .reduce((sum, addon) => sum + addon.price, 0);

  const refreshAiQuota = () => {
    aiReferenceSketchService.getQuota(creatorId)
      .then((data) => { setQuota(data); setQuotaError(null); })
      .catch((cause) => setQuotaError(cause instanceof Error ? cause.message : 'Không tải được lượt AI phác thảo bố cục.'));
  };

  useEffect(() => {
    addonService.creator(creatorId).then(items => { setAddons(items); setAddonIds([]); }).catch(() => setError('Không tải được phụ phí của họa sĩ.'));
    creatorRateCardService.get(creatorId).then(setPackages)
      .catch(() => setError('Không tải được bảng giá họa sĩ.'))
      .finally(() => setLoadingPackages(false));
    creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError((prev) => prev.includes('điều khoản') ? '' : prev); })
      .catch((cause) => setError(extractErrorMessage(cause, 'Không tải được điều khoản của họa sĩ.')));
    refreshAiQuota();
  }, [creatorId]);

  useEffect(() => { generationIdRef.current = generationId; }, [generationId]);

  const stopAiPolling = () => {
    if (aiPollRef.current) { clearInterval(aiPollRef.current); aiPollRef.current = null; }
  };

  const mergeAiImages = (prev: ReferenceSketchImageDto[], incoming: ReferenceSketchImageDto[]) => {
    const byId = new Map(prev.map((img) => [img.id, img]));
    for (const img of incoming) byId.set(img.id, img);
    return Array.from(byId.values());
  };

  const applyAiProgress = (
    status: ReferenceSketchStatus,
    stage: string | null,
    percent: number,
    images: ReferenceSketchImageDto[] | null,
    error: string | null,
    blockReasonVi: string | null,
    blockReasonEn: string | null,
  ) => {
    setGenStatus(status);
    setGenStage(stage);
    setGenPercent(percent);
    if (status === 'Blocked') {
      setGenBlockReason({ vi: blockReasonVi || '', en: blockReasonEn || '' });
      stopAiPolling();
    } else if (status === 'Failed') {
      setGenError(error || 'Không sinh được ảnh phác thảo. Vui lòng thử lại.');
      stopAiPolling();
    } else if (status === 'Succeeded') {
      if (images) setAiImages((prev) => mergeAiImages(prev, images));
      stopAiPolling();
      refreshAiQuota();
    }
  };

  const startAiPolling = (id: string) => {
    stopAiPolling();
    aiPollRef.current = setInterval(() => {
      if (Date.now() - lastAiEventAtRef.current < 5000) return;
      aiReferenceSketchService.getGeneration(id)
        .then((dto: ReferenceSketchGenerationDto) => {
          lastAiEventAtRef.current = Date.now();
          applyAiProgress(dto.status, null, dto.percent, dto.images, dto.error, dto.blockReasonVi, dto.blockReasonEn);
        })
        .catch(() => undefined);
    }, 3000);
  };

  useEffect(() => {
    const hubUrl = notificationHubUrl();
    if (!hubUrl) return;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => ensureFreshAccessToken() })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('AiReferenceSketchProgress', (evt: ReferenceSketchProgressEvent) => {
      if (evt.generationId !== generationIdRef.current) return;
      lastAiEventAtRef.current = Date.now();
      const status: ReferenceSketchStatus = evt.stage === 'blocked' ? 'Blocked' : evt.stage === 'failed' ? 'Failed' : evt.stage === 'done' ? 'Succeeded' : 'Running';
      applyAiProgress(status, evt.stage, evt.percent, evt.images, evt.error, evt.blockReasonVi, evt.blockReasonEn);
    });

    const startPromise = connection.start().then(() => connection.invoke('Subscribe')).catch(() => undefined);

    return () => {
      void startPromise.finally(() => connection.stop().catch(() => undefined));
      stopAiPolling();
    };
  }, []);

  // Escape while the AI sketch preview is open only closes the preview, not the whole form.
  const closeDialog = useEffectEvent(() => { if (!busy && !aiPreview) onClose(); });
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

  const briefValue = watch('description') ?? '';
  const briefLength = briefValue.trim().length;
  const quotaRemaining = quota ? Math.max(quota.limit - quota.used, 0) : 0;
  const aiGenerationInFlight = genStatus === 'Pending' || genStatus === 'Running';
  const aiDisabledReason: string | null = isFreestyle
    ? null
    : aiGenerationInFlight
      ? 'Đang sinh ảnh, vui lòng đợi hoàn tất.'
      : !quota
        ? (quotaError ?? 'Đang tải thông tin lượt AI phác thảo…')
        : !quota.enabled
          ? 'Họa sĩ chưa cho phép dùng AI phác thảo bố cục cho đơn này.'
          : briefLength < 30
            ? 'Nhập mô tả yêu cầu tối thiểu 30 ký tự để dùng AI phác thảo.'
            : quotaRemaining <= 0
              ? 'Đã dùng hết lượt AI phác thảo trong 24 giờ. Vui lòng thử lại sau.'
              : null;
  const canUseAi = !aiDisabledReason;

  // Nút "🎲 Gợi ý bố cục độc đáo" — điều kiện bật giống nút ✨ nhưng KHÔNG tính lượt sinh ảnh
  // (3 lượt/24h chỉ tính cho sinh ảnh), nên không gate theo quotaRemaining/aiGenerationInFlight.
  const hintsDisabledReason: string | null = isFreestyle
    ? null
    : !quota
      ? (quotaError ?? 'Đang tải thông tin lượt AI phác thảo…')
      : !quota.enabled
        ? 'Họa sĩ chưa cho phép dùng AI phác thảo bố cục cho đơn này.'
        : briefLength < 30
          ? 'Nhập mô tả yêu cầu tối thiểu 30 ký tự để dùng gợi ý bố cục.'
          : null;
  const canUseHints = !hintsDisabledReason;

  const handleSuggestLayoutHints = async () => {
    if (!canUseHints || hintsLoading) return;
    setHintsLoading(true);
    setHintsError(null);
    try {
      const { hints } = await aiReferenceSketchService.suggestLayoutHints({
        creatorProfileId: creatorId,
        brief: briefValue.trim(),
        currentHint: layoutHint.trim() || undefined,
      });
      setLayoutHints(hints);
    } catch (err) {
      setHintsError(err instanceof Error ? err.message : 'Không tạo được gợi ý bố cục.');
    } finally {
      setHintsLoading(false);
    }
  };

  const handleStartAiGeneration = async () => {
    if (!canUseAi || starting) return;
    setStarting(true);
    setGenError(null);
    setGenBlockReason(null);
    try {
      const { generationId: newId } = await aiReferenceSketchService.startGeneration({
        creatorProfileId: creatorId,
        brief: briefValue.trim(),
        layoutHint: layoutHint.trim() || undefined,
      });
      generationIdRef.current = newId;
      lastAiEventAtRef.current = Date.now();
      setGenerationId(newId);
      setGenStatus('Pending');
      setGenStage('policy_check');
      setGenPercent(0);
      startAiPolling(newId);
    } catch (cause) {
      setGenError(cause instanceof Error ? cause.message : 'Không khởi tạo được lượt sinh ảnh phác thảo.');
    } finally {
      setStarting(false);
    }
  };

  const handleFreestyleToggle = (checked: boolean) => {
    setIsFreestyle(checked);
    if (checked) {
      setSelectedAiImageIds([]);
      setLayoutHints(null);
      setHintsError(null);
    }
  };

  const toggleAiImage = (id: string) => {
    setSelectedAiImageIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (referenceItems.length + prev.length >= 10) {
        setLinkError('Tổng ảnh tham khảo (tải lên + AI) tối đa 10 mục.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAiBriefHelper = async (random: boolean = false) => {
    const currentTitle = getValues('title');
    const currentDesc = getValues('description');
    if (!currentTitle?.trim() && !currentDesc?.trim()) {
      setError('Vui lòng nhập ít nhất tên dự án hoặc vài từ khóa ý tưởng để AI gợi ý đề bài.');
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
      setError(extractErrorMessage(cause, 'Không thể gọi AI hỗ trợ đề bài lúc này.'));
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
      setPackageError('Vui lòng chọn 1 gói vẽ trong bảng giá của họa sĩ.');
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
        aiReferenceImageIds: isFreestyle ? undefined : selectedAiImageIds,
        isFreestyle,
        layoutHint: layoutHint.trim() || undefined,
      });
      onClose();
      router.push(`/client/requests/${created.id}`);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không tạo được đơn đặt vẽ. Vui lòng kiểm tra lại thông tin.'));
    }
    finally { setBusy(false); }
  };

  return (
    <div className="overlay-scrim" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="commission-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#221E1A]/10 bg-[#FFFCF6] shadow-2xl shadow-black/30">
        <header className="border-b border-[#221E1A]/10 bg-[#F7F2E9]/70 px-5 py-4 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B24A26]">COMMISSION REQUEST · {isVie ? 'BƯỚC' : 'STEP'} {step} / 2</p>
              <h2 id="commission-modal-title" className="mt-1 font-h1 text-xl font-bold text-[#241F1A]">{isVie ? `Đặt vẽ với ${creatorName}` : `Commission Request for ${creatorName}`}</h2>
              <p className="mt-1 text-xs text-[#6E6459]">
                {isVie
                  ? 'Creator xác nhận trước; Client ký quỹ sau khi thống nhất giá.'
                  : 'Creator confirms first; client funds escrow after agreeing on the price.'}
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label={isVie ? 'Đóng biểu mẫu' : 'Close commission form'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:text-[#241F1A] disabled:opacity-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition ${step === 1 ? "border-[#B24A26] bg-[#B24A26]/15 text-[#241F1A]" : "border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#FFFCF6]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-[#B24A26] text-[#F7F2E9]" : "bg-[#2F6B63]/20 text-[#2F6B63]"}`}>{acceptedCreatorTerms ? "✓" : "1"}</span>
              <span className="truncate">{isVie ? '1. Đọc điều khoản (ToS)' : '1. Read Terms of Service'}</span>
            </button>
            <button
              type="button"
              disabled={!terms || !acceptedCreatorTerms}
              onClick={() => goToStep(2)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${step === 2 ? "border-[#B24A26] bg-[#B24A26]/15 text-[#241F1A]" : "border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#FFFCF6]"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-[#B24A26] text-[#F7F2E9]" : "bg-[#F0E7D8] text-[#746A5F]"}`}>2</span>
              <span className="truncate">{isVie ? '2. Chọn gói vẽ & gửi yêu cầu' : '2. Select Package & Send Request'}</span>
            </button>
          </div>
        </header>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          {step === 1 ? (
            <div className="space-y-5">
              {terms ? (
                <CreatorTermsOverview terms={terms} creatorName={creatorName} />
              ) : error ? (
                <div role="alert" className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-3 text-xs text-[#A8321C] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></span>
                  <button type="button" onClick={() => void creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError(""); }).catch((cause) => setError(extractErrorMessage(cause, "Không tải được điều khoản của họa sĩ.")))} className="shrink-0 rounded-lg border border-[#A8321C]/40 bg-[#FFFCF6] px-2.5 py-1 font-semibold text-[#241F1A] hover:bg-[#F0E7D8]">Thử tải lại</button>
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-[#746A5F]">{isVie ? 'Đang tải điều khoản dịch vụ của họa sĩ…' : "Loading the creator's Terms of Service…"}</p>
              )}

              <div className="space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#6E6459]">
                  <input
                    type="checkbox"
                    checked={acceptedCreatorTerms}
                    disabled={!terms || busy}
                    onChange={(e) => { setAcceptedCreatorTerms(e.target.checked); if (e.target.checked) setTermsError(null); }}
                    className="mt-0.5 size-4 accent-[#B24A26]"
                  />
                  <span>
                    {isVie ? 'Tôi đã đọc, hiểu và đồng ý với phạm vi nhận vẽ, bản quyền sử dụng và các điều khoản riêng trong Điều khoản dịch vụ (ToS) của ' : 'I have read, understood, and agree to the scope, usage rights, and custom Terms of Service (ToS) of '}
                    <strong>{creatorName}</strong>.
                  </span>
                </label>
                {termsError && <p role="alert" className="text-xs font-medium text-[#A8321C]">{termsError}</p>}
              </div>

              <div className="flex justify-end border-t border-[#221E1A]/10 pt-5">
                <button
                  type="button"
                  disabled={!terms}
                  onClick={() => {
                    if (!acceptedCreatorTerms) {
                      setTermsError(isVie ? "Vui lòng xác nhận đã đọc và đồng ý với Điều khoản dịch vụ (ToS) của họa sĩ trước khi tiếp tục." : "Please confirm you have read and agreed to the creator's Terms of Service (ToS) before continuing.");
                      return;
                    }
                    goToStep(2);
                  }}
                  className="rounded-xl bg-[#B24A26] px-7 py-3 text-xs font-extrabold text-[#F7F2E9] shadow-lg transition hover:bg-[#8C3718] disabled:opacity-45"
                >
                  {isVie ? 'Tiếp tục chọn gói vẽ →' : 'Continue to Select Package →'}
                </button>
              </div>
            </div>
          ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2F6B63]/30 bg-[#2F6B63]/12/[0.06] px-3.5 py-2.5 text-xs">
            <span className="text-[#2F6B63]">✓ {isVie ? 'Đã đọc & đồng ý ToS của' : 'Read & agreed to the ToS of'} <strong>{creatorName}</strong> (v{terms?.extended?.version ?? 1})</span>
            <button type="button" onClick={() => goToStep(1)} className="shrink-0 font-semibold text-[#8C3718] underline-offset-4 hover:underline">{isVie ? 'Xem lại ToS' : 'Review ToS'}</button>
          </div>
          <div className="space-y-2">
            <label className={label} htmlFor="commission-title">{isVie ? 'TÊN DỰ ÁN' : 'PROJECT NAME'}</label>
            <input id="commission-title" className={`${field} ${errors.title ? 'border-[#A8321C]/40' : ''}`} placeholder={isVie ? 'Ví dụ: Minh họa nhân vật Game' : 'e.g. Game character illustration'} {...register('title')} />
            {errors.title && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-[#A8321C]"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className={label} htmlFor="commission-deadline">{isVie ? 'HẠN DỰ KIẾN (DELIVERY TARGET)' : 'ESTIMATED DELIVERY DATE'}</label>
            <input id="commission-deadline" type="date" className={field} {...register('deadlineAt')} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className={label} htmlFor="commission-brief">{isVie ? 'MÔ TẢ YÊU CẦU CHI TIẾT' : 'DETAILED PROJECT DESCRIPTION'} <span className="text-[#A8321C]">*</span></label>
              <button
                type="button"
                disabled={aiBriefing}
                onClick={() => handleAiBriefHelper(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 text-brand-periwinkle px-3 py-1 text-[11px] font-bold transition-all hover:border-brand-periwinkle/60 shadow-sm shadow-brand-periwinkle/5 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Gợi ý đề bài chuẩn họa sĩ từ ý tưởng thô"
              >
                {aiBriefing && !isRandomIdea ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-periwinkle" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-brand-periwinkle" />
                )}
                <span>AI Brief Helper</span>
              </button>
            </div>
            <textarea id="commission-brief" rows={4} className={`${field} ${errors.description ? 'border-[#A8321C]/40' : ''}`} placeholder="Mô tả chi tiết phong cách, màu sắc, kích thước và yêu cầu nhân vật…" {...register('description')} />
            {errors.description && <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-[#A8321C]"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description.message}</p>}

            {aiSuggestion && (
              <div className="mt-3 rounded-2xl border border-brand-periwinkle/25 bg-[#FFFCF6]/95 backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/40 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-periwinkle/15 border border-brand-periwinkle/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-brand-periwinkle" />
                    </div>
                    <span className="text-xs font-bold text-[#241F1A] tracking-wide"> Gợi ý đề bài từ AI </span>
                    {isRandomIdea && (
                      <span className="rounded-full bg-brand-periwinkle/15 px-2 py-0.5 text-[10px] font-medium text-brand-periwinkle border border-brand-periwinkle/25"> Ý tưởng ngẫu nhiên </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="w-6 h-6 rounded-full bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] flex items-center justify-center text-xs transition-colors"
                    title="Đóng xem trước"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#E5D8C2] p-3.5 font-body text-xs leading-relaxed text-[#241F1A] border border-[#221E1A]/10 selection:bg-brand-periwinkle/30">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-periwinkle hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-[#FFFCF6] shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Áp dụng gợi ý này</span>
                  </button>

                  <button
                    type="button"
                    disabled={aiBriefing}
                    onClick={() => handleAiBriefHelper(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] hover:border-[#221E1A]/20 px-3 py-1.5 text-xs font-semibold text-[#6E6459] hover:text-[#241F1A] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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

          {/* TÀI LIỆU & HÌNH ẢNH THAM KHẢO (REFERENCE / REF) */}
          <div className="space-y-3 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className={label}>{isVie ? 'ẢNH / TÀI LIỆU THAM KHẢO' : 'REFERENCE IMAGES / MATERIALS'}</label>
                <p className="mt-0.5 text-[11px] text-[#6E6459]"> {isVie ? 'Đính kèm ảnh mẫu hoặc liên kết tham khảo cho họa sĩ.' : 'Attach sample images or reference links for the creator.'} </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[10px] font-mono font-bold text-[#746A5F]">
                {referenceItems.length + selectedAiImageIds.length}/10 {isVie ? 'tệp' : 'files'}
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
                  disabled={busy || isUploadingFile || referenceItems.length + selectedAiImageIds.length >= 10}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#221E1A]/20 bg-[#FFFCF6] px-4 py-3 text-xs font-semibold text-[#6E6459] transition hover:border-[#B24A26] hover:bg-[#B24A26]/10 disabled:opacity-45"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#B24A26]" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-[#B24A26]" />
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
                    className="w-full rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] px-3.5 py-3 text-xs text-[#241F1A] placeholder:text-[#746A5F] focus:border-[#8C3718] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !linkInput.trim() || referenceItems.length + selectedAiImageIds.length >= 10}
                  onClick={handleAddLink}
                  title="Thêm liên kết"
                  className="shrink-0 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 py-3 text-xs font-bold text-[#241F1A] transition hover:bg-[#F0E7D8] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {linkError && (
              <p role="alert" className="flex items-center gap-1.5 text-xs text-[#A8321C]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {linkError}
              </p>
            )}

            {/* Danh sách tệp/link đã thêm */}
            {referenceItems.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                {referenceItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-2 pr-7 text-xs transition hover:border-[#221E1A]/20"
                  >
                    {item.type === 'image' && item.url ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F0E7D8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFFCF6] text-[#B24A26]">
                        {item.type === 'drive' ? <FolderOpen className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-[#241F1A]">{item.name}</p>
                      <p className="text-[10px] text-[#746A5F]">
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
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#746A5F] transition hover:bg-[#A8321C]/20 hover:text-[#A8321C]"
                      title="Xóa tệp tham khảo này"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI PHÁC THẢO BỐ CỤC REFERENCE (AI REFERENCE SKETCH) */}
          <div className="space-y-3 rounded-2xl border border-brand-periwinkle/25 bg-[#FFFCF6] p-4">
            <div>
              <label className={label}>AI PHÁC THẢO BỐ CỤC (KHÔNG BẮT BUỘC)</label>
              <p className="mt-0.5 text-[11px] text-[#6E6459]">AI gợi ý 2 phương án dáng · góc máy · bố cục từ mô tả yêu cầu — chỉ để tham khảo, không phải ảnh hoàn chỉnh.</p>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/40 p-3 text-xs cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={isFreestyle} onChange={(e) => handleFreestyleToggle(e.target.checked)} />
              <span>
                <strong className="text-[#241F1A]">Để creator tự freestyle</strong>
                <span className="block text-[11px] text-[#6E6459]">Creator tự quyết định dáng/bố cục, không cần ảnh AI phác thảo.</span>
              </span>
            </label>

            {!isFreestyle && (
              <>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className={label} htmlFor="commission-layout-hint">GỢI Ý BỐ CỤC (KHÔNG BẮT BUỘC, TỐI ĐA 300 KÝ TỰ)</label>
                    <button
                      type="button"
                      disabled={!canUseHints || hintsLoading}
                      onClick={() => void handleSuggestLayoutHints()}
                      title={hintsDisabledReason ?? 'Sinh 3 gợi ý bố cục độc đáo bằng AI'}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-periwinkle/30 bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 px-2 py-1 text-[11px] font-semibold text-brand-periwinkle transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {hintsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>🎲</span>}
                      <span>Gợi ý bố cục độc đáo</span>
                    </button>
                  </div>
                  <textarea
                    id="commission-layout-hint"
                    rows={2}
                    maxLength={300}
                    value={layoutHint}
                    onChange={(e) => setLayoutHint(e.target.value)}
                    placeholder="VD: nhân vật đứng nghiêng 3/4, cận mặt, phông nền đơn giản…"
                    className={field}
                  />
                  <p className="mt-1 text-right text-[10px] text-[#746A5F]">{layoutHint.length}/300</p>

                  {hintsError && (
                    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#A8321C]"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {hintsError}</p>
                  )}

                  {layoutHints && layoutHints.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-3">
                        {layoutHints.map((hint, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLayoutHint(hint.textVi.slice(0, 300))}
                            title="Dùng gợi ý này cho ô Gợi ý bố cục"
                            className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/40 hover:border-brand-periwinkle/40 hover:bg-brand-periwinkle/10 p-2.5 text-left transition-all active:scale-95 cursor-pointer"
                          >
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-brand-periwinkle">{hint.technique}</span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-[#241F1A]">{hint.textVi}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={!canUseHints || hintsLoading}
                        onClick={() => void handleSuggestLayoutHints()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] hover:border-[#221E1A]/20 px-3 py-1.5 text-xs font-semibold text-[#6E6459] hover:text-[#241F1A] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {hintsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Gợi ý khác</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!canUseAi || starting}
                    onClick={() => void handleStartAiGeneration()}
                    title={aiDisabledReason ?? 'Sinh 2 phương án phác thảo bố cục bằng AI'}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-periwinkle hover:brightness-110 px-4 py-2.5 text-xs font-bold text-[#FFFCF6] shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {starting || aiGenerationInFlight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✨</span>}
                    <span>AI phác thảo bố cục</span>
                  </button>
                  <span className="text-[11px] font-semibold text-[#6E6459]">
                    {quota ? `Còn ${quotaRemaining}/${quota.limit} lượt` : 'Đang tải lượt…'}
                  </span>
                  {aiDisabledReason && <span className="text-[11px] text-[#A8321C]">{aiDisabledReason}</span>}
                </div>

                {quota && quota.discountPercent > 0 && (
                  <p className="text-[11px] font-semibold text-[#2F6B63]">
                    Gắn ảnh AI phác thảo làm reference được giảm {quota.discountPercent}% giá đơn.
                  </p>
                )}

                {aiGenerationInFlight && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[0, 1].map((idx) => (
                      <div key={idx} className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/40 p-3">
                        <div className="h-24 animate-pulse rounded-lg bg-[#221E1A]/10" />
                        <p className="mt-2 text-[11px] font-semibold text-[#6E6459]">{aiSketchStageLabel(genStage)}</p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#221E1A]/10">
                          <div className="h-full bg-brand-periwinkle transition-all" style={{ width: `${genPercent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {genStatus === 'Blocked' && genBlockReason && (
                  <p role="alert" className="flex items-center gap-1.5 rounded-xl border border-[#A8321C]/30 bg-[#A8321C]/10 px-3 py-2 text-xs text-[#A8321C]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {genBlockReason.vi || genBlockReason.en}
                  </p>
                )}

                {genStatus === 'Failed' && genError && (
                  <p role="alert" className="flex items-center gap-1.5 rounded-xl border border-[#A8321C]/30 bg-[#A8321C]/10 px-3 py-2 text-xs text-[#A8321C]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {genError}
                  </p>
                )}

                {aiImages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className={label}>ẢNH AI ĐÃ SINH — CHỌN ĐỂ DÙNG LÀM REFERENCE</label>
                      <span className="shrink-0 text-[10px] font-mono font-bold text-[#746A5F]">{selectedAiImageIds.length} đã chọn</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {aiImages.map((img) => {
                        const selected = selectedAiImageIds.includes(img.id);
                        return (
                          <div key={img.id} className="relative">
                            <button
                              type="button"
                              onClick={() => toggleAiImage(img.id)}
                              aria-pressed={selected}
                              className={`group relative w-full overflow-hidden rounded-xl border p-1 text-left transition cursor-pointer ${selected ? 'border-brand-periwinkle ring-2 ring-brand-periwinkle/40' : 'border-[#221E1A]/10 hover:border-[#221E1A]/25'}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.labelVi}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="h-24 w-full rounded-lg object-cover"
                              />
                              <span className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-brand-periwinkle bg-brand-periwinkle text-[#FFFCF6]' : 'border-[#221E1A]/20 bg-[#FFFCF6]/90 text-transparent'}`}>
                                <Check className="h-3 w-3" />
                              </span>
                              <p className="mt-1 truncate px-1 text-[10px] font-semibold text-[#241F1A]">{img.labelVi}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiPreview({ url: img.url, label: img.labelVi })}
                              aria-label={`Xem ảnh lớn: ${img.labelVi}`}
                              title="Xem ảnh lớn"
                              className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-[#221E1A]/15 bg-[#FFFCF6]/90 text-[#241F1A] shadow-sm transition hover:bg-[#FFFCF6]"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <fieldset className="space-y-3 border-t border-[#221E1A]/10 pt-5">
            <legend className="font-h1 text-sm font-bold text-[#241F1A]">BẢNG GIÁ DỊCH VỤ CREATOR (RATE CARD)</legend>
            <p className="text-xs text-[#6E6459]">Chọn gói vẽ do họa sĩ cấu hình. Giá và các mốc thanh toán do họa sĩ quyết định.</p>
            {loadingPackages ? (
              <p className="text-xs text-[#746A5F]">Đang tải bảng giá…</p>
            ) : packages.length === 0 ? (
              <p className="text-xs text-[#8A6A1F]">Họa sĩ chưa cấu hình bảng giá nên chưa thể nhận yêu cầu mới.</p>
            ) : (
              packages.map(item => {
                const slot = getPackageSlotInfo(item);
                return (
                  <label key={item.id} className={`block rounded-xl border p-4 text-xs ${slot.isFull ? 'cursor-not-allowed opacity-55 border-[#221E1A]/10 bg-[#FFFCF6]' : selectedPackageId === item.id ? 'cursor-pointer border-[#B24A26] bg-[#B24A26]/10' : 'cursor-pointer border-[#221E1A]/10 bg-[#FFFCF6]'}`}>
                    <span className="flex flex-wrap items-center gap-2.5">
                      <input type="radio" name="rate-package" disabled={slot.isFull} checked={selectedPackageId === item.id && !slot.isFull} onChange={() => { setSelectedPackageId(item.id); if (packageError) setPackageError(null); }} />
                      <strong className="text-[#241F1A]">{item.name}</strong>
                      {item.categoryName && (
                        <span className="rounded-md border border-[#B24A26]/30 bg-[#B24A26]/15 px-2 py-0.5 text-[10px] font-semibold text-[#8C3718]">
                          {item.categoryName}
                        </span>
                      )}
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                        !slot.isLimited
                          ? 'border-[#2C6A86]/35 bg-[#2C6A86]/10 text-[#2C6A86]'
                          : slot.isFull
                            ? 'border-[#A8321C]/40 bg-[#A8321C]/10 text-[#A8321C]'
                            : 'border-[#2F6B63]/35 bg-[#2F6B63]/10 text-[#2F6B63]'
                      }`}>
                        {slot.isLimited ? slot.label : '∞ Không giới hạn'}
                      </span>
                      <span className="ml-auto font-bold text-[#8C3718]">{money(item.price)}</span>
                    </span>
                    {item.description && <span className="mt-2 block text-[#746A5F] whitespace-pre-line">{item.description}</span>}
                    {(item.milestones?.length ?? 0) > 0 && (
                      <ul className="mt-2.5 space-y-1 rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-2.5 text-[11px]">
                        {[...item.milestones].sort((a, b) => a.sequence - b.sequence).map((m) => (
                          <li key={m.sequence} className="flex items-center justify-between gap-2 text-[#746A5F]">
                            <span><strong className="text-[#241F1A]">Mốc #{m.sequence}:</strong> {m.title}</span>
                            <span className="shrink-0 text-[#746A5F]">
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

            {packageError && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#A8321C] font-medium"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {packageError}</p>}

            {selectedPackage && <div className="space-y-3 border-t border-[#221E1A]/10 pt-5">
              <h3 className="font-h1 text-sm font-bold text-[#241F1A]">PHỤ PHÍ TÙY CHỌN</h3>
              <p className="text-xs text-[#B24A26]">Phụ phí được ký quỹ cùng đơn hàng và thực hiện tại mốc đã ghi.</p>
              {availableAddons.map(a => <label key={a.id} className="flex items-center gap-3 text-xs text-[#241F1A]"><input type="checkbox" checked={addonIds.includes(a.id)} disabled={busy} onChange={e => setAddonIds(ids => e.target.checked ? [...ids, a.id] : ids.filter(id => id !== a.id))} />{a.title} · {a.allowedMilestone} · +{addonMoney(a.price)} · +{a.extendDays} ngày</label>)}
            </div>}
            <div className="space-y-3 border-t border-[#221E1A]/10 pt-5">
              <h3 className="font-h1 text-sm font-bold text-[#241F1A]">MỤC ĐÍCH SỬ DỤNG</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['Personal', 'Commercial'] as const).map(value => (
                  <label key={value} className={`cursor-pointer rounded-xl border p-4 text-xs ${licenseType === value ? 'border-[#B24A26] bg-[#B24A26]/10' : 'border-[#221E1A]/10 bg-[#FFFCF6]'}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="license-type" checked={licenseType === value} onChange={() => setLicenseType(value)} />
                      <strong className="text-[#241F1A]">{value === 'Personal' ? 'Cá nhân' : 'Thương mại'}</strong>
                    </span>
                    <span className="mt-2 block text-[#746A5F]">{value === 'Personal' ? 'Không sử dụng để kinh doanh.' : `Áp dụng hệ số ${terms?.commercialLicenseMultiplier ?? 1.5}×.`}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedPackage && (
              <>
                <div className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-4">
                  <h3 className="text-xs font-bold text-[#241F1A]">{isVie ? 'Kế hoạch các mốc vẽ (Milestone plan)' : 'Artwork milestone plan'}</h3>
                  <ol className="mt-3 space-y-2">
                    {selectedPackage.milestones.map(stage => (
                      <li key={stage.sequence} className="flex justify-between gap-3 text-xs text-[#746A5F]">
                        <span>{stage.sequence}. {stage.title}<span className="ml-2 text-[#746A5F]">· {stage.maxRevisions ?? 3} {isVie ? 'lần sửa' : 'revisions'}</span></span>
                        <span>{money(milestoneEstimate(stage))}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-[#6E6459]">{isVie ? 'Tệp gốc HD được bàn giao sau khi duyệt xong tất cả các bản phác thảo.' : 'HD original files are delivered after all sketches are approved.'}</p>
                  <div className="mt-4 space-y-1 border-t border-[#221E1A]/10 pt-3 text-xs">
                    <p className="flex justify-between text-[#746A5F]"><span>{isVie ? 'Giá gói' : 'Package price'}</span><span>{money(selectedPackage.price)}</span></p>
                    <p className="flex justify-between text-[#746A5F]"><span>{isVie ? 'Hệ số bản quyền' : 'License multiplier'}</span><span>× {multiplier}</span></p>
                    {aiDiscountApplies && (
                      <p className="flex justify-between text-[#2F6B63]"><span>Giảm giá ảnh AI phác thảo</span><span>-{quota!.discountPercent}%</span></p>
                    )}
                    <p className="flex justify-between font-bold text-[#241F1A]"><span>{isVie ? 'Tổng dự kiến' : 'Estimated total'}</span><span>{money(estimatedTotal)}</span></p>
                    {estimatedTotal >= 2_000_000 && <p className="pt-1 text-[11px] text-[#B24A26]">{isVie ? `Đơn từ 2.000.000đ chỉ cần ký quỹ trước Mốc #1 (${money(milestoneEstimate(selectedPackage.milestones[0]))}) khi bắt đầu.` : `Orders from 2,000,000đ only require milestone #1 escrow (${money(milestoneEstimate(selectedPackage.milestones[0]))}) up front.`}</p>}
                  </div>
                </div>

                <div className="pt-2">
                  <label className={label} htmlFor="commission-voucher">{isVie ? 'MÃ GIẢM GIÁ (KHÔNG BẮT BUỘC)' : 'VOUCHER CODE (OPTIONAL)'}</label>
                  <input id="commission-voucher" className={field} placeholder={isVie ? 'Nhập mã giảm giá' : 'Enter voucher code'} {...register('voucherCode')} />
                  {errors.voucherCode && <p role="alert" className="text-xs text-[#A8321C]">{errors.voucherCode.message}</p>}
                  <p className="mt-2 text-xs text-[#746A5F]">{isVie ? 'Hệ thống kiểm tra mã khi tạo yêu cầu và chỉ sử dụng lượt khi ký quỹ.' : 'The code is validated when the request is created and only redeemed on escrow funding.'}</p>
                </div>
              </>
            )}
          </fieldset>


          {error && <div role="alert" className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-3 text-xs text-[#A8321C] flex items-center justify-between gap-2"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></span>{!terms && <button type="button" onClick={() => void creatorProfileService.getTerms(creatorId).then((data) => { setTerms(data); setError(''); }).catch((cause) => setError(extractErrorMessage(cause, 'Không tải được điều khoản của họa sĩ.')))} className="shrink-0 rounded-lg border border-[#A8321C]/40 bg-[#FFFCF6] px-2.5 py-1 font-semibold text-[#241F1A] hover:bg-[#F0E7D8]">Thử tải lại</button>}</div>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#221E1A]/10 pt-5">
            <button type="button" disabled={busy} onClick={() => goToStep(1)} className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-3 text-xs font-semibold text-[#6E6459] transition hover:bg-[#F0E7D8] disabled:opacity-50">
              {isVie ? '← Quay lại đọc ToS' : '← Back to Terms of Service'}
            </button>
            <button disabled={busy || !selectedPackage || !terms} className="rounded-xl bg-[#F0E7D8] px-8 py-3.5 text-xs font-extrabold text-[#FFFCF6] shadow-xl transition-all hover:bg-[#8C3718] disabled:opacity-50">
              {busy ? (isVie ? "Đang gửi…" : "Sending…") : (isVie ? "Gửi yêu cầu đặt vẽ" : "Send commission request")}
            </button>
          </div>
        </form>
          )}
        </div>
      </div>
      <ReferenceLightboxModal
        url={aiPreview?.url ?? null}
        title={aiPreview ? `AI phác thảo · ${aiPreview.label}` : undefined}
        allowDownload={false}
        elevated
        onClose={() => setAiPreview(null)}
      />
    </div>
  );
}
