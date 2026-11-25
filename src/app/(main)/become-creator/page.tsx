'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock, ExternalLink, Hourglass, ShieldCheck, XCircle } from 'lucide-react';
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
  { className: string; iconClassName: string; icon: React.ReactNode; title: string }
> = {
  Pending: {
    className: 'border-[#B24A26]/30 bg-[#B24A26]/[0.06]',
    iconClassName: 'bg-[#B24A26]/15 text-[#B24A26]',
    icon: <Hourglass size={26} aria-hidden />,
    title: 'Đơn của bạn đang chờ duyệt',
  },
  AdditionalProofRequested: {
    className: 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10/[0.06]',
    iconClassName: 'bg-[#8A6A1F]/15 text-[#8A6A1F]',
    icon: <Clock size={26} aria-hidden />,
    title: 'Kiểm duyệt viên yêu cầu bổ sung hồ sơ',
  },
  Rejected: {
    className: 'border-[#A8321C]/40 bg-[#A8321C]/10/[0.06]',
    iconClassName: 'bg-[#A8321C]/15 text-[#A8321C]',
    icon: <XCircle size={26} aria-hidden />,
    title: 'Đơn của bạn đã bị từ chối',
  },
  Approved: {
    className:
      'border-[#2F6B63]/40 bg-[#2F6B63]/10/[0.06] shadow-[0_15px_35px_rgba(0,0,0,0.35),0_0_25px_rgba(167,172,217,0.12)]',
    iconClassName: 'bg-[#2F6B63]/15 text-[#2F6B63] shadow-[0_0_18px_rgba(52,211,153,0.25)]',
    icon: <ShieldCheck size={26} aria-hidden />,
    title: 'Bạn đã là họa sĩ!',
  },
};

