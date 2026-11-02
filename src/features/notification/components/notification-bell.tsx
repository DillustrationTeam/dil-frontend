'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Award, Bell, BriefcaseBusiness, Check, CheckCheck, CircleAlert, Clock, Gavel, Info, LockKeyhole, Megaphone, RefreshCw, Scale, ShieldAlert, Wallet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { notificationService } from '../services/notification.service';
import { useNotificationHub } from '../hooks/use-notification-hub';
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
    case 'PromotionAnnouncement':
      return <Megaphone size={size} className="text-brand-periwinkle" />;
    case 'CommissionStatusChanged':
      return <BriefcaseBusiness size={size} className="text-brand-periwinkle" />;
    case 'EscrowStatusChanged':
      return <LockKeyhole size={size} className="text-emerald-400" />;
    case 'DisputeStatusChanged':
      return <Scale size={size} className="text-amber-400" />;
    case 'InvitationReceived':
      return <Award size={size} className="text-amber-400" />;
    case 'InvitationAccepted':
      return <Award size={size} className="text-emerald-400" />;
    case 'InvitationDeclined':
      return <Award size={size} className="text-rose-400" />;
    case 'InvitationCanceled':
    case 'InvitationExpired':
      return <Award size={size} className="text-outline" />;
    default:
      return <Info size={size} className="text-outline" />;
  }
}

/** RefType backend ghi theo tên entity (VD: "Auction", "PaymentOrder", "PayoutRequest", "Invitation"). */
function getRefLink({ refType, refId, notificationType, notificationTitle, body }: NotificationDto): string | null {
  if (!refType) return null;
  const key = refType.toLowerCase();
  if (key === 'auction' && refId) return `/auctions/${refId}`;
  if (key === 'paymentorder') return '/wallet';
  if (key === 'payoutrequest') return '/payout';
  if (key === 'creatorcommissionrequests') return '/creator/requests';
  if (key === 'clientcommissionrequest' && refId) return `/client/requests/${refId}`;
  if (key === 'commissioncheckout' && refId) return `/payment/checkout/${refId}`;
  if (key === 'commission' && refId && notificationType === 'CommissionStatusChanged') {
    if (notificationTitle === 'Bạn có yêu cầu đặt vẽ mới' || notificationTitle === 'Khách hàng đã phản hồi đề nghị giá') {
      return '/creator/requests';
    }
    return body.toLowerCase().includes('accept') ? `/payment/checkout/${refId}` : `/client/requests/${refId}`;
  }
  if (key === 'commission' && refId) return `/workroom/${refId}`;
  if (key === 'chatroom' && refId) return `/workroom/${refId}`;
  if (key === 'invitation' && refId) return `/notifications?invitationId=${refId}`;
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
  const [replyingInvId, setReplyingInvId] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);

  async function handleQuickAccept(e: React.MouseEvent, item: NotificationDto) {
    e.stopPropagation();
    if (!item.refId) return;
    setReplyingInvId(item.refId);
    try {
      await notificationService.acceptInvitation(item.refId);
      toast.success('Bạn đã chấp nhận lời mời tham gia sự kiện!');
      setItems((prev) =>
        prev.map((n) =>
          n.notificationId === item.notificationId
            ? { ...n, notificationType: 'InvitationAccepted', isRead: true }
            : n
        )
      );
      if (!item.isRead) {
        await notificationService.markRead(item.notificationId);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể chấp nhận lời mời.'));
    } finally {
      setReplyingInvId(null);
    }
  }

  async function handleQuickDecline(e: React.MouseEvent, item: NotificationDto) {
    e.stopPropagation();
    if (!item.refId) return;
    setReplyingInvId(item.refId);
    try {
      await notificationService.declineInvitation(item.refId);
      toast.success('Đã từ chối lời mời tham gia sự kiện.');
      setItems((prev) =>
        prev.map((n) =>
          n.notificationId === item.notificationId
            ? { ...n, notificationType: 'InvitationDeclined', isRead: true }
            : n
        )
      );
      if (!item.isRead) {
        await notificationService.markRead(item.notificationId);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể từ chối lời mời.'));
    } finally {
      setReplyingInvId(null);
    }
  }

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
      const res = await notificationService.list({ limit: previewLimit });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
    } finally {
      setLoading(false);
    }
  }, [userId, previewLimit]);

  // Real-time (UC45): thông báo mới hiện ngay, không phải chờ nhịp polling 60 giây.
  useNotificationHub((incoming) => {
    setUnreadCount((count) => count + (incoming.isRead ? 0 : 1));
    setItems((prev) => {
      if (prev.some((n) => n.notificationId === incoming.notificationId)) return prev;
      return [incoming, ...prev].slice(0, previewLimit);
    });
  });

  // Badge làm mới mỗi 60 giây (lưới an toàn khi WebSocket bị chặn), và mỗi lần mở panel.
  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      await refreshBadge();
    })();
    if (!userId) return;
    const timer = setInterval(refreshBadge, 60000);
    return () => clearInterval(timer);
  }, [userId, refreshBadge]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      if (open) await loadPreview();
    })();
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
    const target = getRefLink(item);
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
                {items.map((item) => {
                  const isInv = item.refType?.toLowerCase() === 'invitation' && !!item.refId;
                  const isInvReceived = item.notificationType === 'InvitationReceived';

                  return (
                    <li key={item.notificationId} className="group transition hover:bg-white/5">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenItem(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenItem(item);
                          }
                        }}
                        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left ${
                          item.isRead ? 'opacity-70' : ''
                        } ${busyId === item.notificationId ? 'opacity-60 pointer-events-none' : ''}`}
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

                          {/* Phản hồi nhanh lời mời sự kiện trong dropdown */}
                          {isInv && isInvReceived && (
                            <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={replyingInvId === item.refId}
                                onClick={(e) => handleQuickAccept(e, item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
                              >
                                {replyingInvId === item.refId ? (
                                  <RefreshCw size={10} className="animate-spin" />
                                ) : (
                                  <Check size={11} />
                                )}
                                Chấp nhận
                              </button>
                              <button
                                type="button"
                                disabled={replyingInvId === item.refId}
                                onClick={(e) => handleQuickDecline(e, item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 transition hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                              >
                                <X size={11} />
                                Từ chối
                              </button>
                            </div>
                          )}

                          {isInv && item.notificationType === 'InvitationAccepted' && (
                            <span className="mt-1.5 inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-400">
                              <Check size={11} /> Đã chấp nhận lời mời
                            </span>
                          )}

                          {isInv && item.notificationType === 'InvitationDeclined' && (
                            <span className="mt-1.5 inline-flex items-center gap-1 font-semibold text-[10px] text-rose-400">
                              <X size={11} /> Đã từ chối lời mời
                            </span>
                          )}

                          <span className="mt-1.5 flex items-center gap-2 text-[10px] text-outline">
                            <span className="rounded-full border border-white/10 px-1.5 py-px">
                              {notificationTypeLabels[item.notificationType] ?? item.notificationType}
                            </span>
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </span>
                        </span>
                      </div>
                    </li>
                  );
                })}
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
