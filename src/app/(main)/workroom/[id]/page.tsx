'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission, Milestone } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';
import {
  ArrowLeft, Check, Circle, FileText, FolderKanban,
  LoaderCircle, LockKeyhole, Download, Upload, XCircle, Star
} from 'lucide-react';
import { isAxiosError } from 'axios';
import SubmitMilestoneModal from '@/components/modals/SubmitMilestoneModal';
import ApprovalRevisionModal from '@/components/modals/ApprovalRevisionModal';
import FinalDeliveryModal from '@/components/modals/FinalDeliveryModal';
import CancelRefundModal from '@/components/modals/CancelRefundModal';
import ReviewRatingModal from '@/components/modals/ReviewRatingModal';

const money = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Chưa đặt hạn';

type ModalState =
  | { type: 'none' }
  | { type: 'submit'; milestoneId: string; milestoneTitle: string }
  | { type: 'review'; milestoneId: string; wipPreviewUrl: string; maxRevisions: number; revisionCount: number }
  | { type: 'finalDeliver' }
  | { type: 'cancel' }
  | { type: 'rating' };

export default function WorkroomPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore(state => state.user?.id);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const refresh = useCallback(async () => setCommission(await commissionService.getById(id)), [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => setError('Không tải được Workroom hoặc bạn không có quyền xem đơn này.')).finally(() => setLoading(false));
  }, [refresh]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await refresh(); setMessage(success); }
    catch (cause) {
      const apiError = isAxiosError(cause) ? cause.response?.data?.error : undefined;
      setError(apiError?.details?.join(' ') || apiError?.message || (cause instanceof Error ? cause.message : 'Thao tác thất bại. Vui lòng thử lại.'));
    }
    finally { setBusy(false); }
  };

  const handleModalSuccess = () => {
    setModal({ type: 'none' });
    void refresh();
  };

  if (loading) return <div className="flex min-h-72 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Đang tải Workroom…</div>;
  if (!commission) return <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-[#A7ACD9]" /><h1 className="mt-4 font-h1 text-xl font-bold text-white">Workroom unavailable</h1><p className="mt-2 text-sm text-slate-400">{error || 'Không tìm thấy đơn vẽ.'}</p></div>;

  const isClient = commission.clientId === userId;
  const funded = commission.escrowStatus === 'Deposited' || commission.escrowStatus === 'PartialReleased' || commission.escrowStatus === 'Released';
  const awaitingAgreement = commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' || commission.status === 'Cancelled';
  const awaitingEscrow = commission.status === 'InProgress' && !funded;
  if (awaitingAgreement || awaitingEscrow) {
    const destination = isClient
      ? awaitingAgreement ? `/client/requests/${id}` : `/payment/checkout/${id}`
      : commission.status === 'PendingAcceptance' ? '/creator/requests' : '/creator/commissions';
    const detail = awaitingAgreement
      ? commission.status === 'Cancelled' ? 'Yêu cầu đã kết thúc.' : commission.status === 'Negotiating' ? 'Đề xuất giá đang chờ Client quyết định.' : 'Yêu cầu đang chờ Creator phản hồi.'
      : 'Đang chờ Client ký quỹ trước khi bắt đầu công việc.';
    return <main className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white">
      <LockKeyhole className="mx-auto h-10 w-10 text-[#A7ACD9]" />
      <h1 className="mt-4 font-h1 text-xl font-bold">Workroom chưa mở</h1>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
      <Link href={destination} className="commission-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm">{isClient ? awaitingAgreement ? 'Xem yêu cầu' : 'Đến trang ký quỹ' : 'Xem danh sách yêu cầu'}</Link>
    </main>;
  }

  const milestones = [...(commission.milestones ?? [])].sort((a, b) => a.sequence - b.sequence);
  const allApproved = milestones.length > 0 && milestones.every(m => m.status === 'Approved');

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-10 text-white">
      <div className="flex items-center justify-between">
        <Link href={isClient ? '/client/commissions' : '/creator/commissions'} className="inline-flex items-center gap-2 text-xs font-bold text-[#A7ACD9] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đơn
        </Link>
        {(['InProgress', 'Delivered'] as Commission['status'][]).includes(commission.status) && (
          <button
            onClick={() => setModal({ type: 'cancel' })}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <XCircle className="h-4 w-4" /> Hủy đơn
          </button>
        )}
      </div>

      <header className="glass-container rounded-[28px] border border-white/10 p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#A7ACD9]">ORDER #CMD-{commission.id.slice(0, 8).toUpperCase()}</span>
            <h1 className="mt-2 font-h1 text-2xl font-extrabold text-white">{commission.title}</h1>
            <p className="mt-2 text-xs text-slate-400">Client: {commission.clientName || commission.clientId} · Creator: {commission.creatorName || commission.creatorId}</p>
          </div>
          <span className="w-fit rounded-full border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-bold text-[#d8dbff]">{commission.status}</span>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <Info label="Escrow held" value={money(commission.escrowHeldAmount)} />
          <Info label="Delivery target" value={formatDate(commission.deadlineAt)} />
          <Info label="Commission total" value={money(commission.finalPrice ?? commission.totalPrice)} />
        </dl>
        <div className="mt-6 border-t border-white/10 pt-5">
          <h2 className="mb-3 font-h1 text-sm font-bold">Milestone timeline</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map(m => (
              <div key={m.id} className={`rounded-xl border p-3 text-xs ${m.status === 'Approved' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : m.sequence === commission.currentStage ? 'border-[#A7ACD9]/60 bg-[#A7ACD9]/15 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                <div className="flex items-center gap-2 font-bold">{m.status === 'Approved' ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{m.sequence}. {m.title}</div>
                <p className="mt-1 pl-5 text-[11px]">{m.status} · {money(m.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="font-h1 text-base font-bold text-white">Milestone progress</h2>
          <span className="text-xs text-slate-400">{milestones.length} milestones</span>
        </div>
        {milestones.length === 0
          ? <p className="py-12 text-center text-sm text-slate-400">Chưa có cột mốc.</p>
          : <div className="mt-2 divide-y divide-white/10">
            {milestones.map(m => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                commission={commission}
                isClient={isClient}
                busy={busy}
                onSubmitClick={() => setModal({ type: 'submit', milestoneId: m.id, milestoneTitle: m.title })}
                onReviewClick={() => setModal({
                  type: 'review',
                  milestoneId: m.id,
                  wipPreviewUrl: m.watermarkedUrl ?? '',
                  maxRevisions: m.maxRevisions ?? 3,
                  revisionCount: m.revisionCount ?? 0
                })}
                run={run}
              />
            ))}
          </div>
        }
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#A7ACD9]" /><h2 className="font-h1 text-base font-bold text-white">Commission brief</h2></div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{commission.description || 'Chưa có mô tả chi tiết.'}</p>
      </section>

      {/* SCR-27: Final Delivery — Creator */}
      {allApproved && commission.status === 'InProgress' && !isClient && (
        <section className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-indigo-300"><Upload className="h-5 w-5" /> Bàn giao file cuối</h2>
          <p className="mt-2 text-sm text-slate-400">Tất cả cột mốc đã được phê duyệt. Upload file gốc chất lượng cao để hoàn thành đơn hàng.</p>
          <button
            onClick={() => setModal({ type: 'finalDeliver' })}
            className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition-colors"
          >
            <Upload className="h-4 w-4" /> Bàn giao file cuối
          </button>
        </section>
      )}

      {/* SCR-28: Accept & Download — Client */}
      {commission.status === 'Delivered' && isClient && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-300"><Download className="h-5 w-5" /> Nghiệm thu & Tải file</h2>
          <p className="mt-2 text-sm text-slate-300">Creator đã bàn giao file gốc. Xác nhận để mở quyền tải file và hoàn tất thanh toán Escrow.</p>
          <button
            disabled={busy}
            onClick={() => run(() => commissionService.complete(id), 'Đã nghiệm thu. Đơn hàng hoàn thành!')}
            className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {busy ? 'Đang xử lý…' : 'Xác nhận Nghiệm thu'}
          </button>
        </section>
      )}

      {/* SCR-28 + Completed state */}
      {commission.status === 'Completed' && (
        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-emerald-300"><Check className="h-5 w-5" /> Đơn hàng đã hoàn thành</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => run(async () => { window.open(await commissionService.getFinalDownloadUrl(id), '_blank'); }, 'Đang mở link tải...')}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Tải file gốc
            </button>
            {isClient && (
              <button
                onClick={() => setModal({ type: 'rating' })}
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <Star className="h-4 w-4" /> Đánh giá Creator
              </button>
            )}
          </div>
        </section>
      )}

      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {/* Modals */}
      {modal.type === 'submit' && (
        <SubmitMilestoneModal
          isOpen
          onClose={() => setModal({ type: 'none' })}
          commissionId={id}
          milestoneId={modal.milestoneId}
          milestoneTitle={modal.milestoneTitle}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === 'review' && (
        <ApprovalRevisionModal
          isOpen
          onClose={() => setModal({ type: 'none' })}
          commissionId={id}
          milestoneId={modal.milestoneId}
          wipPreviewUrl={modal.wipPreviewUrl}
          maxRevisions={modal.maxRevisions}
          revisionCount={modal.revisionCount}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === 'finalDeliver' && (
        <FinalDeliveryModal
          isOpen
          onClose={() => setModal({ type: 'none' })}
          commissionId={id}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === 'cancel' && (
        <CancelRefundModal
          isOpen
          onClose={() => setModal({ type: 'none' })}
          commissionId={id}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === 'rating' && (
        <ReviewRatingModal
          isOpen
          onClose={() => setModal({ type: 'none' })}
          commissionId={id}
          creatorName={commission.creatorName}
          onReviewSubmitted={handleModalSuccess}
        />
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-white">{value}</dd></div>;
}

function MilestoneRow({
  milestone: m, commission, isClient, busy,
  onSubmitClick, onReviewClick,
}: {
  milestone: Milestone;
  commission: Commission;
  isClient: boolean;
  busy: boolean;
  onSubmitClick: () => void;
  onReviewClick: () => void;
  run: (action: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const canSubmit = !isClient
    && commission.status === 'InProgress'
    && commission.currentStage === m.sequence
    && ['Pending', 'RevisionRequested'].includes(m.status)
    && ['Deposited', 'PartialReleased'].includes(commission.escrowStatus ?? '');

  const canReview = isClient
    && commission.status === 'InProgress'
    && commission.currentStage === m.sequence
    && m.status === 'Submitted';

  return (
    <div className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#A7ACD9]">{m.sequence}.</span>
            <h3 className="text-sm font-bold text-white">{m.title}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {money(m.price)} · <span className={m.status === 'Approved' ? 'text-emerald-400' : m.status === 'RevisionRequested' ? 'text-amber-400' : 'text-slate-400'}>{m.status}</span>
            {' '}· {m.revisionCount ?? 0}/{m.maxRevisions ?? 3} revisions
            {m.submittedAt ? ` · Nộp ${formatDate(m.submittedAt)}` : ''}
            {m.approvedAt ? ` · Duyệt ${formatDate(m.approvedAt)}` : ''}
          </p>
          {m.creatorNote && (
            <p className="mt-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300 italic">
              📝 {m.creatorNote}
            </p>
          )}
          {m.revisionFeedback && (
            <p className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200">
              <strong>Yêu cầu sửa:</strong> {m.revisionFeedback}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {m.watermarkedUrl && (
            <button
              disabled={busy}
              onClick={onReviewClick}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Xem bản nháp
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {canSubmit && (
          <button
            onClick={onSubmitClick}
            className="flex items-center gap-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {m.status === 'RevisionRequested' ? 'Nộp bản sửa' : 'Nộp bản nháp'}
          </button>
        )}
        {canReview && (
          <button
            onClick={onReviewClick}
            className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Duyệt / Yêu cầu sửa
          </button>
        )}
      </div>
    </div>
  );
}
