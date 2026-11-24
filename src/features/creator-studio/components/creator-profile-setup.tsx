'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { creatorProfileSchema, CreatorProfileFormValues } from '../types/creator-profile.schema';
import toast from 'react-hot-toast';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { extractErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';


export function CreatorProfileSetup({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const editing = mode === 'edit';
  const router = useRouter();
  const userId = useAuthStore(state => state.user?.id);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      displayName: '',
      headline: '',
      bio: '',
      specialties: '',
      location: '',
      websiteUrl: '',
      bannerUrl: '',
      isAcceptingOrders: true,
      availableSlots: 0,
    },
  });

  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  useEffect(() => {
    if (!editing || !isAuthenticated) return;
    let active = true;
    creatorProfileService.getMyProfile().then(profile => {
      if (!active) return;
      reset({ displayName: profile.displayName, headline: profile.headline ?? '', bio: profile.bio ?? '', specialties: profile.specialties ?? '', location: profile.location ?? '', websiteUrl: profile.websiteUrl ?? '', bannerUrl: profile.bannerUrl ?? '', isAcceptingOrders: profile.isAcceptingOrders, availableSlots: profile.availableSlots });
      setIsAcceptingOrders(profile.isAcceptingOrders);
      setProfileId(profile.id);
      setLoadedUserId(profile.userId);
    }).catch(() => { if (active) setLoadError('Không tải được hồ sơ. Vui lòng thử tải lại trang.'); });
    return () => { active = false; };
  }, [editing, isAuthenticated, userId, reset]);

  const onSubmit = async (data: CreatorProfileFormValues) => {
    if (editing && loadedUserId !== useAuthStore.getState().user?.id) return;
    try {
      const saveProfile = editing ? creatorProfileService.updateMyProfile : creatorProfileService.createProfile;
      const saved = await saveProfile({
        displayName: data.displayName,
        headline: editing ? data.headline : data.headline || undefined,
        bio: editing ? data.bio : data.bio || undefined,
        specialties: editing ? data.specialties : data.specialties || undefined,
        location: editing ? data.location : data.location || undefined,
        websiteUrl: editing ? data.websiteUrl : data.websiteUrl || undefined,
        bannerUrl: editing ? data.bannerUrl : data.bannerUrl || undefined,
        isAcceptingOrders: isAcceptingOrders,
        availableSlots: data.availableSlots,
      });

      toast.success(editing ? 'Đã cập nhật hồ sơ họa sĩ.' : 'Creator profile created successfully.');
      if (editing) router.push(`/creators/${saved.id}`);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Không lưu được hồ sơ. Vui lòng thử lại.');
      toast.error(message);
    }
  };

  if (editing && !isAuthenticated) return <div className="p-8 text-[#6E6459]">Vui lòng <Link href="/login" className="text-[#B24A26] underline">đăng nhập</Link> để chỉnh sửa hồ sơ.</div>;
  if (editing && (!profileId || loadedUserId !== userId)) return <div role="status" className="p-8 text-[#6E6459]">{loadError || 'Đang tải hồ sơ họa sĩ…'}</div>;

  return (
    <div className="glass-container rounded-[32px] p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B24A26]">{editing ? 'Creator profile' : 'Creator onboarding'}</p>
        <h1 className="font-h1 text-3xl font-bold text-[#241F1A] mt-3">{editing ? 'Chỉnh sửa hồ sơ họa sĩ' : 'Set up your creator profile'}</h1>
        {editing && <Link href={`/creators/${profileId}`} className="mt-3 inline-block text-sm text-[#B24A26]">← Quay lại hồ sơ</Link>}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-displayName" className="text-xs uppercase tracking-wider text-[#6E6459]">Display name</label>
            <input
              id="creator-profile-displayName" {...register('displayName')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="Etherea Vox"
            />
            {errors.displayName && <p className="text-[#A8321C] text-xs">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-headline" className="text-xs uppercase tracking-wider text-[#6E6459]">Headline</label>
            <input
              id="creator-profile-headline" {...register('headline')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="Fantasy illustrator crafting cinematic worlds"
            />
            {errors.headline && <p className="text-[#A8321C] text-xs">{errors.headline.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-bio" className="text-xs uppercase tracking-wider text-[#6E6459]">Bio</label>
            <textarea
              id="creator-profile-bio" {...register('bio')}
              className="w-full min-h-[120px] rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="Tell collectors about your style, process, and experience."
            />
            {errors.bio && <p className="text-[#A8321C] text-xs">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-specialties" className="text-xs uppercase tracking-wider text-[#6E6459]">Specialties</label>
            <input
              id="creator-profile-specialties" {...register('specialties')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="Anime, fantasy, character design"
            />
            {errors.specialties && <p className="text-[#A8321C] text-xs">{errors.specialties.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="creator-profile-location" className="text-xs uppercase tracking-wider text-[#6E6459]">Location</label>
            <input
              id="creator-profile-location" {...register('location')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="Ho Chi Minh City"
            />
            {errors.location && <p className="text-[#A8321C] text-xs">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="creator-profile-websiteUrl" className="text-xs uppercase tracking-wider text-[#6E6459]">Website</label>
            <input
              id="creator-profile-websiteUrl" {...register('websiteUrl')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="https://example.com"
            />
            {errors.websiteUrl && <p className="text-[#A8321C] text-xs">{errors.websiteUrl.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-bannerUrl" className="text-xs uppercase tracking-wider text-[#6E6459]">Banner image URL</label>
            <input
              id="creator-profile-bannerUrl" {...register('bannerUrl')}
              className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
              placeholder="https://images.example.com/banner.jpg"
            />
            {errors.bannerUrl && <p className="text-[#A8321C] text-xs">{errors.bannerUrl.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
          <div>
            <p className="font-semibold text-[#241F1A]">Accepting commissions</p>
            <p className="text-sm text-[#6E6459]">Let clients discover your open slots instantly.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Accepting commissions"
            aria-checked={isAcceptingOrders}
            onClick={() => setIsAcceptingOrders((previous) => !previous)}
            className={`relative h-7 w-12 rounded-full transition ${isAcceptingOrders ? 'bg-[#B24A26]' : 'bg-[#F0E7D8]'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-[#F0E7D8] transition ${isAcceptingOrders ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="creator-profile-slots" className="text-xs uppercase tracking-wider text-[#6E6459]">Số lượt nhận đơn</label>
          <input id="creator-profile-slots" type="number" min={0} max={100} {...register('availableSlots', { valueAsNumber: true })} className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A]" />
          {errors.availableSlots && <p className="text-xs text-[#A8321C]">{errors.availableSlots.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#B24A26] px-5 py-3 text-sm font-bold text-[#F7F2E9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Create profile'}
        </button>
      </form>
    </div>
  );
}
