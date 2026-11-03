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