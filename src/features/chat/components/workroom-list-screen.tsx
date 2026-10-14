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
} from 'lucide-react';

import { commissionService } from '@/services/commission.service';
import type { Commission, CommissionStatus } from '@/types/commission.types';

import { extractErrorMessage } from '@/lib/api-client';

/** Trạng thái KHÔNG còn phòng làm việc hoạt động (chưa nhận đơn / đã huỷ). */
const NO_WORKROOM_STATUSES: CommissionStatus[] = ['PendingAcceptance', 'Negotiating', 'Cancelled'];

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

const STATUS_TONE: Record<CommissionStatus, string> = {
  PendingAcceptance: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  InProgress: 'border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle',
  Negotiating: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  SubmittedFinal: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
  Delivered: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
  Completed: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
  Cancelled: 'border-white/15 bg-white/5 text-outline',
  Disputed: 'border-red-400/30 bg-red-400/10 text-red-200',
};

function money(value?: number | null): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
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
}

type FilterKey = 'all' | 'active' | 'done';

export function WorkroomListScreen({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<WorkroomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Người dùng đa vai trò (Client + Creator) có thể có phòng ở CẢ HAI phía.
      // Một phía lỗi (ví dụ chưa có CreatorProfile) không được làm hỏng cả trang.
      const [asClient, asCreator] = await Promise.allSettled([
        commissionService.getByClient(),
        commissionService.getByCreator(),
      ]);

      const collected = new Map<string, WorkroomRow>();

      if (asClient.status === 'fulfilled') {
        for (const commission of asClient.value) {
          collected.set(commission.id, {
            commission,
            viewerRole: 'Client',
            partnerName: commission.creatorName || 'Họa sĩ',
          });
        }
      }

      if (asCreator.status === 'fulfilled') {
        for (const commission of asCreator.value) {
          // Phòng của chính mình ở vai Creator thắng nếu trùng id.
          if (collected.has(commission.id)) continue;
          collected.set(commission.id, {
            commission,
            viewerRole: 'Creator',
            partnerName: commission.clientName || 'Khách hàng',
          });
        }
      }

      if (asClient.status === 'rejected' && asCreator.status === 'rejected') {
        throw asClient.reason;
      }

      const list = Array.from(collected.values())
        .filter((row) => !NO_WORKROOM_STATUSES.includes(row.commission.status))
        .sort((a, b) => {
          const left = new Date(a.commission.createdAt).getTime();
          const right = new Date(b.commission.createdAt).getTime();
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

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      const isDone = row.commission.status === 'Completed';
      if (filter === 'active' && isDone) return false;
      if (filter === 'done' && !isDone) return false;
      if (!needle) return true;
      return (
        row.commission.title.toLowerCase().includes(needle) ||
        row.partnerName.toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, keyword]);

  const metrics = useMemo(() => {
    const active = rows.filter((row) => row.commission.status !== 'Completed');
    return {
      active: active.length,
      escrow: rows.reduce((total, row) => total + (row.commission.escrowHeldAmount ?? 0), 0),
      completed: rows.length - active.length,
    };
  }, [rows]);

  if (!userId) {
    return (
      <div className="mx-auto max-w-4xl px-1 py-10">
        <div className="glass-container rounded-3xl border border-white/10 p-10 text-center">
          <CircleAlert size={40} className="mx-auto mb-4 text-brand-periwinkle" aria-hidden />
          <h1 className="font-h1 text-xl font-bold text-on-surface">Cần đăng nhập để xem phòng làm việc</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Phòng làm việc chỉ hiển thị với chủ sở hữu đơn hàng.
          </p>
          <Link
            href="/login"
            className="commission-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold"
          >
            Đăng nhập <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-on-surface">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-h1 text-2xl font-bold">Phòng làm việc</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Trao đổi phác thảo, duyệt tiến độ và nhận tệp hoàn thiện cho từng đơn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-on-surface transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden /> Làm mới
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <MetricCard label="Phòng đang hoạt động" value={`${metrics.active} phòng`} />
        <MetricCard label="Tiền đang ký quỹ" value={money(metrics.escrow)} />
        <MetricCard label="Đã hoàn tất" value={`${metrics.completed} đơn`} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
            {([
              ['all', 'Tất cả'],
              ['active', 'Đang làm'],
              ['done', 'Hoàn tất'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition ${
                  filter === key ? 'bg-brand-periwinkle text-brand-navy' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên đơn hoặc đối tác…"
              className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs text-on-surface outline-none transition placeholder:text-outline focus:border-brand-periwinkle"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-on-surface-variant">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Đang tải phòng làm việc…
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
            >
              Thử lại
            </button>
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState hasRows={rows.length > 0} />
        ) : (
          <div className="mt-5 grid gap-4">
            {visibleRows.map((row) => (
              <WorkroomCard key={row.commission.id} row={row} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[11px] font-medium text-outline">{label}</p>
      <p className="mt-2 font-h1 text-lg font-bold text-on-surface">{value}</p>
    </div>
  );
}

function WorkroomCard({ row }: { row: WorkroomRow }) {
  const { commission, viewerRole, partnerName } = row;
  const approved = (commission.milestones ?? []).filter((milestone) => milestone.status === 'Approved').length;
  const totalMilestones = (commission.milestones ?? []).length;
  const remainingDays = daysUntil(commission.deadlineAt);
  const escrowHeld = commission.escrowHeldAmount ?? 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-periwinkle/40 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-brand-periwinkle">
              #CMD-{commission.id.slice(0, 8).toUpperCase()}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[commission.status]}`}
            >
              {STATUS_LABEL[commission.status]}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
              Bạn là {viewerRole === 'Client' ? 'Khách hàng' : 'Họa sĩ'}
            </span>
          </div>

          <h2 className="mt-2 truncate text-sm font-bold text-on-surface">{commission.title}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={12} aria-hidden /> {partnerName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-brand-periwinkle" aria-hidden /> Ký quỹ {money(escrowHeld)}
            </span>
            {totalMilestones > 0 && (
              <span>
                Tiến độ {approved}/{totalMilestones} mốc
              </span>
            )}
            {remainingDays !== null && (
              <span
                className={`inline-flex items-center gap-1.5 ${
                  remainingDays < 0 ? 'text-red-300' : remainingDays <= 2 ? 'text-amber-200' : ''
                }`}
              >
                <CalendarClock size={12} aria-hidden />
                {remainingDays < 0
                  ? `Quá hạn ${Math.abs(remainingDays)} ngày`
                  : remainingDays === 0
                    ? 'Hạn hôm nay'
                    : `Còn ${remainingDays} ngày`}
              </span>
            )}
            <span>Cập nhật {lastActivity(commission.createdAt)}</span>
          </div>
        </div>

        <Link
          href={`/workroom/${commission.id}`}
          className="commission-primary inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold"
        >
          Mở phòng làm việc <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ hasRows }: { hasRows: boolean }) {
  return (
    <div className="py-14 text-center">
      <MessageSquare size={40} className="mx-auto mb-3 text-brand-periwinkle" aria-hidden />
      <h2 className="font-h1 text-base font-bold text-on-surface">
        {hasRows ? 'Không có phòng nào khớp bộ lọc' : 'Chưa có phòng làm việc nào'}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
        {hasRows
          ? 'Thử đổi bộ lọc hoặc xoá từ khoá tìm kiếm.'
          : 'Phòng làm việc được mở tự động khi họa sĩ nhận đơn đặt vẽ. Bạn cũng có thể mở phòng từ một phiên đấu giá đã thắng.'}
      </p>
      {!hasRows && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auctions"
            className="commission-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            <Gavel size={15} aria-hidden /> Mở từ sàn đấu giá
          </Link>
          <Link
            href="/client/commissions"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-on-surface transition hover:bg-white/10"
          >
            Xem đơn đặt vẽ
          </Link>
        </div>
      )}
    </div>
  );
}
