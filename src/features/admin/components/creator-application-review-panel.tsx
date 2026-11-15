'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { creatorApplicationReviewService } from '@/features/admin/services/creator-application-review.service';
import { isPortfolioImageUrl } from '@/lib/portfolio-link';
import { EmptyFieldNote } from '@/components/empty-field-note';
import { ImageLightbox, LightboxImage } from '@/components/image-lightbox';
import {
  ApplicationStatusName,
  ApplicationStatusValue,
  CreatorApplicationDto,
  ListApplicationsMeta,
} from '@/features/admin/types/creator-application-review.types';
import { useLanguage } from '@/context/language-context';

const statusBadgeClass: Record<ApplicationStatusName, string> = {
  Pending: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  AdditionalProofRequested: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const getStatusLabel = (status: ApplicationStatusName, isVie: boolean) => {
  switch (status) {
    case 'Pending':
      return isVie ? 'Chờ duyệt' : 'Pending';
    case 'AdditionalProofRequested':
      return isVie ? 'Cần bổ sung' : 'Additional Proof';
    case 'Approved':
      return isVie ? 'Đã duyệt' : 'Approved';
    case 'Rejected':
      return isVie ? 'Đã từ chối' : 'Rejected';
    default:
      return status;
  }
};

type PendingAction = 'reject' | 'more-proof' | null;

export function CreatorApplicationReviewPanel() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const tabs: Array<{ key: ApplicationStatusName | 'All'; label: string }> = [
    { key: 'Pending', label: isVie ? 'Chờ duyệt' : 'Pending' },
    { key: 'AdditionalProofRequested', label: isVie ? 'Cần thêm minh chứng' : 'Additional Proof' },
    { key: 'Approved', label: isVie ? 'Đã duyệt' : 'Approved' },
    { key: 'Rejected', label: isVie ? 'Đã từ chối' : 'Rejected' },
    { key: 'All', label: isVie ? 'Tất cả' : 'All' },
  ];

  const [statusFilter, setStatusFilter] = useState<ApplicationStatusName | 'All'>('Pending');
  const [applications, setApplications] = useState<CreatorApplicationDto[]>([]);
  const [meta, setMeta] = useState<ListApplicationsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [grantBadge, setGrantBadge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) ?? null,
    [applications, selectedId]
  );

  // Gộp tất cả ảnh của đơn (CCCD trước/sau + sản phẩm mẫu upload) thành 1 gallery để
  // moderator bấm xem phóng to và dùng mũi tên duyệt qua hết ảnh của đơn đó.
  const galleryImages = useMemo<LightboxImage[]>(() => {
    if (!selectedApplication) return [];
    return [
      { src: selectedApplication.idProofUrl, alt: 'Mặt trước CCCD' },
      { src: selectedApplication.idProofBackUrl, alt: 'Mặt sau CCCD' },
      ...selectedApplication.portfolioLinks
        .filter((link) => isPortfolioImageUrl(link))
        .map((link) => ({ src: link, alt: 'Portfolio sample' })),
    ];
  }, [selectedApplication]);

  useEffect(() => {
    const loadApplications = async () => {
      setIsLoading(true);
      try {
        const result = await creatorApplicationReviewService.listApplications(statusFilter, page, 10);
        setApplications(result.items);
        setMeta(result.meta);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load applications.');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [statusFilter, page, reloadKey]);

  const resetSelection = () => {
    setSelectedId(null);
    setReviewNote('');
    setPendingAction(null);
    setGrantBadge(true);
    setLightboxIndex(null);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setReviewNote('');
    setPendingAction(null);
    setGrantBadge(true);
    setLightboxIndex(null);
  };

  const submitReview = async (status: number, note?: string) => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await creatorApplicationReviewService.reviewApplication(selectedApplication.id, {
        status,
        reviewNote: note,
        grantAiVerifiedBadge: grantBadge,
      });
      toast.success('Đã cập nhật kết quả duyệt đơn.');
      resetSelection();
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => submitReview(ApplicationStatusValue.Approved);

  const handleConfirmNote = () => {
    if (!reviewNote.trim()) {
      toast.error('Vui lòng nhập lý do trước khi xác nhận.');
      return;
    }
    if (pendingAction === 'reject') {
      submitReview(ApplicationStatusValue.Rejected, reviewNote.trim());
    } else if (pendingAction === 'more-proof') {
      submitReview(ApplicationStatusValue.AdditionalProofRequested, reviewNote.trim());
    }
  };

  const canReview =
    selectedApplication?.status === 'Pending' || selectedApplication?.status === 'AdditionalProofRequested';

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-300">{isVie ? 'Quản trị · SCR-21' : 'Admin · SCR-21'}</p>
          <h1 className="font-h1 mt-2 text-2xl font-extrabold text-white">
            {isVie ? 'Kiểm duyệt & Xác minh Hồ sơ Họa sĩ' : 'Creator Verification & Application Queue'}
          </h1>
        </div>
        {meta && (
          <span className="w-fit rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
            {isVie ? `${meta.pendingCount} Hồ sơ chờ duyệt` : `${meta.pendingCount} Applicants Pending`}
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
              resetSelection();
            }}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
              statusFilter === tab.key
                ? 'border-red-500/40 bg-red-500/20 text-red-300'
                : 'border-white/10 text-[#8A8FA9] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Danh sách đơn */}
        <div className="glass-container flex min-h-[420px] flex-col rounded-3xl border border-white/10 p-4 lg:col-span-5">
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-[#8A8FA9]">
              <p>{isVie ? 'Đang tải danh sách...' : 'Loading...'}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-[#8A8FA9]">
              <p>{isVie ? 'Không có đơn nào ở trạng thái này.' : 'No applications with this status.'}</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between">
              <ul className="space-y-2">
                {applications.map((application) => (
                  <li key={application.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(application.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedId === application.id
                          ? 'border-red-500/40 bg-red-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white">{application.applicantName}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass[application.status]}`}
                        >
                          {getStatusLabel(application.status, isVie)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#8A8FA9]">{application.applicantEmail}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#8A8FA9]">
                        {application.primaryStyle ?? (isVie ? 'Chưa ghi phong cách' : 'No style specified')} · {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>

              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-xs text-[#8A8FA9]">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40"
                  >
                    {isVie ? 'Trước' : 'Previous'}
                  </button>
                  <span>
                    {isVie ? `Trang ${meta.page} / ${meta.totalPages}` : `Page ${meta.page} / ${meta.totalPages}`}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40"
                  >
                    {isVie ? 'Sau' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chi tiết đơn */}
        <div className="glass-container flex min-h-[420px] flex-col rounded-3xl border border-white/10 p-6 lg:col-span-7">
          {!selectedApplication ? (
            <div className="flex flex-1 items-center justify-center py-16 text-center text-sm text-[#8A8FA9]">
              <p>{isVie ? 'Chọn 1 đơn để xem chi tiết.' : 'Select an application to view details.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-h1 text-lg font-bold text-white">{selectedApplication.applicantName}</h3>
                  <p className="text-xs text-[#8A8FA9]">
                    {selectedApplication.applicantEmail} · {selectedApplication.primaryStyle ?? (isVie ? 'Chưa ghi phong cách' : 'No style specified')}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass[selectedApplication.status]}`}
                >
                  {getStatusLabel(selectedApplication.status, isVie)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-white">{isVie ? 'Ảnh CCCD/CMND' : 'ID Proof Documents'}</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 transition hover:opacity-90"
                  >
                    <Image src={selectedApplication.idProofUrl} alt={isVie ? 'Mặt trước CCCD' : 'ID Front'} fill unoptimized className="object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(1)}
                    className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 transition hover:opacity-90"
                  >
                    <Image src={selectedApplication.idProofBackUrl} alt={isVie ? 'Mặt sau CCCD' : 'ID Back'} fill unoptimized className="object-cover" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-white">{isVie ? 'Phong cách chính' : 'Primary Style'}</span>
                {selectedApplication.primaryStyle ? (
                  <p className="text-xs text-[#A7ACD9]">{selectedApplication.primaryStyle}</p>
                ) : (
                  <EmptyFieldNote />
                )}
              </div>

              <div className="space-y-3">
                {selectedApplication.portfolioLinks.some((link) => isPortfolioImageUrl(link)) && (
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-white">{isVie ? 'Sản phẩm mẫu (ảnh upload)' : 'Sample Artworks'}</span>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {selectedApplication.portfolioLinks
                        .filter((link) => isPortfolioImageUrl(link))
                        .map((link, sampleIndex) => (
                          <button
                            key={link}
                            type="button"
                            onClick={() => setLightboxIndex(2 + sampleIndex)}
                            className="relative aspect-square overflow-hidden rounded-xl border border-white/10 transition hover:opacity-90"
                          >
                            <Image src={link} alt="Portfolio sample" fill unoptimized className="object-cover" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-white">{isVie ? 'Liên kết Portfolio (Behance/ArtStation...)' : 'Portfolio Links'}</span>
                  {selectedApplication.portfolioLinks.some((link) => !isPortfolioImageUrl(link)) ? (
                    <ul className="space-y-1 text-xs">
                      {selectedApplication.portfolioLinks
                        .filter((link) => !isPortfolioImageUrl(link))
                        .map((link) => (
                          <li key={link}>
                            <a href={link} target="_blank" rel="noreferrer" className="text-[#A7ACD9] hover:underline break-all">
                              {link}
                            </a>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <EmptyFieldNote />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-white">{isVie ? 'Video Speedpaint minh chứng' : 'Speedpaint proof'}</span>
                {selectedApplication.speedpaintVideoUrls && selectedApplication.speedpaintVideoUrls.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {selectedApplication.speedpaintVideoUrls.map((link) => (
                      <li key={link}>
                        <a href={link} target="_blank" rel="noreferrer" className="text-[#A7ACD9] hover:underline break-all">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyFieldNote />
                )}
              </div>

              {selectedApplication.socialLinks && selectedApplication.socialLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-white">{isVie ? 'Mạng xã hội' : 'Social links'}</span>
                  <ul className="space-y-1 text-xs">
                    {selectedApplication.socialLinks.map((link) => (
                      <li key={link}>
                        <a href={link} target="_blank" rel="noreferrer" className="text-[#A7ACD9] hover:underline break-all">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!canReview && selectedApplication.reviewedByModName && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-[#8A8FA9]">
                  <p>
                    {isVie ? 'Đã duyệt bởi ' : 'Reviewed by '}
                    <span className="text-white">{selectedApplication.reviewedByModName}</span>{' '}
                    {isVie ? 'lúc ' : 'at '}
                    {selectedApplication.reviewedAt && new Date(selectedApplication.reviewedAt).toLocaleString('vi-VN')}
                  </p>
                  {selectedApplication.reviewNote && <p className="mt-1">{isVie ? 'Ghi chú: ' : 'Note: '}{selectedApplication.reviewNote}</p>}
                </div>
              )}

              {canReview && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <label className="flex items-center gap-2 text-xs text-[#8A8FA9]">
                    <input
                      type="checkbox"
                      checked={grantBadge}
                      onChange={(event) => setGrantBadge(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5"
                    />
                    {isVie ? 'Cấp huy hiệu xác thực vẽ tay (IsAiVerified) khi duyệt' : 'Grant AI-verified badge on approval'}
                  </label>

                  {pendingAction && (
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-[#8A8FA9]">
                        {isVie
                          ? `Lý do ${pendingAction === 'reject' ? 'từ chối' : 'yêu cầu bổ sung'} (bắt buộc)`
                          : `Reason for ${pendingAction === 'reject' ? 'rejection' : 'additional proof'} (required)`}
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400"
                        placeholder={isVie ? 'Nhập lý do...' : 'Enter reason...'}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {!pendingAction ? (
                      <>
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={isSubmitting}
                          className="flex-1 rounded-2xl bg-emerald-400 py-3.5 text-sm font-extrabold text-black transition hover:bg-emerald-300 disabled:opacity-60"
                        >
                          {isVie ? '✓ Phê duyệt & Cấp quyền Họa sĩ' : '✓ Approve & Grant Creator Role'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction('more-proof')}
                          disabled={isSubmitting}
                          className="rounded-2xl border border-amber-500/40 bg-amber-500/20 px-5 py-3.5 text-sm font-bold text-amber-300 hover:bg-amber-500/30 disabled:opacity-60"
                        >
                          {isVie ? 'Yêu cầu thêm minh chứng' : 'Request Additional Proof'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction('reject')}
                          disabled={isSubmitting}
                          className="rounded-2xl border border-red-500/40 bg-red-500/20 px-5 py-3.5 text-sm font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-60"
                        >
                          {isVie ? 'Từ chối' : 'Reject'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleConfirmNote}
                          disabled={isSubmitting}
                          className="flex-1 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-[#1F2335] disabled:opacity-60"
                        >
                          {isSubmitting ? (isVie ? 'Đang gửi...' : 'Submitting...') : (isVie ? 'Xác nhận' : 'Confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingAction(null);
                            setReviewNote('');
                          }}
                          className="rounded-2xl border border-white/10 px-5 py-3.5 text-sm text-white"
                        >
                          {isVie ? 'Huỷ' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && galleryImages.length > 0 && (
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
