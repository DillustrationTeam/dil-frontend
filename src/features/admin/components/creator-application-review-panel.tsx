'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { creatorApplicationReviewService } from '@/features/admin/services/creator-application-review.service';
import {
  ApplicationStatusName,
  ApplicationStatusValue,
  CreatorApplicationDto,
  ListApplicationsMeta,
} from '@/features/admin/types/creator-application-review.types';

const tabs: Array<{ key: ApplicationStatusName | 'All'; label: string }> = [
  { key: 'Pending', label: 'Pending' },
  { key: 'AdditionalProofRequested', label: 'Additional Proof' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'All', label: 'All' },
];

const statusBadgeClass: Record<ApplicationStatusName, string> = {
  Pending: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  AdditionalProofRequested: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

type PendingAction = 'reject' | 'more-proof' | null;

// portfolioLinks gộp chung 2 nguồn: link ứng viên tự dán (Behance/ArtStation...) và URL ảnh
// mẫu họ upload lên Cloudinary — backend chỉ có 1 mảng string, không phân biệt loại.
// Nhận diện link nào là ảnh (từ Cloudinary hoặc đuôi file ảnh) để hiện thumbnail thay vì text link.
function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || url.includes('res.cloudinary.com');
}

export function CreatorApplicationReviewPanel() {
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

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) ?? null,
    [applications, selectedId]
  );

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
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setReviewNote('');
    setPendingAction(null);
    setGrantBadge(true);
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
          <p className="text-xs uppercase tracking-[0.2em] text-red-300">Admin · SCR-21</p>
          <h1 className="font-h1 mt-2 text-2xl font-extrabold text-white">Creator Verification & Application Queue</h1>
        </div>
        {meta && (
          <span className="w-fit rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
            {meta.pendingCount} Applicants Pending
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
        <div className="glass-container rounded-3xl border border-white/10 p-4 lg:col-span-5">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-[#8A8FA9]">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="p-6 text-center text-sm text-[#8A8FA9]">Không có đơn nào ở trạng thái này.</p>
          ) : (
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
                        {application.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#8A8FA9]">{application.applicantEmail}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#8A8FA9]">
                      {application.primaryStyle ?? 'Chưa ghi phong cách'} · {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-[#8A8FA9]">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Chi tiết đơn */}
        <div className="glass-container rounded-3xl border border-white/10 p-6 lg:col-span-7">
          {!selectedApplication ? (
            <p className="py-16 text-center text-sm text-[#8A8FA9]">Chọn 1 đơn để xem chi tiết.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-h1 text-lg font-bold text-white">{selectedApplication.applicantName}</h3>
                  <p className="text-xs text-[#8A8FA9]">
                    {selectedApplication.applicantEmail} · {selectedApplication.primaryStyle ?? 'Chưa ghi phong cách'}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass[selectedApplication.status]}`}
                >
                  {selectedApplication.status}
                </span>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-white">Ảnh CCCD/CMND</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10">
                    <Image src={selectedApplication.idProofUrl} alt="Mặt trước CCCD" fill unoptimized className="object-cover" />
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10">
                    <Image src={selectedApplication.idProofBackUrl} alt="Mặt sau CCCD" fill unoptimized className="object-cover" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedApplication.portfolioLinks.some((link) => isImageUrl(link)) && (
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-white">Sản phẩm mẫu (ảnh upload)</span>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {selectedApplication.portfolioLinks
                        .filter((link) => isImageUrl(link))
                        .map((link) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="relative aspect-square overflow-hidden rounded-xl border border-white/10"
                          >
                            <Image src={link} alt="Portfolio sample" fill unoptimized className="object-cover" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {selectedApplication.portfolioLinks.some((link) => !isImageUrl(link)) && (
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-white">Link Portfolio (Behance/ArtStation...)</span>
                    <ul className="space-y-1 text-xs">
                      {selectedApplication.portfolioLinks
                        .filter((link) => !isImageUrl(link))
                        .map((link) => (
                          <li key={link}>
                            <a href={link} target="_blank" rel="noreferrer" className="text-[#A7ACD9] hover:underline break-all">
                              {link}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedApplication.speedpaintVideoUrl && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-white">Speedpaint proof</span>
                  <a
                    href={selectedApplication.speedpaintVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#A7ACD9] hover:underline break-all"
                  >
                    {selectedApplication.speedpaintVideoUrl}
                  </a>
                </div>
              )}

              {selectedApplication.socialLinks && selectedApplication.socialLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-white">Social links</span>
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
                    Đã duyệt bởi <span className="text-white">{selectedApplication.reviewedByModName}</span> lúc{' '}
                    {selectedApplication.reviewedAt && new Date(selectedApplication.reviewedAt).toLocaleString('vi-VN')}
                  </p>
                  {selectedApplication.reviewNote && <p className="mt-1">Ghi chú: {selectedApplication.reviewNote}</p>}
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
                    Cấp huy hiệu xác thực vẽ tay (IsAiVerified) khi duyệt
                  </label>

                  {pendingAction && (
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-[#8A8FA9]">
                        Lý do {pendingAction === 'reject' ? 'từ chối' : 'yêu cầu bổ sung'} (bắt buộc)
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400"
                        placeholder="Nhập lý do..."
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
                          ✓ Approve & Grant Creator Role
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction('more-proof')}
                          disabled={isSubmitting}
                          className="rounded-2xl border border-amber-500/40 bg-amber-500/20 px-5 py-3.5 text-sm font-bold text-amber-300 hover:bg-amber-500/30 disabled:opacity-60"
                        >
                          Request Additional Proof
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction('reject')}
                          disabled={isSubmitting}
                          className="rounded-2xl border border-red-500/40 bg-red-500/20 px-5 py-3.5 text-sm font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-60"
                        >
                          Reject
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
                          {isSubmitting ? 'Đang gửi...' : 'Xác nhận'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingAction(null);
                            setReviewNote('');
                          }}
                          className="rounded-2xl border border-white/10 px-5 py-3.5 text-sm text-white"
                        >
                          Huỷ
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
    </div>
  );
}
