'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';
import { auctionRiskService } from '../services/auction-risk.service';
import { auctionService } from '../services/auction.service';
import { formatVnd } from './auction-card';
import { RiskBadge, RiskScore } from './risk-badge';
import { RiskDetailDrawer } from './risk-detail-drawer';
import { RiskReviewDialog } from './risk-review-dialog';
import type {
  AuctionRiskAssessmentDto,
  RiskAlertFilters,
  RiskAlertPage,
} from '../types/auction-risk.types';
import { riskStatusLabels } from '../types/auction-risk.types';
import type { BidDto } from '../types/auction.types';

/**
 * Hàng chờ rủi ro của AI Bid Fraud Detection.
 *
 * 4 trạng thái: Chờ xem (hàng chờ làm việc, gồm cả phiếu đang có người nhận), Đã bỏ qua,
 * Đã xác nhận, Tất cả.
 *
 * "Nhận phiếu" là thao tác TƯỜNG MINH trong phiếu, không tự động khi mở: nếu tự động thì bấm
 * "Nhả phiếu" xong mở lại là nhận lại ngay, người dùng thấy banner y như chưa nhả.
 */
const STATUS_TABS = [
  { key: 'Open', label: 'Chờ xem' },
  { key: 'Dismissed', label: 'Đã bỏ qua' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'All', label: 'Tất cả' },
] as const;

const LEVEL_TABS = [
  { key: 'All', label: 'Tất cả mức' },
  { key: 'Critical', label: 'Nghiêm trọng' },
  { key: 'High', label: 'Cao' },
  { key: 'Medium', label: 'Vừa' },
] as const;

function rowStatusTone(status: string) {
  if (status === 'Confirmed') return 'confirmed';
  if (status === 'Dismissed') return 'dismissed';
  if (status === 'UnderReview') return 'reviewing';
  return 'open';
}

