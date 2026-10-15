'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, X } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import type { CommissionDispute } from '@/types/commission.types';

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
}

function getEvidenceUrls(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return value.split(',').map((url) => url.trim()).filter(Boolean);
  }
  return [];
}

export default function DisputeDetailsModal({ isOpen, onClose, commissionId }: DisputeDetailsModalProps) {
  const [dispute, setDispute] = useState<CommissionDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    commissionService.getDispute(commissionId)
      .then((result) => { if (active) setDispute(result); })
      .catch(() => { if (active) setError('Không tải được hồ sơ tranh chấp.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [commissionId, isOpen]);

  if (!isOpen) return null;

  const evidenceUrls = getEvidenceUrls(dispute?.evidenceUrls);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="dispute-details-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1F2335] shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#1F2335] px-5 py-4">
          <div>
            <h2 id="dispute-details-title" className="font-h1 text-base font-bold text-white">Hồ sơ tranh chấp</h2>
            <p className="mt-1 text-xs text-slate-400">Commission #{commissionId.slice(0, 8).toUpperCase()}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hồ sơ tranh chấp" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          {loading ? <p className="py-10 text-center text-sm text-slate-400">Đang tải hồ sơ…</p> : error ? <p role="alert" className="flex items-center gap-2 py-8 text-sm text-rose-300"><AlertCircle className="h-4 w-4" />{error}</p> : dispute ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">{dispute.status}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{new Date(dispute.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Lý do</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-white">{dispute.reason}</p>
              </section>
              <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Bằng chứng</h3>
                {evidenceUrls.length ? <ul className="space-y-2">{evidenceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all text-sm text-[#C5C9F8] underline"><span>{url}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></a></li>)}</ul> : <p className="text-sm text-slate-400">Không có liên kết bằng chứng.</p>}
              </section>
              {dispute.resolution && <section className="space-y-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4"><h3 className="text-xs font-bold uppercase text-emerald-200">Kết quả xử lý</h3><p className="text-sm text-white">{dispute.resolution}</p>{dispute.resolvedAt && <p className="text-xs text-slate-400">{new Date(dispute.resolvedAt).toLocaleString('vi-VN')}</p>}{dispute.clientRefundAmount != null && <p className="text-sm text-slate-300">Hoàn khách: {new Intl.NumberFormat('vi-VN').format(dispute.clientRefundAmount)} VND</p>}{dispute.artistPayAmount != null && <p className="text-sm text-slate-300">Creator nhận: {new Intl.NumberFormat('vi-VN').format(dispute.artistPayAmount)} VND</p>}{dispute.adminNote && <p className="whitespace-pre-wrap border-t border-white/10 pt-2 text-sm text-slate-300">{dispute.adminNote}</p>}</section>}
              {dispute.status === 'Resolved' && <p className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" />Hồ sơ đã được giải quyết.</p>}
            </>
          ) : <p className="py-8 text-center text-sm text-slate-400">Đơn này chưa có hồ sơ tranh chấp.</p>}
        </div>
      </section>
    </div>
  );
}
