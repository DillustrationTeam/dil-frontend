'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Scale,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import type { Commission, CommissionDispute } from '@/types/commission.types';

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  initialDispute?: CommissionDispute | null;
  commission?: Commission | null;
}

const formatMoney = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

function getEvidenceUrls(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return value
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
  }
  return [];
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(url) || url.includes('/uploads/');
}

function parseReason(raw?: string | null): { category: string | null; detail: string } {
  if (!raw) return { category: null, detail: '' };
  const match = raw.match(/^\s*\[([^\]]+)\]\s*([\s\S]*)$/);
  if (!match) return { category: null, detail: raw.trim() };
  return { category: match[1].trim(), detail: match[2].trim() };
}

function getStatusMeta(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'resolved') {
    return {
      label: 'Đã giải quyết',
      badgeClass: 'border-[#2F6B63]/40 bg-[#2F6B63]/15 text-[#2F6B63]',
      isResolved: true,
    };
  }
  if (normalized === 'underreview' || normalized === 'investigating') {
    return {
      label: 'Đang xem xét',
      badgeClass: 'border-[#2C6A86]/40 bg-[#2C6A86]/15 text-[#2C6A86]',
      isResolved: false,
    };
  }
  return {
    label: status === 'Open' ? 'Chờ xử lý' : status || 'Chờ xử lý',
    badgeClass: 'border-[#8A6A1F]/40 bg-[#8A6A1F]/15 text-[#8A6A1F]',
    isResolved: false,
  };
}

