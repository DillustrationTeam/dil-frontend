'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { PageHeader } from '@/components/page-header';
import { CreatorApplicationReviewPanel } from '@/features/admin/components/creator-application-review-panel';

const ADMIN_ROLES = ['Administrator', 'Moderator'];

export default function CreatorVerificationsPage() {
  const router = useRouter();
  const { isAuthenticated, roles } = useAuthStore();
  const isAdminOrMod = roles.some((role) => ADMIN_ROLES.includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdminOrMod) {
      router.push('/');
    }
  }, [isAuthenticated, isAdminOrMod, router]);

  if (!isAuthenticated || !isAdminOrMod) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0d0e15] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Admin · Creator Verification" />
      </div>
      <CreatorApplicationReviewPanel />
    </main>
  );
}
