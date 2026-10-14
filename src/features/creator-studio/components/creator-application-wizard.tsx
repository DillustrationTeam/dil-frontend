'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCloudinaryUpload } from '@/features/creator-studio/hooks/use-cloudinary-upload';
import { creatorApplicationService } from '@/features/creator-studio/services/creator-application.service';

type WizardStep = 'identity' | 'portfolio' | 'style';

type WizardFormState = {
  idProofUrl: string;
  idProofBackUrl: string;
  portfolioLinks: string[];
  portfolioUploads: string[];
  primaryStyle: string;
  speedpaintVideoUrls: string[];
};

const steps: Array<{ key: WizardStep; label: string }> = [
  { key: 'identity', label: 'Identity' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'style', label: 'Style & Proof' },
];

const defaultValues: WizardFormState = {
  idProofUrl: '',
  idProofBackUrl: '',
  portfolioLinks: [''],
  portfolioUploads: [],
  primaryStyle: '',
  speedpaintVideoUrls: [''],
};

// Danh sách gợi ý phong cách vẽ — người dùng vẫn có thể gõ tự do, đây chỉ là dropdown hỗ trợ chọn nhanh.
const primaryStyleSuggestions = [
  'Anime / Manga',
  'Chibi',
  'Semi-realistic',
  'Realistic / Portrait',
  'Concept Art',
  'Character Design',
  'Fanart',
  'Fantasy Art',
  'Pixel Art',
  '3D / CGI',
  'Flat Design / Vector',
  'Watercolor',
  'Traditional / Sketch',
  'Environment / Background',
  'Furry / Anthro',
];

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]';

