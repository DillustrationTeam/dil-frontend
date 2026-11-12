'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Eye,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { auctionService, auctionError } from '../services/auction.service';
import type { PhysicalDeliveryListItemDto } from '../types/auction.types';

function formatVnd(value?: number | null) {
  if (value === null || value === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

const statusBadgeConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  AwaitingPhysical: {
    label: 'Chờ người mua chọn',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  AwaitingShipment: {
    label: 'Chờ gửi hàng',
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
  },
  InTransit: {
    label: 'Đang vận chuyển',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
  },
  Delivered: {
    label: 'Đã giao thành công',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  Completed: {
    label: 'Hoàn tất & Giải ngân',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  Disputed: {
    label: 'Khiếu nại',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
  },
  Resolved: {
    label: 'Khiếu nại đã đóng',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  DigitalAccepted: {
    label: 'Đã nhận bản điện tử',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  Active: {
    label: 'Đang đấu giá',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
  },
};

export function AdminDeliveryDashboard() {
  const [items, setItems] = useState<PhysicalDeliveryListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Modal phân xử khiếu nại
  const [resolveTarget, setResolveTarget] = useState<PhysicalDeliveryListItemDto | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auctionService.getPhysicalDeliveries({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setItems(data);
    } catch (err) {
      setError(auctionError(err) || 'Không thể tải dữ liệu giám sát vận chuyển.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    auctionService
      .getPhysicalDeliveries({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      .then((data) => {
        if (!ignore) {
          setItems(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(auctionError(err) || 'Không thể tải dữ liệu giám sát vận chuyển.');
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

  async function handleResolve(decision: 'release' | 'refund' | 'close') {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await auctionService.resolveDeliveryDispute(resolveTarget.auctionId, decision, resolveNote.trim() || null);
      setResolveTarget(null);
      setResolveNote('');
      await fetchDeliveries();
    } catch (err) {
      setError(auctionError(err) || 'Không phân xử được khiếu nại.');
    } finally {
      setResolving(false);
    }
  }

  // KPIs
  const totalCount = items.length;
  const awaitingShipmentCount = items.filter(
    (i) => i.delivery?.status === 'AwaitingShipment' || i.auctionStatus === 'AwaitingPhysical'
  ).length;
  const inTransitCount = items.filter((i) => i.delivery?.status === 'InTransit').length;
  const disputedCount = items.filter((i) => i.delivery?.status === 'Disputed').length;
  const totalEscrowHold = items
    .filter((i) => i.escrowStatus === 'Deposited' || i.delivery?.status === 'InTransit')
    .reduce((sum, i) => sum + (i.finalPrice ?? i.currentPrice), 0);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.artworkTitle.toLowerCase().includes(query) ||
      item.sellerName.toLowerCase().includes(query) ||
      (item.winnerName && item.winnerName.toLowerCase().includes(query)) ||
      (item.delivery?.trackingCode && item.delivery.trackingCode.toLowerCase().includes(query)) ||
      (item.delivery?.carrierName && item.delivery.carrierName.toLowerCase().includes(query)) ||
      item.auctionId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5 font-h1">
            <Truck className="text-amber-400" size={26} />
            Giám sát Vận chuyển &amp; Ký quỹ Bưu cục
          </h1>
          <p className="text-xs text-outline mt-1">
            Quản trị đối soát vận đơn, bảo lãnh thanh toán ký quỹ sàn và xử lý khiếu nại tranh vật lý.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDeliveries}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-medium text-outline">Tổng đơn vật lý</p>
          <p className="mt-1 font-h1 text-xl font-bold text-white">{totalCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[11px] font-medium text-amber-300">Chờ gửi bưu điện</p>
          <p className="mt-1 font-h1 text-xl font-bold text-amber-400">{awaitingShipmentCount}</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-[11px] font-medium text-blue-300">Đang trên đường giao</p>
          <p className="mt-1 font-h1 text-xl font-bold text-blue-400">{inTransitCount}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[11px] font-medium text-emerald-300">Tiền ký quỹ tạm giữ</p>
          <p className="mt-1 font-h1 text-sm font-bold text-emerald-400">{formatVnd(totalEscrowHold)}</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-[11px] font-medium text-rose-300">Đơn khiếu nại</p>
          <p className="mt-1 font-h1 text-xl font-bold text-rose-400">{disputedCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'Active', label: 'Đang đấu giá' },
            { key: 'AwaitingShipment', label: 'Chờ gửi hàng' },
            { key: 'InTransit', label: 'Đang giao' },
            { key: 'Delivered', label: 'Đã nhận' },
            { key: 'Disputed', label: 'Khiếu nại' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? 'bg-amber-400 text-brand-navy shadow-sm'
                  : 'bg-white/5 text-outline hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tác phẩm, mã vận đơn, người mua..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <RefreshCw size={24} className="mx-auto animate-spin text-amber-400" />
          <p className="mt-3 text-xs text-outline">Đang tải dữ liệu giám sát vận chuyển...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 py-16 text-center">
          <Package size={40} className="mx-auto text-outline/50" />
          <h3 className="mt-3 text-sm font-semibold text-white">Không tìm thấy đơn giao nhận nào</h3>
          <p className="mt-1 text-xs text-outline">Hãy thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
        </div>
      )}

      {/* Table danh sách đơn vận chuyển */}
      {!loading && filteredItems.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-xs text-on-surface">
            <thead className="border-b border-white/10 bg-black/30 font-semibold text-outline text-[11px]">
              <tr>
                <th className="px-4 py-3">Tác phẩm &amp; Phiên</th>
                <th className="px-4 py-3">Họa sĩ &amp; Người thắng</th>
                <th className="px-4 py-3">Vận đơn &amp; Bưu cục</th>
                <th className="px-4 py-3">Trạng thái &amp; Ký quỹ</th>
                <th className="px-4 py-3">Biên lai bưu điện</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const delivery = item.delivery;
                const statusKey = delivery?.status ?? item.auctionStatus;
                const paidEarly =
                  item.auctionStatus === 'Completed' &&
                  delivery?.status !== 'Delivered' &&
                  delivery?.status !== 'Cancelled';
                const badge = statusBadgeConfig[statusKey] ?? {
                  label: statusKey,
                  bg: 'bg-white/10',
                  text: 'text-white',
                  border: 'border-white/20',
                };

                return (
                  <tr key={item.auctionId} className="hover:bg-white/[0.03] transition">
                    {/* Tác phẩm */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/40 border border-white/10">
                          <Image
                            src={item.artworkImageUrl || '/weblogo.png'}
                            alt={item.artworkTitle}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-semibold text-white truncate" title={item.artworkTitle}>
                            {item.artworkTitle}
                          </p>
                          <p className="text-[10px] font-mono text-outline truncate">
                            ID: {item.auctionId.slice(0, 8)}...
                          </p>
                          <p className="text-[11px] font-bold text-amber-300">
                            {formatVnd(item.finalPrice ?? item.currentPrice)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Họa sĩ & Người thắng */}
                    <td className="px-4 py-3.5 space-y-1">
                      <p className="text-white">
                        Họa sĩ: <strong className="text-brand-periwinkle">{item.sellerName}</strong>
                      </p>
                      <p className="text-outline">
                        Người thắng: <strong className="text-white">{item.winnerName || 'Chưa chốt'}</strong>
                      </p>
                      {delivery?.recipientPhone && (
                        <p className="text-[10px] text-outline">SĐT: {delivery.recipientPhone}</p>
                      )}
                    </td>

                    {/* Vận đơn & Bưu cục */}
                    <td className="px-4 py-3.5 space-y-1">
                      {delivery?.trackingCode ? (
                        <>
                          <p className="text-white font-mono font-semibold">
                            {delivery.carrierName}: <span className="text-amber-300">{delivery.trackingCode}</span>
                          </p>
                          {delivery.trackingUrl && (
                            <a
                              href={delivery.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-brand-periwinkle underline hover:text-white"
                            >
                              Tra cứu bưu cục <ExternalLink size={10} />
                            </a>
                          )}
                          {delivery.shippedAt && (
                            <p className="text-[10px] text-outline">
                              Gửi lúc: {new Date(delivery.shippedAt).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-outline italic text-[11px]">Chưa tạo vận đơn</span>
                      )}
                    </td>

                    {/* Trạng thái & Ký quỹ */}
                    <td className="px-4 py-3.5 space-y-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <Truck size={10} />
                        {badge.label}
                        {paidEarly && <span className="text-[10px] font-normal text-amber-300"> · đã giải ngân trước</span>}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-outline">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span>Ký quỹ: </span>
                        <strong className="text-white font-mono text-[10px]">{item.escrowStatus}</strong>
                      </div>
                    </td>

                    {/* Bằng chứng & Biên lai bưu điện */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {delivery?.shippingReceiptUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: delivery.shippingReceiptUrl!,
                                title: `Biên lai gửi hàng — ${item.artworkTitle}`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/20 transition"
                          >
                            <FileText size={11} /> Phiếu gửi
                          </button>
                        ) : (
                          <span className="text-[11px] text-outline/50">—</span>
                        )}

                        {delivery?.packageImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: delivery.packageImageUrl!,
                                title: `Ảnh kiện hàng đóng gói — ${item.artworkTitle}`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/10 transition"
                          >
                            <Eye size={11} /> Ảnh kiện
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(item.delivery?.status === 'Disputed' || item.auctionStatus === 'Disputed') && (
                          <button
                            type="button"
                            onClick={() => {
                              setResolveTarget(item);
                              setResolveNote(item.delivery?.disputeReason ?? '');
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/25 transition"
                          >
                            Phân xử
                          </button>
                        )}
                        <Link
                          href={`/auctions/${item.auctionId}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-400 hover:text-brand-navy transition"
                        >
                          Chi tiết
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal xem phóng to ảnh biên lai / bưu kiện.
          z-[80] để luôn nổi trên modal phân xử (z-50): nếu cùng z-50 thì modal
          phân xử render sau sẽ đè lên, bấm ảnh bằng chứng không thấy gì. */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl border border-white/20 bg-brand-navy p-5 space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-semibold text-white text-sm truncate">{previewImage.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1 text-outline hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/40 border border-white/10">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            <div className="flex justify-end pt-1">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 underline hover:text-white"
              >
                Mở ảnh gốc trong tab mới <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân xử khiếu nại giao nhận */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-rose-400/40 bg-[#1F2335] p-6 shadow-2xl">
            <h3 className="font-h1 text-base font-bold text-rose-200">Phân xử khiếu nại giao nhận</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Phiên <strong className="text-white">{resolveTarget.artworkTitle}</strong> — ký quỹ
              <strong className="text-white"> {formatVnd(resolveTarget.finalPrice ?? resolveTarget.currentPrice)}</strong> đang bị đóng băng.
            </p>

            {resolveTarget.delivery?.disputeReason && (
              <p className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-on-surface-variant">
                Lý do người mua nêu: <span className="text-white">{resolveTarget.delivery.disputeReason}</span>
              </p>
            )}

            {/* Ký quỹ đã giải ngân: không còn quỹ để hoàn, chỉ đóng được hồ sơ.
                Nói rõ trước khi Admin bấm, để không tưởng hệ thống lỗi. */}
            {resolveTarget.escrowStatus === 'Released' && (
              <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
                <strong>Ký quỹ đã giải ngân cho người bán.</strong> Sàn không thu hồi được khoản tiền này nữa,
                nên chỉ có thể <strong>đóng hồ sơ</strong>. Cả người mua và người bán sẽ nhận thông báo, người mua
                được mở quyền đánh giá người bán.
              </p>
            )}

            {resolveTarget.delivery?.disputeEvidenceUrl && (
              <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                <p className="text-[11px] font-semibold text-rose-200">Ảnh bằng chứng người mua tải lên:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resolveTarget.delivery.disputeEvidenceUrl
                    .split(',')
                    .map((url) => url.trim())
                    .filter(Boolean)
                    .map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setPreviewImage({ url, title: `Bằng chứng khiếu nại #${idx + 1}` })}
                        className="relative h-20 w-20 cursor-zoom-in overflow-hidden rounded-lg border border-white/20 transition hover:border-rose-300 hover:ring-2 hover:ring-rose-400/40"
                      >
                        <Image src={url} alt={`Bằng chứng ${idx + 1}`} fill unoptimized className="object-cover" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            <label className="mt-4 block text-[11px] font-semibold text-on-surface-variant">
              Ghi chú phân xử (lưu vào nhật ký)
            </label>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Ảnh biên lai cho thấy tranh nguyên vẹn, bác khiếu nại."
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-rose-400 focus:outline-none"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setResolveTarget(null);
                  setResolveNote('');
                }}
                disabled={resolving}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-outline hover:text-white transition disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleResolve('release')}
                disabled={resolving}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 transition disabled:opacity-50"
              >
                Bác khiếu nại — giải ngân cho người bán
              </button>
              {resolveTarget.escrowStatus === 'Released' ? (
                <button
                  type="button"
                  onClick={() => handleResolve('close')}
                  disabled={resolving}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 transition disabled:opacity-50"
                >
                  Đóng khiếu nại — không hoàn được tiền
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleResolve('refund')}
                  disabled={resolving}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 transition disabled:opacity-50"
                >
                  Chấp nhận — hoàn tiền cho người mua
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
