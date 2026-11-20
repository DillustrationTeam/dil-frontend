'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { CreatorApplicationWizard } from '@/features/creator-studio/components/creator-application-wizard';
import { creatorApplicationService } from '@/features/creator-studio/services/creator-application.service';
import { MyCreatorApplicationDto } from '@/features/creator-studio/types/creator-application.types';
import { splitPortfolioLinks } from '@/lib/portfolio-link';
import { EmptyFieldNote } from '@/components/empty-field-note';
import { ImageLightbox, LightboxImage } from '@/components/image-lightbox';

// Banner trạng thái đơn: nền kính của hệ thống + một icon trạng thái. Pending dùng periwinkle
// (màu nhấn duy nhất của Digital Etherealism) thay cho tím; các màu trạng thái khác chỉ tô icon/viền.
const statusBanner: Record<
  MyCreatorApplicationDto['status'],
  { className: string; iconClassName: string; icon: string; title: string }
> = {
  Pending: {
    className: 'border-[#A7ACD9]/30 bg-[#A7ACD9]/[0.06]',
    iconClassName: 'bg-[#A7ACD9]/15 text-[#A7ACD9]',
    icon: 'hourglass_top',
    title: 'Đơn của bạn đang chờ duyệt',
  },
  AdditionalProofRequested: {
    className: 'border-amber-400/30 bg-amber-400/[0.06]',
    iconClassName: 'bg-amber-400/15 text-amber-300',
    icon: 'assignment_late',
    title: 'Moderator yêu cầu bổ sung hồ sơ',
  },
  Rejected: {
    className: 'border-red-400/30 bg-red-400/[0.06]',
    iconClassName: 'bg-red-400/15 text-red-300',
    icon: 'cancel',
    title: 'Đơn của bạn đã bị từ chối',
  },
  Approved: {
    className:
      'border-emerald-400/30 bg-emerald-400/[0.06] shadow-[0_15px_35px_rgba(0,0,0,0.35),0_0_25px_rgba(167,172,217,0.12)]',
    iconClassName: 'bg-emerald-400/15 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.25)]',
    icon: 'verified',
    title: 'Bạn đã là Creator!',
  },
};

