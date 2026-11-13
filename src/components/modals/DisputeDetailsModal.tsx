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
      badgeClass: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200',
      isResolved: true,
    };
  }
  if (normalized === 'underreview' || normalized === 'investigating') {
    return {
      label: 'Đang xem xét',
      badgeClass: 'border-sky-400/30 bg-sky-400/15 text-sky-200',
      isResolved: false,
    };
  }
  return {
    label: status === 'Open' ? 'Chờ xử lý' : status || 'Chờ xử lý',
    badgeClass: 'border-amber-300/30 bg-amber-300/15 text-amber-200',
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
      return `Họa sĩ (@${commission.creatorName || 'Creator'})`;
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E2536] bg-[#161927] text-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#1E2536] bg-[#161927]/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Scale className="h-3.5 w-3.5" />
                Hồ sơ tranh chấp
              </span>
              {dispute?.id && (
                <span className="font-mono text-[11px] text-slate-400">
                  #DSP-{dispute.id.slice(0, 8).toUpperCase()}
                </span>
              )}
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 id="dispute-details-title" className="mt-1.5 truncate font-h1 text-base font-bold text-white">
              {commission?.title || `Commission #${commissionId.slice(0, 8).toUpperCase()}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Mã đơn: #CMD-{commissionId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hồ sơ tranh chấp"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="divide-y divide-[#1E2536]">
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Đang tải hồ sơ tranh chấp…</p>
          ) : error ? (
            <p role="alert" className="flex items-center justify-center gap-2 py-10 text-sm text-rose-300">
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
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : step.active
                              ? 'bg-amber-300/20 text-amber-200 ring-1 ring-amber-300/50'
                              : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {step.done ? '✓' : index + 1}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          step.done ? 'text-emerald-200' : step.active ? 'text-amber-100 font-semibold' : 'text-slate-500'
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
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <UserCheck className="h-3.5 w-3.5 text-[#A7ACD9]" />
                    Người khiếu nại
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-white">{raisedByLabel}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <Clock3 className="h-3.5 w-3.5 text-[#A7ACD9]" />
                    Thời gian gửi
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-white">
                    {new Date(dispute.createdAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
                    Ký quỹ tạm giữ
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-amber-200">
                    {commission?.escrowHeldAmount != null
                      ? formatMoney(commission.escrowHeldAmount)
                      : 'Đang tạm khóa'}
                  </dd>
                </div>
              </dl>

              {/* Lý do & mô tả chi tiết */}
              <div className="space-y-2.5 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-[#A7ACD9]" />
                    Nội dung khiếu nại
                  </h3>
                  {category && (
                    <span className="rounded-md border border-rose-400/25 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
                      {category}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-white/[0.03] p-4 text-sm leading-6 text-slate-100">
                  {detail || dispute.reason}
                </p>
              </div>

              {/* Bằng chứng */}
              <div className="space-y-3 px-6 py-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                          >
                            <img
                              src={url}
                              alt="Bằng chứng tranh chấp"
                              className="h-28 w-full object-cover transition group-hover:scale-105"
                            />
                            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                              Mở ảnh
                            </span>
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
                                className="inline-flex max-w-full items-center gap-2 break-all text-xs text-[#C5C9F8] underline hover:text-white"
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
                  <p className="text-xs text-slate-400">
                    Chưa có tệp/liên kết bằng chứng đính kèm. Trọng tài vẫn có thể đối chiếu lịch sử chat và các bản WIP trong Workroom.
                  </p>
                )}
              </div>

              {/* Phán quyết hoặc thông báo trạng thái chờ */}
              {dispute.resolution || statusMeta.isResolved || dispute.adminNote ? (
                <div className="space-y-2.5 bg-emerald-400/[0.04] px-6 py-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Kết quả xử lý &amp; Phán quyết trọng tài
                  </h3>
                  {dispute.resolution && (
                    <p className="text-sm font-semibold text-white">Quyết định: {dispute.resolution}</p>
                  )}
                  {dispute.adminNote && (
                    <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                      <strong className="text-white">Ghi chú phán quyết:</strong> {dispute.adminNote}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
                    {dispute.clientRefundAmount != null && (
                      <span>
                        Hoàn khách:{' '}
                        <strong className="text-white">{formatMoney(dispute.clientRefundAmount)}</strong>
                      </span>
                    )}
                    {dispute.artistPayAmount != null && (
                      <span>
                        Creator nhận:{' '}
                        <strong className="text-white">{formatMoney(dispute.artistPayAmount)}</strong>
                      </span>
                    )}
                    {dispute.resolvedAt && (
                      <span className="text-slate-400">
                        Giải quyết lúc: {new Date(dispute.resolvedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-300/[0.05] px-6 py-4 text-xs leading-5 text-amber-100/90">
                  <strong>Trạng thái bảo vệ Escrow:</strong> Tiền ký quỹ đang được hệ thống tạm khóa an toàn. Trọng tài sàn sẽ xem xét lịch sử trao đổi, tiến độ các mốc và bằng chứng liên quan trước khi đưa ra phán quyết cuối cùng.
                </div>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Đơn này chưa có hồ sơ tranh chấp.</p>
          )}
        </div>

        <footer className="flex justify-end border-t border-[#1E2536] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
          >
            Đóng
          </button>
        </footer>
      </section>
    </div>
  );
}
