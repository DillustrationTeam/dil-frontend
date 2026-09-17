'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';

const creatorProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required').max(100),
  headline: z.string().max(200).default(''),
  bio: z.string().max(2000).default(''),
  specialties: z.string().max(500).default(''),
  location: z.string().max(200).default(''),
  websiteUrl: z.string().default(''),
  bannerUrl: z.string().default(''),
  isAcceptingOrders: z.boolean().default(true),
});

export type CreatorProfileFormValues = z.infer<typeof creatorProfileSchema>;

export function CreatorProfileSetup() {
  const {
    register,
    handleSubmit,
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
    },
  });

  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  const onSubmit = async (data: CreatorProfileFormValues) => {
    try {
      await creatorProfileService.createProfile({
        displayName: data.displayName,
        headline: data.headline || undefined,
        bio: data.bio || undefined,
        specialties: data.specialties || undefined,
        location: data.location || undefined,
        websiteUrl: data.websiteUrl || undefined,
        bannerUrl: data.bannerUrl || undefined,
        isAcceptingOrders: isAcceptingOrders,
      });

      toast.success('Creator profile created successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to create profile.';
      toast.error(message);
    }
  };

  return (
    <div className="glass-container rounded-[32px] p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Creator onboarding</p>
        <h1 className="font-h1 text-3xl font-bold text-white mt-3">Set up your creator profile</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Display name</label>
            <input
              {...register('displayName')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Etherea Vox"
            />
            {errors.displayName && <p className="text-red-400 text-xs">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Headline</label>
            <input
              {...register('headline')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Fantasy illustrator crafting cinematic worlds"
            />
            {errors.headline && <p className="text-red-400 text-xs">{errors.headline.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Bio</label>
            <textarea
              {...register('bio')}
              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Tell collectors about your style, process, and experience."
            />
            {errors.bio && <p className="text-red-400 text-xs">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Specialties</label>
            <input
              {...register('specialties')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Anime, fantasy, character design"
            />
            {errors.specialties && <p className="text-red-400 text-xs">{errors.specialties.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Location</label>
            <input
              {...register('location')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="Ho Chi Minh City"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Website</label>
            <input
              {...register('websiteUrl')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]"
              placeholder="https://example.com"
            />
            {errors.websiteUrl && <p className="text-red-400 text-xs">{errors.websiteUrl.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#C7C5CF]">Banner image URL</label>
            <input
              {...register('bannerUrl')}
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
            aria-checked={isAcceptingOrders}
            onClick={() => setIsAcceptingOrders((previous) => !previous)}
            className={`relative h-7 w-12 rounded-full transition ${isAcceptingOrders ? 'bg-[#A7ACD9]' : 'bg-white/10'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${isAcceptingOrders ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving profile...' : 'Create profile'}
        </button>
      </form>
    </div>
  );
}
