'use client';

import React from 'react';
import { ArtworkScanPanel } from '@/features/artwork-ai';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import {
  ArtworkInspectionDetailDto,
  ModerationActionType,
} from '@/features/admin/types/moderation.types';
import { ArtworkPreviewCard } from './artwork-preview-card';
import { AiScanMetricsCard } from './ai-scan-metrics-card';
import { ModerationDecisionForm } from './moderation-decision-form';

interface ModerationInspectionPanelProps {
  artwork: ArtworkInspectionDetailDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onExecuteDecision: (
    artworkId: string,
    action: ModerationActionType,
    moderationNote?: string
  ) => Promise<boolean>;
  onClose?: () => void;
}

export function ModerationInspectionPanel({
  artwork,
  isLoading,
  isSubmitting,
  onExecuteDecision,
  onClose,
}: ModerationInspectionPanelProps) {
  if (isLoading && !artwork) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        <p className="font-h1 font-bold text-white text-sm">
          Loading Artwork Inspection Details...
        </p>
        <p className="text-xs text-[#8A8FA9]">
          Đang tải thông tin tác phẩm và kết quả kiểm tra.
        </p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-10 flex flex-col items-center justify-center text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-[#8A8FA9]/40" />
        <p className="font-h1 font-bold text-white text-base">
          No Artwork Selected for Inspection
        </p>
        <p className="text-xs text-[#8A8FA9] max-w-md">
          Select any flagged artwork from the queue above to review AI NSFW scan breakdown, tag classifications, and execute moderation actions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-h1 font-bold text-lg text-white flex items-center gap-2">
          <span>Inspection Console</span>
          <span className="text-xs font-mono text-[#8A8FA9]">
            [Item #{artwork.artworkId.substring(0, 8)}]
          </span>
        </h2>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#8A8FA9] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Collapse Panel</span>
          </button>
        )}
      </div>

      {/* Detailed Inspection Panel (Selected Item) matching SCR-20 grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Image Preview & AI Tags (50% / col-span-6) */}
        <div className="md:col-span-6">
          <ArtworkPreviewCard artwork={artwork} />
        </div>

        {/* Right Column: AI NSFW Metrics Breakdown & Moderator Action Form (50% / col-span-6) */}
        <div className="md:col-span-6 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6 flex flex-col justify-between">
          {/* AI Confidence Scores */}
          <AiScanMetricsCard artwork={artwork} />
          <ArtworkScanPanel key={artwork.artworkId} artworkId={artwork.artworkId} canRetry={['Pending', 'Flagged'].includes(artwork.moderationStatus)} />

          {/* Moderator Decision Form */}
          <ModerationDecisionForm
            artworkId={artwork.artworkId}
            isSubmitting={isSubmitting}
            currentStatus={artwork.moderationStatus}
            onExecuteDecision={onExecuteDecision}
          />
        </div>
      </div>
    </div>
  );
}
