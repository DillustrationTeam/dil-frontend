'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, CheckCheck, CircleAlert, Clock, Gavel, Info, RefreshCw, ShieldAlert, Wallet } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import { notificationTypeLabels, type NotificationDto } from '../types/notification.types';

function getIcon(type: string, size = 15) {
  switch (type) {
    case 'OutbidAlert':
    case 'AuctionWon':
      return <Gavel size={size} className="text-amber-400" />;
    case 'AuctionEndingSoon':
      return <Clock size={size} className="text-amber-400" />;
    case 'DeadlineRiskWarning':
      return <Clock size={size} className="text-red-400" />;
    case 'PaymentSucceeded':
      return <Wallet size={size} className="text-brand-periwinkle" />;
    case 'PayoutStatusChanged':
      return <Wallet size={size} className="text-sky-400" />;
    case 'UserSanctionAlert':
      return <ShieldAlert size={size} className="text-red-400" />;
    default:
      return <Info size={size} className="text-outline" />;
  }
}

/** RefType backend ghi theo tên entity (VD: "Auction", "PaymentOrder", "PayoutRequest"). */
function getRefLink(refType: string | null, refId: string | null): string | null {
  if (!refType) return null;
  const key = refType.toLowerCase();
  if (key === 'auction' && refId) return `/auctions/${refId}`;
  if (key === 'paymentorder') return '/wallet';
  if (key === 'payoutrequest') return '/payout';
  if (key === 'commission' && refId) return `/workroom/${refId}`;
  if (key === 'chatroom' && refId) return `/workroom/${refId}`;
  return null;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

interface NotificationBellProps {
  userId: string | null;
  /** Kiểu icon nút chuông: 'lucide' (mặc định) hoặc 'material' để khớp header Marketplace. */
  iconSet?: 'lucide' | 'material';
  /** Class cho nút chuông, để hoà vào header chứa nó. */
  triggerClassName?: string;
  /** Số thông báo hiển thị trong dropdown. */
  previewLimit?: number;
  /** Căn lề panel: 'right' (mặc định) hoặc 'left'. */
  align?: 'left' | 'right';
}

export function NotificationBell({
  userId,
  iconSet = 'lucide',
  triggerClassName,
  previewLimit = 6,
  align = 'right',
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);

  /** Chỉ lấy badge số chưa đọc — nhẹ, gọi được cả khi panel đang đóng. */
  const refreshBadge = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await notificationService.unreadCount());
    } catch {
      // Giữ nguyên số cũ khi lỗi mạng — không làm phiền người dùng.
    }
  }, [userId]);

  const loadPreview = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.list(undefined, undefined, undefined, previewLimit);
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
    } finally {
      setLoading(false);
    }
  }, [userId, previewLimit]);

  // Badge làm mới mỗi 60 giây, và mỗi lần mở panel.
  useEffect(() => {
    refreshBadge();
    if (!userId) return;
    const timer = setInterval(refreshBadge, 60000);
    return () => clearInterval(timer);
  }, [userId, refreshBadge]);

  useEffect(() => {
    if (open) loadPreview();
  }, [open, loadPreview]);

  // Đóng panel khi bấm ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleOpenItem(item: NotificationDto) {
    const target = getRefLink(item.refType, item.refId);
    if (!item.isRead) {
      setBusyId(item.notificationId);
      try {
        await notificationService.markRead(item.notificationId);
        setItems((prev) =>
          prev.map((n) => (n.notificationId === item.notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Vẫn cho phép điều hướng dù đánh dấu đã đọc thất bại.
      } finally {
        setBusyId(null);
      }
    }
    setOpen(false);
    if (target) router.push(target);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không đánh dấu được tất cả là đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  }

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        className={
          triggerClassName ??
          'relative rounded-full p-2 text-brand-periwinkle transition-all hover:bg-brand-periwinkle/10 active:scale-95'
        }
      >
        {iconSet === 'material' ? (
          <span className="material-symbols-outlined text-xl">notifications</span>
        ) : (
          <Bell size={20} />
        )}

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-[#1F2335]">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          className={`absolute z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#1F2335] shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Tiêu đề + hành động nhanh */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="font-h1 text-sm font-bold text-on-surface">Thông báo</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-periwinkle hover:underline disabled:opacity-50"
              >
                {markingAll ? <RefreshCw size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Nội dung */}
          <div className="max-h-[22rem] overflow-y-auto">
            {!userId ? (
              <div className="px-4 py-8 text-center text-xs text-outline">
                Vui lòng đăng nhập để xem thông báo.
              </div>
            ) : loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
                ))}
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 px-4 py-6 text-xs text-red-200">
                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={28} className="mx-auto mb-2 text-outline" />
                <p className="text-xs text-on-surface-variant">Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((item) => (
                  <li key={item.notificationId}>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(item)}
                      disabled={busyId === item.notificationId}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 disabled:opacity-60 ${
                        item.isRead ? 'opacity-70' : ''
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">{getIcon(item.notificationType)}</span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-xs ${item.isRead ? 'font-medium text-on-surface-variant' : 'font-bold text-on-surface'}`}>
                            {item.notificationTitle}
                          </span>
                          {!item.isRead && <span className="size-1.5 shrink-0 rounded-full bg-brand-periwinkle" />}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-outline">
                          {item.body}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[10px] text-outline">
                          <span className="rounded-full border border-white/10 px-1.5 py-px">
                            {notificationTypeLabels[item.notificationType] ?? item.notificationType}
                          </span>
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Xem tất cả */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-white/10 px-4 py-3 text-xs font-semibold text-brand-periwinkle transition hover:bg-brand-periwinkle/10"
          >
            Xem tất cả thông báo <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
