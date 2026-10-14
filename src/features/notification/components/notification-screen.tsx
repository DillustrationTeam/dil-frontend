'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BriefcaseBusiness, Check, CheckCheck, CircleAlert, Clock, ExternalLink, Gavel, Info, LockKeyhole, Megaphone, RefreshCw, Scale, ShieldAlert, Wallet } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import { useNotificationHub } from '../hooks/use-notification-hub';
import { notificationCategories, notificationTypeLabels, type NotificationDto } from '../types/notification.types';

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
    case 'PromotionAnnouncement':
      return <Megaphone size={18} className="text-brand-periwinkle" />;
    case 'CommissionStatusChanged':
      return <BriefcaseBusiness size={18} className="text-brand-periwinkle" />;
    case 'EscrowStatusChanged':
      return <LockKeyhole size={18} className="text-emerald-400" />;
    case 'DisputeStatusChanged':
      return <Scale size={18} className="text-amber-400" />;
    default:
      return <Info size={18} className="text-outline" />;
  }
}

/** RefType backend ghi theo tên entity (VD: "Auction", "PaymentOrder", "PayoutRequest"). */
function getRefLink({ refType, refId, notificationType, notificationTitle, body }: NotificationDto) {
  if (!refType) return null;
  const key = refType.toLowerCase();
  if (key === 'auction' && refId) return { url: `/auctions/${refId}`, label: 'Xem phiên đấu giá' };
  if (key === 'paymentorder') return { url: '/wallet', label: 'Xem ví cá nhân' };
  if (key === 'payoutrequest') return { url: '/payout', label: 'Xem yêu cầu rút tiền' };
  if (key === 'creatorcommissionrequests') return { url: '/creator/requests', label: 'Xem yêu cầu đặt vẽ' };
  if (key === 'clientcommissionrequest' && refId) return { url: `/client/requests/${refId}`, label: 'Xem yêu cầu đặt vẽ' };
  if (key === 'commissioncheckout' && refId) return { url: `/payment/checkout/${refId}`, label: 'Tiến hành ký quỹ' };
  if (key === 'commission' && refId && notificationType === 'CommissionStatusChanged') {
    if (notificationTitle === 'Bạn có yêu cầu đặt vẽ mới' || notificationTitle === 'Khách hàng đã phản hồi đề nghị giá') {
      return { url: '/creator/requests', label: 'Xem yêu cầu đặt vẽ' };
    }
    return body.toLowerCase().includes('accept')
      ? { url: `/payment/checkout/${refId}`, label: 'Tiến hành ký quỹ' }
      : { url: `/client/requests/${refId}`, label: 'Xem yêu cầu đặt vẽ' };
  }
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

  // Bộ lọc (SCR-45): tab phân loại (Tất cả + 4 nhóm) và công tắc "chỉ chưa đọc".
  const [activeTab, setActiveTab] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  async function loadData(reset = true) {
    if (!userId) return;
    if (reset) setLoading(true);
    setError(null);
    try {
      const isRead = unreadOnly ? false : undefined;
      const res = await notificationService.list({
        isRead,
        category: activeTab === 'all' ? undefined : activeTab,
        cursor: reset ? undefined : nextCursor ?? undefined,
      });

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

  // Badge và danh sách cập nhật tức thời qua SignalR (UC45); polling 60s ở chuông vẫn giữ làm lưới an toàn.
  useNotificationHub((incoming) => {
    setUnreadCount((count) => count + (incoming.isRead ? 0 : 1));
    setNotifications((prev) => {
      if (prev.some((n) => n.notificationId === incoming.notificationId)) return prev;
      return [incoming, ...prev];
    });
  });

  // Giữ loader trong ref: effect chỉ chạy lại theo bộ lọc, không phụ thuộc
  // identity của hàm (tránh react-hooks/exhaustive-deps).
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  });

  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      await loadDataRef.current(true);
    })();
  }, [activeTab, unreadOnly, userId]);

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

      {/* Tab phân loại (SCR-45): Tất cả + Tài chính / Đơn hàng / Hệ thống / Khuyến mãi */}
      <div className="glass-container mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 p-2 text-xs">
        {[{ id: 'all', label: 'Tất cả' }, ...notificationCategories].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand-periwinkle text-brand-navy'
                : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setUnreadOnly((prev) => !prev)}
          aria-pressed={unreadOnly}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-semibold transition ${
            unreadOnly
              ? 'border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle'
              : 'border-white/15 text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <span className={`size-2 rounded-full ${unreadOnly ? 'bg-brand-periwinkle' : 'bg-outline'}`} />
          Chỉ chưa đọc
        </button>
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
            const refLink = getRefLink(n);
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
