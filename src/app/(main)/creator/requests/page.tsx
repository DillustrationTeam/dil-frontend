'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Send,
  X,
} from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { Commission, RespondToCommissionPayload } from '@/types/commission.types';

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'No delivery date set';
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value),
  );
};

const formatSubmittedAt = (value: string) =>
  new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(value),
  );

export default function CreatorRequestsPage() {
  const [requests, setRequests] = useState<Commission[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [counterOffer, setCounterOffer] = useState('');
  const [counterDeadline, setCounterDeadline] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    commissionService
      .getCreatorRequests()
      .then((items) => {
        setRequests(items);
        setSelectedRequest(items[0] ?? null);
      })
      .catch(() => setFeedback('Unable to load incoming requests. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (payload: RespondToCommissionPayload) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await commissionService.respond(selectedRequest.id, payload);
      const remainingRequests = requests.filter((request) => request.id !== selectedRequest.id);
      setRequests(remainingRequests);
      setSelectedRequest(remainingRequests[0] ?? null);
      setShowNegotiate(false);
      setRejecting(false);
      setFeedback(
        payload.action === 'Accept'
          ? 'Request accepted. The client can now secure the escrow deposit.'
          : payload.action === 'Reject'
            ? 'Request declined.'
            : 'Counter-offer sent to the client.',
      );
    } catch {
      setFeedback('We could not update this request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const total = selectedRequest?.totalPrice ?? selectedRequest?.price;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-h1 text-2xl font-bold text-white">Incoming commission requests</h1>
          </div>
          <span className="text-sm text-slate-400">{requests.length} pending</span>
        </div>
      </section>

      {feedback && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 px-4 py-3 text-sm text-[#d8dbff]">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#A7ACD9] hover:text-white" aria-label="Dismiss message"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm text-slate-400">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#A7ACD9]" /> Loading requests…
        </div>
      ) : requests.length === 0 || !selectedRequest ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-6 text-center">
          <CheckCircle2 className="mb-4 h-11 w-11 text-[#A7ACD9]" />
          <h2 className="font-h1 text-lg font-bold text-white">Your inbox is clear</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">New commission briefs for your studio will appear here.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.55fr)]">
          <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-h1 text-sm font-bold text-white">Request queue</h2>
            </div>
            <div className="max-h-[620px] overflow-y-auto p-2">
              {requests.map((request) => {
                const isSelected = selectedRequest.id === request.id;
                return (
                  <button
                    key={request.id}
                    onClick={() => { setSelectedRequest(request); setShowNegotiate(false); setRejecting(false); }}
                    className={`mb-1 w-full rounded-xl p-4 text-left transition ${isSelected ? 'bg-[#A7ACD9]/15' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[10px] font-bold text-[#A7ACD9]">#{request.id.slice(0, 8).toUpperCase()}</span>
                      <ChevronRight className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#A7ACD9]' : 'text-slate-600'}`} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-bold text-white">{request.title}</p>
                    <p className="mt-1 text-xs text-slate-400">@{request.clientName || request.clientId.slice(0, 8)}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#A7ACD9]">{formatMoney(request.totalPrice ?? request.price)}</span>
                      <span className="text-slate-500">{formatSubmittedAt(request.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#A7ACD9]">#{selectedRequest.id.slice(0, 8).toUpperCase()}</span>
                <h2 className="mt-1 font-h1 text-xl font-bold text-white sm:text-2xl">{selectedRequest.title}</h2>
                <p className="mt-2 text-sm text-slate-400">Client: <span className="font-semibold text-slate-200">@{selectedRequest.clientName || selectedRequest.clientId}</span> · Submitted {formatSubmittedAt(selectedRequest.createdAt)}</p>
              </div>
              <span className="w-fit rounded-full bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-bold text-[#d8dbff]">Ready for review</span>
            </header>

            <div className="space-y-6 py-6">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Project brief</p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{selectedRequest.description || 'The client has not added a detailed brief yet.'}</p>
              </div>

              <dl className="grid gap-4 border-y border-white/10 py-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-slate-500">Proposed budget</dt><dd className="mt-1 font-h1 text-xl font-bold text-white">{formatMoney(total)}</dd></div>
                <div><dt className="text-xs text-slate-500">Delivery target</dt><dd className="mt-1 font-semibold text-white">{formatDate(selectedRequest.deadlineAt)}</dd></div>
                <div><dt className="text-xs text-slate-500">Milestones</dt><dd className="mt-1 font-semibold text-white">{selectedRequest.milestones?.length ?? 0} proposed</dd></div>
              </dl>
            </div>

            {showNegotiate && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const price = counterOffer ? Number(counterOffer) : undefined;
                  const deadline = counterDeadline ? new Date(counterDeadline).toISOString() : undefined;
                  const note = counterNote.trim() || undefined;

                  if ((price && Number.isFinite(price) && price > 0) || deadline || note) {
                    void respond({
                      action: 'Negotiate',
                      negotiatePrice: price,
                      negotiateDeadlineAt: deadline,
                      negotiateNote: note,
                    });
                  }
                }}
                className="mb-4 space-y-3 rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 p-4"
              >
                <label className="block text-sm font-bold text-white">Thương lượng &amp; Đề xuất lại hợp đồng</label>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="counter-offer" className="block text-[11px] font-bold text-[#A7ACD9] uppercase mb-1">Giá đề xuất mới (VND)</label>
                    <input
                      id="counter-offer"
                      type="number"
                      min="1"
                      step="1"
                      value={counterOffer}
                      onChange={(event) => setCounterOffer(event.target.value)}
                      placeholder="Ví dụ: 450000"
                      className="w-full rounded-xl border border-white/15 bg-[#10131f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A7ACD9]"
                    />
                  </div>

                  <div>
                    <label htmlFor="counter-deadline" className="block text-[11px] font-bold text-[#A7ACD9] uppercase mb-1">Hạn hoàn thành mới (Tùy chọn)</label>
                    <input
                      id="counter-deadline"
                      type="date"
                      value={counterDeadline}
                      onChange={(event) => setCounterDeadline(event.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#10131f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A7ACD9]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="counter-note" className="block text-[11px] font-bold text-[#A7ACD9] uppercase mb-1">Ghi chú / Lý do điều chỉnh cho Client (Tùy chọn)</label>
                  <textarea
                    id="counter-note"
                    rows={2}
                    value={counterNote}
                    onChange={(event) => setCounterNote(event.target.value)}
                    placeholder="Ví dụ: Cần nới thêm 3 ngày do gói vẽ có thêm background chi tiết..."
                    className="w-full rounded-xl border border-white/15 bg-[#10131f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A7ACD9]"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    disabled={submitting}
                    className="rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-xs font-bold text-[#1F2335] shadow-lg hover:bg-white transition-all disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Gửi đề xuất lại cho Client
                  </button>
                </div>
              </form>
            )}

            {rejecting && (
              <form onSubmit={(event) => { event.preventDefault(); void respond({ action: 'Reject', rejectReason: rejectReason.trim() || undefined }); }} className="mb-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4">
                <label htmlFor="decline-reason" className="text-sm font-bold text-red-100">Reason for declining <span className="font-normal text-red-200/60">(optional)</span></label>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input id="decline-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="e.g. My current queue is full" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#10131f] px-3 py-2.5 text-sm text-white outline-none focus:border-red-300" />
                  <button disabled={submitting} className="rounded-xl bg-red-400 px-4 py-2.5 text-xs font-bold text-[#351016] disabled:opacity-60">Confirm decline</button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <button disabled={submitting} onClick={() => void respond({ action: 'Accept' })} className="order-1 flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#151725] transition hover:bg-[#dfe2ff] disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> {submitting ? 'Updating…' : 'Accept & await escrow'}</button>
              <button disabled={submitting} onClick={() => { setShowNegotiate(!showNegotiate); setRejecting(false); setCounterOffer(String(total ?? '')); }} className="order-2 flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">Counter-offer</button>
              <button disabled={submitting} onClick={() => { setRejecting(!rejecting); setShowNegotiate(false); }} className="order-3 flex items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-60">Decline</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
