'use client';

import React from 'react';
import { Shield } from 'lucide-react';

interface PolicyParametersGridProps {
  milestoneDays: number;
  revisionLimit: number;
  presignedUrlMinutes: number;
  onMilestoneDaysChange: (value: number) => void;
  onRevisionLimitChange: (value: number) => void;
  onPresignedUrlMinutesChange: (value: number) => void;
}

export function PolicyParametersGrid({
  milestoneDays,
  revisionLimit,
  presignedUrlMinutes,
  onMilestoneDaysChange,
  onRevisionLimitChange,
  onPresignedUrlMinutesChange,
}: PolicyParametersGridProps) {
  const milestoneTimelineOptions = [
    { value: 3, label: '3 Days (Accelerated)' },
    { value: 5, label: '5 Days (Fast)' },
    { value: 7, label: '7 Days (Default)' },
    { value: 10, label: '10 Days (Standard)' },
    { value: 14, label: '14 Days (Extended)' },
  ];

  const presignedUrlOptions = [
    { value: 5, label: '5 Minutes (Strict DRM)' },
    { value: 15, label: '15 Minutes (Default)' },
    { value: 30, label: '30 Minutes' },
    { value: 60, label: '60 Minutes (Standard)' },
    { value: 120, label: '120 Minutes (Long session)' },
  ];

  const handleRevisionIncrement = () => {
    if (revisionLimit < 20) {
      onRevisionLimitChange(revisionLimit + 1);
    }
  };

  const handleRevisionDecrement = () => {
    if (revisionLimit > 0) {
      onRevisionLimitChange(revisionLimit - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-red-400" />
        <h3 className="font-h1 text-sm font-bold text-white uppercase tracking-wider">
          Operational & Protection Policies
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Milestone Auto-Approval Timeline */}
        <div className="space-y-2 bg-black/40 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auto-approval-timeline"
                className="block font-bold text-white text-xs font-h1"
              >
                Milestone Auto-Approval
              </label>
            </div>
            <p className="text-[10px] text-[#8A8FA9] mb-3 leading-relaxed">
              Automatic escrow release timeline if Client remains inactive after Creator delivers milestone work.
            </p>
          </div>

          <div>
            <select
              id="auto-approval-timeline"
              value={milestoneDays}
              onChange={(e) => onMilestoneDaysChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-[#0f1017] border border-white/15 text-white font-bold text-xs focus:border-red-400 focus:outline-none transition-colors"
            >
              {milestoneTimelineOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Default Free Revision Limit */}
        <div className="space-y-2 bg-black/40 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="revision-limit-input"
                className="block font-bold text-white text-xs font-h1"
              >
                Free Revision Limit
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Commission Rule
              </span>
            </div>
            <p className="text-[10px] text-[#8A8FA9] mb-3 leading-relaxed">
              Standard free revision requests included per deliverable milestone before fee surcharge is requested.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevisionDecrement}
              disabled={revisionLimit <= 0}
              className="w-10 h-11 rounded-xl bg-[#0f1017] border border-white/15 text-white font-bold hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              -
            </button>

            <input
              id="revision-limit-input"
              type="number"
              min="0"
              max="20"
              value={revisionLimit}
              onChange={(e) =>
                onRevisionLimitChange(
                  Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0))
                )
              }
              className="flex-1 px-4 py-3 rounded-xl bg-[#0f1017] border border-white/15 text-white text-center font-mono font-bold text-sm focus:border-red-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleRevisionIncrement}
              disabled={revisionLimit >= 20}
              className="w-10 h-11 rounded-xl bg-[#0f1017] border border-white/15 text-white font-bold hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* 3. AWS S3 Presigned URL Expiration */}
        <div className="space-y-2 bg-black/40 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="presigned-url-expiration"
                className="block font-bold text-white text-xs font-h1"
              >
                Presigned URL Expiry
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                BR-39
              </span>
            </div>
            <p className="text-[10px] text-[#8A8FA9] mb-3 leading-relaxed">
              Lifespan of temporary AWS S3 / Cloudinary presigned URLs for secure high-res deliverable downloads.
            </p>
          </div>

          <div>
            <select
              id="presigned-url-expiration"
              value={presignedUrlMinutes}
              onChange={(e) => onPresignedUrlMinutesChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-[#0f1017] border border-white/15 text-white font-bold text-xs focus:border-red-400 focus:outline-none transition-colors"
            >
              {presignedUrlOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
