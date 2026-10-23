'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Layers,
  Plus,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  addonService,
  addonMoney,
  type CommissionAddon,
} from '@/services/addon.service';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { Commission } from '@/types/commission.types';

export function WorkroomAddons({
  commission,
  isCreator,
  onUpdated,
  onPresenceChanged,
  onOpenStore,
  onSelectMilestone,
}: {
  commission: Commission;
  isCreator: boolean;
  onUpdated: (value: Commission) => void;
  onPresenceChanged: (present: boolean) => void;
  onOpenStore?: () => void;
  onSelectMilestone?: (milestoneId: string) => void;
}) {
  const [items, setItems] = useState<CommissionAddon[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'accepted' | 'rejected'
  >('all');

  const sequence = commission.currentStage ?? 1;
  const active =
    commission.status === 'InProgress' && (commission.escrowHeldAmount ?? 0) > 0;
  const updatedRef = useRef(onUpdated);

  useEffect(() => {
    updatedRef.current = onUpdated;
  }, [onUpdated]);

  useEffect(() => {
    onPresenceChanged(items.length > 0);
  }, [items.length, onPresenceChanged]);

  const refresh = useCallback(async () => {
    const [addons, current] = await Promise.all([
      addonService.list(commission.id),
      commissionService.getById(commission.id),
    ]);
    setItems(addons);
    updatedRef.current(current);
  }, [commission.id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [addons, current] = await Promise.all([
          addonService.list(commission.id),
          commissionService.getById(commission.id),
        ]);
        if (!cancelled) {
          setItems(addons);
          updatedRef.current(current);
        }
      } catch (cause) {
        if (!cancelled) setError(extractErrorMessage(cause, 'Không tải được phụ phí.'));
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [commission.id]);

  // Bộ lọc phụ phí theo trạng thái
  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return items;
    if (filterStatus === 'pending')
      return items.filter((a) => a.status === 'Proposed');
    if (filterStatus === 'accepted')
      return items.filter((a) => a.status === 'Accepted');
    if (filterStatus === 'rejected')
      return items.filter((a) => a.status === 'Rejected');
    return items;
  }, [items, filterStatus]);

  // Gom nhóm phụ phí theo từng Mốc (milestoneSequence)
  const groupedByMilestone = useMemo(() => {
    const map = new Map<number, CommissionAddon[]>();
    for (const item of filteredItems) {
      const list = map.get(item.milestoneSequence) || [];
      list.push(item);
      map.set(item.milestoneSequence, list);
    }
    return Array.from(map.entries()).sort(([seqA], [seqB]) => seqA - seqB);
  }, [filteredItems]);

  const totalFunded = useMemo(
    () =>
      items
        .filter((a) => a.status === 'Accepted')
        .reduce((sum, a) => sum + a.price, 0),
    [items]
  );

  const totalDays = useMemo(
    () =>
      items
        .filter((a) => a.status === 'Accepted')
        .reduce((sum, a) => sum + a.extendDays, 0),
    [items]
  );

  const pendingCount = useMemo(
    () => items.filter((a) => a.status === 'Proposed').length,
    [items]
  );

  const acceptedCount = useMemo(
    () => items.filter((a) => a.status === 'Accepted').length,
    [items]
  );

  const rejectedCount = useMemo(
    () => items.filter((a) => a.status === 'Rejected').length,
    [items]
  );

  // Đề xuất đang chờ duyệt và đủ điều kiện duyệt tại mốc hiện tại
  const eligiblePending = useMemo(
    () =>
      items.filter(
        (a) =>
          a.status === 'Proposed' &&
          a.milestoneSequence === sequence &&
          active
      ),
    [items, sequence, active]
  );

  const eligiblePendingTotal = useMemo(
    () => eligiblePending.reduce((sum, a) => sum + a.price, 0),
    [eligiblePending]
  );

  // THAO TÁC NHANH: Duyệt tất cả đề xuất đủ điều kiện
  const handleAcceptAll = async () => {
    if (eligiblePending.length === 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      for (const a of eligiblePending) {
        await addonService.respond(commission.id, a.id, 'Accept');
      }
      await refresh();
    } catch (cause) {
      setError(
        extractErrorMessage(cause, 'Một số phụ phí không thể duyệt đồng thời.')
      );
    } finally {
      setBusy(false);
    }
  };

  // THAO TÁC NHANH: Từ chối tất cả đề xuất đang chờ
  const handleRejectAll = async () => {
    const pendingItems = items.filter((a) => a.status === 'Proposed');
    if (pendingItems.length === 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      for (const a of pendingItems) {
        await addonService.respond(commission.id, a.id, 'Reject');
      }
      await refresh();
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không thể từ chối các phụ phí.'));
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="my-2 rounded-2xl border border-white/10 bg-[#171a2a]/95 p-3.5 shadow-lg backdrop-blur-md space-y-3">
      {/* 1. THANH TỔNG QUAN VÀ CÁC THAO TÁC NHANH TRÊN HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#A7ACD9]/20 text-[#A7ACD9]">
            <Layers size={15} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-h1 text-xs font-bold text-white">
                Phụ phí theo mốc ({items.length} mục)
              </h3>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {pendingCount} chờ duyệt
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#A7ACD9]">
              Đã nạp Escrow: +{addonMoney(totalFunded)}
              {totalDays > 0 && ` · Gia hạn: +${totalDays} ngày`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Thao tác nhanh: Mở nhanh cửa hàng Add-on */}
          {onOpenStore && (
            <button
              type="button"
              onClick={onOpenStore}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A7ACD9] hover:text-white bg-[#A7ACD9]/10 hover:bg-[#A7ACD9]/20 border border-[#A7ACD9]/30 transition px-2 py-1 rounded-lg"
              title="Mở bảng phụ phí để mua hoặc báo giá thêm"
            >
              <Plus size={12} />
              <span>{isCreator ? 'Báo giá mới' : 'Mua thêm'}</span>
            </button>
          )}

          {/* Thao tác nhanh: Thu gọn / Mở rộng */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#A7ACD9] hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5"
              title={collapsed ? 'Mở rộng chi tiết' : 'Thu gọn danh sách'}
            >
              <span>{collapsed ? 'Chi tiết' : 'Thu gọn'}</span>
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 2. THAO TÁC NHANH: BANNER DUYỆT HÀNG LOẠT (BATCH ACCEPT) KHI CÓ NHIỀU ĐỀ XUẤT CHỜ DUYỆT */}
      {!isCreator && eligiblePending.length > 1 && !collapsed && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/30 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <Sparkles size={14} className="text-amber-400 animate-pulse shrink-0" />
            <span>
              Có <strong>{eligiblePending.length} đề xuất</strong> chờ bạn duyệt (+{addonMoney(eligiblePendingTotal)})
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={handleAcceptAll}
              className="px-2.5 py-1 rounded-lg bg-[#A7ACD9] text-[#1F2335] font-bold text-[11px] hover:bg-white transition disabled:opacity-40"
              title="Duyệt và ký quỹ toàn bộ đề xuất hợp lệ ở mốc này"
            >
              Duyệt tất cả ({eligiblePending.length})
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleRejectAll}
              className="px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 text-[11px] hover:bg-white/10 transition disabled:opacity-40"
              title="Từ chối tất cả đề xuất đang chờ"
            >
              Từ chối hết
            </button>
          </div>
        </div>
      )}

      {/* 3. THAO TÁC NHANH: BỘ LỌC TRẠNG THÁI (FILTER PILLS) */}
      {!collapsed && items.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2 py-0.5 rounded-lg border transition ${
              filterStatus === 'all'
                ? 'bg-[#A7ACD9]/20 border-[#A7ACD9] text-[#A7ACD9] font-semibold'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({items.length})
          </button>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-0.5 rounded-lg border transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Chờ duyệt ({pendingCount})
            </button>
          )}
          {acceptedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('accepted')}
              className={`px-2 py-0.5 rounded-lg border transition ${
                filterStatus === 'accepted'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Đã nạp Escrow ({acceptedCount})
            </button>
          )}
          {rejectedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('rejected')}
              className={`px-2 py-0.5 rounded-lg border transition ${
                filterStatus === 'rejected'
                  ? 'bg-white/10 border-white/20 text-white font-semibold'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Đã từ chối ({rejectedCount})
            </button>
          )}
        </div>
      )}

      {/* 4. DANH SÁCH PHỤ PHÍ THEO TỪNG MỐC */}
      {!collapsed && (
        <div className="space-y-3 pt-0.5">
          {groupedByMilestone.length === 0 ? (
            <p className="text-center text-[11px] text-slate-400 py-2">
              Không có phụ phí nào phù hợp với bộ lọc hiện tại.
            </p>
          ) : (
            groupedByMilestone.map(([msSeq, msItems]) => {
              const milestone = commission.milestones?.find(
                (m) => m.sequence === msSeq
              );
              const milestoneTitle = milestone?.title || `Mốc #${msSeq}`;
              const isCurrentMilestone = msSeq === sequence;

              return (
                <div key={msSeq} className="space-y-1.5">
                  {/* Header của từng mốc - Cho phép click để xem mốc này trên Canvas */}
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#919099] px-1">
                    <button
                      type="button"
                      disabled={!onSelectMilestone || !milestone?.id}
                      onClick={() =>
                        milestone?.id && onSelectMilestone?.(milestone.id)
                      }
                      className="flex items-center gap-1.5 hover:text-white transition group/ms text-left"
                      title={
                        onSelectMilestone
                          ? `Bấm để xem phác thảo Mốc #${msSeq} trên Canvas`
                          : undefined
                      }
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isCurrentMilestone
                            ? 'bg-brand-periwinkle animate-pulse shadow-[0_0_6px_rgba(167,172,217,0.8)]'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>
                        Mốc #{msSeq}: {milestoneTitle}
                      </span>
                      {onSelectMilestone && milestone?.id && (
                        <ExternalLink
                          size={10}
                          className="opacity-0 group-hover/ms:opacity-100 transition-opacity text-[#A7ACD9]"
                        />
                      )}
                    </button>
                    <span className="text-[10px] lowercase font-normal text-outline">
                      {msItems.length} phụ phí
                    </span>
                  </div>

                  {/* Danh sách phụ phí trong mốc này */}
                  <div className="space-y-1.5">
                    {msItems.map((a) => {
                      const isPending = a.status === 'Proposed';
                      const isAccepted = a.status === 'Accepted';
                      const isRejected = a.status === 'Rejected';

                      return (
                        <div
                          key={a.id}
                          className={`rounded-xl border p-2.5 transition text-xs flex flex-col gap-1.5 ${
                            isPending
                              ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                              : isAccepted
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-white/5 bg-white/[0.02] opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isAccepted && (
                                <CheckCircle2
                                  size={14}
                                  className="text-emerald-400 shrink-0"
                                />
                              )}
                              {isRejected && (
                                <XCircle
                                  size={14}
                                  className="text-slate-400 shrink-0"
                                />
                              )}
                              {isPending && (
                                <Clock
                                  size={14}
                                  className="text-amber-400 shrink-0 animate-pulse"
                                />
                              )}
                              <strong className="text-white font-medium text-xs">
                                {a.title}
                              </strong>
                            </div>
                            {a.createdAt && (
                              <span className="text-[10px] text-outline shrink-0">
                                {new Date(a.createdAt).toLocaleTimeString(
                                  'vi-VN',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
                            <div className="flex items-center gap-2 font-semibold">
                              <span className="text-[#A7ACD9]">
                                +{addonMoney(a.price)}
                              </span>
                              {a.extendDays > 0 && (
                                <span className="text-outline font-normal">
                                  · Gia hạn: +{a.extendDays} ngày
                                </span>
                              )}
                            </div>

                            {/* Trạng thái xử lý */}
                            {isAccepted ? (
                              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                {commission.escrowStatus === 'Pending'
                                  ? 'Đã chọn · Ký quỹ cùng đơn'
                                  : 'Đã nạp Escrow'}
                              </span>
                            ) : isRejected ? (
                              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-white/10">
                                Đã từ chối
                              </span>
                            ) : (
                              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                                {a.milestoneSequence !== sequence
                                  ? 'Đã qua mốc'
                                  : isCreator
                                  ? 'Chờ khách duyệt'
                                  : 'Chờ bạn duyệt'}
                              </span>
                            )}
                          </div>

                          {/* Nút thao tác nhanh từng món: Duyệt hoặc Từ chối */}
                          {isPending && !isCreator && (
                            <div className="flex items-center gap-2 pt-1 border-t border-white/10 mt-1">
                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  !active ||
                                  a.milestoneSequence !== sequence
                                }
                                className="flex-1 rounded-lg bg-[#A7ACD9] py-1.5 px-3 font-bold text-[11px] text-[#1F2335] hover:bg-white transition disabled:opacity-40"
                                onClick={async () => {
                                  setBusy(true);
                                  setError('');
                                  try {
                                    await addonService.respond(
                                      commission.id,
                                      a.id,
                                      'Accept'
                                    );
                                    await refresh();
                                  } catch (cause) {
                                    setError(
                                      extractErrorMessage(
                                        cause,
                                        'Không xử lý được phụ phí.'
                                      )
                                    );
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                Thanh toán &amp; Nạp ký quỹ
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                className="rounded-lg border border-white/15 py-1.5 px-3 font-semibold text-[11px] text-slate-300 hover:bg-white/10 transition disabled:opacity-40"
                                onClick={async () => {
                                  setBusy(true);
                                  setError('');
                                  try {
                                    await addonService.respond(
                                      commission.id,
                                      a.id,
                                      'Reject'
                                    );
                                    await refresh();
                                  } catch (cause) {
                                    setError(
                                      extractErrorMessage(
                                        cause,
                                        'Không xử lý được phụ phí.'
                                      )
                                    );
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-300 pt-1">
          {error}
        </p>
      )}
    </div>
  );
}
