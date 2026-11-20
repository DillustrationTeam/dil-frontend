'use client';

import { useEffect, useMemo, useState } from 'react';
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

const primaryActionClass =
  'min-h-11 rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-sm font-bold text-[#1F2335] transition-[background-color,box-shadow,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const primaryActionReadyClass = 'hover:bg-[#C2C7F6] hover:shadow-[0_0_18px_rgba(167,172,217,0.25)]';
const primaryActionWaitingClass = 'cursor-not-allowed opacity-50';

// Focus ô nhập dùng cùng "Periwinkle focus glow" với ô upload (DESIGN.md) thay vì chỉ đổi màu viền 1px.
const inputClass =
  'w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#8A8FA9] focus:border-[#A7ACD9] focus-visible:shadow-[0_0_15px_rgba(167,172,217,0.3)]';

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
  const labelId = `${inputId}-label`;

  return (
    <div className="space-y-2">
      <label id={labelId} htmlFor={inputId} className="text-xs uppercase tracking-wider text-[#C7C5CF]">
        {label} <span aria-hidden="true" className="text-red-400">*</span>
      </label>
      {/* Input file dùng sr-only (không phải hidden) để vẫn nhận focus bằng Tab và đọc được
          bằng screen reader; khung dropzone sáng viền periwinkle khi input được focus bàn phím. */}
      <label
        htmlFor={inputId}
        aria-busy={isUploading}
        className="relative flex aspect-[2/1] w-full sm:aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 transition hover:border-[#A7ACD9] has-[:focus-visible]:border-solid has-[:focus-visible]:border-[#A7ACD9] has-[:focus-visible]:shadow-[0_0_15px_rgba(167,172,217,0.3)]"
      >
        {value ? (
          <Image src={value} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#C7C5CF]">
            <span aria-hidden="true" className="material-symbols-outlined text-3xl">
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
            <Pencil aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-medium">Chỉnh sửa</span>
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          aria-labelledby={labelId}
          aria-required="true"
          className="sr-only"
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
  // Lỗi của bước hiện tại, hiển thị ngay trong form (cạnh nút hành động) thay vì toast góc màn hình.
  const [stepError, setStepError] = useState<string | null>(null);

  const idFrontUpload = useCloudinaryUpload('creator-applications/id-proof');
  const idBackUpload = useCloudinaryUpload('creator-applications/id-proof');
  const portfolioUpload = useCloudinaryUpload('creator-applications/portfolio');

  const currentStep = steps[stepIndex];

  const canContinue = useMemo(() => {
    if (currentStep.key === 'identity') {
      return form.idProofUrl.trim().length > 0 && form.idProofBackUrl.trim().length > 0;
    }

    if (currentStep.key === 'portfolio') {
      return form.portfolioUploads.length > 0;
    }

    if (currentStep.key === 'style') {
      const hasStyle = form.primaryStyle.trim().length > 0;
      const hasSpeedpaint = form.speedpaintVideoUrls.some((link) => link.trim().length > 0);
      return hasStyle && hasSpeedpaint;
    }

    return true;
  }, [currentStep.key, form]);

  // Xoá lỗi khi người dùng đã điền đủ bước hoặc chuyển sang bước khác.
  useEffect(() => {
    if (canContinue) setStepError(null);
  }, [canContinue]);

  useEffect(() => {
    setStepError(null);
  }, [stepIndex]);

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
      setStepError('Please complete this step before continuing.');
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
        setStepError('Vui lòng chọn hoặc nhập phong cách vẽ chính.');
      } else if (!form.speedpaintVideoUrls.some((link) => link.trim().length > 0)) {
        setStepError('Vui lòng cung cấp link video speedpaint minh chứng.');
      } else {
        setStepError('Please complete this step before continuing.');
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
        // Trang cha truyền onDone để ở lại và hiện banner "đang chờ duyệt"; nơi khác vẫn về trang chủ.
        if (onDone) {
          onDone();
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit your application.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-container mx-auto max-w-3xl rounded-[28px] p-4 sm:rounded-[32px] sm:p-6 md:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">
            {mode === 'edit' ? 'Sửa đơn Creator' : 'Become a creator'}
          </p>
          <h1 className="font-h1 text-3xl font-bold text-white mt-3">
            {mode === 'edit' ? 'Cập nhật đơn của bạn' : 'Đăng ký trở thành Creator'}
          </h1>
          <p className="mt-2 text-pretty text-sm text-[#C7C5CF]">
            {mode === 'edit'
              ? 'Cập nhật lại thông tin đơn — đơn sẽ được đưa lại vào hàng chờ duyệt.'
              : 'Hoàn thành 3 bước để gửi đơn xác minh. Moderator sẽ xét duyệt và cấp quyền Creator sau khi đơn được chấp thuận.'}
          </p>
        </div>
        {mode === 'edit' && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="min-h-11 shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-[#C7C5CF] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
          >
            Hủy
          </button>
        )}
      </div>

      <div className="mb-8 flex gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const isActive = index === stepIndex;
          const isDone = index < stepIndex;

          return (
            <div key={step.key} className="min-w-0 flex-1" aria-current={isActive ? 'step' : undefined}>
              <div
                className={`mb-2 flex items-center gap-2 text-[11px] uppercase leading-tight tracking-[0.12em] sm:text-xs sm:tracking-[0.16em] ${
                  isActive ? 'text-white' : 'text-[#C7C5CF]'
                }`}
              >
                {/* shrink-0: giữ huy hiệu tròn 24px, không bị bóp méo khi nhãn dài trên màn hình hẹp. */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-[#A7ACD9] text-[#1F2335]' : isDone ? 'bg-[#A7ACD9]/30 text-white' : 'bg-white/5 text-[#C7C5CF]'
                  }`}
                >
                  {isDone ? (
                    <span aria-hidden="true" data-no-translate="true" className="material-symbols-outlined text-sm font-bold">
                      check
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                {/* Trên mobile chỉ hiện nhãn của bước đang làm; các bước khác vẫn đọc được bằng screen reader. */}
                <span className={isActive ? 'min-w-0' : 'max-sm:sr-only'}>{step.label}</span>
              </div>
              <div className={`h-1 rounded-full ${isDone || isActive ? 'bg-[#A7ACD9]' : 'bg-white/10'}`} />
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {currentStep.key === 'identity' && (
          <>
            {/* Khoảnh khắc nhạy cảm nhất của luồng: đóng khung câu cam kết quyền riêng tư (giữ nguyên chữ)
                trong một panel periwinkle có icon khiên để người dùng thấy rõ dữ liệu được bảo vệ. */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-[#A7ACD9]/25 border-t-[#A7ACD9]/40 bg-[#A7ACD9]/[0.06] p-4 shadow-[0_0_20px_rgba(167,172,217,0.06)]">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A7ACD9]/15 text-[#A7ACD9]"
              >
                <span data-no-translate="true" className="material-symbols-outlined text-[22px]">
                  verified_user
                </span>
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-[#E4E1E5]">
                Tải lên ảnh CCCD/CMND để xác minh danh tính. Thông tin chỉ dùng để duyệt hồ sơ, không hiển thị công khai.
              </p>
            </div>
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
              <label
                id="portfolio-links-label"
                htmlFor="portfolio-link-0"
                className="text-xs uppercase tracking-wider text-[#C7C5CF]"
              >
                Link Behance / ArtStation / Portfolio site
              </label>
              {form.portfolioLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    id={`portfolio-link-${index}`}
                    aria-labelledby="portfolio-links-label"
                    type="url"
                    inputMode="url"
                    value={link}
                    onChange={(event) => updatePortfolioLink(index, event.target.value)}
                    className={inputClass}
                    placeholder="https://www.behance.net/yourprofile"
                  />
                  {form.portfolioLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePortfolioLink(index)}
                      className="min-h-11 min-w-11 shrink-0 rounded-xl border border-white/10 px-3 text-[#C7C5CF] hover:border-red-400 hover:text-red-400"
                      aria-label="Remove link"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPortfolioLink}
                className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-[#A7ACD9] hover:underline focus-visible:outline-2 focus-visible:outline-[#A7ACD9]"
              >
                + Thêm link khác
              </button>
            </div>

            <div className="space-y-3">
              <label
                id="upload-portfolio-sample-label"
                htmlFor="upload-portfolio-sample"
                className="text-xs uppercase tracking-wider text-[#C7C5CF]"
              >
                Upload sản phẩm mẫu (bắt buộc, có thể chọn nhiều ảnh){' '}
                <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.portfolioUploads.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
                    <Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" />
                    {/* Luôn có trong DOM để Tab tới được; chỉ ẩn bằng opacity trên thiết bị có hover,
                        hiện sẵn trên màn hình cảm ứng và khi được focus bàn phím. */}
                    <button
                      type="button"
                      onClick={() => removePortfolioUpload(url)}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A7ACD9] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                      aria-label="Remove sample"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="upload-portfolio-sample"
                  aria-busy={portfolioUpload.isUploading}
                  className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[#C7C5CF] transition hover:border-[#A7ACD9] has-[:focus-visible]:border-solid has-[:focus-visible]:border-[#A7ACD9] has-[:focus-visible]:text-[#A7ACD9] has-[:focus-visible]:shadow-[0_0_15px_rgba(167,172,217,0.3)]"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                    {portfolioUpload.isUploading ? 'progress_activity' : 'add'}
                  </span>
                  <input
                    id="upload-portfolio-sample"
                    type="file"
                    accept="image/*"
                    multiple
                    aria-labelledby="upload-portfolio-sample-label"
                    aria-required="true"
                    className="sr-only"
                    disabled={portfolioUpload.isUploading}
                    onChange={async (event) => {
                      // Cho chọn nhiều ảnh trong một lần (đúng như nhãn "có thể chọn nhiều ảnh");
                      // tải tuần tự để hook upload xử lý từng file và báo lỗi riêng từng ảnh.
                      const files = Array.from(event.target.files ?? []);
                      event.target.value = '';
                      for (const file of files) {
                        await handlePortfolioFileUpload(file);
                      }
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
              <label htmlFor="primary-style" className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Phong cách chính <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <input
                id="primary-style"
                aria-required="true"
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
              <label
                id="speedpaint-links-label"
                htmlFor="speedpaint-link-0"
                className="text-xs uppercase tracking-wider text-[#C7C5CF]"
              >
                Link video Speedpaint (minh chứng vẽ tay) <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              {form.speedpaintVideoUrls.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    id={`speedpaint-link-${index}`}
                    aria-labelledby="speedpaint-links-label"
                    aria-required={index === 0 ? 'true' : undefined}
                    type="url"
                    inputMode="url"
                    value={link}
                    onChange={(event) => updateSpeedpaintLink(index, event.target.value)}
                    className={inputClass}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {form.speedpaintVideoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpeedpaintLink(index)}
                      className="min-h-11 min-w-11 shrink-0 rounded-xl border border-white/10 px-3 text-[#C7C5CF] hover:border-red-400 hover:text-red-400"
                      aria-label="Remove link"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpeedpaintLink}
                className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-[#A7ACD9] hover:underline focus-visible:outline-2 focus-visible:outline-[#A7ACD9]"
              >
                + Thêm link khác
              </button>
            </div>
          </>
        )}
      </div>

      {/* Vùng lỗi luôn có trong DOM (role="alert") để screen reader đọc ngay khi nội dung xuất hiện. */}
      <div role="alert" aria-live="assertive">
        {stepError && (
          <p
            id="wizard-step-error"
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <span
              aria-hidden="true"
              data-no-translate="true"
              className="material-symbols-outlined text-lg leading-5 text-red-300"
            >
              error
            </span>
            <span>{stepError}</span>
          </p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={stepIndex === 0}
          className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>

        {/* Nút chính mờ đi (aria-disabled) khi bước chưa đủ nhưng vẫn bấm được để hiện lỗi cụ thể. */}
        {stepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            aria-disabled={!canContinue}
            aria-describedby={stepError ? 'wizard-step-error' : undefined}
            className={`${primaryActionClass} ${canContinue ? primaryActionReadyClass : primaryActionWaitingClass}`}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-disabled={!canContinue}
            aria-describedby={stepError ? 'wizard-step-error' : undefined}
            className={`${primaryActionClass} ${canContinue ? primaryActionReadyClass : primaryActionWaitingClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isSubmitting ? 'Submitting...' : mode === 'edit' ? 'Save changes' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  );
}
