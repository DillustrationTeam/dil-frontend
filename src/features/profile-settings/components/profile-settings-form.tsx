'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Upload, X } from 'lucide-react';
import type { Point } from 'react-easy-crop';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { useCloudinaryUpload } from '@/features/creator-studio/hooks/use-cloudinary-upload';
import { profileSettingsService } from '@/features/profile-settings/services/profile-settings.service';
import { clientProfileService } from '@/features/marketplace/services/client-profile.service';
import { ImageCropModal } from '@/components/image-crop-modal';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_TRANSFORMATION = 'c_fill,w_400,h_400,q_auto,f_auto';
const COVER_TRANSFORMATION = 'c_fill,w_1600,h_533,q_auto,f_auto';

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Tên hiển thị phải từ 2-50 ký tự.')
    .max(50, 'Tên hiển thị phải từ 2-50 ký tự.'),
  bio: z.string().max(1000, 'Giới thiệu bản thân tối đa 1000 ký tự.'),
  avatarUrl: z.string(),
  coverUrl: z.string(),
  socialLinks: z.array(z.string()),
  interestTags: z.array(z.string()),
  country: z.string(),
  timezone: z.string(),
  preferredLanguages: z.array(z.string()),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]';

const interestTagOptions = [
  'OC',
  'Fanart',
  'VTuber',
  'D&D',
  'Original',
  'Anime',
  'Furry',
  'Concept Art',
  'Cosplay Reference',
  'Chibi',
];

const languageOptions = ['Tiếng Việt', 'English', '日本語', '한국어', '中文'];

const countryOptions = [
  'Việt Nam',
  'United States',
  'Japan',
  'South Korea',
  'China',
  'Singapore',
  'Thailand',
  'Philippines',
  'Indonesia',
  'Australia',
];

const timezoneOptions = ['GMT+7', 'GMT+8', 'GMT+9', 'GMT+0', 'GMT-5', 'GMT-8', 'GMT+1', 'GMT+5:30'];

function ChipToggleGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isSelected
                ? 'border-[#A7ACD9] bg-[#A7ACD9]/15 text-white'
                : 'border-white/10 text-[#C7C5CF] hover:border-white/30'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ImageUploadSlot({
  label,
  value,
  isUploading,
  aspectClassName,
  onSelectNewFile,
  onEditExisting,
  onRemove,
}: {
  label: string;
  value: string;
  isUploading: boolean;
  aspectClassName: string;
  onSelectNewFile: (file: File) => void;
  onEditExisting: () => void;
  onRemove: () => void;
}) {
  const inputId = `profile-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">{label}</label>
      <div
        className={`relative flex ${aspectClassName} w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 transition ${
          !value ? 'hover:border-[#A7ACD9]' : ''
        }`}
      >
        {value ? (
          <Image src={value} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <label htmlFor={inputId} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-[#C7C5CF]">
            <span className="material-symbols-outlined text-3xl">
              {isUploading ? 'progress_activity' : 'upload'}
            </span>
            <span className="text-xs">{isUploading ? 'Đang tải lên...' : 'Bấm để tải ảnh lên'}</span>
          </label>
        )}
        {value && !isUploading && (
          <>
            <button
              type="button"
              title="Chỉnh sửa vùng cắt"
              onClick={onEditExisting}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-white/80 opacity-80 backdrop-blur-sm transition hover:opacity-100"
            >
              <Pencil className="h-4 w-4" />
              <span className="text-xs font-medium">Chỉnh sửa</span>
            </button>
            <button
              type="button"
              title="Xóa ảnh, quay về mặc định"
              onClick={onRemove}
              className="absolute left-2 top-2 flex items-center justify-center rounded-full bg-black/50 p-1.5 text-white/80 opacity-80 backdrop-blur-sm transition hover:bg-red-500/80 hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <label
              htmlFor={inputId}
              title="Chọn ảnh khác"
              className="absolute bottom-2 left-2 flex cursor-pointer items-center justify-center rounded-full bg-black/50 p-1.5 text-white/80 opacity-80 backdrop-blur-sm transition hover:opacity-100"
            >
              <Upload className="h-4 w-4" />
            </label>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelectNewFile(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function ProfileSettingsForm() {
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      bio: user?.bio ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      coverUrl: user?.coverUrl ?? '',
      socialLinks: user?.socialLinks && user.socialLinks.length > 0 ? user.socialLinks : [''],
      interestTags: [],
      country: '',
      timezone: '',
      preferredLanguages: [],
    },
  });

  const avatarUrl = useWatch({ control, name: 'avatarUrl' });
  const coverUrl = useWatch({ control, name: 'coverUrl' });
  const socialLinks = useWatch({ control, name: 'socialLinks' });
  const interestTags = useWatch({ control, name: 'interestTags' });
  const preferredLanguages = useWatch({ control, name: 'preferredLanguages' });
  const bio = useWatch({ control, name: 'bio' });

  const avatarUpload = useCloudinaryUpload('profile-avatars');
  const coverUpload = useCloudinaryUpload('profile-covers');

  type CropSession = { src: string; crop: Point; zoom: number; rotation: number };
  const [cropSessions, setCropSessions] = useState<{ avatar: CropSession | null; cover: CropSession | null }>({
    avatar: null,
    cover: null,
  });
  const [cropTarget, setCropTargetKind] = useState<'avatar' | 'cover' | null>(null);

  const [customTagInput, setCustomTagInput] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    clientProfileService
      .getClientById(user.id)
      .then((profile) => {
        reset({
          ...getValues(),
          interestTags: profile.interestTags,
          country: profile.country ?? '',
          timezone: profile.timezone ?? '',
          preferredLanguages: profile.preferredLanguages,
        });
      })
      .catch(() => {
        // Chưa từng thiết lập Client Profile — giữ nguyên giá trị rỗng mặc định.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSelectNewFile = (kind: 'avatar' | 'cover', file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ nhận file JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Dung lượng ảnh tối đa 5MB.');
      return;
    }

    setCropSessions((previous) => {
      const old = previous[kind];
      if (old?.src.startsWith('blob:')) URL.revokeObjectURL(old.src);
      return { ...previous, [kind]: { src: URL.createObjectURL(file), crop: { x: 0, y: 0 }, zoom: 1, rotation: 0 } };
    });
    setCropTargetKind(kind);
  };

  const handleEditExisting = (kind: 'avatar' | 'cover') => {
    setCropSessions((previous) => {
      if (previous[kind]) return previous;
      const currentValue = kind === 'avatar' ? avatarUrl : coverUrl;
      if (!currentValue) return previous;
      return { ...previous, [kind]: { src: currentValue, crop: { x: 0, y: 0 }, zoom: 1, rotation: 0 } };
    });
    setCropTargetKind(kind);
  };

  const handleCropCancel = () => {
    setCropTargetKind(null);
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!cropTarget) return;
    const kind = cropTarget;
    setCropTargetKind(null);

    const file = new File([blob], `${kind}.jpg`, { type: 'image/jpeg' });
    const transformation = kind === 'avatar' ? AVATAR_TRANSFORMATION : COVER_TRANSFORMATION;
    const upload = kind === 'avatar' ? avatarUpload : coverUpload;
    const url = await upload.upload(file, transformation);
    if (url) {
      setValue(kind === 'avatar' ? 'avatarUrl' : 'coverUrl', url, { shouldDirty: true });
    } else {
      toast.error(upload.error ?? 'Không thể tải ảnh lên.');
    }
  };

  const updateCropSession = (kind: 'avatar' | 'cover', patch: Partial<CropSession>) => {
    setCropSessions((previous) => (previous[kind] ? { ...previous, [kind]: { ...previous[kind]!, ...patch } } : previous));
  };

  const updateSocialLink = (index: number, value: string) => {
    const next = [...socialLinks];
    next[index] = value;
    setValue('socialLinks', next, { shouldDirty: true });
  };

  const addSocialLink = () => {
    setValue('socialLinks', [...socialLinks, ''], { shouldDirty: true });
  };

  const removeSocialLink = (index: number) => {
    setValue(
      'socialLinks',
      socialLinks.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const toggleInterestTag = (tag: string) => {
    setValue(
      'interestTags',
      interestTags.includes(tag) ? interestTags.filter((t) => t !== tag) : [...interestTags, tag],
      { shouldDirty: true }
    );
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (!tag) return;
    if (!interestTags.includes(tag)) {
      setValue('interestTags', [...interestTags, tag], { shouldDirty: true });
    }
    setCustomTagInput('');
  };

  const removeInterestTag = (tag: string) => {
    setValue(
      'interestTags',
      interestTags.filter((t) => t !== tag),
      { shouldDirty: true }
    );
  };

  const toggleLanguage = (lang: string) => {
    setValue(
      'preferredLanguages',
      preferredLanguages.includes(lang)
        ? preferredLanguages.filter((l) => l !== lang)
        : [...preferredLanguages, lang],
      { shouldDirty: true }
    );
  };

  const onSubmit = async (values: ProfileFormValues) => {
    const cleanedSocialLinks = values.socialLinks.map((link) => link.trim()).filter((link) => link.length > 0);

    try {
      const updatedUser = await profileSettingsService.updateProfile({
        fullName: values.fullName.trim(),
        bio: values.bio.trim(),
        avatarUrl: values.avatarUrl,
        coverUrl: values.coverUrl,
        socialLinks: cleanedSocialLinks,
      });
      setUser(updatedUser, roles);

      await clientProfileService.updateMyProfile({
        interestTags: values.interestTags,
        country: values.country.trim() || undefined,
        timezone: values.timezone.trim() || undefined,
        preferredLanguages: values.preferredLanguages,
      });

      toast.success('Đã lưu thay đổi hồ sơ.');
      reset({ ...values, socialLinks: cleanedSocialLinks.length > 0 ? cleanedSocialLinks : [''] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="glass-container rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploadSlot
            label="Ảnh đại diện (Avatar)"
            value={avatarUrl}
            isUploading={avatarUpload.isUploading}
            aspectClassName="aspect-square"
            onSelectNewFile={(file) => handleSelectNewFile('avatar', file)}
            onEditExisting={() => handleEditExisting('avatar')}
            onRemove={() => {
              setValue('avatarUrl', '', { shouldDirty: true });
              setCropSessions((previous) => ({ ...previous, avatar: null }));
            }}
          />
          <ImageUploadSlot
            label="Ảnh bìa (Cover Art)"
            value={coverUrl}
            isUploading={coverUpload.isUploading}
            aspectClassName="aspect-[16/9]"
            onSelectNewFile={(file) => handleSelectNewFile('cover', file)}
            onEditExisting={() => handleEditExisting('cover')}
            onRemove={() => {
              setValue('coverUrl', '', { shouldDirty: true });
              setCropSessions((previous) => ({ ...previous, cover: null }));
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Tên hiển thị</label>
          <input {...register('fullName')} className={inputClass} placeholder="Tên hiển thị của bạn" />
          {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Giới thiệu bản thân (Bio)</label>
            <span className="text-[10px] text-[#78767A]">{bio.length}/1000</span>
          </div>
          <textarea
            {...register('bio')}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="Vài dòng giới thiệu về bạn..."
          />
          {errors.bio && <p className="text-red-400 text-xs">{errors.bio.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Social Links</label>
          {socialLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={link}
                onChange={(event) => updateSocialLink(index, event.target.value)}
                className={inputClass}
                placeholder="https://facebook.com/..."
              />
              {socialLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="rounded-xl border border-white/10 px-3 text-[#C7C5CF] hover:border-red-400 hover:text-red-400"
                  aria-label="Remove link"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSocialLink} className="text-xs font-semibold text-[#A7ACD9] hover:underline">
            + Thêm link khác
          </button>
        </div>

        <div className="space-y-6 border-t border-white/10 pt-8">
          <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Hồ sơ công khai (hiện trên trang profile)</p>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Phong cách / Thể loại quan tâm</label>
            <ChipToggleGroup options={interestTagOptions} selected={interestTags} onToggle={toggleInterestTag} />
            {interestTags.filter((tag) => !interestTagOptions.includes(tag)).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {interestTags
                  .filter((tag) => !interestTagOptions.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full border border-[#A7ACD9] bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {tag}
                      <button type="button" onClick={() => removeInterestTag(tag)} aria-label={`Xóa tag ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <input
                value={customTagInput}
                onChange={(event) => setCustomTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomTag();
                  }
                }}
                className={inputClass}
                placeholder="Tự thêm phong cách khác..."
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="shrink-0 rounded-xl border border-white/10 px-4 text-xs font-semibold text-[#A7ACD9] hover:border-[#A7ACD9]"
              >
                Thêm
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Quốc gia <span className="normal-case text-[#78767A]">(để trống nếu không muốn hiển thị)</span>
              </label>
              <input {...register('country')} list="country-suggestions" className={inputClass} placeholder="vd: Việt Nam" />
              <datalist id="country-suggestions">
                {countryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
                Múi giờ <span className="normal-case text-[#78767A]">(để trống nếu không muốn hiển thị)</span>
              </label>
              <input {...register('timezone')} list="timezone-suggestions" className={inputClass} placeholder="vd: GMT+7" />
              <datalist id="timezone-suggestions">
                {timezoneOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">
              Ngôn ngữ giao tiếp <span className="normal-case text-[#78767A]">(để trống nếu không muốn hiển thị)</span>
            </label>
            <ChipToggleGroup options={languageOptions} selected={preferredLanguages} onToggle={toggleLanguage} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="w-full rounded-xl bg-[#A7ACD9] py-3.5 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      {cropTarget && cropSessions[cropTarget] && (
        <ImageCropModal
          imageSrc={cropSessions[cropTarget]!.src}
          aspect={cropTarget === 'avatar' ? 1 : 3}
          crop={cropSessions[cropTarget]!.crop}
          zoom={cropSessions[cropTarget]!.zoom}
          rotation={cropSessions[cropTarget]!.rotation}
          onCropChange={(crop) => updateCropSession(cropTarget, { crop })}
          onZoomChange={(zoom) => updateCropSession(cropTarget, { zoom })}
          onRotationChange={(rotation) => updateCropSession(cropTarget, { rotation })}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
