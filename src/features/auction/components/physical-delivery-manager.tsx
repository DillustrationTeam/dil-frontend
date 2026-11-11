'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
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
    label: 'Đang khiếu nại',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
  },
  DigitalAccepted: {
    label: 'Đã nhận bản điện tử',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  Active: {
    label: 'Đang đấu giá (Có bản vật lý)',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
  },
};

export function PhysicalDeliveryManager() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [items, setItems] = useState<PhysicalDeliveryListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<'all' | 'seller' | 'winner'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auctionService.getPhysicalDeliveries({
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setItems(data);
    } catch (err) {
      setError(auctionError(err) || 'Không thể tải danh sách đơn giao nhận.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    let ignore = false;
    auctionService
      .getPhysicalDeliveries({
        role: roleFilter === 'all' ? undefined : roleFilter,
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
          setError(auctionError(err) || 'Không thể tải danh sách đơn giao nhận.');
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
  }, [roleFilter, statusFilter]);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.artworkTitle.toLowerCase().includes(query) ||
      item.sellerName.toLowerCase().includes(query) ||
      (item.winnerName && item.winnerName.toLowerCase().includes(query)) ||
      (item.delivery?.trackingCode && item.delivery.trackingCode.toLowerCase().includes(query)) ||
      (item.delivery?.carrierName && item.delivery.carrierName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Bộ lọc tổng quan */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white font-h1">
            <Truck className="text-amber-400" size={24} />
            Quản lý Giao nhận Tranh vật lý
          </h2>
          <p className="text-xs text-outline mt-1">
            Theo dõi tiến độ bưu cục, mã vận đơn và tiền tạm giữ ký quỹ sàn cho các tác phẩm có bản vật lý.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDeliveries}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Tabs vai trò */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === 'all'
                ? 'bg-brand-periwinkle text-brand-navy shadow-sm'
                : 'text-outline hover:text-white hover:bg-white/5'
            }`}
          >
            Tất cả vai trò
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('seller')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === 'seller'
                ? 'bg-amber-400 text-brand-navy shadow-sm'
                : 'text-outline hover:text-white hover:bg-white/5'
            }`}
          >
            Đơn tôi bán (Họa sĩ)
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('winner')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === 'winner'
                ? 'bg-emerald-400 text-brand-navy shadow-sm'
                : 'text-outline hover:text-white hover:bg-white/5'
            }`}
          >
            Đơn tôi thắng (Người nhận)
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tác phẩm, mã vận đơn..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/30 focus:border-brand-periwinkle focus:outline-none"
          />
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { key: 'ALL', label: 'Tất cả trạng thái' },
          { key: 'Active', label: 'Đang đấu giá' },
          { key: 'AwaitingShipment', label: 'Chờ gửi hàng' },
          { key: 'InTransit', label: 'Đang vận chuyển' },
          { key: 'Delivered', label: 'Đã nhận hàng' },
          { key: 'Disputed', label: 'Khiếu nại' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              statusFilter === tab.key
                ? 'border border-brand-periwinkle/50 bg-brand-periwinkle/20 text-brand-periwinkle'
                : 'border border-white/5 bg-white/5 text-outline hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
        <div className="py-16 text-center">
          <RefreshCw size={24} className="mx-auto animate-spin text-brand-periwinkle" />
          <p className="mt-3 text-xs text-outline">Đang tải danh sách đơn giao nhận...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 py-16 text-center">
          <Package size={40} className="mx-auto text-outline/50" />
          <h3 className="mt-3 text-sm font-semibold text-white">Chưa có đơn giao nhận nào</h3>
          <p className="mt-1 text-xs text-outline max-w-sm mx-auto">
            Khi bạn tạo hoặc trúng đấu giá phiên có tuỳ chọn tranh vật lý, tiến độ bưu phẩm và ký quỹ sẽ xuất hiện tại đây.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/auctions"
              className="rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 transition"
            >
              Khám phá phiên đấu giá
            </Link>
          </div>
        </div>
      )}

      {/* Danh sách thẻ đơn giao nhận */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => {
            const isSeller = currentUserId === item.sellerId;
            const isWinner = Boolean(currentUserId && item.winnerId && currentUserId === item.winnerId);
            const delivery = item.delivery;
            // Người mua nhận bản điện tử (tiền đã giải ngân) nhưng vẫn có thể yêu cầu giao tranh:
            // trạng thái hiển thị theo bưu phẩm, chỉ thêm ghi chú "đã giải ngân trước".
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
              <article
                key={item.auctionId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-periwinkle/40 flex flex-col justify-between"
              >
                <div>
                  {/* Header thẻ: Status badge + Role badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <Truck size={12} />
                      {badge.label}
                      {paidEarly && <span className="text-[10px] font-normal text-amber-300"> · đã giải ngân trước</span>}
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-on-surface-variant">
                      {isSeller ? 'Tôi là Người bán' : isWinner ? 'Tôi là Người thắng' : 'Người xem'}
                    </span>
                  </div>

                  {/* Thông tin tác phẩm */}
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40 border border-white/10">
                      <Image
                        src={item.artworkImageUrl || '/weblogo.png'}
                        alt={item.artworkTitle}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="truncate font-semibold text-white text-sm hover:text-brand-periwinkle transition">
                        <Link href={`/auctions/${item.auctionId}`}>{item.artworkTitle}</Link>
                      </h3>
                      {item.artworkStyle && (
                        <p className="text-[11px] text-outline">Phong cách: {item.artworkStyle}</p>
                      )}
                      <p className="text-xs font-bold text-amber-300">
                        {formatVnd(item.finalPrice ?? item.currentPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Chi tiết người nhận / người gửi */}
                  <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-outline text-[11px]">
                      <span>Họa sĩ: <strong className="text-white">{item.sellerName}</strong></span>
                      <span>Người thắng: <strong className="text-white">{item.winnerName || 'Chưa chốt'}</strong></span>
                    </div>

                    {delivery?.shippingAddress && (
                      <p className="text-on-surface-variant truncate">
                        Địa chỉ nhận: <span className="text-white">{delivery.shippingAddress}</span>
                      </p>
                    )}

                    {delivery?.trackingCode && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                        <span className="text-outline">
                          Bưu cục: <strong className="text-amber-300">{delivery.carrierName}</strong> ({delivery.trackingCode})
                        </span>
                        {delivery.trackingUrl && (
                          <a
                            href={delivery.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-periwinkle underline hover:text-white"
                          >
                            Tra cứu <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Escrow badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-outline pt-1">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Ký quỹ sàn: </span>
                      <strong className="text-white font-mono">{item.escrowStatus}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    {item.auctionStatus === 'Active' ? 'Phiên đang nhận giá' : item.auctionStatus === 'Completed' ? 'Giao dịch đã hoàn tất' : item.auctionStatus === 'Disputed' ? 'Đang khiếu nại' : 'Đang xử lý giao nhận'}
                  </span>

                  <Link
                    href={`/auctions/${item.auctionId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-periwinkle hover:text-brand-navy transition"
                  >
                    Xem chi tiết &amp; Thao tác
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
