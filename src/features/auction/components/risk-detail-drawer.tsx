'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, CheckCircle2, Clock3, Hand, RefreshCw, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { AuctionRiskAssessmentDto, RiskSignalDto } from '../types/auction-risk.types';
import type { BidDto } from '../types/auction.types';
import { RiskBadge, RiskScore } from './risk-badge';
import { formatVnd } from './auction-card';

const MIN_NOTE_LENGTH = 10;

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
 * The sheet is **state-aware**: an Open sheet is a decision form (note + actions), a dismissed or
 * confirmed sheet is a closed record (decision, reviewer, reason, evidence, no actions). Same
 * component, different composition and accent — a moderator must be able to tell at a glance
 * whether they are deciding or reading history.
 *
 * Colours come from tokens, so both "paper" and "ink" themes work without a second stylesheet.
 */
export function RiskDetailDrawer({
  open,
  assessment,
  loading,
  error,
  note,
  bids = [],
  claimWarning = null,
  currentUserId = null,
  claiming = false,
  onNoteChange,
  onClose,
  onReview,
  onClaim,
  onRelease,
  onRescan,
  rescanning,
}: {
  open: boolean;
  assessment: AuctionRiskAssessmentDto | null;
  loading: boolean;
  error: string | null;
  note: string;
  bids?: BidDto[];
  claimWarning?: string | null;
  currentUserId?: string | null;
  claiming?: boolean;
  onClaim?: () => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onReview: (status: 'Dismissed' | 'Confirmed') => void;
  onRelease?: () => void;
  onRescan: () => void;
  rescanning: boolean;
}) {
  const { t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [noteTouched, setNoteTouched] = useState(false);

  const groups = useMemo(() => groupSignals(assessment?.signals ?? []), [assessment]);
  const status = assessment?.status ?? 'Open';
  const isDismissed = status === 'Dismissed';
  const isConfirmed = status === 'Confirmed';
  const isReviewing = status === 'UnderReview';
  const decided = isDismissed || isConfirmed;

  const tone = isConfirmed ? 'confirmed' : isDismissed ? 'dismissed' : isReviewing ? 'reviewing' : 'open';
  const statusLabel = isConfirmed
    ? t('Đã xác nhận gian lận')
    : isDismissed
      ? t('Đã bỏ qua')
      : isReviewing
        ? t('Đang xem')
        : t('Chờ xem');

  const claimedByMe =
    isReviewing &&
    Boolean(currentUserId) &&
    assessment?.claimedByUserId === currentUserId;

  const noteTooShort = note.trim().length < MIN_NOTE_LENGTH;
  const showNoteError = noteTooShort && noteTouched;
  const reviewer = assessment?.reviewedByName?.trim() || t('Người kiểm duyệt');

  // `onClose` is usually an inline arrow in the parent, so its identity changes on every parent
  // render - including the render caused by typing in the note. Keeping it in a ref lets the focus
  // effect depend on `open` alone; otherwise every keystroke yanked the caret back to the close
  // button.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
    // Intentionally depends on `open` only: this is an open/close side effect, not a re-render one.
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} aria-hidden="true" />
      <aside
        className={`drawer__panel risk-sheet risk-sheet--${tone}`}
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
            {/* Kết luận quyết định đứng TRƯỚC bằng chứng khi phiếu đã đóng */}
            {decided && (
              <div className="risk-decision">
                <div className="risk-decision__icon">
                  {isConfirmed ? <ShieldAlert size={18} aria-hidden /> : <Ban size={18} aria-hidden />}
                </div>
                <div>
                  <p className="risk-decision__title">
                    {isConfirmed ? t('Đã xác nhận gian lận') : t('Đã bỏ qua cảnh báo')}
                  </p>
                  <p className="risk-decision__meta">
                    {reviewer} · {formatDateTime(assessment.reviewedAt)}
                  </p>
                  <p className="risk-decision__note">{assessment.decisionNote || t('Không có ghi chú.')}</p>
                  {isConfirmed && (
                    <p className="risk-decision__effect">
                      {assessment.auctionStatus === 'Cancelled'
                        ? t('Phiên đã bị huỷ và toàn bộ tiền cọc đã hoàn về ví người tham gia.')
                        : t('Phiên đã kết thúc trước quyết định này nên không huỷ lại; cọc xử lý theo quy trình khiếu nại.')}
                    </p>
                  )}
                  {isDismissed && (
                    <p className="risk-decision__effect">
                      {t('Người bán đã được thông báo phiên tiếp tục bình thường và không có vi phạm.')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isReviewing && (
              <div className="risk-claim">
                <div>
                  <p className="risk-claim__title">
                    {claimedByMe
                      ? t('Bạn đang xem phiếu này')
                      : `${t('Đang xem bởi')} ${assessment.claimedByName?.trim() || t('một kiểm duyệt viên')}`}
                  </p>
                  <p className="risk-claim__meta">
                    {t('Phiếu tự nhả về hàng chờ nếu không có quyết định trong 30 phút')}
                    {assessment.claimedAt ? ` · ${formatDateTime(assessment.claimedAt)}` : ''}
                  </p>
                </div>
                {claimedByMe && onRelease && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={onRelease} disabled={claiming}>
                    <RotateCcw size={14} aria-hidden />
                    {t(claiming ? 'Đang nhả…' : 'Nhả phiếu')}
                  </button>
                )}
              </div>
            )}

            {claimWarning && (
              <p role="alert" className="risk-sheet__alert">
                {claimWarning}
              </p>
            )}

            <div className="risk-verdict">
              <div className="risk-verdict__row">
                <RiskScore score={assessment.score} />
                <RiskBadge level={assessment.riskLevel} label={assessment.riskLevelLabel} />
                <span className={`risk-status risk-status--${tone}`}>{statusLabel}</span>
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
              <h3 className="risk-sheet__label">
                {decided ? t('Bằng chứng đã ghi nhận') : t('Vì sao bị gắn cờ')}
              </h3>
              {groups.length === 0 ? (
                <p className="risk-sheet__empty">{t('Chưa ghi nhận dấu hiệu nào.')}</p>
              ) : (
                <ul className={`risk-signals${decided ? ' risk-signals--closed' : ''}`}>
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
                {decided && (
                  <div>
                    <dt>{t('Xử lý')}</dt>
                    <dd>{formatDateTime(assessment.reviewedAt)}</dd>
                  </div>
                )}
              </dl>
            </section>

            {decided ? (
              // Phiếu đã đóng: chỉ đọc. Không có hành động nào để tránh sửa lịch sử.
              <div className="risk-sheet__foot risk-sheet__foot--closed">
                <p className="risk-sheet__closed">
                  <Clock3 size={14} aria-hidden />
                  {t('Phiếu đã đóng. Mở lại phiên sẽ tạo phiếu mới nếu có dấu hiệu mới.')}
                </p>
                <div className="risk-sheet__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={onClose}>
                    {t('Đóng')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="risk-sheet__foot">
                <label className="risk-sheet__label" htmlFor="risk-note">
                  {t('Ghi chú kiểm duyệt')}
                </label>
                <textarea
                  id="risk-note"
                  ref={noteRef}
                  className="risk-sheet__note"
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  onBlur={() => setNoteTouched(true)}
                  placeholder={t('Ví dụ: hai tài khoản dùng chung IP văn phòng, đã xác minh với người bán.')}
                  aria-invalid={showNoteError}
                  aria-describedby="risk-note-hint"
                />
                <p
                  id="risk-note-hint"
                  className={showNoteError ? 'err' : 'risk-sheet__hint'}
                  role={showNoteError ? 'alert' : undefined}
                >
                  {showNoteError
                    ? t(`Ghi chú cần ít nhất ${MIN_NOTE_LENGTH} ký tự — còn thiếu ${MIN_NOTE_LENGTH - note.trim().length}.`)
                    : t('Bắt buộc khi xác nhận gian lận (ít nhất 10 ký tự).')}
                </p>

                <div className="risk-sheet__actions">
                    {/* Nhận phiếu là hành động tường minh: chưa ai giữ thì mới hiện. */}
                    {!isReviewing && onClaim && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={onClaim}
                        disabled={claiming || rescanning}
                      >
                        <Hand size={14} aria-hidden />
                        {t(claiming ? 'Đang nhận…' : 'Nhận phiếu')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => onReview('Dismissed')}
                      disabled={rescanning}
                    >
                      {t('Bỏ qua phiên này')}
                    </button>
                  {/*
                    Không dùng `disabled` cho nút xác nhận: nút bị khoá im lặng khiến người dùng
                    tưởng nút hỏng. Giữ bấm được, thiếu ghi chú thì focus về ô ghi chú + hiện lỗi.
                  */}
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      if (noteTooShort) {
                        setNoteTouched(true);
                        noteRef.current?.focus();
                        return;
                      }

                      onReview('Confirmed');
                    }}
                    disabled={rescanning}
                    aria-describedby="risk-note-hint"
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
