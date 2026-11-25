'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';

type SetupStep = 'bio' | 'ratecard' | 'slot';

type SetupFormState = {
  displayName: string;
  headline: string;
  bio: string;
  specialties: string;
  location: string;
  websiteUrl: string;
  bannerUrl: string;
  isAcceptingOrders: boolean;
  availability: string;
};

const steps: Array<{ key: SetupStep; label: string }> = [
  { key: 'bio', label: 'Bio' },
  { key: 'ratecard', label: 'Ratecard' },
  { key: 'slot', label: 'Slot' },
];

const defaultValues: SetupFormState = {
  displayName: '',
  headline: '',
  bio: '',
  specialties: '',
  location: '',
  websiteUrl: '',
  bannerUrl: '',
  isAcceptingOrders: true,
  availability: 'Open for 3 new commissions this month',
};

export function ProfileSetupWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<SetupFormState>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[stepIndex];

  const canContinue = useMemo(() => {
    if (currentStep.key === 'bio') {
      return form.displayName.trim().length >= 2;
    }

    if (currentStep.key === 'ratecard') {
      return true;
    }

    return form.availability.trim().length > 0;
  }, [currentStep.key, form.availability, form.displayName]);

  const updateField = (field: keyof SetupFormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [field]: value }));
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
      toast.error('Please complete the final setup step.');
      return;
    }

    setIsSubmitting(true);

    try {
      await creatorProfileService.createProfile({
        displayName: form.displayName,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        specialties: form.specialties || undefined,
        location: form.location || undefined,
        websiteUrl: form.websiteUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        isAcceptingOrders: form.isAcceptingOrders,
      });

      toast.success('Profile setup saved successfully.');
      router.push('/creator/services');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your profile.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-container rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B24A26]">Profile setup</p>
        <h1 className="font-h1 text-3xl font-bold text-[#241F1A] mt-3">Create your creator storefront</h1>
      </div>

      <div className="mb-8 flex gap-3">
        {steps.map((step, index) => {
          const isActive = index === stepIndex;
          const isDone = index < stepIndex;

          return (
            <div key={step.key} className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6E6459]">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#B24A26] text-[#F7F2E9]' : isDone ? 'bg-[#B24A26]/30 text-[#241F1A]' : 'bg-[#FFFCF6] text-[#6E6459]'
                  }`}
                >
                  {index + 1}
                </span>
                {step.label}
              </div>
              <div className={`h-1 rounded-full ${isDone || isActive ? 'bg-[#B24A26]' : 'bg-[#F0E7D8]'}`} />
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {currentStep.key === 'bio' && (
          <>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#6E6459]">Display name</label>
              <input
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                placeholder="Etherea Vox"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#6E6459]">Headline</label>
              <input
                value={form.headline}
                onChange={(event) => updateField('headline', event.target.value)}
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                placeholder="Fantasy illustrator crafting cinematic worlds"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#6E6459]">Bio</label>
              <textarea
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                className="min-h-[150px] w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                placeholder="Tell collectors about your art direction, process, and inspiration."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#6E6459]">Specialties</label>
                <input
                  value={form.specialties}
                  onChange={(event) => updateField('specialties', event.target.value)}
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                  placeholder="Character design, fantasy, anime"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#6E6459]">Location</label>
                <input
                  value={form.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                  placeholder="Ho Chi Minh City"
                />
              </div>
            </div>
          </>
        )}

        {currentStep.key === 'ratecard' && (
          <>
            <p className="rounded-xl border border-[#B24A26]/30 bg-[#B24A26]/10 p-4 text-sm text-[#6E6459]">Sau khi tạo hồ sơ, bạn sẽ cấu hình gói giá và các cột mốc tại màn Rate Card.</p>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#6E6459]">Portfolio URL</label>
              <input
                value={form.websiteUrl}
                onChange={(event) => updateField('websiteUrl', event.target.value)}
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                placeholder="https://yourstudio.example"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#6E6459]">Banner URL</label>
              <input
                value={form.bannerUrl}
                onChange={(event) => updateField('bannerUrl', event.target.value)}
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                placeholder="https://images.example.com/banner.jpg"
              />
            </div>
          </>
        )}

        {currentStep.key === 'slot' && (
          <>
            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#241F1A]">Accepting commissions</p>
                  <p className="text-sm text-[#6E6459]">Toggle to let clients see your open slots.</p>
                </div>
                <button
                  type="button"
                  aria-checked={form.isAcceptingOrders}
                  role="switch"
                  onClick={() => updateField('isAcceptingOrders', !form.isAcceptingOrders)}
                  className={`relative h-7 w-12 rounded-full transition ${form.isAcceptingOrders ? 'bg-[#B24A26]' : 'bg-[#F0E7D8]'}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-[#F0E7D8] transition ${form.isAcceptingOrders ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#6E6459]">Available slot note</label>
                <textarea
                  value={form.availability}
                  onChange={(event) => updateField('availability', event.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#B24A26]"
                  placeholder="Open for 3 new commissions this month"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={stepIndex === 0}
          className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-sm text-[#241F1A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {stepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-xl bg-[#B24A26] px-5 py-2.5 text-sm font-bold text-[#F7F2E9]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#B24A26] px-5 py-2.5 text-sm font-bold text-[#F7F2E9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Finish setup'}
          </button>
        )}
      </div>
    </div>
  );
}
