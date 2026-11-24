'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Gavel,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { chatService } from '../services/chat.service';
import type { WorkroomUnreadCountDto } from '../types/chat.types';
import { useNotificationHub } from '@/features/notification/hooks/use-notification-hub';
import { commissionService } from '@/services/commission.service';
import type { Commission, CommissionStatus } from '@/types/commission.types';
import { CountUp, Reveal } from '@/components/motion';

import { extractErrorMessage } from '@/lib/api-client';

/** Trạng thái KHÔNG còn phòng làm việc hoạt động (chưa nhận đơn / đã huỷ). */
const NO_WORKROOM_STATUSES: CommissionStatus[] = ['PendingAcceptance', 'Negotiating'];

const STATUS_LABEL: Record<CommissionStatus, string> = {
  PendingAcceptance: 'Chờ họa sĩ nhận đơn',
  InProgress: 'Đang thực hiện',
  Negotiating: 'Đang thương lượng',
  SubmittedFinal: 'Đã nộp bản cuối',
  Delivered: 'Đã bàn giao',
  Completed: 'Đã hoàn tất',
  Cancelled: 'Đã huỷ',
  Disputed: 'Đang khiếu nại',
};

/** Badge theo hệ màu giấy: "live" là đỏ son, "ok" là petrol, "done" là mực nhạt. */
const STATUS_TONE: Record<CommissionStatus, string> = {
  PendingAcceptance: 'badge--soon',
  InProgress: 'badge--info',
  Negotiating: 'badge--soon',
  SubmittedFinal: 'badge--info',
  Delivered: 'badge--info',
  Completed: 'badge--ok',
  Cancelled: 'badge--done',
  Disputed: 'badge--live',
};

function money(value?: number | null): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
}

