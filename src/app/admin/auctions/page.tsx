'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Layers,
} from 'lucide-react';
import { auctionService, auctionError } from '@/features/auction/services/auction.service';
import type { AuctionListItemDto } from '@/features/auction/types/auction.types';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([]);
  // Danh sách KHÔNG lọc, chỉ dùng để tính 4 ô KPI (xem `stats` bên dưới).
  const [allAuctions, setAllAuctions] = useState<AuctionListItemDto[]>([]);
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
      // Trang quản trị cần thấy đủ phiên để chốt/huỷ, không phải 12 dòng của chợ.
      const [res, allRes] = await Promise.all([
        auctionService.list(filter, undefined, undefined, 100),
        auctionService.list({}, undefined, undefined, 100),
      ]);
      setAuctions(res.items || []);
      setAllAuctions(allRes.items || []);
    } catch (err) {
      toast.error(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const filter = statusFilter === 'ALL' ? {} : { status: statusFilter };
    Promise.all([
      auctionService.list(filter, undefined, undefined, 100),
      auctionService.list({}, undefined, undefined, 100),
    ])
      .then(([res, allRes]) => {
        if (!ignore) {
          setAuctions(res.items || []);
          setAllAuctions(allRes.items || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(auctionError(err));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
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

  /**
   * KPI tính trên TOÀN BỘ phiên, không phải trên danh sách đang lọc theo tab.
   * Trước đây `stats` đếm từ `auctions` (đã lọc status ở server) nên tab mặc định "Active"
   * khiến "Sắp diễn ra / Đã chốt / Đã kết thúc & huỷ" luôn bằng 0.
   */
  const stats = useMemo(() => {
    return {
      active: allAuctions.filter((a) => a.auctionStatus === 'Active').length,
      scheduled: allAuctions.filter((a) => a.auctionStatus === 'Scheduled').length,
      settled: allAuctions.filter((a) => a.auctionStatus === 'Settled').length,
      ended: allAuctions.filter((a) => a.auctionStatus === 'Ended' || a.auctionStatus === 'Cancelled').length,
    };
  }, [allAuctions]);

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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/15 px-2.5 py-1 text-xs font-semibold text-[#2F6B63]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2F6B63]/10" /> Đang diễn ra </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2C5A86]/40 bg-[#2C5A86]/15 px-2.5 py-1 text-xs font-semibold text-[#2C5A86]">
            <Clock className="h-3 w-3" /> Sắp diễn ra </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5F3F86]/40 bg-[#5F3F86]/15 px-2.5 py-1 text-xs font-semibold text-[#5F3F86]">
            <CheckCircle2 className="h-3 w-3" /> Đã chốt phiên </span>
        );
      case 'Ended':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#F0E7D8] px-2.5 py-1 text-xs font-semibold text-[#746A5F]"> Đã kết thúc </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A8321C]/40 bg-[#A8321C]/15 px-2.5 py-1 text-xs font-semibold text-[#A8321C]">
            <XCircle className="h-3 w-3" /> Đã huỷ </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-medium text-[#746A5F]">
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
            <div className="rounded-xl bg-[#B24A26]/15 p-2.5 text-[#B24A26]">
              <Gavel className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-h1 text-2xl font-bold text-[#241F1A] tracking-tight"> Quản trị phiên đấu giá (đấu giá Operations) </h1>
              <p className="text-xs text-[#746A5F] mt-0.5"> Giám sát sàn đấu giá, chốt phiên khẩn cấp hoặc xử lý huỷ phiên theo quyền Quản trị viên </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Lối vào hàng chờ rủi ro: cùng kiểu nút phụ, không thêm mục sidebar mới */}
          <Link
            href="/admin/auctions/risk"
            className="inline-flex items-center gap-2 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-2.5 text-xs font-bold text-[#A8321C] transition-colors hover:bg-[#A8321C]/15 active:scale-95"
          >
            <ShieldAlert className="h-4 w-4" /> Hàng chờ rủi ro
          </Link>

          <button
            type="button"
            onClick={() => void fetchAuctions()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2.5 text-xs font-bold text-[#241F1A] transition-colors hover:bg-[#F0E7D8] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-[#B24A26] ${loading ? 'animate-spin' : ''}`} /> Làm mới </button>
        </div>
      </div>

      {/* Executive Overview KPI Cards (Consistent with System Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Auctions */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isVie ? 'PHIÊN ĐANG DIỄN RA' : 'ACTIVE SESSIONS'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#2F6B63]/10 text-[#2F6B63]">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#2F6B63] tracking-tight">
            {stats.active}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            <span className="font-h1 font-bold text-[#2F6B63]">{isVie ? 'Đang diễn ra' : 'Active'}</span> {isVie ? 'sôi động trên sàn' : 'on the live floor'}
          </p>
        </div>

        {/* Card 2: Upcoming / Scheduled */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isVie ? 'PHIÊN SẮP BẮT ĐẦU' : 'SCHEDULED SESSIONS'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#2C5A86]/10 text-[#2C5A86]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#2C5A86] tracking-tight">
            {stats.scheduled}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            <span className="font-h1 font-bold text-[#241F1A]/90">{isVie ? 'Sắp mở phiên' : 'Opening soon'}</span> {isVie ? 'nhận lượt đặt giá' : 'for incoming bids'}
          </p>
        </div>

        {/* Card 3: Settled & Completed */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isVie ? 'ĐÃ CHỐT & BÀN GIAO' : 'SETTLED & DELIVERED'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#5F3F86]/10 text-[#5F3F86]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#5F3F86] tracking-tight">
            {stats.settled}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {isVie ? 'Đã xác định Winner & giải ngân' : 'Winner settled & escrow released'}
          </p>
        </div>

        {/* Card 4: Total Sessions */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isVie ? 'TỔNG CÁC PHIÊN' : 'TOTAL SESSIONS'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#8C3718]/10 text-[#8C3718]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#8C3718] tracking-tight">
            {auctions.length}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            <span className="font-h1 font-bold text-[#241F1A]/90">{stats.ended}</span> {isVie ? 'Phiên đã kết thúc / huỷ' : 'Sessions ended / cancelled'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-1.5">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#B24A26] text-[#F7F2E9] shadow-md shadow-[#B24A26]/20'
                    : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#746A5F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tranh, ID..."
            className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-10 pr-4 text-xs text-[#241F1A] placeholder-white/30 outline-none transition-colors focus:border-[#B24A26]"
          />
        </div>
      </div>

      {/* Auctions Table / List */}
      <div className="glass-container overflow-hidden rounded-3xl border border-[#221E1A]/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#221E1A]/10 bg-[#FFFCF6] text-[11px] font-bold uppercase tracking-wider text-[#746A5F]">
                <th className="px-5 py-4">Tác phẩm</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Giá hiện tại</th>
                <th className="px-5 py-4">Lượt đặt giá</th>
                <th className="px-5 py-4">Thời gian kết thúc</th>
                <th className="px-5 py-4 text-right">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221E1A]/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#746A5F]">
                    <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-[#B24A26]" /> Đang tải danh sách phiên đấu giá… </td>
                </tr>
              ) : filteredAuctions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#746A5F]">
                    <Gavel className="mx-auto mb-3 h-8 w-8 text-[#241F1A]/20" /> Không tìm thấy phiên đấu giá nào phù hợp. </td>
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
                      className="transition-colors hover:bg-[#FFFCF6]"
                    >
                      {/* Artwork Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]">
                            {auction.artwork?.thumbnailUrl || auction.artwork?.imageUrl ? (
                              <img
                                src={auction.artwork.thumbnailUrl || auction.artwork.imageUrl || '/weblogo.png'}
                                alt={auction.artwork?.artworkTitle || 'Artwork'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#746A5F]">
                                <Layers className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="truncate font-bold text-[#241F1A] text-sm">
                              {auction.artwork?.artworkTitle || 'Chưa đặt tên'}
                            </p>
                            <p className="font-mono text-[10px] text-[#B24A26]">
                              ID: {auction.auctionId.slice(0, 8)}…
                            </p>
                            {auction.artwork?.style && (
                              <span className="mt-0.5 inline-block text-[10px] text-[#746A5F]">
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
                        <span className="font-mono text-sm font-bold text-[#B24A26]">
                          {auction.finalPrice ? `${money(auction.finalPrice)} (giá chốt)` : money(auction.currentPrice)}
                        </span>
                      </td>

                      {/* Bid Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-lg bg-[#FFFCF6] px-2.5 py-1 text-xs font-medium text-[#746A5F]">
                          {auction.bidCount} lượt
                        </span>
                      </td>

                      {/* End Time */}
                      <td className="px-5 py-4 whitespace-nowrap text-[#746A5F]">
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
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 px-3 py-1.5 text-xs font-bold text-[#8A6A1F] transition-all hover:bg-[#8A6A1F]/20 active:scale-95"
                              title="Kết thúc phiên và chốt giá ngay lập tức"
                            >
                              <Gavel className="h-3.5 w-3.5" /> Kết thúc ngay </button>
                          )}

                          {canCancel && auction.bidCount === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionAuction(auction);
                                setModalType('cancel');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-3 py-1.5 text-xs font-medium text-[#A8321C] transition-all hover:bg-[#A8321C]/20 active:scale-95"
                              title="Huỷ phiên đấu giá"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Huỷ phiên </button>
                          )}

                          <Link
                            href={`/auctions/${auction.auctionId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1.5 text-xs font-medium text-[#746A5F] transition-colors hover:bg-[#F0E7D8] hover:text-[#241F1A]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-container w-full max-w-lg rounded-3xl border border-[#8A6A1F]/40 bg-[#F7F2E9] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 p-3 text-[#8A6A1F] shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-h1 text-lg font-bold text-[#241F1A]"> Xác nhận kết thúc phiên ngay lập tức </h3>
                <p className="mt-1 text-xs text-[#746A5F] leading-relaxed"> Bạn đang sử dụng quyền <strong>Quản trị viên</strong> để kết thúc sớm phiên đấu giá cho tác phẩm{' '}
                  <span className="text-[#241F1A] font-bold underline">
                    {actionAuction.artwork?.artworkTitle || 'này'}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#746A5F]">Mã phiên:</span>
                <span className="font-mono text-[#241F1A]">{actionAuction.auctionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746A5F]">Giá hiện tại:</span>
                <span className="font-mono font-bold text-[#B24A26]">
                  {actionAuction.finalPrice ? `${money(actionAuction.finalPrice)} (giá chốt)` : money(actionAuction.currentPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746A5F]">Số lượt đặt giá:</span>
                <span className="font-bold text-[#241F1A]">{actionAuction.bidCount} lượt</span>
              </div>
              <div className="flex justify-between border-t border-[#221E1A]/10 pt-2">
                <span className="text-[#746A5F]">Hạn gốc ban đầu:</span>
                <span className="text-[#746A5F]">
                  {new Date(actionAuction.endAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#8A6A1F]/30 bg-[#8A6A1F]/10 p-3 text-[11px] text-[#8A6A1F]">
              ⚠️ <strong>Lưu ý:</strong> Phiên sẽ dừng nhận bid ngay tức khắc. Nếu có người đặt giá hợp lệ, hệ thống sẽ xác định họ là người chiến thắng, kích hoạt giải ngân ký quỹ và tạo bản ghi bàn giao tác quyền. </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setActionAuction(null);
                }}
                disabled={submitting}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-[#746A5F] transition-colors hover:bg-[#F0E7D8] disabled:opacity-50"
              > Hủy bỏ </button>
              <button
                type="button"
                onClick={() => void handleForceSettle()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8A6A1F] to-[#8A6A1F] px-5 py-2 text-xs font-bold text-[#241F1A] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang chốt phiên… </>
                ) : (
                  <>
                    <Gavel className="h-3.5 w-3.5" /> Xác nhận kết thúc ngay </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {modalType === 'cancel' && actionAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-container w-full max-w-lg rounded-3xl border border-[#A8321C]/40 bg-[#F7F2E9] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/15 p-3 text-[#A8321C] shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-h1 text-lg font-bold text-[#241F1A]">Huỷ phiên đấu giá</h3>
                <p className="mt-1 text-xs text-[#746A5F]">
                  Phiên đấu giá cho tác phẩm{' '}
                  <span className="text-[#241F1A] font-bold">
                    {actionAuction.artwork?.artworkTitle}
                  </span>{' '}
                  chưa có ai đặt giá và sẽ bị huỷ bỏ hoàn toàn.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#746A5F]"> Lý do huỷ phiên <span className="text-[#A8321C]">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do huỷ phiên (vi phạm chính sách, yêu cầu của tác giả...)"
                rows={3}
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs text-[#241F1A] placeholder-white/30 outline-none transition-colors focus:border-[#A8321C]/30"
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
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-[#746A5F] transition-colors hover:bg-[#F0E7D8] disabled:opacity-50"
              > Đóng </button>
              <button
                type="button"
                onClick={() => void handleCancelAuction()}
                disabled={submitting || !cancelReason.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#A8321C]/12 px-5 py-2 text-xs font-bold text-[#241F1A] transition-all hover:bg-[#A8321C]/12 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang xử lý… </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" /> Xác nhận huỷ </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
