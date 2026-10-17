'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Gavel,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import { auctionService, auctionError } from '@/features/auction/services/auction.service';
import type { AuctionListItemDto } from '@/features/auction/types/auction.types';

const statusTabs = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'Active', label: 'Đang diễn ra' },
  { key: 'Scheduled', label: 'Sắp diễn ra' },
  { key: 'Settled', label: 'Đã chốt' },
  { key: 'Ended', label: 'Đã kết thúc' },
  { key: 'Cancelled', label: 'Đã hủy' },
] as const;

type StatusTabKey = (typeof statusTabs)[number]['key'];

const money = (val?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val ?? 0);

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTabKey>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionAuction, setActionAuction] = useState<AuctionListItemDto | null>(null);
  const [modalType, setModalType] = useState<'force-settle' | 'cancel' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'ALL' ? {} : { status: statusFilter };
      const res = await auctionService.list(filter);
      setAuctions(res.items || []);
    } catch (err) {
      toast.error(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAuctions();
  }, [statusFilter]);

  const filteredAuctions = useMemo(() => {
    if (!searchQuery.trim()) return auctions;
    const q = searchQuery.toLowerCase().trim();
    return auctions.filter(
      (a) =>
        a.artwork?.artworkTitle.toLowerCase().includes(q) ||
        a.auctionId.toLowerCase().includes(q) ||
        a.artwork?.style?.toLowerCase().includes(q),
    );
  }, [auctions, searchQuery]);

  const stats = useMemo(() => {
    return {
      active: auctions.filter((a) => a.auctionStatus === 'Active').length,
      scheduled: auctions.filter((a) => a.auctionStatus === 'Scheduled').length,
      settled: auctions.filter((a) => a.auctionStatus === 'Settled').length,
      ended: auctions.filter((a) => a.auctionStatus === 'Ended' || a.auctionStatus === 'Cancelled').length,
    };
  }, [auctions]);

  const handleForceSettle = async () => {
    if (!actionAuction) return;
    setSubmitting(true);
    try {
      const res = await auctionService.settle(actionAuction.auctionId, true);
      if (res.winnerId) {
        toast.success(
          `Đã chốt phiên thành công! Giá cuối: ${money(res.finalPrice)}. Tác quyền đã được chuyển giao.`,
          { duration: 5000 },
        );
      } else {
        toast.success('Đã kết thúc phiên đấu giá thành công (không có người đặt giá đủ điều kiện).', {
          duration: 5000,
        });
      }
      setModalType(null);
      setActionAuction(null);
      await fetchAuctions();
    } catch (err) {
      toast.error(auctionError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!actionAuction) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do huỷ phiên đấu giá.');
      return;
    }
    setSubmitting(true);
    try {
      await auctionService.cancel(actionAuction.auctionId, cancelReason.trim());
      toast.success('Đã huỷ phiên đấu giá thành công.');
      setModalType(null);
      setActionAuction(null);
      setCancelReason('');
      await fetchAuctions();
    } catch (err) {
      toast.error(auctionError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Đang diễn ra
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
            <Clock className="h-3 w-3" />
            Sắp diễn ra
          </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
            <CheckCircle2 className="h-3 w-3" />
            Đã chốt phiên
          </span>
        );
      case 'Ended':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
            Đã kết thúc
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300">
            <XCircle className="h-3 w-3" />
            Đã huỷ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#A7ACD9]/15 p-2.5 text-[#A7ACD9]">
              <Gavel className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-h1 text-2xl font-bold text-white tracking-tight">
                Quản trị phiên đấu giá (Auction Operations)
              </h1>
              <p className="text-xs text-[#919099] mt-0.5">
                Giám sát sàn đấu giá, chốt phiên khẩn cấp hoặc xử lý huỷ phiên theo quyền Quản trị viên
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchAuctions()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-[#A7ACD9] ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-container rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#919099]">Đang diễn ra</p>
          <p className="mt-1 font-h1 text-2xl font-bold text-emerald-400">{stats.active}</p>
        </div>
        <div className="glass-container rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#919099]">Sắp diễn ra</p>
          <p className="mt-1 font-h1 text-2xl font-bold text-blue-400">{stats.scheduled}</p>
        </div>
        <div className="glass-container rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#919099]">Đã chốt phiên</p>
          <p className="mt-1 font-h1 text-2xl font-bold text-purple-300">{stats.settled}</p>
        </div>
        <div className="glass-container rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#919099]">Đã kết thúc / Huỷ</p>
          <p className="mt-1 font-h1 text-2xl font-bold text-slate-300">{stats.ended}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#A7ACD9] text-[#1F2335] shadow-md shadow-[#A7ACD9]/20'
                    : 'text-[#919099] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#919099]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tranh, ID..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder-white/30 outline-none transition-colors focus:border-[#A7ACD9]"
          />
        </div>
      </div>

      {/* Auctions Table / List */}
      <div className="glass-container overflow-hidden rounded-3xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-[#919099]">
                <th className="px-5 py-4">Tác phẩm</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Giá hiện tại</th>
                <th className="px-5 py-4">Lượt đặt giá</th>
                <th className="px-5 py-4">Thời gian kết thúc</th>
                <th className="px-5 py-4 text-right">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-[#A7ACD9]" />
                    Đang tải danh sách phiên đấu giá…
                  </td>
                </tr>
              ) : filteredAuctions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Gavel className="mx-auto mb-3 h-8 w-8 text-white/20" />
                    Không tìm thấy phiên đấu giá nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAuctions.map((auction) => {
                  const isActive = auction.auctionStatus === 'Active';
                  const isScheduled = auction.auctionStatus === 'Scheduled';
                  const canForceSettle = isActive || isScheduled;
                  const canCancel = isActive || isScheduled;

                  return (
                    <tr
                      key={auction.auctionId}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Artwork Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            {auction.artwork?.thumbnailUrl || auction.artwork?.imageUrl ? (
                              <img
                                src={auction.artwork.thumbnailUrl || auction.artwork.imageUrl || ''}
                                alt={auction.artwork?.artworkTitle || 'Artwork'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <Layers className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="truncate font-bold text-white text-sm">
                              {auction.artwork?.artworkTitle || 'Chưa đặt tên'}
                            </p>
                            <p className="font-mono text-[10px] text-[#A7ACD9]">
                              ID: {auction.auctionId.slice(0, 8)}…
                            </p>
                            {auction.artwork?.style && (
                              <span className="mt-0.5 inline-block text-[10px] text-slate-400">
                                {auction.artwork.style}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(auction.auctionStatus)}
                      </td>

                      {/* Current Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-[#A7ACD9]">
                          {money(auction.currentPrice)}
                        </span>
                      </td>

                      {/* Bid Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                          {auction.bidCount} lượt
                        </span>
                      </td>

                      {/* End Time */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                        {new Date(auction.endAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          {canForceSettle && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionAuction(auction);
                                setModalType('force-settle');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-400/25 active:scale-95"
                              title="Kết thúc phiên và chốt giá ngay lập tức"
                            >
                              <Gavel className="h-3.5 w-3.5" />
                              Kết thúc ngay
                            </button>
                          )}

                          {canCancel && auction.bidCount === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionAuction(auction);
                                setModalType('cancel');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition-all hover:bg-rose-400/20 active:scale-95"
                              title="Huỷ phiên đấu giá"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Huỷ phiên
                            </button>
                          )}

                          <Link
                            href={`/auctions/${auction.auctionId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                            title="Xem trang đấu giá trực tiếp"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Force Settle Modal */}
      {modalType === 'force-settle' && actionAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-container w-full max-w-lg rounded-3xl border border-amber-400/30 bg-[#1F2335] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/15 p-3 text-amber-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-h1 text-lg font-bold text-white">
                  Xác nhận kết thúc phiên ngay lập tức
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Bạn đang sử dụng quyền <strong>Quản trị viên (Administrator)</strong> để kết thúc sớm phiên đấu giá cho tác phẩm{' '}
                  <span className="text-white font-bold underline">
                    {actionAuction.artwork?.artworkTitle || 'này'}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#919099]">Mã phiên:</span>
                <span className="font-mono text-white">{actionAuction.auctionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#919099]">Giá hiện tại:</span>
                <span className="font-mono font-bold text-[#A7ACD9]">
                  {money(actionAuction.currentPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#919099]">Số lượt đặt giá:</span>
                <span className="font-bold text-white">{actionAuction.bidCount} lượt</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-[#919099]">Hạn gốc ban đầu:</span>
                <span className="text-slate-300">
                  {new Date(actionAuction.endAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
              ⚠️ <strong>Lưu ý:</strong> Phiên sẽ dừng nhận bid ngay tức khắc. Nếu có người đặt giá hợp lệ, hệ thống sẽ xác định họ là người chiến thắng, kích hoạt giải ngân Escrow và tạo bản ghi bàn giao tác quyền.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setActionAuction(null);
                }}
                disabled={submitting}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleForceSettle()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Đang chốt phiên…
                  </>
                ) : (
                  <>
                    <Gavel className="h-3.5 w-3.5" />
                    Xác nhận kết thúc ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {modalType === 'cancel' && actionAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-container w-full max-w-lg rounded-3xl border border-rose-500/30 bg-[#1F2335] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-rose-400 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-h1 text-lg font-bold text-white">Huỷ phiên đấu giá</h3>
                <p className="mt-1 text-xs text-slate-300">
                  Phiên đấu giá cho tác phẩm{' '}
                  <span className="text-white font-bold">
                    {actionAuction.artwork?.artworkTitle}
                  </span>{' '}
                  chưa có ai đặt giá và sẽ bị huỷ bỏ hoàn toàn.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#919099]">
                Lý do huỷ phiên <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do huỷ phiên (vi phạm chính sách, yêu cầu của tác giả...)"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 outline-none transition-colors focus:border-rose-400"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setActionAuction(null);
                  setCancelReason('');
                }}
                disabled={submitting}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void handleCancelAuction()}
                disabled={submitting || !cancelReason.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Đang xử lý…
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Xác nhận huỷ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
