'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { auctionRiskService } from '../services/auction-risk.service';
import type { AuctionRiskAssessmentDto } from '../types/auction-risk.types';
import { RiskBadge } from './risk-badge';

/**
 * One-line risk strip on the auction detail page for operators.
 *
 * Mirrors the existing `role="status"` notice strips on that page (same rounded-2xl border, same
 * mb-6 rhythm). Non-operators never see it — and, quan trọng hơn, KHÔNG gọi API: trước đây ai vào
 * trang chi tiết cũng bắn request tới endpoint chỉ dành cho kiểm duyệt viên, nhận 403 rồi mới ẩn
 * mình. Người mua thường thấy 2 dòng đỏ "Failed to load resource: 403" trong console.
 */
export function RiskDetailStrip({ auctionId }: { auctionId: string }) {
  const { t } = useLanguage();
  const roles = useAuthStore((state) => state.roles);
  const isOperator = roles.includes('Administrator') || roles.includes('Moderator');
  const [assessment, setAssessment] = useState<AuctionRiskAssessmentDto | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isOperator) {
      setHidden(true);
      return;
    }

    let ignore = false;

    void (async () => {
      try {
        const data = await auctionRiskService.get(auctionId);
        if (!ignore && data.assessmentId !== '00000000-0000-0000-0000-000000000000') {
          setAssessment(data);
        }
      } catch {
        // 403/401/404: quyền có thể vừa bị thu hồi — ẩn strip, không hiện hộp rỗng.
        if (!ignore) setHidden(true);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [auctionId, isOperator]);

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