// Link ngoài hiển thị dạng chip: icon + tên miền nổi bật + phần đường dẫn mờ, cắt gọn trên một dòng.
// Toàn bộ URL vẫn nằm trong href và title nên không mất thông tin.
function LinkChip({ href, icon }: { href: string; icon: string }) {
  let host = href;
  let rest = '';
  try {
    const parsed = new URL(href);
    host = parsed.hostname.replace(/^www\./, '');
    rest = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '');
  } catch {
    // URL không hợp lệ: hiển thị nguyên chuỗi.
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="group inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm transition-colors hover:border-[#A7ACD9]/40 hover:bg-[#A7ACD9]/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
    >
      <span aria-hidden="true" data-no-translate="true" className="material-symbols-outlined shrink-0 text-lg text-[#A7ACD9]">
        {icon}
      </span>
      <span className="min-w-0 truncate" data-no-translate="true">
        <span className="font-semibold text-white">{host}</span>
        {rest && <span className="text-[#8A8FA9]">{rest}</span>}
      </span>
      <span
        aria-hidden="true"
        data-no-translate="true"
        className="material-symbols-outlined shrink-0 text-base text-[#8A8FA9] transition-colors group-hover:text-[#A7ACD9]"
      >
        open_in_new
      </span>
    </a>
  );
}

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Gộp tất cả ảnh của đơn (CCCD trước/sau + sản phẩm mẫu) thành 1 gallery để
  // bấm xem phóng to và dùng mũi tên duyệt qua hết ảnh đã nộp.
  const galleryImages: LightboxImage[] = [
    { src: application.idProofUrl, alt: 'Mặt trước CCCD' },
    { src: application.idProofBackUrl, alt: 'Mặt sau CCCD' },
    ...sampleImages.map((url) => ({ src: url, alt: 'Portfolio sample' })),
  ];

  return (
    <div className="glass-container rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-h1 text-xl font-bold text-white">Đơn hiện tại của bạn</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#A7ACD9] transition-colors hover:border-[#A7ACD9]/40 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
          >
            Sửa đơn
          </button>
          <button
            type="button"
            onClick={handleWithdrawClick}
            disabled={isWithdrawing}
            className={`relative min-h-11 overflow-hidden rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50 ${
              confirmingWithdraw
                ? 'border-red-400 bg-red-500/20 text-red-300'
                : 'border-white/10 text-red-400 hover:bg-red-500/10'
            }`}
          >
            {isWithdrawing ? 'Đang thu hồi...' : confirmingWithdraw ? 'Bấm lần nữa để xác nhận' : 'Thu hồi đơn'}
            {/* Thanh co dần trong 4 giây cho thấy còn bao lâu trước khi lời xác nhận tự huỷ
                (dùng lại keyframe carouselProgress trong globals.css, chạy ngược). */}
            {confirmingWithdraw && !isWithdrawing && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-0.5 bg-red-400 motion-reduce:hidden"
                style={{ animation: 'carouselProgress 4s linear reverse forwards' }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-1">Phong cách chính</p>
          {application.primaryStyle ? (
            <p className="text-white">{application.primaryStyle}</p>
          ) : (
            <EmptyFieldNote />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-1">Video speedpaint</p>
          {application.speedpaintVideoUrls && application.speedpaintVideoUrls.length > 0 ? (
            <ul className="space-y-2">
              {application.speedpaintVideoUrls.map((link) => (
                <li key={link}>
                  <LinkChip href={link} icon="play_circle" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyFieldNote />
          )}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">Portfolio links</p>
        {sampleLinks.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {sampleLinks.map((link) => (
              <li key={link} className="min-w-0 max-w-full">
                <LinkChip href={link} icon="link" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyFieldNote />
        )}
      </div>

      {sampleImages.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">Sản phẩm mẫu</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {sampleImages.map((url, sampleIndex) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIndex(2 + sampleIndex)}
                className="relative aspect-square overflow-hidden rounded-xl border border-white/10 transition hover:border-[#A7ACD9]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
              >
                <Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[#C7C5CF] mb-2">CCCD/CMND đã nộp</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 transition hover:border-[#A7ACD9]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
          >
            <Image src={application.idProofUrl} alt="Mặt trước" fill unoptimized className="object-cover" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(1)}
            className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 transition hover:border-[#A7ACD9]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7ACD9]"
          >
            <Image src={application.idProofBackUrl} alt="Mặt sau" fill unoptimized className="object-cover" />
          </button>
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}

export default function BecomeCreatorPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [application, setApplication] = useState<MyCreatorApplicationDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Chờ Zustand persist đọc xong localStorage rồi mới quyết định — kiểm tra
    // isAuthenticated ngay khi mount sẽ luôn thấy false (giá trị mặc định) và
    // đá nhầm người dùng đã đăng nhập ra /login mỗi lần F5 hoặc mở link thẳng.
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

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

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  const isManageable =
    !!application && (application.status === 'Pending' || application.status === 'AdditionalProofRequested');
  const canResubmit = !application || application.status === 'Rejected';

  return (
    // pb-56 trên mobile: chừa chỗ để cuộn nút hành động lên trên cụm nút nổi (AI, ngôn ngữ, báo lỗi) ở góc phải dưới.
    <div className="px-4 pb-56 pt-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">

        {isCheckingStatus ? (
          // Skeleton cùng khung với card kính thật để trang không nhảy bố cục khi dữ liệu về.
          <div
            role="status"
            aria-busy="true"
            className="glass-container mx-auto max-w-3xl space-y-6 rounded-[32px] p-6 md:p-8"
          >
            <div className="space-y-3 motion-safe:animate-pulse" aria-hidden="true">
              <div className="h-8 w-2/3 rounded-xl bg-white/[0.06]" />
              <div className="h-4 w-full rounded-lg bg-white/[0.04]" />
              <div className="h-4 w-4/5 rounded-lg bg-white/[0.04]" />
            </div>
            <div className="flex gap-2 sm:gap-3 motion-safe:animate-pulse" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-1 flex-1 rounded-full bg-white/10" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 motion-safe:animate-pulse" aria-hidden="true">
              <div className="aspect-[16/10] rounded-xl bg-white/[0.04]" />
              <div className="aspect-[16/10] rounded-xl bg-white/[0.04]" />
            </div>
            <p className="text-center text-sm text-[#C7C5CF]">Đang kiểm tra trạng thái đơn của bạn...</p>
          </div>
        ) : (
          <>
            {application && (
              <div
                role="status"
                className={`relative mx-auto mb-8 flex max-w-3xl items-start gap-4 overflow-hidden rounded-3xl border border-t-white/20 p-5 backdrop-blur-xl sm:p-6 ${
                  statusBanner[application.status].className
                } ${application.status === 'Approved' ? 'sm:p-8' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex shrink-0 items-center justify-center rounded-full ${
                    application.status === 'Approved' ? 'h-14 w-14' : 'h-11 w-11'
                  } ${statusBanner[application.status].iconClassName}`}
                >
                  {/* data-no-translate: tên icon (verified, cancel…) là ligature, không được để lớp dịch đổi chữ. */}
                  <span
                    data-no-translate="true"
                    className={`material-symbols-outlined ${application.status === 'Approved' ? 'text-3xl' : 'text-2xl'}`}
                  >
                    {statusBanner[application.status].icon}
                  </span>
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  {/* Khi đơn bị từ chối, wizard bên dưới đã có h1 riêng; các trạng thái khác thì
                      tiêu đề banner chính là tiêu đề trang. */}
                  {(() => {
                    const TitleTag = application.status === 'Rejected' ? 'p' : 'h1';
                    return (
                      <TitleTag
                        className={`font-h1 font-bold text-white ${
                          application.status === 'Approved' ? 'text-xl sm:text-2xl' : 'text-base'
                        }`}
                      >
                        {statusBanner[application.status].title}
                      </TitleTag>
                    );
                  })()}
                  {application.reviewNote && (
                    <p className="mt-2 text-sm text-[#C7C5CF]">
                      <span className="font-semibold text-white">
                        {application.status === 'Rejected' ? 'Lý do: ' : 'Ghi chú từ moderator: '}
                      </span>
                      {application.reviewNote}
                    </p>
                  )}
                  {application.status === 'Pending' && (
                    <p className="mt-2 text-sm text-[#C7C5CF]">
                      Vui lòng chờ Moderator xét duyệt, chúng tôi sẽ thông báo khi có kết quả.
                    </p>
                  )}
                  {application.status === 'Approved' && (
                    <p className="mt-3 text-sm leading-relaxed text-[#C7C5CF]">
                      Bạn có thể bắt đầu thiết lập gian hàng của mình tại{' '}
                      <Link
                        href="/creator-setup"
                        className="mx-0.5 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#A7ACD9] px-4 align-middle text-sm font-bold text-[#1F2335] transition-[background-color,box-shadow] duration-150 hover:bg-[#C2C7F6] hover:shadow-[0_0_18px_rgba(167,172,217,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Creator Setup
                        <span aria-hidden="true" data-no-translate="true" className="material-symbols-outlined text-lg">
                          arrow_forward
                        </span>
                      </Link>
                      .
                    </p>
                  )}
                </div>
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
                initialValues={(() => {
                  const { manualLinks, uploadedImages } = splitPortfolioLinks(application.portfolioLinks);
                  return {
                    idProofUrl: application.idProofUrl,
                    idProofBackUrl: application.idProofBackUrl,
                    portfolioLinks: manualLinks.length > 0 ? manualLinks : [''],
                    portfolioUploads: uploadedImages,
                    primaryStyle: application.primaryStyle ?? '',
                    speedpaintVideoUrls:
                      application.speedpaintVideoUrls && application.speedpaintVideoUrls.length > 0
                        ? application.speedpaintVideoUrls
                        : [''],
                  };
                })()}
                onDone={handleEditDone}
              />
            )}

            {/* Nộp xong ở lại trang: tải lại trạng thái đơn để hiện banner "đang chờ duyệt" và thẻ tóm tắt. */}
            {canResubmit && (
              <CreatorApplicationWizard
                onDone={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setReloadKey((k) => k + 1);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
