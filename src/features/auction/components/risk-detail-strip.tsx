'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionRiskService } from '../services/auction-risk.service';
import type { AuctionRiskAssessmentDto } from '../types/auction-risk.types';
import { RiskBadge } from './risk-badge';

/**
 * One-line risk strip on the auction detail page for operators.
 *
 * Mirrors the existing `role="status"` notice strips on that page (same rounded-2xl border, same
 * mb-6 rhythm). Non-operators never see it: the API answers 403 and the component renders nothing
 * rather than an empty box.
 */
export function RiskDetailStrip({ auctionId }: { auctionId: string }) {
  const { t } = useLanguage();
  const [assessment, setAssessment] = useState<AuctionRiskAssessmentDto | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      try {
        const data = await auctionRiskService.get(auctionId);
        if (!ignore && data.assessmentId !== '00000000-0000-0000-0000-000000000000') {
          setAssessment(data);
        }
      } catch {
        // 403/401/404: the strip is an operator-only extra, so it simply does not render.
        if (!ignore) setHidden(true);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [auctionId]);

  if (hidden || !assessment) return null;
  if (!['High', 'Critical'].includes(String(assessment.riskLevel))) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-3 text-xs text-[#A8321C]"
    >
      <AlertTriangle size={15} aria-hidden />
      <span className="font-semibold">
        {t('Điểm rủi ro')} {assessment.score.toFixed(1)}/100
      </span>
      <RiskBadge level={assessment.riskLevel} label={assessment.riskLevelLabel} />
      <span className="text-[#746A5F]">
        {assessment.signalCount} {t('dấu hiệu')}
      </span>
      <a href="/admin/auctions?tab=risk" className="ml-auto font-semibold underline">
        {t('Mở phiếu kiểm duyệt')}
      </a>
    </div>
  );
}
