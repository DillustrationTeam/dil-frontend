'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

/**
 * Confirmation step for resolving a risk sheet.
 *
 * The note is written in the drawer (one place to type), so this dialog only echoes it back:
 * "you are about to confirm X with this note". Copied shell from the force-settle modal on the admin
 * auctions page (overlay + glass container + icon tile + info box), but all colours are tokens so it
 * reads correctly in both paper and ink themes.
 */
export function RiskReviewDialog({
  open,
  mode,
  auctionTitle,
  score,
  signalCount,
  note,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  mode: 'Dismissed' | 'Confirmed';
  auctionTitle: string;
  score: number;
  signalCount: number;
  note: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();

  if (!open) return null;

  const isConfirm = mode === 'Confirmed';

  return (
    <div className="risk-dialog">
      <div className="risk-dialog__panel" role="dialog" aria-modal="true" aria-label={t('Xác nhận quyết định')}>
        <div className="risk-dialog__head">
          <div className={`risk-dialog__icon${isConfirm ? ' risk-dialog__icon--danger' : ' risk-dialog__icon--ok'}`}>
            {isConfirm ? <AlertTriangle size={22} aria-hidden /> : <CheckCircle2 size={22} aria-hidden />}
          </div>
          <div>
            <h3 className="risk-dialog__title">
              {t(isConfirm ? 'Xác nhận gian lận cho phiên này?' : 'Bỏ qua cảnh báo của phiên này?')}
            </h3>
            <p className="risk-dialog__body">
              {t(
                isConfirm
                  ? 'Phiên sẽ được ghi nhận là gian lận và chuyển sang bước xử lý tiếp theo. Quyết định lưu kèm tên bạn.'
                  : 'Cảnh báo sẽ đóng lại và phiên tiếp tục bình thường. Lý do bạn ghi sẽ được lưu để người sau đọc.',
              )}
            </p>
          </div>
        </div>

        <dl className="risk-dialog__facts">
          <div>
            <dt>{t('Phiên')}</dt>
            <dd className="risk-dialog__truncate" title={auctionTitle}>
              {auctionTitle}
            </dd>
          </div>
          <div>
            <dt>{t('Điểm rủi ro')}</dt>
            <dd className="risk-dialog__num">
              {score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)}/100
            </dd>
          </div>
          <div>
            <dt>{t('Số dấu hiệu')}</dt>
            <dd className="risk-dialog__num">{signalCount}</dd>
          </div>
          <div>
            <dt>{t('Ghi chú')}</dt>
            <dd className="risk-dialog__note">{note.trim() || t('Không có ghi chú.')}</dd>
          </div>
        </dl>

        <div className="risk-dialog__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel} disabled={submitting}>
            {t('Đóng')}
          </button>
          <button
            type="button"
            className={`btn btn--sm ${isConfirm ? 'btn--danger' : 'btn--outline'}`}
            onClick={onConfirm}
            disabled={submitting || (isConfirm && note.trim().length < 10)}
          >
            {t(submitting ? 'Đang lưu…' : isConfirm ? 'Xác nhận gian lận' : 'Bỏ qua cảnh báo')}
          </button>
        </div>
      </div>
    </div>
  );
}
