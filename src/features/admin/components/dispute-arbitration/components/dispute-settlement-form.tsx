'use client';

import React, { useState } from 'react';
import {
  Gavel,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Sparkles,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  DisputeArbitrationDetailDto,
  ResolveDisputeArbitrationRequest,
} from '@/features/admin/types/dispute-arbitration.types';

interface DisputeSettlementFormProps {
  dispute: DisputeArbitrationDetailDto;
  isSubmitting: boolean;
  onResolve: (disputeId: string, req: ResolveDisputeArbitrationRequest) => Promise<boolean>;
}

export function DisputeSettlementForm({
  dispute,
  isSubmitting,
  onResolve,
}: DisputeSettlementFormProps) {
  const isResolved = dispute.status === 'Resolved';
  const totalEscrow = dispute.escrowHeldAmount || dispute.finalPrice;
  const totalSettledAmount =
    (dispute.clientRefundAmount ?? 0) + (dispute.artistPayAmount ?? 0);
  const effectiveTotal = totalSettledAmount > 0 ? totalSettledAmount : totalEscrow;

  const resolvedClientPercent =
    dispute.clientRefundPercent ??
    (dispute.clientRefundAmount != null && effectiveTotal > 0
      ? Math.round((dispute.clientRefundAmount / effectiveTotal) * 100)
      : dispute.resolution === 'ClientWin100'
      ? 100
      : dispute.resolution === 'ArtistWin100'
      ? 0
      : 50);

  const resolvedCreatorPercent = 100 - resolvedClientPercent;

  // Pattern: Render-time state synchronization when inspected dispute changes
  const [prevDisputeId, setPrevDisputeId] = useState(dispute.disputeId);
  const [clientRefundPercent, setClientRefundPercent] = useState<number>(
    dispute.clientRefundPercent ?? resolvedClientPercent
  );
  const [adminNote, setAdminNote] = useState<string>(dispute.adminNote ?? '');
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  if (prevDisputeId !== dispute.disputeId) {
    setPrevDisputeId(dispute.disputeId);
    setClientRefundPercent(dispute.clientRefundPercent ?? resolvedClientPercent);
    setAdminNote(dispute.adminNote ?? '');
    setConfirmModalOpen(false);
  }

  const clientAmount = (totalEscrow * clientRefundPercent) / 100;
  const creatorAmount = (totalEscrow * (100 - clientRefundPercent)) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResolved || isSubmitting) return;

    if (!adminNote.trim()) {
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmExecution = async () => {
    const success = await onResolve(dispute.disputeId, {
      clientRefundPercent,
      adminNote: adminNote.trim(),
      resolution:
        clientRefundPercent === 100
          ? 'ClientWin100'
          : clientRefundPercent === 0
          ? 'ArtistWin100'
          : 'SplitCustom',
    });

    if (success) {
      setConfirmModalOpen(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6 flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Title & Section Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-h1 font-bold text-white text-sm">
                Admin Arbitration &amp; Refund Settlement
              </h3>
              <p className="text-[11px] text-[#8A8FA9]">
                Arbitration Protocol • Atomic Escrow Ledger
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-[11px] font-bold rounded-full border ${
              isResolved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
            }`}
          >
            {isResolved ? 'SETTLED' : 'DISPUTED'}
          </span>
        </div>

        {/* Resolved Banner if ticket is already closed */}
        {isResolved && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dispute Dossier Closed &amp; Arbitrated</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              This dispute was resolved on{' '}
              {dispute.resolvedAt
                ? new Date(dispute.resolvedAt).toLocaleString('vi-VN')
                : 'N/A'}{' '}
              by Moderator <strong className="text-white">@{dispute.moderatorName || 'Admin'}</strong>.
            </p>
            <div className="pt-2 border-t border-emerald-500/20 text-[11px] flex justify-between font-mono">
              <span className="text-emerald-300">
                Client Refund: {resolvedClientPercent}% ($
                {(dispute.clientRefundAmount ?? clientAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
                )
              </span>
              <span className="text-[#C5C9F8]">
                Creator Payout: {resolvedCreatorPercent}% ($
                {(dispute.artistPayAmount ?? creatorAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
                )
              </span>
            </div>
            {dispute.adminNote && (
              <div className="pt-2 text-[11px] text-[#C5C9F8] italic">
                &ldquo;{dispute.adminNote}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Escrow Pool Summary Box */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8A8FA9] flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Locked Escrow Pool
            </span>
            <span className="font-mono font-bold text-white text-sm">
              ${totalEscrow.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8A8FA9] border-t border-white/5 pt-2">
            <span>Commission Total: ${dispute.finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span>Disbursed so far: ${dispute.disbursedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Atomic Escrow Refund Distribution Slider & Live Calculator */}
        <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider block">
              ATOMIC ESCROW REFUND SPLIT (${totalEscrow.toLocaleString('en-US', { minimumFractionDigits: 2 })} TOTAL)
            </span>
            <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              {clientRefundPercent}% / {100 - clientRefundPercent}%
            </span>
          </div>

          {/* Real-time calculated amounts */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Client Refund ({clientRefundPercent}%)
              </div>
              <div className="font-mono text-base font-bold text-white">
                ${clientAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#8A8FA9] truncate">
                To @{dispute.client.userName}
              </div>
            </div>

            <div className="space-y-0.5 text-right">
              <div className="text-[10px] text-[#C5C9F8] font-bold flex items-center justify-end gap-1">
                Creator Payout ({100 - clientRefundPercent}%)
                <span className="w-2 h-2 rounded-full bg-[#C5C9F8] inline-block" />
              </div>
              <div className="font-mono text-base font-bold text-white">
                ${creatorAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#8A8FA9] truncate">
                To @{dispute.creator.userName}
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              disabled={isResolved || isSubmitting}
              value={clientRefundPercent}
              onChange={(e) => setClientRefundPercent(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-emerald-500 via-purple-500 to-indigo-500 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <div className="flex justify-between text-[10px] text-[#8A8FA9] font-mono">
              <span>0% (100% Creator)</span>
              <span>50 / 50 Equal</span>
              <span>100% (100% Client)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          {!isResolved && (
            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
              <span className="text-[10px] text-[#8A8FA9] font-medium shrink-0">Presets:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setClientRefundPercent(100)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    clientRefundPercent === 100
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-white/5 text-[#8A8FA9] border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  100% Client
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setClientRefundPercent(50)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    clientRefundPercent === 50
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-white/5 text-[#8A8FA9] border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  50 / 50 Split
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setClientRefundPercent(0)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    clientRefundPercent === 0
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-white/5 text-[#8A8FA9] border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  100% Creator
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form: Admin Arbitration Note & Reason */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center justify-between font-bold text-white text-xs mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-400" />
                Admin Arbitration Reason &amp; Audit Note
              </span>
              <span className="text-[10px] text-[#8A8FA9] font-normal">
                Required for Audit Log
              </span>
            </label>
            <textarea
              rows={3}
              required
              disabled={isResolved || isSubmitting}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Partitioning escrow 50/50 based on partial deliverable completion and mutual communication breakdown..."
              className="w-full px-3.5 py-2.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs placeholder:text-[#8A8FA9]/60 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Operational Safety Warning */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-amber-200/90 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Atomic Settlement:</strong> Upon execution, locked escrow funds are
              instantly distributed to user digital wallets and the commission status is set to
              Cancelled/Resolved. This action cannot be reverted.
            </span>
          </div>

          {/* Execution Button */}
          {!isResolved ? (
            <button
              type="submit"
              disabled={isSubmitting || !adminNote.trim()}
              className="w-full py-4 bg-gradient-to-r from-red-500 via-purple-600 to-indigo-600 hover:from-red-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-[0_4px_25px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_30px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Atomic Escrow Transfer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Atomic Escrow Distribution &amp; Resolve Dispute</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-3 text-xs text-[#8A8FA9] bg-white/5 rounded-xl border border-white/5">
              Dispute ticket is already settled and locked.
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#161926] border border-red-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-h1 font-bold text-white text-base">
                  Confirm Escrow Execution
                </h4>
                <p className="text-[11px] text-[#8A8FA9]">
                  Ticket #{dispute.disputeId.substring(0, 8)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A8FA9]">Total Escrow:</span>
                <span className="font-mono font-bold text-white">
                  ${totalEscrow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Client Refund ({clientRefundPercent}%):</span>
                <span className="font-mono font-bold">
                  ${clientAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-indigo-300 font-semibold">
                <span>Creator Payout ({100 - clientRefundPercent}%):</span>
                <span className="font-mono font-bold">
                  ${creatorAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#8A8FA9] leading-relaxed">
              <strong className="text-white block mb-1">Arbitration Note:</strong>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/90 italic">
                &ldquo;{adminNote}&rdquo;
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmExecution}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    <span>Confirm &amp; Disburse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
