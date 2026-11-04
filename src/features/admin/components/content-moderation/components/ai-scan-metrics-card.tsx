'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Flame,
  Cpu,
  History,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { ArtworkInspectionDetailDto } from '@/features/admin/types/moderation.types';

interface AiScanMetricsCardProps {
  artwork: ArtworkInspectionDetailDto;
  isRescanning?: boolean;
  onRescanArtwork?: (artworkId: string) => Promise<boolean>;
}

export function AiScanMetricsCard({
  artwork,
  isRescanning = false,
  onRescanArtwork,
}: AiScanMetricsCardProps) {
  const isPendingScan =
    artwork.safeScore === null || artwork.safeScore === undefined;

  const safePercent = !isPendingScan ? (artwork.safeScore! * 100).toFixed(1) : null;

  const adultPercent =
    artwork.adultScore !== null && artwork.adultScore !== undefined
      ? (artwork.adultScore * 100).toFixed(1)
      : '0.0';

  const violencePercent =
    artwork.violenceScore !== null && artwork.violenceScore !== undefined
      ? (artwork.violenceScore * 100).toFixed(1)
      : '0.0';

  const aiDetectionPercent =
    artwork.aiDetectionScore !== null && artwork.aiDetectionScore !== undefined
      ? (artwork.aiDetectionScore * 100).toFixed(1)
      : null;

  const safeNumeric = safePercent !== null ? parseFloat(safePercent) : 0;
  const isHighSafe = safeNumeric >= 90;
  const isMediumSafe = safeNumeric >= 70 && safeNumeric < 90;

  const adultNumeric = parseFloat(adultPercent);
  const violenceNumeric = parseFloat(violencePercent);

  const getRiskLabel = (pct: number) => {
    if (pct < 5) return 'Negligible';
    if (pct < 20) return 'Low';
    if (pct < 50) return 'Moderate';
    return 'High';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`w-4 h-4 ${isPendingScan ? 'text-amber-400' : 'text-emerald-400'}`}
          />
          <h3 className="font-h1 font-bold text-white text-sm">
            AI Content Safety Scan
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8A8FA9] uppercase">
          Gemini 2.5 Flash
        </span>
      </div>

      {isPendingScan ? (
        /* Pending AI Scan State */
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Safety Scan Pending / In Queue</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              PENDING
            </span>
          </div>
          <p className="text-[11px] text-[#8A8FA9] leading-relaxed">
            This artwork has not been scanned yet or the automated background scan is in progress. You can initiate a re-scan right away.
          </p>
          {onRescanArtwork && (
            <button
              type="button"
              disabled={isRescanning}
              onClick={() => onRescanArtwork(artwork.artworkId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
              <span>{isRescanning ? 'Requesting AI Scan...' : 'Trigger AI Scan Now'}</span>
            </button>
          )}
        </div>
      ) : (
        /* Completed AI Scan Metrics */
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span>Safe Content Confidence</span>
              {isHighSafe && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </span>
            <span
              className={`font-mono font-bold ${
                isHighSafe
                  ? 'text-emerald-400'
                  : isMediumSafe
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {safePercent}% SAFE
            </span>
          </div>

          <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHighSafe
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                  : isMediumSafe
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, safeNumeric))}%` }}
            ></div>
          </div>

          {/* Detailed Risk Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            {/* Adult Content Risk */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#8A8FA9]">
                <span className="flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-red-400/80" />
                  <span>Adult Content Risk:</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="text-white text-xs font-mono">
                  {adultPercent}%
                </strong>
                <span
                  className={`text-[9px] font-bold ${
                    adultNumeric < 5 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ({getRiskLabel(adultNumeric)})
                </span>
              </div>
            </div>

            {/* Violence Risk */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#8A8FA9]">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400/80" />
                  <span>Violence Risk:</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="text-white text-xs font-mono">
                  {violencePercent}%
                </strong>
                <span
                  className={`text-[9px] font-bold ${
                    violenceNumeric < 5 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ({getRiskLabel(violenceNumeric)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Detection & Flag Reason Notes */}
      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[#8A8FA9] flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>AI Classifier Detection:</span>
          </span>
          <span
            className={`font-mono font-bold ${
              artwork.isAiGenerated ? 'text-purple-300' : 'text-emerald-400'
            }`}
          >
            {artwork.isAiGenerated
              ? `AI Generated Art${aiDetectionPercent ? ` (${aiDetectionPercent}%)` : ''}`
              : `Human Created${aiDetectionPercent ? ` (AI: ${aiDetectionPercent}%)` : ''}`}
          </span>
        </div>

        {artwork.flagReason && (
          <div className="flex items-center justify-between border-t border-white/5 pt-1">
            <span className="text-[#8A8FA9] flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-400" />
              <span>Flag Reason:</span>
            </span>
            <span className="text-amber-300 font-medium">
              {artwork.flagReason}
            </span>
          </div>
        )}
      </div>

      {/* Previous Moderation History (if already moderated) */}
      {artwork.moderatedAt && (
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1 text-[10px]">
          <div className="flex items-center justify-between text-[#8A8FA9]">
            <span className="flex items-center gap-1 font-bold text-white">
              <History className="w-3 h-3 text-blue-400" />
              <span>Previous Audit Log</span>
            </span>
            <span>{new Date(artwork.moderatedAt).toLocaleString()}</span>
          </div>
          <p className="text-white/80">
            Moderated by:{' '}
            <span className="text-white font-bold">
              {artwork.moderatorName || 'System Admin'}
            </span>
          </p>
          {artwork.moderationNote && (
            <p className="italic text-[#8A8FA9] bg-black/40 p-1.5 rounded border border-white/5">
              &ldquo;{artwork.moderationNote}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