function timeAgo(iso: string | null | undefined, t: (s: string) => string): string {
  if (!iso) return '—';
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return t('vừa xong');
  if (diffMinutes < 60) return `${diffMinutes} ${t('phút trước')}`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} ${t('giờ trước')}`;
  return `${Math.round(hours / 24)} ${t('ngày trước')}`;
}

export function AdminRiskQueue() {
  const { t } = useLanguage();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['key']>('Open');
  const [level, setLevel] = useState<(typeof LEVEL_TABS)[number]['key']>('All');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState<RiskAlertPage>({ items: [], nextCursor: null, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assessment, setAssessment] = useState<AuctionRiskAssessmentDto | null>(null);
  const [recentBids, setRecentBids] = useState<BidDto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [claimWarning, setClaimWarning] = useState<string | null>(null);
  const [activeAuctionId, setActiveAuctionId] = useState<string | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [reviewMode, setReviewMode] = useState<'Dismissed' | 'Confirmed' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(
    async (append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const filters: RiskAlertFilters = {
          status,
          level,
          cursor: append ? page.nextCursor : null,
          limit: 20,
        };
        const result = await auctionRiskService.list(filters);

        setPage((previous) =>
          append
            ? { items: [...previous.items, ...result.items], nextCursor: result.nextCursor, hasMore: result.hasMore }
            : result,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Không tải được hàng chờ rủi ro.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // page.nextCursor chỉ dùng cho nhánh append; bỏ khỏi dependency để tránh vòng tải lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, level, t],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  // Bộ phát hiện ghi nền, nên hàng chờ tự làm mới thay vì bắt người dùng bấm refresh.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void load(false);
    };

    const timer = window.setInterval(refreshIfVisible, 60_000);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [load]);

  const rows = useMemo(
    () => [...page.items].sort((a, b) => (sortDesc ? b.score - a.score : a.score - b.score)),
    [page.items, sortDesc],
  );

  /** Đọc lại phiếu + dấu vết bid tại chỗ (không đóng drawer). */
  const refreshSheet = useCallback(async (auctionId: string, assessmentId: string) => {
    const [sheet, detail] = await Promise.all([
      auctionRiskService.get(auctionId, assessmentId),
      auctionService.detail(auctionId).catch(() => null),
    ]);

    setAssessment(sheet);
    setRecentBids(detail?.recentBids ?? []);
  }, []);

  const openSheet = useCallback(
    async (auctionId: string, assessmentId: string) => {
      setActiveAuctionId(auctionId);
      setActiveAssessmentId(assessmentId);
      setDrawerOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      setClaimWarning(null);
      setAssessment(null);
      setRecentBids([]);

      try {
        await refreshSheet(auctionId, assessmentId);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : t('Không tải được phiếu rủi ro.'));
      } finally {
        setDetailLoading(false);
      }
    },
    [refreshSheet, t],
  );

  /** Nhận phiếu: tường minh, chỉ khi chưa có ai giữ. */
  const claimSheet = useCallback(async () => {
    if (!activeAuctionId || !activeAssessmentId) return;
    setClaiming(true);
    setClaimWarning(null);
    try {
      await auctionRiskService.review(activeAuctionId, { status: 'UnderReview' });
      await refreshSheet(activeAuctionId, activeAssessmentId);
      toast.success(t('Bạn đang xem phiếu này. Phiếu tự nhả sau 30 phút nếu chưa quyết định.'));
      await load(false);
    } catch (err) {
      setClaimWarning(err instanceof Error ? err.message : t('Không nhận được phiếu này.'));
    } finally {
      setClaiming(false);
    }
  }, [activeAuctionId, activeAssessmentId, refreshSheet, load, t]);

  /** Nhả phiếu: cập nhật tại chỗ để thấy banner biến mất, không đóng drawer. */
  const releaseSheet = useCallback(async () => {
    if (!activeAuctionId || !activeAssessmentId) return;
    setClaiming(true);
    setClaimWarning(null);
    try {
      await auctionRiskService.review(activeAuctionId, { status: 'Open' });
      await refreshSheet(activeAuctionId, activeAssessmentId);
      toast.success(t('Đã nhả phiếu về hàng chờ.'));
      await load(false);
    } catch (err) {
      setClaimWarning(err instanceof Error ? err.message : t('Không nhả được phiếu.'));
    } finally {
      setClaiming(false);
    }
  }, [activeAuctionId, activeAssessmentId, refreshSheet, load, t]);

  const rescan = useCallback(async () => {
    if (!activeAuctionId) return;
    setRescanning(true);
    try {
      const result = await auctionRiskService.rescan(activeAuctionId);
      toast.success(t(`Đã quét lại: ${result.score.toFixed(1)}/100 · ${result.signalCount} dấu hiệu.`));
      if (activeAssessmentId) await refreshSheet(activeAuctionId, activeAssessmentId);
      await load(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Không quét lại được phiên này.'));
    } finally {
      setRescanning(false);
    }
  }, [activeAuctionId, activeAssessmentId, refreshSheet, load, t]);

  const submitReview = useCallback(async () => {
    if (!activeAuctionId || !reviewMode) return;
    setSubmitting(true);
    try {
      await auctionRiskService.review(activeAuctionId, {
        status: reviewMode,
        note: note.trim().length > 0 ? note.trim() : undefined,
      });
      toast.success(
        t(
          reviewMode === 'Confirmed'
            ? 'Đã xác nhận gian lận: phiên bị huỷ, tiền cọc đã hoàn về ví người tham gia và người bán đã được báo.'
            : 'Đã bỏ qua cảnh báo: phiên tiếp tục nhận đặt giá và người bán đã được báo.',
        ),
      );
      setReviewMode(null);
      setNote('');

      // Giữ drawer mở và đọc lại phiếu: kiểm duyệt viên phải thấy NGAY hệ quả (phiên đã huỷ,
      // cọc đã hoàn) thay vì chỉ một toast rồi drawer tự đóng — trước đây đóng luôn nên không ai
      // đọc được dòng hệ quả của quyết định.
      if (activeAssessmentId) {
        await refreshSheet(activeAuctionId, activeAssessmentId);
      }

      await load(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Không lưu được quyết định.'));
    } finally {
      setSubmitting(false);
    }
  }, [activeAuctionId, activeAssessmentId, reviewMode, note, load, refreshSheet, t]);

  // Identity ổn định: drawer giữ các handler này trong effect; arrow inline sẽ làm effect chạy lại.
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openReview = useCallback(
    (nextStatus: 'Dismissed' | 'Confirmed') => setReviewMode(nextStatus),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-1.5">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                aria-pressed={active}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[var(--lumen)] text-[var(--ink)] shadow-md'
                    : 'text-[var(--ash)] hover:bg-[var(--ink-3)] hover:text-[var(--ivory)]'
                }`}
              >
                {t(tab.label)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-1.5">
            {LEVEL_TABS.map((tab) => {
              const active = level === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLevel(tab.key)}
                  aria-pressed={active}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold ${
                    active ? 'bg-[var(--ivory)] text-[var(--ink)]' : 'text-[var(--ash)] hover:text-[var(--ivory)]'
                  }`}
                >
                  {t(tab.label)}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => setSortDesc((previous) => !previous)} className="btn btn--outline btn--sm">
            {t(sortDesc ? 'Điểm cao → thấp' : 'Điểm thấp → cao')}
          </button>

          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await load(false);
              setRefreshing(false);
            }}
            disabled={loading || refreshing}
            className="icon-btn"
            aria-label={t('Quét lại hàng chờ')}
            title={t('Quét lại hàng chờ')}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="risk-sheet__alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-[68px] w-full rounded-xl" />
          ))}
          <span className="sr-only" role="status" aria-live="polite">
            {t('Đang tải hàng chờ rủi ro')}
          </span>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <ShieldAlert size={44} className="empty__art" aria-hidden />
          <h2>{t('Không có phiên nào cần kiểm tra')}</h2>
          <p>{t('Hàng chờ tự làm mới mỗi 5 phút. Bạn có thể quét lại ngay nếu vừa chốt phiên.')}</p>
          <div className="empty__actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => void load(false)}>
              {t('Quét lại ngay')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-[var(--hair)] bg-[var(--ink-2)] md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--hair)] text-[11px] font-bold uppercase tracking-wider text-[var(--ash-dim)]">
                  <th scope="col" className="px-5 py-4">{t('Điểm')}</th>
                  <th scope="col" className="px-5 py-4">{t('Phiên')}</th>
                  <th scope="col" className="px-5 py-4">{t('Dấu hiệu')}</th>
                  <th scope="col" className="px-5 py-4">{t('Bid cuối')}</th>
                  <th scope="col" className="px-5 py-4">{t('Phát hiện')}</th>
                  <th scope="col" className="px-5 py-4 text-right">{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hair)]">
                {rows.map((row) => (
                  <tr
                    key={row.assessmentId}
                    className={`auc-riskrow auc-riskrow--${rowStatusTone(row.status)} hover:bg-[var(--ink-3)]`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskScore score={row.score} />
                        <RiskBadge level={row.riskLevel} label={row.riskLevelLabel} />
                        {row.status !== 'Open' && (
                          <span className={`risk-status risk-status--${rowStatusTone(row.status)}`}>
                            {t(riskStatusLabels[row.status] ?? row.status)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <div className="flex items-center gap-2">
                        {row.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.thumbnailUrl} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--ink-3)]" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--ivory)]" title={row.auctionTitle}>
                            {row.auctionTitle}
                          </p>
                          <p className="text-[11px] text-[var(--ash)] tabular-nums">{formatVnd(row.currentPrice)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-5 py-4">
                      <p className="truncate text-[11px] text-[var(--ash)]" title={row.summary}>
                        {row.summary}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[var(--ash)]">{timeAgo(row.lastBidAt, t)}</td>
                    <td className="px-5 py-4 text-[11px] text-[var(--ash-dim)] tabular-nums">
                      {new Date(row.detectedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => void openSheet(row.auctionId, row.assessmentId)}
                      >
                        {t('Xem phiếu')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.assessmentId}>
                <button
                  type="button"
                  onClick={() => void openSheet(row.auctionId, row.assessmentId)}
                  className={`auc-riskcard auc-riskcard--${rowStatusTone(row.status)} w-full rounded-2xl border border-[var(--hair)] bg-[var(--ink-2)] p-4 text-left`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <RiskScore score={row.score} />
                    <div className="flex items-center gap-1.5">
                      <RiskBadge level={row.riskLevel} label={row.riskLevelLabel} />
                      {row.status !== 'Open' && (
                        <span className={`risk-status risk-status--${rowStatusTone(row.status)}`}>
                          {t(riskStatusLabels[row.status] ?? row.status)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-[var(--ivory)]">{row.auctionTitle}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[var(--ash)]">{row.summary}</p>
                  <p className="mt-2 text-[11px] text-[var(--ash-dim)]">
                    {t('Phát hiện')} {new Date(row.detectedAt).toLocaleString('vi-VN')}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {page.hasMore && (
            <div className="flex justify-center">
              <button type="button" className="btn btn--outline" disabled={loadingMore} onClick={() => void load(true)}>
                {t(loadingMore ? 'Đang tải thêm…' : 'Tải thêm')}
              </button>
            </div>
          )}
        </>
      )}

      <RiskDetailDrawer
        open={drawerOpen}
        assessment={assessment}
        loading={detailLoading}
        error={detailError}
        note={note}
        bids={recentBids}
        claimWarning={claimWarning}
        currentUserId={currentUserId}
        claiming={claiming}
        onNoteChange={setNote}
        onClose={closeDrawer}
        onReview={openReview}
        onClaim={() => void claimSheet()}
        onRelease={() => void releaseSheet()}
        onRescan={() => void rescan()}
        rescanning={rescanning}
      />

      <RiskReviewDialog
        open={reviewMode !== null}
        mode={reviewMode ?? 'Dismissed'}
        auctionTitle={assessment?.auctionTitle ?? ''}
        score={assessment?.score ?? 0}
        signalCount={assessment?.signalCount ?? 0}
        note={note}
        submitting={submitting}
        onCancel={() => setReviewMode(null)}
        onConfirm={() => void submitReview()}
      />
    </div>
  );
}
