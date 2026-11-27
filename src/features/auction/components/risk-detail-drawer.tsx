'use client';

import { useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { AuctionRiskAssessmentDto, RiskSignalDto } from '../types/auction-risk.types';
import type { BidDto } from '../types/auction.types';
import { RiskBadge, RiskScore } from './risk-badge';
import { formatVnd } from './auction-card';

/** 26/11/2026 22:51 — one format everywhere in the sheet, tabular so rows line up. */
function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatTime(iso: string) {
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

type SignalGroup = {
  code: string;
  label: string;
  weight: number;
  evidences: string[];
};

/** Same rule firing on several accounts is one finding with several pieces of evidence, not N rows. */
function groupSignals(signals: RiskSignalDto[]): SignalGroup[] {
  const groups = new Map<string, SignalGroup>();

  for (const signal of signals) {
    const key = `${signal.code}`;
    const existing = groups.get(key);
    if (existing) {
      existing.weight = Math.max(existing.weight, signal.weight);
      if (!existing.evidences.includes(signal.evidence)) existing.evidences.push(signal.evidence);
      continue;
    }

    groups.set(key, {
      code: key,
      label: signal.label,
      weight: signal.weight,
      evidences: [signal.evidence],
    });
  }

  return [...groups.values()].sort((a, b) => b.weight - a.weight);
}

/**
 * Evidence sheet of one risky auction.
 *
 * Redesign notes:
 *   - every colour comes from a token, so the same sheet is legible in "paper" and "ink" without a
 *     second stylesheet;
 *   - the verdict (score + level) is one block at the top instead of a badge floating next to a
 *     number, so severity is read before the evidence list;
 *   - signals are grouped per rule: the same rule hitting three accounts is one finding with three
 *     evidence lines, which is how a moderator reasons about it;
 *   - the note lives here (the confirm dialog only echoes it back).
 */
export function RiskDetailDrawer({
  open,
  assessment,
  loading,
  error,
  note,
  bids = [],
  onNoteChange,
  onClose,
  onReview,
  onRescan,
  rescanning,
}: {
  open: boolean;
  assessment: AuctionRiskAssessmentDto | null;
  loading: boolean;
  error: string | null;
  note: string;
  bids?: BidDto[];
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onReview: (status: 'Dismissed' | 'Confirmed') => void;
  onRescan: () => void;
  rescanning: boolean;
}) {
  const { t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const groups = useMemo(() => groupSignals(assessment?.signals ?? []), [assessment]);
  const decided = assessment != null && ['Dismissed', 'Confirmed'].includes(assessment.status);
  const noteTooShort = note.trim().length < 10;

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} aria-hidden="true" />
      <aside
        className="drawer__panel risk-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('Phiếu kiểm duyệt rủi ro')}
      >
        <div className="risk-sheet__head">
          <h2 className="drawer__title">{t('Phiếu kiểm duyệt rủi ro')}</h2>
          <div className="risk-sheet__headtools">
            <button
              type="button"
              onClick={onRescan}
              disabled={rescanning}
              className="icon-btn"
              aria-label={t('Quét lại phiên này')}
              title={t('Quét lại phiên này')}
            >
              <RefreshCw
                size={15}
                className={rescanning ? 'animate-spin motion-reduce:animate-none' : ''}
                aria-hidden
              />
            </button>
            <button
              type="button"
              ref={closeRef}
              onClick={onClose}
              className="icon-btn"
              aria-label={t('Đóng phiếu kiểm duyệt')}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>

        {loading && (
          <div className="risk-sheet__stack" aria-busy="true">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="skeleton h-16 w-full rounded-xl" />
            ))}
            <span className="sr-only" role="status" aria-live="polite">
              {t('Đang tải phiếu rủi ro')}
            </span>
          </div>
        )}

        {error && !loading && (
          <p role="alert" className="risk-sheet__alert">
            {error}
          </p>
        )}

        {assessment && !loading && (
          <>
            <div className="risk-verdict">
              <div className="risk-verdict__row">
                <RiskScore score={assessment.score} />
                <RiskBadge level={assessment.riskLevel} label={assessment.riskLevelLabel} />
                <span className="risk-verdict__count">
                  {assessment.signalCount} {t('dấu hiệu')}
                </span>
              </div>
              <p className="risk-verdict__title" title={assessment.auctionTitle}>
                {assessment.auctionTitle}
              </p>
              <p className="risk-verdict__summary">{assessment.summary}</p>
            </div>

            <section className="risk-sheet__group">
              <h3 className="risk-sheet__label">{t('Vì sao bị gắn cờ')}</h3>
              {groups.length === 0 ? (
                <p className="risk-sheet__empty">{t('Chưa ghi nhận dấu hiệu nào.')}</p>
              ) : (
                <ul className="risk-signals">
                  {groups.map((group) => (
                    <li key={group.code} className="risk-signal">
                      <div className="risk-signal__head">
                        <span className="risk-signal__name">{group.label}</span>
                        <span className="risk-signal__weight">+{Math.round(group.weight)}</span>
                      </div>
                      <ul className="risk-signal__evidence">
                        {group.evidences.map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {bids.length > 0 && (
              <section className="risk-sheet__group">
                <h3 className="risk-sheet__label">{t('Diễn biến đặt giá')}</h3>
                <ol className="risk-bids">
                  {bids.slice(0, 12).map((bid) => (
                    <li
                      key={bid.bidId}
                      className={`risk-bid${bid.bidStatus === 'Leading' ? ' risk-bid--leading' : ''}`}
                    >
                      <span className="risk-bid__who">{bid.bidder?.fullName || t('Người đấu giá')}</span>
                      <span className="risk-bid__amount">{formatVnd(bid.amount)}</span>
                      <span className="risk-bid__time">{formatTime(bid.placedAt)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="risk-sheet__group">
              <h3 className="risk-sheet__label">{t('Dấu thời gian')}</h3>
              <dl className="risk-meta">
                <div>
                  <dt>{t('Phát hiện')}</dt>
                  <dd>{formatDateTime(assessment.detectedAt)}</dd>
                </div>
                <div>
                  <dt>{t('Quét gần nhất')}</dt>
                  <dd>{formatDateTime(assessment.lastRiskScanAt)}</dd>
                </div>
              </dl>
            </section>

            {decided ? (
              <section className="risk-sheet__group">
                <h3 className="risk-sheet__label">{t('Đã xử lý')}</h3>
                <p className="risk-verdict__summary">{assessment.decisionNote || t('Không có ghi chú.')}</p>
                <p className="risk-meta__stamp">{formatDateTime(assessment.reviewedAt)}</p>
              </section>
            ) : (
              <div className="risk-sheet__foot">
                <label className="risk-sheet__label" htmlFor="risk-note">
                  {t('Ghi chú kiểm duyệt')}
                </label>
                <textarea
                  id="risk-note"
                  className="risk-sheet__note"
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder={t('Ví dụ: hai tài khoản dùng chung IP văn phòng, đã xác minh với người bán.')}
                  aria-describedby={noteTooShort ? 'risk-note-hint' : undefined}
                />
                <p id="risk-note-hint" className="risk-sheet__hint">
                  {t('Bắt buộc khi xác nhận gian lận (ít nhất 10 ký tự).')}
                </p>

                <div className="risk-sheet__actions">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => onReview('Dismissed')}
                    disabled={rescanning}
                  >
                    {t('Bỏ qua phiên này')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => onReview('Confirmed')}
                    disabled={rescanning || noteTooShort}
                  >
                    <ShieldAlert size={14} aria-hidden />
                    {t('Xác nhận gian lận')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
