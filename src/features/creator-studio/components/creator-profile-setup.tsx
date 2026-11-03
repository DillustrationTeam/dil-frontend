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

      toast.success(editing ? 'Đã cập nhật hồ sơ Creator.' : 'Creator profile created successfully.');
      if (editing) router.push(`/creators/${saved.id}`);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Không lưu được hồ sơ. Vui lòng thử lại.');
      toast.error(message);
    }
  };

  if (editing && !isAuthenticated) return <div className="p-8 text-[#C7C5CF]">Vui lòng <Link href="/login" className="text-[#A7ACD9] underline">đăng nhập</Link> để chỉnh sửa hồ sơ.</div>;
  if (editing && (!profileId || loadedUserId !== userId)) return <div role="status" className="p-8 text-[#C7C5CF]">{loadError || 'Đang tải hồ sơ Creator…'}</div>;

  return (
    <div className="glass-container rounded-[32px] p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">{editing ? 'Creator profile' : 'Creator onboarding'}</p>
        <h1 className="font-h1 text-3xl font-bold text-white mt-3">{editing ? 'Chỉnh sửa hồ sơ Creator' : 'Set up your creator profile'}</h1>
        {editing && <Link href={`/creators/${profileId}`} className="mt-3 inline-block text-sm text-[#A7ACD9]">← Quay lại hồ sơ</Link>}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-displayName" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Display name</label>
            <input
              id="creator-profile-displayName" {...register('displayName')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Etherea Vox"
            />
            {errors.displayName && <p className="text-red-400 text-xs">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-headline" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Headline</label>
            <input
              id="creator-profile-headline" {...register('headline')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Fantasy illustrator crafting cinematic worlds"
            />
            {errors.headline && <p className="text-red-400 text-xs">{errors.headline.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-bio" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Bio</label>
            <textarea
              id="creator-profile-bio" {...register('bio')}
              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Tell collectors about your style, process, and experience."
            />
            {errors.bio && <p className="text-red-400 text-xs">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-specialties" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Specialties</label>
            <input
              id="creator-profile-specialties" {...register('specialties')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Anime, fantasy, character design"
            />
            {errors.specialties && <p className="text-red-400 text-xs">{errors.specialties.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="creator-profile-location" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Location</label>
            <input
              id="creator-profile-location" {...register('location')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Ho Chi Minh City"
            />
            {errors.location && <p className="text-red-400 text-xs">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="creator-profile-websiteUrl" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Website</label>
            <input
              id="creator-profile-websiteUrl" {...register('websiteUrl')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="https://example.com"
            />
            {errors.websiteUrl && <p className="text-red-400 text-xs">{errors.websiteUrl.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="creator-profile-bannerUrl" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Banner image URL</label>
            <input
              id="creator-profile-bannerUrl" {...register('bannerUrl')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="https://images.example.com/banner.jpg"
            />
            {errors.bannerUrl && <p className="text-red-400 text-xs">{errors.bannerUrl.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="font-semibold text-white">Accepting commissions</p>
            <p className="text-sm text-[#C7C5CF]">Let clients discover your open slots instantly.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Accepting commissions"
            aria-checked={isAcceptingOrders}
            onClick={() => setIsAcceptingOrders((previous) => !previous)}
            className={`relative h-7 w-12 rounded-full transition ${isAcceptingOrders ? 'bg-[#A7ACD9]' : 'bg-white/10'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${isAcceptingOrders ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="creator-profile-slots" className="text-xs uppercase tracking-wider text-[#C7C5CF]">Số slot nhận đơn</label>
          <input id="creator-profile-slots" type="number" min={0} max={100} {...register('availableSlots', { valueAsNumber: true })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          {errors.availableSlots && <p className="text-xs text-red-400">{errors.availableSlots.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Create profile'}
        </button>
      </form>
    </div>
  );
}
