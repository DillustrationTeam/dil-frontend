'use client';

import React from 'react';
import { FileCheck2, Shield } from 'lucide-react';

export function PolicyRulesGuideCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#241F1A]">
          <FileCheck2 className="w-4 h-4 text-[#2C5A86]" />
          <span>BR-37 Escrow Milestone Inaction Protection</span>
        </div>
        <p className="text-[11px] text-[#6E6459] leading-relaxed font-body">
          When a creator marks a milestone deliverable as completed, clients have a strict window to review and request revisions. If no client action occurs before the deadline, the system automatically marks the milestone approved and releases escrow funds to prevent abandonment.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#241F1A]">
          <Shield className="w-4 h-4 text-[#5F3F86]" />
          <span>BR-39 Digital Deliverables Pre-signed Security</span>
        </div>
        <p className="text-[11px] text-[#6E6459] leading-relaxed font-body">
          Deliverable artwork master files (PSD, lossless PNG, raw archives) are protected in private S3 buckets. Downloads generate time-limited pre-signed URLs that invalidate immediately after expiry, preventing link sharing or unauthorized hotlinking.
        </p>
      </div>
    </div>
  );
}
