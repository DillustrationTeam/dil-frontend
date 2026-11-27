'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { auctionRiskService } from '../services/auction-risk.service';
import { auctionService } from '../services/auction.service';
import { formatVnd } from './auction-card';
import { RiskBadge, RiskScore } from './risk-badge';
import { RiskDetailDrawer } from './risk-detail-drawer';
import { RiskReviewDialog } from './risk-review-dialog';
import type {
  AuctionRiskAssessmentDto,
  RiskAlertListItemDto,
  RiskAlertPage,
} from '../types/auction-risk.types';
import type { BidDto } from '../types/auction.types';

const STATUS_TABS = [
  { key: 'Open', label: 'Chờ xem' },
  { key: 'UnderReview', label: 'Đang xem' },
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

function timeAgo(iso: string | null | undefined, t: (s: string) => string): string {
  if (!iso) return '—';
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return t('vừa xong');
  if (diffMinutes < 60) return `${diffMinutes} ${t('phút trước')}`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} ${t('giờ trước')}`;
  return `${Math.round(hours / 24)} ${t('ngày trước')}`;
}

/**
 * Risk queue of AI Bid Fraud Detection, rendered inside the admin auctions page as a tab.
 *
 * Deliberately shaped like the existing admin surfaces (pill filters, `glass-container` table shell,
 * uppercase 11px header, `divide-y` rows, mobile card list) so it reads as one more tab rather than a
 * new product. Loading uses skeleton rows, not the spinner the older admin table uses.
 */
export function AdminRiskQueue() {
  const { t } = useLanguage();
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
  const [activeAuctionId, setActiveAuctionId] = useState<string | null>(null);

  const [reviewMode, setReviewMode] = useState<'Dismissed' | 'Confirmed' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  const load = useCallback(
    async (append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await auctionRiskService.list({
          status,
          level,
          cursor: append ? page.nextCursor : null,
          limit: 20,
        });

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
    // page.nextCursor is read only for the append case; keeping it out avoids a reload loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, level, t],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  // The detector writes in the background, so the queue refreshes itself instead of asking the
  // moderator to hammer the refresh button. Pauses while the tab is hidden to spare the API.
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

  const rows = useMemo(() => {
    const sorted = [...page.items].sort((a, b) => (sortDesc ? b.score - a.score : a.score - b.score));
    return sorted;
  }, [page.items, sortDesc]);

  const openSheet = useCallback(async (auctionId: string) => {
    setActiveAuctionId(auctionId);
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setAssessment(null);

    setRecentBids([]);

    try {
      // The sheet and the bid trail come from two endpoints; the trail is a nice-to-have, so a
      // failure there must not blank the evidence sheet.
      const [sheet, detail] = await Promise.all([
        auctionRiskService.get(auctionId),
        auctionService.detail(auctionId).catch(() => null),
      ]);

      setAssessment(sheet);
      setRecentBids(detail?.recentBids ?? []);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : t('Không tải được phiếu rủi ro.'));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  const rescan = useCallback(async () => {
    if (!activeAuctionId) return;
    setRescanning(true);
    try {
      const result = await auctionRiskService.rescan(activeAuctionId);
      toast.success(
        t(`Đã quét lại: ${result.score.toFixed(1)}/100 · ${result.signalCount} dấu hiệu.`),
      );
      setAssessment(await auctionRiskService.get(activeAuctionId));
      await load(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Không quét lại được phiên này.'));
    } finally {
      setRescanning(false);
    }
  }, [activeAuctionId, load, t]);

  const submitReview = useCallback(
    async () => {
      if (!activeAuctionId || !reviewMode) return;
      setSubmitting(true);
      try {
        await auctionRiskService.review(activeAuctionId, {
          status: reviewMode,
          note: note.trim().length > 0 ? note.trim() : undefined,
        });
        toast.success(
          t(reviewMode === 'Confirmed' ? 'Đã xác nhận gian lận cho phiên.' : 'Đã bỏ qua cảnh báo của phiên.'),
        );
        setReviewMode(null);
        setDrawerOpen(false);
        setNote('');
        await load(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('Không lưu được quyết định.'));
      } finally {
        setSubmitting(false);
      }
    },
    [activeAuctionId, reviewMode, note, load, t],
  );

  return (
    <div className="space-y-4">
      {/* Bộ lọc: cùng khung pill như tab trạng thái của trang quản trị */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-1.5">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                aria-pressed={active}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active ? 'bg-[#B24A26] text-[#F7F2E9] shadow-md' : 'text-[#746A5F] hover:bg-[#FFFCF6] hover:text-[#241F1A]'
                }`}
              >
                {t(tab.label)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-1.5">
            {LEVEL_TABS.map((tab) => {
              const active = level === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLevel(tab.key)}
                  aria-pressed={active}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold ${
                    active ? 'bg-[#241F1A] text-[#F7F2E9]' : 'text-[#746A5F] hover:text-[#241F1A]'
                  }`}
                >
                  {t(tab.label)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSortDesc((previous) => !previous)}
            className="btn btn--outline btn--sm"
          >
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
        <div role="alert" className="rounded-2xl border border-[#A8321C]/30 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
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
          {/* Desktop: bảng semantic cùng vỏ với bảng phiên đấu giá */}
          <div className="hidden overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#221E1A]/10 bg-[#FFFCF6] text-[11px] font-bold uppercase tracking-wider text-[#746A5F]">
                  <th scope="col" className="px-5 py-4">{t('Điểm')}</th>
                  <th scope="col" className="px-5 py-4">{t('Phiên')}</th>
                  <th scope="col" className="px-5 py-4">{t('Dấu hiệu')}</th>
                  <th scope="col" className="px-5 py-4">{t('Bid cuối')}</th>
                  <th scope="col" className="px-5 py-4">{t('Phát hiện')}</th>
                  <th scope="col" className="px-5 py-4 text-right">{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221E1A]/10">
                {rows.map((row) => (
                  <tr
                    key={row.assessmentId}
                    className={`hover:bg-[#F0E7D8] ${row.riskLevel === 'Critical' ? 'border-l-[3px] border-l-[#A8321C]' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <RiskScore score={row.score} />
                        <RiskBadge level={row.riskLevel} label={row.riskLevelLabel} />
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <div className="flex items-center gap-2">
                        {row.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.thumbnailUrl} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#F0E7D8]" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#241F1A]" title={row.auctionTitle}>
                            {row.auctionTitle}
                          </p>
                          <p className="text-[11px] text-[#746A5F] tabular-nums">{formatVnd(row.currentPrice)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-5 py-4">
                      <p className="truncate text-[11px] text-[#746A5F]" title={row.summary}>
                        {row.summary}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[#746A5F]">{timeAgo(row.lastBidAt, t)}</td>
                    <td className="px-5 py-4 text-[11px] text-[#746A5F] tabular-nums">
                      {new Date(row.detectedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => void openSheet(row.auctionId)}
                      >
                        {t('Xem phiếu')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: danh sách thẻ, không cuộn ngang */}
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.assessmentId}>
                <button
                  type="button"
                  onClick={() => void openSheet(row.auctionId)}
                  className="w-full rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <RiskScore score={row.score} />
                    <RiskBadge level={row.riskLevel} label={row.riskLevelLabel} />
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-[#241F1A]">{row.auctionTitle}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[#746A5F]">{row.summary}</p>
                  <p className="mt-2 text-[11px] text-[#746A5F]">
                    {t('Phát hiện')} {new Date(row.detectedAt).toLocaleString('vi-VN')}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {page.hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn btn--outline"
                disabled={loadingMore}
                onClick={() => void load(true)}
              >
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
        onNoteChange={setNote}
        onClose={() => setDrawerOpen(false)}
        onReview={(nextStatus) => setReviewMode(nextStatus)}
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