export default function DisputeDetailsModal({
  isOpen,
  onClose,
  commissionId,
  initialDispute,
  commission,
}: DisputeDetailsModalProps) {
  const [dispute, setDispute] = useState<CommissionDispute | null>(initialDispute ?? null);
  const [loading, setLoading] = useState(!initialDispute);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    commissionService
      .getDispute(commissionId)
      .then((result) => {
        if (active) setDispute(result);
      })
      .catch(() => {
        if (active && !initialDispute) setError('Không tải được hồ sơ tranh chấp.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [commissionId, initialDispute, isOpen]);

  if (!isOpen) return null;

  const evidenceUrls = getEvidenceUrls(dispute?.evidenceUrls);
  const { category, detail } = parseReason(dispute?.reason);
  const statusMeta = getStatusMeta(dispute?.status);

  const raisedByLabel = (() => {
    if (!dispute?.raisedById) return 'Thành viên đơn hàng';
    if (commission?.clientId && dispute.raisedById === commission.clientId) {
      return `Khách hàng (@${commission.clientName || 'Client'})`;
    }
    if (commission) {
      return `Họa sĩ (${commission.creatorName || 'chưa rõ'})`;
    }
    return `ID #${dispute.raisedById.slice(0, 8).toUpperCase()}`;
  })();

  const steps = [
    { label: 'Tiếp nhận khiếu nại', done: true, active: false },
    { label: 'Trọng tài xem xét', done: statusMeta.isResolved, active: !statusMeta.isResolved },
    { label: 'Phán quyết & Giải ngân', done: statusMeta.isResolved, active: false },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F0E7D8]/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#F0E7D8] bg-[#FFFCF6] text-[#241F1A] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#F0E7D8] bg-[#FFFCF6]/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8A6A1F]">
                <Scale className="h-3.5 w-3.5" /> Hồ sơ tranh chấp </span>
              {dispute?.id && (
                <span className="font-mono text-[11px] text-[#746A5F]">
                  #DSP-{dispute.id.slice(0, 8).toUpperCase()}
                </span>
              )}
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 id="dispute-details-title" className="mt-1.5 truncate font-h1 text-base font-bold text-[#241F1A]">
              {commission?.title || `Commission #${commissionId.slice(0, 8).toUpperCase()}`}
            </h2>
            <p className="mt-0.5 text-xs text-[#746A5F]">
              Mã đơn: #CMD-{commissionId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hồ sơ tranh chấp"
            className="rounded-lg p-1.5 text-[#746A5F] transition hover:bg-[#FFFCF6] hover:text-[#241F1A]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="divide-y divide-[#F0E7D8]">
          {loading ? (
            <p className="py-12 text-center text-sm text-[#746A5F]">Đang tải hồ sơ tranh chấp…</p>
          ) : error ? (
            <p role="alert" className="flex items-center justify-center gap-2 py-10 text-sm text-[#A8321C]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : dispute ? (
            <>
              {/* Stepper tiến trình */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-2">
                  {steps.map((step, index) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          step.done
                            ? 'bg-[#2F6B63]/20 text-[#2F6B63]'
                            : step.active
                              ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] ring-1 ring-[#8A6A1F]/40'
                              : 'bg-[#FFFCF6] text-[#746A5F]'
                        }`}
                      >
                        {step.done ? '✓' : index + 1}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          step.done ? 'text-[#2F6B63]' : step.active ? 'text-[#8A6A1F] font-semibold' : 'text-[#746A5F]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin tổng quan */}
              <dl className="grid gap-4 px-6 py-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#746A5F]">
                    <UserCheck className="h-3.5 w-3.5 text-[#B24A26]" /> Người khiếu nại </dt>
                  <dd className="mt-1 text-xs font-semibold text-[#241F1A]">{raisedByLabel}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#746A5F]">
                    <Clock3 className="h-3.5 w-3.5 text-[#B24A26]" /> Thời gian gửi </dt>
                  <dd className="mt-1 text-xs font-semibold text-[#241F1A]">
                    {new Date(dispute.createdAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#746A5F]">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#8A6A1F]" /> Ký quỹ tạm giữ </dt>
                  <dd className="mt-1 text-xs font-bold text-[#8A6A1F]">
                    {commission?.escrowHeldAmount != null
                      ? formatMoney(commission.escrowHeldAmount)
                      : 'Đang tạm khóa'}
                  </dd>
                </div>
              </dl>

              {/* Lý do & mô tả chi tiết */}
              <div className="space-y-2.5 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#746A5F]">
                    <FileText className="h-3.5 w-3.5 text-[#B24A26]" /> Nội dung khiếu nại </h3>
                  {category && (
                    <span className="rounded-md border border-[#A8321C]/35 bg-[#A8321C]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#A8321C]">
                      {category}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-[#FFFCF6] p-4 text-sm leading-6 text-[#6E6459]">
                  {detail || dispute.reason}
                </p>
              </div>

              {/* Bằng chứng */}
              <div className="space-y-3 px-6 py-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#746A5F]">
                  Bằng chứng đính kèm ({evidenceUrls.length})
                </h3>
                {evidenceUrls.length > 0 ? (
                  <div className="space-y-3">
                    {evidenceUrls.some(isImageUrl) && (
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {evidenceUrls.filter(isImageUrl).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]"
                          >
                            <img
                              src={url}
                              alt="Bằng chứng tranh chấp"
                              className="h-28 w-full object-cover transition group-hover:scale-105"
                            />
                            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-[#E5D8C2] px-1.5 py-0.5 text-[10px] text-[#241F1A]"> Mở ảnh </span>
                          </a>
                        ))}
                      </div>
                    )}
                    {evidenceUrls.filter((u) => !isImageUrl(u)).length > 0 && (
                      <ul className="space-y-1.5">
                        {evidenceUrls
                          .filter((u) => !isImageUrl(u))
                          .map((url) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-full items-center gap-2 break-all text-xs text-[#8C3718] underline hover:text-[#241F1A]"
                              >
                                <span>{url}</span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              </a>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#746A5F]"> Chưa có tệp/liên kết bằng chứng đính kèm. Trọng tài vẫn có thể đối chiếu lịch sử trò chuyện và các bản WIP trong phòng làm việc. </p>
                )}
              </div>

              {/* Phán quyết hoặc thông báo trạng thái chờ */}
              {dispute.resolution || statusMeta.isResolved || dispute.adminNote ? (
                <div className="space-y-2.5 bg-[#2F6B63]/10/[0.04] px-6 py-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2F6B63]">
                    <CheckCircle2 className="h-4 w-4" />
                    Kết quả xử lý &amp; Phán quyết trọng tài
                  </h3>
                  {dispute.resolution && (
                    <p className="text-sm font-semibold text-[#241F1A]">Quyết định: {dispute.resolution}</p>
                  )}
                  {dispute.adminNote && (
                    <p className="whitespace-pre-wrap rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3 text-sm text-[#6E6459]">
                      <strong className="text-[#241F1A]">Ghi chú phán quyết:</strong> {dispute.adminNote}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 pt-1 text-xs text-[#746A5F]">
                    {dispute.clientRefundAmount != null && (
                      <span>
                        Hoàn khách:{' '}
                        <strong className="text-[#241F1A]">{formatMoney(dispute.clientRefundAmount)}</strong>
                      </span>
                    )}
                    {dispute.artistPayAmount != null && (
                      <span>
                        Họa sĩ nhận:{' '}
                        <strong className="text-[#241F1A]">{formatMoney(dispute.artistPayAmount)}</strong>
                      </span>
                    )}
                    {dispute.resolvedAt && (
                      <span className="text-[#746A5F]">
                        Giải quyết lúc: {new Date(dispute.resolvedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#8A6A1F]/10/[0.05] px-6 py-4 text-xs leading-5 text-[#8A6A1F]">
                  <strong>Trạng thái bảo vệ ký quỹ:</strong> Tiền ký quỹ đang được hệ thống tạm khóa an toàn. Trọng tài sàn sẽ xem xét lịch sử trao đổi, tiến độ các mốc và bằng chứng liên quan trước khi đưa ra phán quyết cuối cùng. </div>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-[#746A5F]">Đơn này chưa có hồ sơ tranh chấp.</p>
          )}
        </div>

        <footer className="flex justify-end border-t border-[#F0E7D8] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-[#6E6459] transition hover:bg-[#FFFCF6]"
          > Đóng </button>
        </footer>
      </section>
    </div>
  );
}
