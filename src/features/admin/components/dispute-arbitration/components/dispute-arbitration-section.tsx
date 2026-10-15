'use client';

import React from 'react';
import {
  DisputeArbitrationDetailDto,
  ResolveDisputeArbitrationRequest,
} from '@/features/admin/types/dispute-arbitration.types';
import { DisputeEvidencePanel } from './dispute-evidence-panel';
import { DisputeSettlementForm } from './dispute-settlement-form';
import {
  Gavel,
  Loader2,
  Lock,
  Calendar,
  Layers,
} from 'lucide-react';

interface DisputeArbitrationSectionProps {
  dispute: DisputeArbitrationDetailDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onResolve: (disputeId: string, req: ResolveDisputeArbitrationRequest) => Promise<boolean>;
}

export function DisputeArbitrationSection({
  dispute,
  isLoading,
  isSubmitting,
  onResolve,
}: DisputeArbitrationSectionProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 animate-spin">
          <Loader2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-h1 font-bold text-white text-base">
            Loading Arbitration Dossier...
          </h3>
          <p className="text-xs text-[#8A8FA9] mt-1">
            Fetching contract milestones, chat snapshot transcript, and escrow balances.
          </p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="glass-card p-12 text-center space-y-4 border border-dashed border-white/10">
        <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 text-[#8A8FA9]">
          <Gavel className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-h1 font-bold text-white text-base">
            No Dispute Dossier Inspected
          </h3>
          <p className="text-xs text-[#8A8FA9] mt-1 max-w-md mx-auto">
            Select an active ticket from the arbitration queue above to inspect workroom evidence,
            statements, and execute atomic escrow disbursement.
          </p>
        </div>
      </div>
    );
  }

  const isResolved = dispute.status === 'Resolved';
  const totalEscrow = dispute.escrowHeldAmount ?? dispute.finalPrice;

  return (
    <div id="arbitration-dossier" className="space-y-6 scroll-mt-6">
      {/* Dispute Ticket Banner */}
      <div className="glass-card p-6 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-red-400 font-bold tracking-wider">
                DISPUTE TICKET #{dispute.disputeId.substring(0, 8).toUpperCase()}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-[#8A8FA9]">
                COMMISSION #{dispute.commissionId.substring(0, 8).toUpperCase()}
              </span>
            </div>

            <h2 className="font-h1 text-xl sm:text-2xl font-extrabold text-white">
              {dispute.commissionTitle}
            </h2>

            <p className="text-xs text-[#8A8FA9]">
              Client: <strong className="text-emerald-400">@{dispute.client.userName}</strong> ({dispute.client.fullName})
              {' • '}
              Creator: <strong className="text-amber-300">@{dispute.creator.userName}</strong> ({dispute.creator.fullName})
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Escrow Status: {isResolved ? 'SETTLED' : 'LOCKED'} (${totalEscrow.toLocaleString('en-US', { minimumFractionDigits: 2 })})
            </span>

            <div className="flex items-center gap-3 text-[11px] text-[#8A8FA9]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Raised {new Date(dispute.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Stage {dispute.currentStage}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Grid: Left 60% (Evidence & Chat Snapshot) vs Right 40% (Arbitration Settlement Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: 60% (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <DisputeEvidencePanel dispute={dispute} />
        </div>

        {/* RIGHT: 40% (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <DisputeSettlementForm
            dispute={dispute}
            isSubmitting={isSubmitting}
            onResolve={onResolve}
          />
        </div>
      </div>
    </div>
  );
}
