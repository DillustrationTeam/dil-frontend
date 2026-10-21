'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, Handshake, Scale, ShieldAlert, X } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import type { CommissionDispute } from '@/types/commission.types';

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  initialDispute?: CommissionDispute | null;
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

export default function DisputeDetailsModal({ isOpen, onClose, commissionId, initialDispute }: DisputeDetailsModalProps) {
  const user = useAuthStore((s) => s.user);
  const [dispute, setDispute] = useState<CommissionDispute | null>(initialDispute ?? null);
  const [loading, setLoading] = useState(!initialDispute);
  const [error, setError] = useState<string | null>(null);

  // Negotiation response states
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPercent, setCounterPercent] = useState<number>(50);
  const [counterResponse, setCounterResponse] = useState('');
  const [counterEvidence, setCounterEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    commissionService.getDispute(commissionId)
      .then((result) => {
        if (active) {
          setDispute(result);
          if (result.claimantRefundPercent != null) {
            setCounterPercent(100 - result.claimantRefundPercent);
          }
        }
      })
      .catch(() => { if (active) setError('Không tải được hồ sơ tranh chấp.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [commissionId, isOpen]);

  if (!isOpen) return null;

  const isClaimant = !!user?.id && user.id === dispute?.raisedById;
  const isRespondent = !!user?.id && user.id !== dispute?.raisedById;
  const evidenceUrls = getEvidenceUrls(dispute?.evidenceUrls);
  const respondentEvidenceUrls = getEvidenceUrls(dispute?.respondentEvidenceUrls);

  const handleAcceptProposal = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn chấp nhận đề xuất giải quyết này? Hệ thống sẽ tất toán tiền ký quỹ ngay lập tức.')) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await commissionService.respondDispute(commissionId, { action: 'Accept' });
      const updated = await commissionService.getDispute(commissionId);
      setDispute(updated);
    } catch (err: unknown) {
      setActionError(extractErrorMessage(err, 'Lỗi khi chấp nhận đề xuất hòa giải.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCounter = async () => {
    if (!counterResponse.trim()) {
      setActionError('Vui lòng nêu rõ lý do hoặc quan điểm phản đối/đề xuất của bạn.');
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const urls = counterEvidence.trim()
        ? counterEvidence.split('\n').map((u) => u.trim()).filter(Boolean)
        : undefined;

      await commissionService.respondDispute(commissionId, {
        action: 'Counter',
        counterRefundPercent: counterPercent,
        response: counterResponse.trim(),
        evidenceUrls: urls,
      });

      const updated = await commissionService.getDispute(commissionId);
      setDispute(updated);
      setShowCounterForm(false);
    } catch (err: unknown) {
      setActionError(extractErrorMessage(err, 'Lỗi khi gửi phản hồi tranh chấp.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Negotiating':
        return <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" /> Đang thương lượng</span>;
      case 'MutualSettled':
        return <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Hòa giải thành</span>;
      case 'Pending':
        return <span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Chờ Trọng tài phân xử</span>;
      case 'Resolved':
        return <span className="rounded-md border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-xs font-semibold text-purple-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Đã phân xử</span>;
      default:
        return <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="dispute-details-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1F2335] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1F2335] px-5 py-4">
          <div>
            <h2 id="dispute-details-title" className="font-h1 text-base font-bold text-white">Hồ sơ tranh chấp</h2>
            <p className="mt-1 text-xs text-slate-400">Commission #{commissionId.slice(0, 8).toUpperCase()}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hồ sơ tranh chấp" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Đang tải hồ sơ…</p>
          ) : error ? (
            <p role="alert" className="flex items-center gap-2 py-8 text-sm text-rose-300"><AlertCircle className="h-4 w-4" />{error}</p>
          ) : dispute ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {getStatusBadge(dispute.status)}
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{new Date(dispute.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              {/* Claimant Reason */}
              <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Nội dung khiếu nại (Bên mở đơn)</h3>
                  {dispute.claimantRefundPercent != null && (
                    <span className="text-xs font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                      Đề xuất hoàn: {dispute.claimantRefundPercent}%
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-white">{dispute.reason}</p>
                {evidenceUrls.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[11px] font-bold text-slate-400 mb-1">Bằng chứng kèm theo:</p>
                    <ul className="space-y-1">
                      {evidenceUrls.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 break-all text-xs text-[#C5C9F8] underline hover:text-white">
                            <span>{url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Respondent Response (if answered) */}
              {dispute.respondentRespondedAt && (
                <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-slate-400">Phản hồi từ Đối phương</h3>
                    {dispute.respondentRefundPercent != null && (
                      <span className="text-xs font-medium text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded">
                        Đề xuất ngược: {dispute.respondentRefundPercent}% hoàn khách
                      </span>
                    )}
                  </div>
                  {dispute.respondentResponse && (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white">{dispute.respondentResponse}</p>
                  )}
                  {respondentEvidenceUrls.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[11px] font-bold text-slate-400 mb-1">Bằng chứng đối ứng:</p>
                      <ul className="space-y-1">
                        {respondentEvidenceUrls.map((url) => (
                          <li key={url}>
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 break-all text-xs text-[#C5C9F8] underline hover:text-white">
                              <span>{url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">Phản hồi lúc: {new Date(dispute.respondentRespondedAt).toLocaleString('vi-VN')}</p>
                </section>
              )}

              {/* Active Negotiation Section */}
              {dispute.status === 'Negotiating' && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Handshake className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-cyan-200">Giai đoạn tự thương lượng hai bên</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        Bên khiếu nại đưa ra phương án phân chia: Khách nhận <strong>{dispute.claimantRefundPercent ?? 100}%</strong>, Họa sĩ nhận <strong>{100 - (dispute.claimantRefundPercent ?? 100)}%</strong>.
                      </p>
                    </div>
                  </div>

                  {isRespondent && (
                    <div className="pt-2 border-t border-white/10 space-y-3">
                      {!showCounterForm ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleAcceptProposal}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                          >
                            Đồng ý đề xuất (Tất toán ngay)
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setShowCounterForm(true)}
                            className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition"
                          >
                            Không đồng ý &amp; Đề xuất lại
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/10 animate-fadeIn">
                          <h5 className="text-xs font-bold text-white">Đề xuất phương án phản hồi:</h5>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300">Tỷ lệ hoàn tiền cho Khách:</span>
                              <span className="font-bold text-cyan-400">{counterPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={counterPercent}
                              onChange={(e) => setCounterPercent(Number(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                              <span>Khách nhận: {counterPercent}%</span>
                              <span>Họa sĩ nhận: {100 - counterPercent}%</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                              Lý do / Phản biện <span className="text-amber-400">*</span>
                            </label>
                            <textarea
                              rows={3}
                              value={counterResponse}
                              onChange={(e) => setCounterResponse(e.target.value)}
                              placeholder="Nêu rõ quan điểm của bạn và vì sao mức này hợp lý hơn..."
                              className="w-full p-2.5 bg-[#1b1b1e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                              Link Bằng chứng đối ứng (mỗi link 1 dòng)
                            </label>
                            <textarea
                              rows={2}
                              value={counterEvidence}
                              onChange={(e) => setCounterEvidence(e.target.value)}
                              placeholder="https://..."
                              className="w-full p-2 bg-[#1b1b1e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                            />
                          </div>

                          {actionError && (
                            <p className="text-xs text-rose-300 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
                            </p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowCounterForm(false)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="button"
                              onClick={handleSendCounter}
                              disabled={isSubmitting}
                              className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50"
                            >
                              {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất & Chuyển Trọng tài phân xử'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isClaimant && (
                    <p className="text-[11px] text-slate-400 italic">
                      * Đang chờ đối phương xem xét đề xuất. Nếu đối phương đồng ý, tiền sẽ được tất toán tự động. Nếu từ chối, vụ việc sẽ tự động chuyển đến Ban Quản Trị để phân xử.
                    </p>
                  )}
                </div>
              )}

              {/* Mutual Settlement Result */}
              {dispute.status === 'MutualSettled' && (
                <section className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="text-xs font-bold uppercase">Hòa giải thành công</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hai bên đã thống nhất phương án hòa giải. Tiền ký quỹ Escrow đã được tất toán tự động theo thỏa thuận:
                  </p>
                  <div className="flex gap-4 text-xs font-semibold pt-1">
                    <span className="text-emerald-300">Hoàn Khách: {dispute.clientRefundPercent ?? dispute.claimantRefundPercent}%</span>
                    <span className="text-cyan-300">Creator nhận: {100 - (dispute.clientRefundPercent ?? dispute.claimantRefundPercent ?? 100)}%</span>
                  </div>
                </section>
              )}

              {/* Admin Resolution Section */}
              {(dispute.resolution || dispute.status === 'Resolved' || dispute.adminNote) && (
                <section className="space-y-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
                  <h3 className="text-xs font-bold uppercase text-emerald-200">Kết quả xử lý &amp; Phán quyết trọng tài</h3>
                  {dispute.resolution && <p className="text-sm font-semibold text-white">Quyết định: {dispute.resolution}</p>}
                  {dispute.adminNote && (
                    <p className="text-sm text-slate-200 whitespace-pre-wrap border-t border-white/10 pt-2">
                      <strong>Ghi chú phán quyết:</strong> {dispute.adminNote}
                    </p>
                  )}
                  {dispute.resolvedAt && (
                    <p className="text-xs text-slate-400">Thời gian giải quyết: {new Date(dispute.resolvedAt).toLocaleString('vi-VN')}</p>
                  )}
                  {dispute.clientRefundAmount != null && (
                    <p className="text-sm text-slate-300">Hoàn khách: {new Intl.NumberFormat('vi-VN').format(dispute.clientRefundAmount)} VND</p>
                  )}
                  {dispute.artistPayAmount != null && (
                    <p className="text-sm text-slate-300">Creator nhận: {new Intl.NumberFormat('vi-VN').format(dispute.artistPayAmount)} VND</p>
                  )}
                </section>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Đơn này chưa có hồ sơ tranh chấp.</p>
          )}
        </div>
      </section>
    </div>
  );
}