function ImageUploadSlot({
  label,
  value,
  isUploading,
  onSelectFile,
}: {
  label: string;
  value: string;
  isUploading: boolean;
  onSelectFile: (file: File) => void;
}) {
  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">{label}</label>
      <label
        htmlFor={inputId}
        className="relative flex aspect-[16/10] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 transition hover:border-[#A7ACD9]"
      >
        {value ? (
          <Image src={value} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#C7C5CF]">
            <span className="material-symbols-outlined text-3xl">
              {isUploading ? 'progress_activity' : 'upload'}
            </span>
            <span className="text-xs">{isUploading ? 'Uploading...' : 'Click to upload'}</span>
          </div>
        )}
        {value && !isUploading && (
          <span
            title="Nhấn vào ảnh để chọn ảnh khác"
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-white/80 opacity-80 backdrop-blur-sm transition hover:opacity-100"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-medium">Chỉnh sửa</span>
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelectFile(file);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

export function CreatorApplicationWizard({
  mode = 'create',
  initialValues,
  onDone,
}: {
  mode?: 'create' | 'edit';
  initialValues?: Partial<WizardFormState>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<WizardFormState>({ ...defaultValues, ...initialValues });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idFrontUpload = useCloudinaryUpload('creator-applications/id-proof');
  const idBackUpload = useCloudinaryUpload('creator-applications/id-proof');
  const portfolioUpload = useCloudinaryUpload('creator-applications/portfolio');

  const currentStep = steps[stepIndex];

  const canContinue = useMemo(() => {
    if (currentStep.key === 'identity') {
      return form.idProofUrl.trim().length > 0 && form.idProofBackUrl.trim().length > 0;
    }

    if (currentStep.key === 'portfolio') {
      const hasManualLink = form.portfolioLinks.some((link) => link.trim().length > 0);
      return hasManualLink || form.portfolioUploads.length > 0;
    }

    if (currentStep.key === 'style') {
      const hasStyle = form.primaryStyle.trim().length > 0;
      const hasSpeedpaint = form.speedpaintVideoUrls.some((link) => link.trim().length > 0);
      return hasStyle && hasSpeedpaint;
    }

    return true;
  }, [currentStep.key, form]);

  const handleIdFrontUpload = async (file: File) => {
    const url = await idFrontUpload.upload(file);
    if (url) {
      setForm((previous) => ({ ...previous, idProofUrl: url }));
    } else {
      toast.error(idFrontUpload.error ?? 'Failed to upload front-side ID image.');
    }
  };

  const handleIdBackUpload = async (file: File) => {
    const url = await idBackUpload.upload(file);
    if (url) {
      setForm((previous) => ({ ...previous, idProofBackUrl: url }));
    } else {
      toast.error(idBackUpload.error ?? 'Failed to upload back-side ID image.');
    }
  };

  const handlePortfolioFileUpload = async (file: File) => {
    const url = await portfolioUpload.upload(file);
    if (url) {
      setForm((previous) => ({ ...previous, portfolioUploads: [...previous.portfolioUploads, url] }));
    } else {
      toast.error(portfolioUpload.error ?? 'Failed to upload sample artwork.');
    }
  };

  const removePortfolioUpload = (url: string) => {
    setForm((previous) => ({
      ...previous,
      portfolioUploads: previous.portfolioUploads.filter((item) => item !== url),
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    setForm((previous) => {
      const next = [...previous.portfolioLinks];
      next[index] = value;
      return { ...previous, portfolioLinks: next };
    });
  };

  const addPortfolioLink = () => {
    setForm((previous) => ({ ...previous, portfolioLinks: [...previous.portfolioLinks, ''] }));
  };

  const removePortfolioLink = (index: number) => {
    setForm((previous) => ({
      ...previous,
      portfolioLinks: previous.portfolioLinks.filter((_, i) => i !== index),
    }));
  };

  const updateSpeedpaintLink = (index: number, value: string) => {
    setForm((previous) => {
      const next = [...previous.speedpaintVideoUrls];
      next[index] = value;
      return { ...previous, speedpaintVideoUrls: next };
    });
  };

  const addSpeedpaintLink = () => {
    setForm((previous) => ({ ...previous, speedpaintVideoUrls: [...previous.speedpaintVideoUrls, ''] }));
  };

  const removeSpeedpaintLink = (index: number) => {
    setForm((previous) => ({
      ...previous,
      speedpaintVideoUrls: previous.speedpaintVideoUrls.filter((_, i) => i !== index),
    }));
  };

  const updatePrimaryStyle = (value: string) => {
    setForm((previous) => ({ ...previous, primaryStyle: value }));
  };

  const nextStep = () => {
    if (!canContinue) {
      toast.error('Please complete this step before continuing.');
      return;
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((previous) => previous + 1);
    }
  };

  const previousStep = () => {
    if (stepIndex > 0) {
      setStepIndex((previous) => previous - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canContinue) {
      if (!form.primaryStyle.trim()) {
        toast.error('Vui lòng chọn hoặc nhập phong cách vẽ chính.');
      } else if (!form.speedpaintVideoUrls.some((link) => link.trim().length > 0)) {
        toast.error('Vui lòng cung cấp link video speedpaint minh chứng.');
      } else {
        toast.error('Please complete this step before continuing.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const portfolioLinks = [
        ...form.portfolioLinks.map((link) => link.trim()).filter((link) => link.length > 0),
        ...form.portfolioUploads,
      ];

      const speedpaintVideoUrls = form.speedpaintVideoUrls.map((link) => link.trim()).filter((link) => link.length > 0);

      const payload = {
        portfolioLinks,
        idProofUrl: form.idProofUrl,
        idProofBackUrl: form.idProofBackUrl,
        primaryStyle: form.primaryStyle.trim(),
        speedpaintVideoUrls,
      };

      if (mode === 'edit') {
        await creatorApplicationService.updateApplication(payload);
        toast.success('Application updated! It will be reviewed again.');
        onDone?.();
      } else {
        await creatorApplicationService.submitApplication(payload);
        toast.success('Application submitted! Our moderators will review it soon.');
        router.push('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit your application.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-container rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">
            {mode === 'edit' ? 'Sửa đơn Creator' : 'Become a creator'}
          </p>
          <h1 className="font-h1 text-3xl font-bold text-white mt-3">
            {mode === 'edit' ? 'Cập nhật đơn của bạn' : 'Đăng ký trở thành Creator'}
          </h1>
          <p className="mt-2 text-sm text-[#C7C5CF]">
            {mode === 'edit'
              ? 'Cập nhật lại thông tin đơn — đơn sẽ được đưa lại vào hàng chờ duyệt.'
              : 'Hoàn thành 3 bước để gửi đơn xác minh. Moderator sẽ xét duyệt và cấp quyền Creator sau khi đơn được chấp thuận.'}
          </p>
        </div>
        {mode === 'edit' && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-[#C7C5CF] hover:text-white"
          >
            Hủy
          </button>
        )}
      </div>

      <div className="mb-8 flex gap-3">
        {steps.map((step, index) => {
          const isActive = index === stepIndex;
          const isDone = index < stepIndex;

          return (
            <div key={step.key} className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#C7C5CF]">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#A7ACD9] text-[#1F2335]' : isDone ? 'bg-[#A7ACD9]/30 text-white' : 'bg-white/5 text-[#C7C5CF]'
                  }`}
                >
                  {index + 1}
                </span>
                {step.label}
              </div>
              <div className={`h-1 rounded-full ${isDone || isActive ? 'bg-[#A7ACD9]' : 'bg-white/10'}`} />
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {currentStep.key === 'identity' && (
          <>
            <p className="text-sm text-[#C7C5CF]">
              Tải lên ảnh CCCD/CMND để xác minh danh tính. Thông tin chỉ dùng để duyệt hồ sơ, không hiển thị công khai.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <ImageUploadSlot
                label="Mặt trước CCCD/CMND"
                value={form.idProofUrl}
                isUploading={idFrontUpload.isUploading}
                onSelectFile={handleIdFrontUpload}
              />
              <ImageUploadSlot
                label="Mặt sau CCCD/CMND"
                value={form.idProofBackUrl}
                isUploading={idBackUpload.isUploading}
                onSelectFile={handleIdBackUpload}
              />
            </div>
          </>
        )}

        {currentStep.key === 'portfolio' && (
          <>
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Link Behance / ArtStation / Portfolio site
              </label>
              {form.portfolioLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={link}
                    onChange={(event) => updatePortfolioLink(index, event.target.value)}
                    className={inputClass}
                    placeholder="https://www.behance.net/yourprofile"
                  />
                  {form.portfolioLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePortfolioLink(index)}
                      className="rounded-xl border border-white/10 px-3 text-[#C7C5CF] hover:border-red-400 hover:text-red-400"
                      aria-label="Remove link"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPortfolioLink}
                className="text-xs font-semibold text-[#A7ACD9] hover:underline"
              >
                + Thêm link khác
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Upload sản phẩm mẫu (tuỳ chọn, có thể chọn nhiều ảnh)
              </label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.portfolioUploads.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
                    <Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePortfolioUpload(url)}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white group-hover:flex"
                      aria-label="Remove sample"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="upload-portfolio-sample"
                  className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[#C7C5CF] transition hover:border-[#A7ACD9]"
                >
                  <span className="material-symbols-outlined text-2xl">
                    {portfolioUpload.isUploading ? 'progress_activity' : 'add'}
                  </span>
                  <input
                    id="upload-portfolio-sample"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={portfolioUpload.isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handlePortfolioFileUpload(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {currentStep.key === 'style' && (
          <>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Phong cách chính <span className="text-red-400">*</span>
              </label>
              <input
                value={form.primaryStyle}
                onChange={(event) => updatePrimaryStyle(event.target.value)}
                className={inputClass}
                placeholder="Chọn hoặc gõ phong cách của bạn (bắt buộc)"
                list="primary-style-suggestions"
              />
              <datalist id="primary-style-suggestions">
                {primaryStyleSuggestions.map((style) => (
                  <option key={style} value={style} />
                ))}
              </datalist>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Link video Speedpaint (minh chứng vẽ tay) <span className="text-red-400">*</span>
              </label>
              {form.speedpaintVideoUrls.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={link}
                    onChange={(event) => updateSpeedpaintLink(index, event.target.value)}
                    className={inputClass}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {form.speedpaintVideoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpeedpaintLink(index)}
                      className="rounded-xl border border-white/10 px-3 text-[#C7C5CF] hover:border-red-400 hover:text-red-400"
                      aria-label="Remove link"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpeedpaintLink}
                className="text-xs font-semibold text-[#A7ACD9] hover:underline"
              >
                + Thêm link khác
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={stepIndex === 0}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {stepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-sm font-bold text-[#1F2335]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-sm font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : mode === 'edit' ? 'Save changes' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  );
}