// Link ngoài hiển thị dạng chip: icon + tên miền nổi bật + phần đường dẫn mờ, cắt gọn trên một dòng.
// Toàn bộ URL vẫn nằm trong href và title nên không mất thông tin.
function LinkChip({ href, icon }: { href: string; icon: React.ReactNode }) {
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
      className="group inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 text-sm transition-colors hover:border-[#B24A26]/40 hover:bg-[#B24A26]/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B24A26]"
    >
      {icon}
      <span className="min-w-0 truncate" data-no-translate="true">
        <span className="font-semibold text-[#241F1A]">{host}</span>
        {rest && <span className="text-[#6E6459]">{rest}</span>}
      </span>
      <ExternalLink size={16} className="shrink-0 text-[#6E6459] transition-colors group-hover:text-[#B24A26]" aria-hidden />
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
        <h2 className="font-h1 text-xl font-bold text-[#241F1A]">Đơn hiện tại của bạn</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 rounded-xl border border-[#221E1A]/10 px-4 py-2 text-sm font-semibold text-[#B24A26] transition-colors hover:border-[#B24A26]/40 hover:bg-[#FFFCF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B24A26]"
          > Sửa đơn </button>
          <button
            type="button"
            onClick={handleWithdrawClick}
            disabled={isWithdrawing}
            className={`relative min-h-11 overflow-hidden rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8321C]/30 disabled:opacity-50 ${
              confirmingWithdraw
                ? 'border-[#A8321C]/30 bg-[#A8321C]/20 text-[#A8321C]'
                : 'border-[#221E1A]/10 text-[#A8321C] hover:bg-[#A8321C]/10'
            }`}
          >
            {isWithdrawing ? 'Đang thu hồi...' : confirmingWithdraw ? 'Bấm lần nữa để xác nhận' : 'Thu hồi đơn'}
            {/* Thanh co dần trong 4 giây cho thấy còn bao lâu trước khi lời xác nhận tự huỷ
                (dùng lại keyframe carouselProgress trong globals.css, chạy ngược). */}
            {confirmingWithdraw && !isWithdrawing && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-0.5 bg-[#A8321C]/10 motion-reduce:hidden"
                style={{ animation: 'carouselProgress 4s linear reverse forwards' }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6E6459] mb-1">Phong cách chính</p>
          {application.primaryStyle ? (
            <p className="text-[#241F1A]">{application.primaryStyle}</p>
          ) : (
            <EmptyFieldNote />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6E6459] mb-1">Video speedpaint</p>
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
        <p className="text-xs uppercase tracking-wider text-[#6E6459] mb-2">Portfolio links</p>
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
          <p className="text-xs uppercase tracking-wider text-[#6E6459] mb-2">Sản phẩm mẫu</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {sampleImages.map((url, sampleIndex) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIndex(2 + sampleIndex)}
                className="relative aspect-square overflow-hidden rounded-xl border border-[#221E1A]/10 transition hover:border-[#B24A26]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B24A26]"
              >
                <Image src={url} alt="Portfolio sample" fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[#6E6459] mb-2">CCCD/CMND đã nộp</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#221E1A]/10 transition hover:border-[#B24A26]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B24A26]"
          >
            <Image src={application.idProofUrl} alt="Mặt trước" fill unoptimized className="object-cover" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(1)}
            className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#221E1A]/10 transition hover:border-[#B24A26]/40 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B24A26]"
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
              <div className="h-8 w-2/3 rounded-xl bg-[#FFFCF6]" />
              <div className="h-4 w-full rounded-lg bg-[#FFFCF6]" />
              <div className="h-4 w-4/5 rounded-lg bg-[#FFFCF6]" />
            </div>
            <div className="flex gap-2 sm:gap-3 motion-safe:animate-pulse" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-1 flex-1 rounded-full bg-[#F0E7D8]" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 motion-safe:animate-pulse" aria-hidden="true">
              <div className="aspect-[16/10] rounded-xl bg-[#FFFCF6]" />
              <div className="aspect-[16/10] rounded-xl bg-[#FFFCF6]" />
            </div>
            <p className="text-center text-sm text-[#6E6459]">Đang kiểm tra trạng thái đơn của bạn...</p>
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
                  {statusBanner[application.status].icon}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  {/* Khi đơn bị từ chối, wizard bên dưới đã có h1 riêng; các trạng thái khác thì
                      tiêu đề banner chính là tiêu đề trang. */}
                  {(() => {
                    const TitleTag = application.status === 'Rejected' ? 'p' : 'h1';
                    return (
                      <TitleTag
                        className={`font-h1 font-bold text-[#241F1A] ${
                          application.status === 'Approved' ? 'text-xl sm:text-2xl' : 'text-base'
                        }`}
                      >
                        {statusBanner[application.status].title}
                      </TitleTag>
                    );
                  })()}
                  {application.reviewNote && (
                    <p className="mt-2 text-sm text-[#6E6459]">
                      <span className="font-semibold text-[#241F1A]">
                        {application.status === 'Rejected' ? 'Lý do: ' : 'Ghi chú từ kiểm duyệt viên: '}
                      </span>
                      {application.reviewNote}
                    </p>
                  )}
                  {application.status === 'Pending' && (
                    <p className="mt-2 text-sm text-[#6E6459]"> Vui lòng chờ kiểm duyệt viên xét duyệt, chúng tôi sẽ thông báo khi có kết quả. </p>
                  )}
                  {application.status === 'Approved' && (
                    <p className="mt-3 text-sm leading-relaxed text-[#6E6459]">
                      Bạn có thể bắt đầu thiết lập gian hàng của mình tại{' '}
                      <Link
                        href="/creator-setup"
                        className="mx-0.5 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#B24A26] px-4 align-middle text-sm font-bold text-[#F7F2E9] transition-[background-color,box-shadow] duration-150 hover:bg-[#8C3718] hover:shadow-[0_0_18px_rgba(167,172,217,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Creator Setup
                        <ArrowRight size={18} aria-hidden />
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
