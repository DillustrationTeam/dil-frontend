'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { PageHeader } from '@/components/page-header';
import { CreatorApplicationWizard } from '@/features/creator-studio/components/creator-application-wizard';
import { creatorApplicationService } from '@/features/creator-studio/services/creator-application.service';
import { MyCreatorApplicationDto } from '@/features/creator-studio/types/creator-application.types';

const statusBanner: Record<
  MyCreatorApplicationDto['status'],
  { className: string; title: string }
> = {
  Pending: {
    className: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
    title: 'Đơn của bạn đang chờ duyệt',
  },
  AdditionalProofRequested: {
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    title: 'Moderator yêu cầu bổ sung hồ sơ',
  },
  Rejected: {
    className: 'border-red-500/30 bg-red-500/10 text-red-200',
    title: 'Đơn của bạn đã bị từ chối',
  },
  Approved: {
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    title: 'Bạn đã là Creator!',
  },
};

export default function BecomeCreatorPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [application, setApplication] = useState<MyCreatorApplicationDto | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const result = await creatorApplicationService.getMyApplication();
        setApplication(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải trạng thái đơn.');
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const canResubmit =
    !application || application.status === 'AdditionalProofRequested' || application.status === 'Rejected';

  return (
    <main className="min-h-screen bg-[#1F2335] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Đăng ký trở thành Creator" />

        {isCheckingStatus ? (
          <p className="text-center text-sm text-[#C7C5CF]">Đang kiểm tra trạng thái đơn của bạn...</p>
        ) : (
          <>
            {application && (
              <div className={`mb-8 rounded-2xl border p-5 ${statusBanner[application.status].className}`}>
                <p className="text-sm font-bold">{statusBanner[application.status].title}</p>
                {application.reviewNote && (
                  <p className="mt-2 text-sm">
                    {application.status === 'Rejected' ? 'Lý do: ' : 'Ghi chú từ moderator: '}
                    {application.reviewNote}
                  </p>
                )}
                {application.status === 'Pending' && (
                  <p className="mt-2 text-sm">Vui lòng chờ Moderator xét duyệt, chúng tôi sẽ thông báo khi có kết quả.</p>
                )}
                {application.status === 'Approved' && (
                  <p className="mt-2 text-sm">
                    Bạn có thể bắt đầu thiết lập gian hàng của mình tại{' '}
                    <Link href="/creator-setup" className="underline hover:text-white">
                      Creator Setup
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}

            {canResubmit && <CreatorApplicationWizard />}
          </>
        )}
      </div>
    </main>
  );
}
