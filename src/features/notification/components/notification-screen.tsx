'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, CircleAlert, Clock, ExternalLink, Gavel, Info, RefreshCw, ShieldAlert, Wallet } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import { notificationTypeLabels, notificationTypes, type NotificationDto } from '../types/notification.types';

function getIcon(type: string) {
  switch (type) {
    case 'OutbidAlert':
      return <Gavel size={18} className="text-amber-400" />;
    case 'AuctionEndingSoon':
      return <Clock size={18} className="text-amber-400" />;
    case 'AuctionWon':
      return <Gavel size={18} className="text-emerald-400" />;
    case 'DeadlineRiskWarning':
      return <Clock size={18} className="text-red-400" />;
    case 'PaymentSucceeded':
      return <Wallet size={18} className="text-brand-periwinkle" />;
    case 'PayoutStatusChanged':
      return <Wallet size={18} className="text-sky-400" />;
    case 'UserSanctionAlert':
      return <ShieldAlert size={18} className="text-red-400" />;
    default:
      return <Info size={18} className="text-outline" />;
  }
}

/** RefType backend ghi theo tên entity (VD: "Auction", "PaymentOrder", "PayoutRequest"). */
function getRefLink(refType: string | null, refId: string | null) {
  if (!refType) return null;
  const key = refType.toLowerCase();
  if (key === 'auction' && refId) return { url: `/auctions/${refId}`, label: 'Xem phiên đấu giá' };
  if (key === 'paymentorder') return { url: '/wallet', label: 'Xem ví cá nhân' };
  if (key === 'payoutrequest') return { url: '/payout', label: 'Xem yêu cầu rút tiền' };
  if (key === 'commission' && refId) return { url: `/workroom/${refId}`, label: 'Mở phòng làm việc' };
  if (key === 'chatroom' && refId) return { url: `/workroom/${refId}`, label: 'Mở cuộc trò chuyện' };
  return null;
}

export function NotificationScreen({ userId }: { userId: string | null }) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Bộ lọc: tab trạng thái đọc ('all' / 'unread') + loại thông báo theo enum backend
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('');

  async function loadData(reset = true) {
    if (!userId) return;
    if (reset) setLoading(true);
    setError(null);
    try {
      const isRead = activeTab === 'unread' ? false : undefined;
      const res = await notificationService.list(isRead, activeType || undefined, reset ? undefined : nextCursor ?? undefined);

      if (reset) {
        setNotifications(res.items);
      } else {
        setNotifications((prev) => [...prev, ...res.items]);
      }
      setUnreadCount(res.unreadCount);
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách thông báo.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, [activeTab, activeType, userId]);

  async function handleMarkRead(id: string) {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignored
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể đánh dấu tất cả đã đọc.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 text-on-surface">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-h1 text-2xl font-bold">Trung tâm thông báo</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-periwinkle px-2.5 py-0.5 font-mono text-xs font-bold text-brand-navy">
                {unreadCount} mới
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Cập nhật hoạt động đặt vẽ tranh, biến động số dư và diễn biến các phiên đấu giá.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-brand-periwinkle hover:bg-white/10"
            >
              <CheckCheck size={15} /> Đánh dấu đã đọc tất cả
            </button>
          )}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-outline hover:text-white"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Bộ lọc: trạng thái đọc + loại thông báo hợp lệ theo enum backend */}
      <div className="glass-container mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 p-2 text-xs">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'unread', label: 'Chưa đọc' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand-periwinkle text-brand-navy'
                : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <select
          aria-label="Lọc theo loại thông báo"
          value={activeType}
          onChange={(e) => setActiveType(e.target.value)}
          className="ml-auto rounded-full border border-white/15 bg-brand-navy px-4 py-1.5 text-xs text-on-surface outline-none focus:border-brand-periwinkle"
        >
          <option value="">Tất cả loại thông báo</option>
          {notificationTypes.map((type) => (
            <option key={type} value={type}>
              {notificationTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-container h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : (!Array.isArray(notifications) || notifications.length === 0) ? (
        <div className="glass-container rounded-3xl border border-white/10 p-16 text-center">
          <Bell size={40} className="mx-auto mb-3 text-outline" />
          <h2 className="font-h1 text-base font-bold text-on-surface">Không có thông báo nào</h2>
          <p className="mt-1 text-xs text-on-surface-variant">Bạn đã xem hết tất cả thông báo hiện có.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const refLink = getRefLink(n.refType, n.refId);
            return (
              <div
                key={n.notificationId}
                className={`glass-container relative flex items-start gap-4 rounded-2xl border p-4 transition ${
                  n.isRead
                    ? 'border-white/5 bg-white/[0.02] text-on-surface-variant'
                    : 'border-brand-periwinkle/30 bg-brand-periwinkle/5 text-on-surface'
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  {getIcon(n.notificationType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{n.notificationTitle}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-outline">
                      <Clock size={12} /> {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{n.body}</p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-outline">
                      {notificationTypeLabels[n.notificationType] || n.notificationType}
                    </span>

                    <div className="flex items-center gap-3">
                      {refLink && (
                        <Link
                          href={refLink.url}
                          className="inline-flex items-center gap-1 font-semibold text-brand-periwinkle hover:underline"
                        >
                          {refLink.label} <ExternalLink size={12} />
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.notificationId)}
                          className="inline-flex items-center gap-1 text-[11px] text-outline hover:text-white"
                        >
                          <Check size={13} /> Đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <span className="size-2 shrink-0 rounded-full bg-brand-periwinkle" title="Chưa đọc" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <div className="mt-8 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              loadData(false);
            }}
            className="rounded-full border border-white/15 px-6 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Xem các thông báo cũ hơn'}
          </button>
        </div>
      )}
    </div>
  );
}
