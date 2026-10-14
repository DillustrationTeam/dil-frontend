'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCloudinaryUpload } from '@/features/creator-studio/hooks/use-cloudinary-upload';
import { creatorApplicationService } from '@/features/creator-studio/services/creator-application.service';
import type { SubmitCreatorApplicationRequest } from '@/features/creator-studio/types/creator-application.types';
import { splitPortfolioLinks } from '@/lib/portfolio-link';

type WizardValues = SubmitCreatorApplicationRequest & { portfolioUploads: string[] };

const defaults: WizardValues = {
  idProofUrl: '',
  idProofBackUrl: '',
  portfolioLinks: [''],
  portfolioUploads: [],
  primaryStyle: '',
  speedpaintVideoUrls: [''],
};
const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]';
const styleSuggestions = ['Anime / Manga', 'Chibi', 'Semi-realistic', 'Realistic / Portrait', 'Concept Art', 'Character Design', 'Fantasy Art', 'Pixel Art', 'Watercolor'];

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function CreatorApplicationWizard({
  mode = 'create',
  initialValues,
  onDone,
}: {
  mode?: 'create' | 'edit';
  initialValues?: Partial<SubmitCreatorApplicationRequest>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const initialPortfolio = initialValues?.portfolioLinks ? splitPortfolioLinks(initialValues.portfolioLinks) : null;
  const [values, setValues] = useState<WizardValues>(() => ({
    ...defaults,
    ...initialValues,
    portfolioLinks: initialPortfolio?.manualLinks.length ? initialPortfolio.manualLinks : [''],
    portfolioUploads: initialPortfolio?.uploadedImages ?? [],
    speedpaintVideoUrls: initialValues?.speedpaintVideoUrls?.length ? initialValues.speedpaintVideoUrls : [''],
  }));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const frontUpload = useCloudinaryUpload('creator-applications/id-proof');
  const backUpload = useCloudinaryUpload('creator-applications/id-proof');
  const portfolioUpload = useCloudinaryUpload('creator-applications/portfolio');
  const uploading = frontUpload.isUploading || backUpload.isUploading || portfolioUpload.isUploading;

  const setField = <K extends keyof WizardValues>(key: K, value: WizardValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const uploadImage = async (file: File, side: 'front' | 'back' | 'portfolio') => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận tệp hình ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh tải lên không được vượt quá 10MB.');
      return;
    }
    const hook = side === 'front' ? frontUpload : side === 'back' ? backUpload : portfolioUpload;
    const url = await hook.upload(file);
    if (!url) {
      setError(hook.error ?? 'Không thể tải ảnh lên.');
      return;
    }
    if (side === 'front') setField('idProofUrl', url);
    else if (side === 'back') setField('idProofBackUrl', url);
    else setField('portfolioUploads', [...values.portfolioUploads, url]);
  };

  const validateStep = () => {
    if (step === 0 && (!values.idProofUrl || !values.idProofBackUrl)) {
      setError('Vui lòng tải đủ ảnh mặt trước và mặt sau giấy tờ tùy thân.');
      return false;
    }
    if (step === 1) {
      const links = values.portfolioLinks.map((link) => link.trim()).filter(Boolean);
      if (!links.length && !values.portfolioUploads.length) {
        setError('Vui lòng thêm portfolio link hoặc tải lên ít nhất một sản phẩm mẫu.');
        return false;
      }
      if (links.some((link) => !isWebUrl(link))) {
        setError('Portfolio link không hợp lệ. Dùng địa chỉ bắt đầu bằng http:// hoặc https://.');
        return false;
      }
    }
    if (step === 2) {
      if (!values.primaryStyle.trim()) {
        setError('Vui lòng nhập phong cách vẽ chính.');
        return false;
      }
      const links = values.speedpaintVideoUrls.map((link) => link.trim()).filter(Boolean);
      if (!links.length) {
        setError('Vui lòng cung cấp ít nhất một link speedpaint.');
        return false;
      }
      if (links.some((link) => !isWebUrl(link))) {
        setError('Speedpaint URL không hợp lệ. Dùng địa chỉ bắt đầu bằng http:// hoặc https://.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const submit = async () => {
    if (!validateStep()) return;
    const payload: SubmitCreatorApplicationRequest = {
      idProofUrl: values.idProofUrl,
      idProofBackUrl: values.idProofBackUrl,
      portfolioLinks: [
        ...values.portfolioLinks.map((link) => link.trim()).filter(Boolean),
        ...values.portfolioUploads,
      ],
      primaryStyle: values.primaryStyle.trim(),
      speedpaintVideoUrls: values.speedpaintVideoUrls.map((link) => link.trim()).filter(Boolean),
    };
    setIsSubmitting(true);
    try {
      if (mode === 'edit') {
        await creatorApplicationService.updateApplication(payload);
        toast.success('Đã cập nhật hồ sơ ứng tuyển.');
        onDone?.();
      } else {
        await creatorApplicationService.submitApplication(payload);
        toast.success('Đã gửi hồ sơ ứng tuyển Creator.');
        router.push('/');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi hồ sơ ứng tuyển.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageSlot = (label: string, value: string, side: 'front' | 'back') => (
    <label className="space-y-2 text-xs text-[#C7C5CF]">
      <span>{label}</span>
      <span className="relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5">
        {value ? <><Image src={value} alt={label} fill unoptimized className="object-cover" /><span className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2"><Pencil className="h-4 w-4" /></span></> : <span>{side === 'front' ? frontUpload.isUploading : backUpload.isUploading ? 'Đang tải…' : 'Chọn ảnh'}</span>}
        <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, side); event.target.value = ''; }} />
      </span>
    </label>
  );

  return (
    <section className="glass-container mx-auto w-full max-w-3xl rounded-3xl p-5 sm:p-7">
      <header className="mb-6"><p className="text-xs uppercase tracking-wider text-[#A7ACD9]">{mode === 'edit' ? 'Cập nhật hồ sơ' : 'Ứng tuyển Creator'}</p><h1 className="mt-2 font-h1 text-2xl font-bold text-white">{mode === 'edit' ? 'Bổ sung hồ sơ Creator' : 'Trở thành Creator'}</h1></header>
      <div className="mb-6 flex gap-2 text-xs text-slate-400">{['Danh tính', 'Portfolio', 'Phong cách'].map((label, index) => <button type="button" key={label} onClick={() => index < step && setStep(index)} className={`flex-1 border-b-2 pb-2 text-left ${step === index ? 'border-[#A7ACD9] text-white' : index < step ? 'border-[#A7ACD9]/40' : 'border-white/10'}`}>{index + 1}. {label}</button>)}</div>
      <div className="space-y-5">
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">{imageSlot('Mặt trước giấy tờ tùy thân', values.idProofUrl, 'front')}{imageSlot('Mặt sau giấy tờ tùy thân', values.idProofBackUrl, 'back')}</div>}
        {step === 1 && <div className="space-y-4"><div className="space-y-2"><label className="text-xs text-[#C7C5CF]">Portfolio links</label>{values.portfolioLinks.map((link, index) => <div className="flex gap-2" key={index}><input className={inputClass} value={link} placeholder="https://portfolio.example" onChange={(event) => setField('portfolioLinks', values.portfolioLinks.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />{values.portfolioLinks.length > 1 && <button type="button" aria-label="Xóa link" onClick={() => setField('portfolioLinks', values.portfolioLinks.filter((_, itemIndex) => itemIndex !== index))}><X className="h-4 w-4" /></button>}</div>)}<button type="button" className="text-xs text-[#A7ACD9]" onClick={() => setField('portfolioLinks', [...values.portfolioLinks, ''])}>+ Thêm link</button></div><div className="space-y-2"><label className="text-xs text-[#C7C5CF]">Ảnh sản phẩm mẫu (bắt buộc)</label><div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{values.portfolioUploads.map((url) => <div key={url} className="relative aspect-square overflow-hidden rounded-lg"><Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" /><button type="button" aria-label="Xóa ảnh" onClick={() => setField('portfolioUploads', values.portfolioUploads.filter((item) => item !== url))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1"><X className="h-3 w-3" /></button></div>)}<label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 text-2xl text-[#A7ACD9]">+<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, 'portfolio'); event.target.value = ''; }} /></label></div></div></div>}
        {step === 2 && <div className="space-y-4"><div className="space-y-2"><label className="text-xs text-[#C7C5CF]">Phong cách chính</label><input className={inputClass} list="creator-style-options" value={values.primaryStyle} onChange={(event) => setField('primaryStyle', event.target.value)} /><datalist id="creator-style-options">{styleSuggestions.map((style) => <option key={style} value={style} />)}</datalist></div><div className="space-y-2"><label className="text-xs text-[#C7C5CF]">Video speedpaint</label>{values.speedpaintVideoUrls.map((link, index) => <div className="flex gap-2" key={index}><input className={inputClass} value={link} placeholder="https://youtube.com/watch?..." onChange={(event) => setField('speedpaintVideoUrls', values.speedpaintVideoUrls.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />{values.speedpaintVideoUrls.length > 1 && <button type="button" aria-label="Xóa speedpaint link" onClick={() => setField('speedpaintVideoUrls', values.speedpaintVideoUrls.filter((_, itemIndex) => itemIndex !== index))}><X className="h-4 w-4" /></button>}</div>)}<button type="button" className="text-xs text-[#A7ACD9]" onClick={() => setField('speedpaintVideoUrls', [...values.speedpaintVideoUrls, ''])}>+ Thêm link</button></div></div>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
      <footer className="mt-7 flex justify-between gap-3"><button type="button" disabled={step === 0 || isSubmitting} onClick={() => { setError(''); setStep((current) => current - 1); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40">Quay lại</button>{step < 2 ? <button type="button" onClick={() => { if (validateStep()) setStep((current) => current + 1); }} className="rounded-lg bg-[#A7ACD9] px-5 py-2 text-sm font-semibold text-[#1F2335]">Tiếp tục</button> : <button type="button" disabled={isSubmitting || uploading} onClick={() => void submit()} className="rounded-lg bg-[#A7ACD9] px-5 py-2 text-sm font-semibold text-[#1F2335] disabled:opacity-50">{isSubmitting ? 'Đang gửi…' : mode === 'edit' ? 'Lưu hồ sơ' : 'Gửi hồ sơ'}</button>}</footer>
    </section>
  );
}