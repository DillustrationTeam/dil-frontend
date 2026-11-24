import { ProfileSetupWizard } from '@/features/creator-studio/components/profile-setup-wizard';

export default function CreatorSetupPage() {
  return (
    <main className="min-h-screen bg-[#F7F2E9] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <ProfileSetupWizard />
      </div>
    </main>
  );
}
