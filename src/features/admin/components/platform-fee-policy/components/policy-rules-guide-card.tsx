'use client';

import React from 'react';
import { FileCheck2, Shield } from 'lucide-react';

export function PolicyRulesGuideCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <FileCheck2 className="w-4 h-4 text-blue-400" />
          <span>BR-37 Escrow Milestone Inaction Protection</span>
        </div>
        <p className="text-[11px] text-[#8A8FA9] leading-relaxed font-body">
          When a creator marks a milestone deliverable as completed, clients have a strict window to review and request revisions. If no client action occurs before the deadline, the system automatically marks the milestone approved and releases escrow funds to prevent abandonment.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>BR-39 Digital Deliverables Pre-signed Security</span>
        </div>
        <p className="text-[11px] text-[#8A8FA9] leading-relaxed font-body">
          Deliverable artwork master files (PSD, lossless PNG, raw archives) are protected in private S3 buckets. Downloads generate time-limited pre-signed URLs that invalidate immediately after expiry, preventing link sharing or unauthorized hotlinking.
        </p>
      </div>
    </div>
  );
}
