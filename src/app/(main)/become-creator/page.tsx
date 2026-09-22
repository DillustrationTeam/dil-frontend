'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || url.includes('res.cloudinary.com');

function ApplicationSummaryCard({
  application,
  onEdit,
  onWithdraw,
  isWithdrawing,
}: {
  application: MyCreatorApplicationDto;
  onEdit: () => void;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}) {
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWithdrawClick = () => {
    if (!confirmingWithdraw) {
      setConfirmingWithdraw(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingWithdraw(false), 4000);
      return;
    }

    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmingWithdraw(false);
    onWithdraw();
  };

  const sampleImages = application.portfolioLinks.filter(isImageUrl);
  const sampleLinks = application.portfolioLinks.filter((link) => !isImageUrl(link));

  return (
    <div className="glass-container rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-h1 text-xl font-bold text-white">Đơn hiện tại của bạn</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#A7ACD9] hover:bg-white/5"
          >
            Sửa đơn
          </button>
          <button
            type="button"
            onClick={handleWithdrawClick}
            disabled={isWithdrawing}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              confirmingWithdraw
                ? 'border-red-400 bg-red-500/20 text-red-300'
                : 'border-white/10 text-red-400 hover:bg-red-500/10'
            }`}
          >
            {isWithdrawing ? 'Đang thu hồi...' : confirmingWithdraw ? 'Bấm lần nữa để xác nhận' : 'Thu hồi đơn'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        {application.primaryStyle && (
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C7C5CF]">Phong cách chính</p>
            <p className="mt-1 text-white">{application.primaryStyle}</p>
          </div>
        )}
        {application.speedpaintVideoUrl && (
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C7C5CF]">Video speedpaint</p>
            <a
              href={application.speedpaintVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-[#A7ACD9] underline"
            >
              {application.speedpaintVideoUrl}
            </a>
          </div>
        )}
      </div>

      {sampleLinks.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">Portfolio links</p>
          <ul className="space-y-1 text-sm">
            {sampleLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#A7ACD9] underline truncate block">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sampleImages.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">Sản phẩm mẫu</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {sampleImages.map((url) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                <Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">CCCD/CMND đã nộp</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10">
            <Image src={application.idProofUrl} alt="Mặt trước" fill unoptimized className="object-cover" />
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10">
            <Image src={application.idProofBackUrl} alt="Mặt sau" fill unoptimized className="object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BecomeCreatorPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [application, setApplication] = useState<MyCreatorApplicationDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchApplication = async () => {
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

    fetchApplication();
  }, [isAuthenticated, reloadKey]);

  const handleEditDone = () => {
    setIsEditing(false);
    setReloadKey((k) => k + 1);
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await creatorApplicationService.withdrawApplication();
      toast.success('Đã thu hồi đơn.');
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thu hồi đơn.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const isManageable =
    !!application && (application.status === 'Pending' || application.status === 'AdditionalProofRequested');
  const canResubmit = !application || application.status === 'Rejected';

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

            {isManageable && application && !isEditing && (
              <ApplicationSummaryCard
                application={application}
                onEdit={() => setIsEditing(true)}
                onWithdraw={handleWithdraw}
                isWithdrawing={isWithdrawing}
              />
            )}

            {isManageable && application && isEditing && (
              <CreatorApplicationWizard
                mode="edit"
                initialValues={{
                  idProofUrl: application.idProofUrl,
                  idProofBackUrl: application.idProofBackUrl,
                  portfolioLinks: application.portfolioLinks.length > 0 ? application.portfolioLinks : [''],
                  primaryStyle: application.primaryStyle ?? '',
                  speedpaintVideoUrl: application.speedpaintVideoUrl ?? '',
                }}
                onDone={handleEditDone}
              />
            )}

            {canResubmit && <CreatorApplicationWizard />}
          </>
        )}
      </div>
    </main>
  );
}