function lastActivity(iso?: string | null): string {
  if (!iso) return 'Chưa có hoạt động';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

interface WorkroomRow {
  commission: Commission;
  /** Vai trò của người đang đăng nhập trong đơn này. */
  viewerRole: 'Client' | 'Creator';
  /** Tên đối tác còn lại trong phòng. */
  partnerName: string;
  /** Số tin nhắn chưa đọc trong phòng. */
  unreadCount: number;
  /** Thời điểm có tin nhắn gần nhất. */
  lastMessageAt?: string | null;
}

type FilterKey = 'all' | 'active' | 'disputed' | 'done' | 'cancelled';
type RoleFilterKey = 'all' | 'Client' | 'Creator';
type DeadlineFilterKey = 'all' | 'overdue' | 'due_soon' | 'escrow';
type SortKey = 'newest' | 'deadline' | 'escrow';

export function WorkroomListScreen({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<WorkroomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Người dùng đa vai trò (Client + Creator) có thể có phòng ở CẢ HAI phía.
      // Một phía lỗi (ví dụ chưa có CreatorProfile) không được làm hỏng cả trang.
      const [asClient, asCreator, unreadRes] = await Promise.allSettled([
        commissionService.getByClient(),
        commissionService.getByCreator(),
        chatService.getUnreadCounts(),
      ]);

      const unreadMap = new Map<string, WorkroomUnreadCountDto>();
      if (unreadRes.status === 'fulfilled' && Array.isArray(unreadRes.value)) {
        for (const item of unreadRes.value) {
          unreadMap.set(String(item.commissionId).toLowerCase(), item);
        }
      }

      const collected = new Map<string, WorkroomRow>();

      if (asClient.status === 'fulfilled') {
        for (const commission of asClient.value) {
          const unread = unreadMap.get(String(commission.id).toLowerCase());
          collected.set(commission.id, {
            commission,
            viewerRole: 'Client',
            partnerName: commission.creatorName || 'Họa sĩ',
            unreadCount: unread?.unreadCount ?? 0,
            lastMessageAt: unread?.lastMessageAt ?? null,
          });
        }
      }

      if (asCreator.status === 'fulfilled') {
        for (const commission of asCreator.value) {
          // Phòng của chính mình ở vai Creator thắng nếu trùng id.
          if (collected.has(commission.id)) continue;
          const unread = unreadMap.get(String(commission.id).toLowerCase());
          collected.set(commission.id, {
            commission,
            viewerRole: 'Creator',
            partnerName: commission.clientName || 'Khách hàng',
            unreadCount: unread?.unreadCount ?? 0,
            lastMessageAt: unread?.lastMessageAt ?? null,
          });
        }
      }

      if (asClient.status === 'rejected' && asCreator.status === 'rejected') {
        throw asClient.reason;
      }

      const list = Array.from(collected.values())
        .filter(
          (row) =>
            !NO_WORKROOM_STATUSES.includes(row.commission.status) &&
            row.commission.escrowStatus !== 'Pending',
        )
        .sort((a, b) => {
          if ((a.unreadCount > 0) !== (b.unreadCount > 0)) {
            return a.unreadCount > 0 ? -1 : 1;
          }
          const left = new Date(a.lastMessageAt || a.commission.createdAt).getTime();
          const right = new Date(b.lastMessageAt || b.commission.createdAt).getTime();
          return right - left;
        });

      setRows(list);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Không tải được danh sách phòng làm việc.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Tránh setState đồng bộ ngay trong effect (gây cascading render — xem workroom-screen.tsx).
  useEffect(() => {
    void Promise.resolve().then(() => {
      void load();
    });
  }, [load]);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const unreadList = await chatService.getUnreadCounts();
      const unreadMap = new Map(unreadList.map((item) => [String(item.commissionId).toLowerCase(), item]));
      setRows((current) =>
        current
          .map((row) => {
            const match = unreadMap.get(String(row.commission.id).toLowerCase());
            if (!match) return row;
            return {
              ...row,
              unreadCount: match.unreadCount,
              lastMessageAt: match.lastMessageAt ?? row.lastMessageAt,
            };
          })
          .sort((a, b) => {
            if ((a.unreadCount > 0) !== (b.unreadCount > 0)) {
              return a.unreadCount > 0 ? -1 : 1;
            }
            const left = new Date(a.lastMessageAt || a.commission.createdAt).getTime();
            const right = new Date(b.lastMessageAt || b.commission.createdAt).getTime();
            return right - left;
          }),
      );
    } catch {
      // ignore background refresh errors
    }
  }, [userId]);

  const handleNotificationNoop = useCallback(() => {}, []);
  const handleWorkroomMessage = useCallback(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useNotificationHub(handleNotificationNoop, handleWorkroomMessage);

  useEffect(() => {
    if (!userId) return;

    const onFocus = () => {
      void refreshUnread();
    };
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(() => {
      void refreshUnread();
    }, 8000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [userId, refreshUnread]);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const status = row.commission.status;
      if (filter === 'active' && (status === 'Completed' || status === 'Disputed' || status === 'Cancelled')) return false;
      if (filter === 'disputed' && status !== 'Disputed') return false;
      if (filter === 'done' && status !== 'Completed') return false;
      if (filter === 'cancelled' && status !== 'Cancelled') return false;

      if (roleFilter !== 'all' && row.viewerRole !== roleFilter) return false;

      const remainingDays = daysUntil(row.commission.deadlineAt);
      if (deadlineFilter === 'overdue') {
        if (remainingDays === null || remainingDays >= 0 || status === 'Completed' || status === 'Cancelled') return false;
      } else if (deadlineFilter === 'due_soon') {
        if (remainingDays === null || remainingDays < 0 || remainingDays > 3 || status === 'Completed' || status === 'Cancelled') return false;
      } else if (deadlineFilter === 'escrow') {
        if ((row.commission.escrowHeldAmount ?? 0) <= 0) return false;
      }

      if (!needle) return true;
      const shortCode = `#cmd-${row.commission.id.slice(0, 8)}`.toLowerCase();
      return (
        row.commission.title.toLowerCase().includes(needle) ||
        row.partnerName.toLowerCase().includes(needle) ||
        shortCode.includes(needle)
      );
    });

    if (sortBy === 'newest') return filtered;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'escrow') {
        return (b.commission.escrowHeldAmount ?? 0) - (a.commission.escrowHeldAmount ?? 0);
      }
      const aTime = a.commission.deadlineAt ? new Date(a.commission.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.commission.deadlineAt ? new Date(b.commission.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [rows, filter, roleFilter, deadlineFilter, sortBy, keyword]);

  const metrics = useMemo(() => {
    const active = rows.filter((row) => row.commission.status !== 'Completed' && row.commission.status !== 'Cancelled');
    return {
      active: active.length,
      escrow: rows.reduce((total, row) => total + (row.commission.escrowHeldAmount ?? 0), 0),
      completed: rows.filter((row) => row.commission.status === 'Completed').length,
    };
  }, [rows]);

  const unreadRooms = rows.filter(
    (r) => r.unreadCount > 0 && r.commission.status !== 'Completed' && r.commission.status !== 'Cancelled',
  );

  if (!userId) {
    return (
      <div className="wrap max-w-4xl py-10">
        <div className="pane text-center">
          <CircleAlert size={40} className="mx-auto mb-4 text-[#B24A26]" aria-hidden />
          <h1 className="text-2xl text-[#241F1A]">Cần đăng nhập để xem phòng làm việc</h1>
          <p className="mt-2 text-sm text-[#6E6459]">Phòng làm việc chỉ hiển thị với chủ sở hữu đơn hàng.</p>
          <Link href="/login" className="btn btn--primary mt-6"> Đăng nhập <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap w-full max-w-6xl">
      <header className="page-head">
        <div>
          <p className="eyebrow">Phòng làm việc</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1>Trao đổi &amp; duyệt tiến độ</h1>
            {unreadRooms.length > 0 && (
              <span className="unread-pill">
                <span className="unread-pill__dot" />
                {unreadRooms.length} phòng có tin mới
              </span>
            )}
          </div>
          <p className="page-head__sub"> Phác thảo, mốc thanh toán và tệp hoàn thiện của từng đơn — tất cả trong một phòng. </p>
        </div>
        <div className="page-head__actions">
          <button type="button" onClick={() => void load()} disabled={loading} className="btn btn--outline btn--sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden /> Làm mới </button>
        </div>
      </header>

      {/* Ba con số thành một dòng lặng lẽ, không phải ba cái thẻ */}
      <div className="statsline">
        <span>
          <b>
            <CountUp value={metrics.active} />
          </b> phòng đang hoạt động </span>
        <span>
          <b>
            <CountUp value={metrics.escrow} format={(v) => money(v)} />
          </b> đang ký quỹ </span>
        <span>
          <b>
            <CountUp value={metrics.completed} />
          </b> đơn đã hoàn tất </span>
      </div>

      <section className="pane room-panel mt-6">
        <div className="room-filters">
          <div className="filterbar__tabs" role="tablist" aria-label="Lọc phòng làm việc">
            {([
              ['all', 'Tất cả'],
              ['active', 'Đang làm'],
              ['disputed', 'Khiếu nại'],
              ['done', 'Hoàn tất'],
              ['cancelled', 'Đã huỷ'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className="fpill"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="input-wrap room-search">
            <Search aria-hidden />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên đơn, mã hoặc đối tác…"
              aria-label="Tìm phòng làm việc"
              className="input min-h-11 text-sm"
            />
          </div>
        </div>

        <div className="room-filters room-filters--low">
          <select
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilterKey)}
            className="input"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Client">Bạn là Khách hàng</option>
            <option value="Creator">Bạn là Họa sĩ</option>
          </select>

          <select
            aria-label="Lọc theo hạn chót và ký quỹ"
            value={deadlineFilter}
            onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilterKey)}
            className="input"
          >
            <option value="all">Mọi hạn chót</option>
            <option value="overdue">Quá hạn</option>
            <option value="due_soon">Sắp đến hạn (≤ 3 ngày)</option>
            <option value="escrow">Đang có ký quỹ</option>
          </select>

          <select
            aria-label="Sắp xếp phòng làm việc"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="input"
          >
            <option value="newest">Mới nhất</option>
            <option value="deadline">Hạn chót gần nhất</option>
            <option value="escrow">Ký quỹ cao nhất</option>
          </select>

          {(filter !== 'all' || roleFilter !== 'all' || deadlineFilter !== 'all' || sortBy !== 'newest' || keyword.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setRoleFilter('all');
                setDeadlineFilter('all');
                setSortBy('newest');
                setKeyword('');
              }}
              className="btn btn--ghost btn--sm"
            > Xoá bộ lọc </button>
          )}
        </div>

        {loading ? (
          <div className="rooms" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[6.5rem]" />
            ))}
            <p className="mt-2 flex items-center gap-2 text-sm text-[#6E6459]">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Đang tải phòng làm việc… </p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#A8321C]">{error}</p>
            <button type="button" onClick={() => void load()} className="btn btn--outline btn--sm mt-4"> Thử lại </button>
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState hasRows={rows.length > 0} />
        ) : (
          <div className="rooms">
            {visibleRows.map((row, index) => (
              <Reveal key={row.commission.id} delay={Math.min(index, 8) * 45}>
                <WorkroomCard row={row} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkroomCard({ row }: { row: WorkroomRow }) {
  const { commission, viewerRole, partnerName, unreadCount, lastMessageAt } = row;
  const approved = (commission.milestones ?? []).filter((milestone) => milestone.status === 'Approved').length;
  const totalMilestones = (commission.milestones ?? []).length;
  const isEnded = commission.status === 'Completed' || commission.status === 'Cancelled';
  const remainingDays = isEnded ? null : daysUntil(commission.deadlineAt);
  const escrowHeld = commission.escrowHeldAmount ?? 0;
  const hasUnread = unreadCount > 0 && !isEnded;

  return (
    <article className={`wcard ${hasUnread ? 'wcard--unread' : ''}`}>
      <div className="wcard__main">
        <div className="wcard__top">
          <span className="wcard__code">#CMD-{commission.id.slice(0, 8).toUpperCase()}</span>
          <span className={`badge ${STATUS_TONE[commission.status]}`}>{STATUS_LABEL[commission.status]}</span>
          <span className="badge">
            Bạn là {viewerRole === 'Client' ? 'Khách hàng' : 'Họa sĩ'}
          </span>
          {hasUnread && (
            <span className="wcard__ping">
              <span />
              {unreadCount} tin mới
            </span>
          )}
        </div>

        <h2 className="wcard__title">{commission.title}</h2>

        <div className="wcard__facts">
          <span>
            <MessageSquare aria-hidden /> {partnerName}
          </span>
          <span>
            <ShieldCheck aria-hidden /> Ký quỹ {money(escrowHeld)}
          </span>
          {totalMilestones > 0 && (
            <span>
              <Sparkles aria-hidden /> Tiến độ {approved}/{totalMilestones} mốc
            </span>
          )}
          {remainingDays !== null && (
            <span className={remainingDays < 0 ? 'text-[#A8321C]' : remainingDays <= 2 ? 'text-[#8A6A1F]' : ''}>
              <CalendarClock aria-hidden />
              {remainingDays < 0
                ? `Quá hạn ${Math.abs(remainingDays)} ngày`
                : remainingDays === 0
                  ? 'Hạn hôm nay'
                  : `Còn ${remainingDays} ngày`}
            </span>
          )}
        </div>

        <p className="wcard__last">
          <MessageSquare aria-hidden /> Cập nhật {lastActivity(lastMessageAt || commission.createdAt)}
        </p>
      </div>

      <div className="wcard__action">
        <span className="wcard__when">{money(commission.price)}</span>
        <Link href={`/workroom/${commission.id}`} className="btn btn--primary btn--sm">
          Mở phòng
          {hasUnread && <span className="rounded-full bg-[#FFFCF6]/25 px-1.5 text-[11px] font-bold">{unreadCount}</span>}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ hasRows }: { hasRows: boolean }) {
  return (
    <div className="empty mt-6">
      <MessageSquare size={40} className="empty__art" aria-hidden />
      <h2>{hasRows ? 'Không có phòng nào khớp bộ lọc' : 'Chưa có phòng làm việc nào'}</h2>
      <p>
        {hasRows
          ? 'Thử đổi bộ lọc hoặc xoá từ khoá tìm kiếm.'
          : 'Phòng làm việc được mở tự động khi họa sĩ nhận đơn đặt vẽ. Bạn cũng có thể mở phòng từ một phiên đấu giá đã thắng.'}
      </p>
      {!hasRows && (
        <div className="empty__actions">
          <Link href="/auctions" className="btn btn--primary btn--sm">
            <Gavel size={15} aria-hidden /> Mở từ sàn đấu giá </Link>
          <Link href="/client/commissions" className="btn btn--outline btn--sm"> Xem đơn đặt vẽ </Link>
        </div>
      )}
    </div>
  );
}
