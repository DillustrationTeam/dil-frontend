'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Gavel,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Undo2,
  X,
} from 'lucide-react';
import { auctionError, auctionService } from '../services/auction.service';
import type { AuctionPenaltyAdminDto } from '../types/auction.types';

const MAX_REVOKE_REASON = 500;

const levelMeta: Record<number, { label: string; className: string }> = {
  1: { label: 'L1 · Cảnh cáo', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  2: { label: 'L2 · Cảnh cáo nặng', className: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  3: { label: 'L3 · Phụ phí 20%', className: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  4: { label: 'L4 · Phụ phí 30%', className: 'border-rose-500/40 bg-rose-500/15 text-rose-200' },
  5: { label: 'L5 · Khoá bán 30 ngày', className: 'border-rose-500/50 bg-rose-500/20 text-rose-100' },
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Sổ án phạt giao hàng của người bán (L1–L5) + thu hồi án phạt.
 *
 * Trước đây thang phạt chỉ hiện trong trang chi tiết phiên của chính người bán, Ban quản trị
 * không có chỗ nào xem toàn bộ án phạt đang hiệu lực, cũng không có cách sửa một án phạt bị
 * tạo nhầm — người bán bị oan phải chịu phụ phí/khoá bán cho tới khi hết hạn.
 */
export function AuctionPenaltyConsole() {
  const [items, setItems] = useState<AuctionPenaltyAdminDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mặc định xem TẤT CẢ: án đã chạy xong (Consumed) vẫn là lịch sử người vận hành cần thấy —
  // trước đây mặc định lọc Active nên một seller chỉ có án Consumed trông như chưa từng bị phạt.
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [minLevel, setMinLevel] = useState<string>('');

  const [revokeTarget, setRevokeTarget] = useState<AuctionPenaltyAdminDto | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const load = useCallback(
    async (nextCursor?: string) => {
      if (nextCursor) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await auctionService.getPenalties(
          {
            status: statusFilter || undefined,
            minLevel: minLevel ? Number(minLevel) : undefined,
          },
          nextCursor,
          20,
        );
        setItems((prev) => (nextCursor ? [...prev, ...res.items] : res.items));
        setCursor(res.nextCursor);
      } catch (err: unknown) {
        setError(auctionError(err) || 'Không tải được danh sách án phạt.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, minLevel],
  );

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await load();
    })();
  }, [load]);

  function openRevoke(item: AuctionPenaltyAdminDto) {
    setRevokeTarget(item);
    setRevokeReason('');
    setRevokeError(null);
  }

  async function submitRevoke() {
    if (!revokeTarget) return;
    const reason = revokeReason.trim();
    if (reason.length < 10) {
      setRevokeError('Lý do thu hồi phải có ít nhất 10 ký tự để lưu vết kiểm toán.');
      return;
    }
    if (reason.length > MAX_REVOKE_REASON) {
      setRevokeError(`Lý do tối đa ${MAX_REVOKE_REASON} ký tự.`);
      return;
    }

    setRevoking(true);
    setRevokeError(null);
    try {
      const res = await auctionService.revokePenalty(revokeTarget.penaltyId, reason);
      setItems((prev) =>
        prev.map((p) =>
          p.penaltyId === res.penaltyId
            ? {
                ...p,
                status: res.status,
                revokedAt: res.revokedAt,
                revokeReason: res.revokeReason,
                revokedByAdminName: 'Bạn',
              }
            : p,
        ),
      );
      setSuccess(`Đã thu hồi án phạt L${res.strikeLevel} của ${revokeTarget.sellerName ?? 'người bán'}.`);
      setRevokeTarget(null);
    } catch (err: unknown) {
      setRevokeError(auctionError(err));
    } finally {
      setRevoking(false);
    }
  }

  const activeCount = items.filter((p) => p.status === 'Active').length;
  const consumedCount = items.filter((p) => p.status === 'Consumed').length;

  return (
    <div className="w-full text-on-surface">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-h1 text-2xl font-bold md:text-3xl">Án phạt người bán</h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Thang phạt giao hàng L1–L5 theo Quy chế giao nhận. Thu hồi án phạt khi phán quyết sai — thao tác được lưu vết.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={16} /> {success}
          <button type="button" onClick={() => setSuccess(null)} className="ml-auto text-emerald-200/70 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-xs">
        <label className="block">
          <span className="mb-1 block text-outline">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
          >
            <option value="">Tất cả</option>
            <option value="Active">Đang hiệu lực</option>
            <option value="Consumed">Đã chạy xong</option>
            <option value="Revoked">Đã thu hồi</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-outline">Mức phạt tối thiểu</span>
          <select
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
            className="rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
          >
            <option value="">Tất cả</option>
            <option value="3">Từ L3 (có phụ phí)</option>
            <option value="5">L5 (khoá bán)</option>
          </select>
        </label>

        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-semibold text-amber-200">
          <ShieldAlert size={13} /> {activeCount} đang hiệu lực
          {consumedCount > 0 && <span className="text-outline">· {consumedCount} đã chạy xong</span>}
        </span>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center text-outline">
          <LoaderCircle size={26} className="mx-auto mb-2 animate-spin" /> Đang tải sổ án phạt…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center text-outline">
          <Gavel size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có án phạt nào khớp bộ lọc.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-outline">
              <tr>
                <th className="px-4 py-3">Người bán</th>
                <th className="px-4 py-3">Mức</th>
                <th className="px-4 py-3">Lượt phụ phí</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Hiệu lực</th>
                <th className="px-4 py-3">Ghi nhận</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const meta = levelMeta[p.strikeLevel] ?? levelMeta[1];
                const isActive = p.status === 'Active';
                const isConsumed = p.status === 'Consumed';
                const statusLabel = isActive ? 'Đang hiệu lực' : isConsumed ? 'Đã chạy xong' : 'Đã thu hồi';
                return (
                  <tr key={p.penaltyId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{p.sellerName ?? 'Không rõ'}</p>
                      <p className="text-[11px] text-outline">{p.sellerEmail ?? p.sellerId.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      {p.escrowReleasedAtStrike && (
                        <p className="mt-1 text-[10px] text-rose-300">Ký quỹ đã giải ngân khi phạt</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {p.sessionsUsed}/{p.sessionsTotal}
                      {p.surchargePercent != null && (
                        <span className="ml-1 text-amber-300">· {p.surchargePercent}%</span>
                      )}
                      {p.banUntil && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-rose-300">
                          <Ban size={10} /> tới {formatDate(p.banUntil)}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-on-surface-variant">
                      <p className="line-clamp-2">{p.reason ?? '—'}</p>
                      {p.revokedAt && (
                        <p className="mt-1 text-[10px] text-rose-300">
                          Đã thu hồi: {p.revokeReason ?? '—'} ({p.revokedByAdminName ?? 'N/A'})
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 font-semibold ${
                          isActive
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                            : 'border-white/15 bg-white/5 text-outline'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/auctions/${p.sourceAuctionId}`}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-outline hover:text-white"
                        >
                          Phiên gốc
                        </Link>
                        {p.status !== 'Revoked' && (
                          <button
                            type="button"
                            onClick={() => openRevoke(p)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/25"
                          >
                            <Undo2 size={12} /> Thu hồi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cursor && !loading && (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void load(cursor)}
            className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-brand-navy disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Tải thêm án phạt'}
          </button>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#1F2335] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/15 text-rose-300">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-h1 text-base font-bold">Thu hồi án phạt L{revokeTarget.strikeLevel}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {revokeTarget.sellerName ?? 'Người bán'} · {revokeTarget.sellerEmail ?? revokeTarget.sellerId.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="text-outline hover:text-white"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-on-surface-variant">
              <p>
                <strong className="text-white">Lý do ghi nhận:</strong> {revokeTarget.reason ?? '—'}
              </p>
              <p className="mt-1">
                <strong className="text-white">Phụ phí:</strong> {revokeTarget.surchargePercent ?? 0}% trong{' '}
                {revokeTarget.sessionsTotal} phiên · đã dùng {revokeTarget.sessionsUsed}
              </p>
            </div>

            <label className="mt-4 block text-xs">
              <span className="mb-1 block font-semibold">Lý do thu hồi (bắt buộc, lưu vào nhật ký)</span>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={4}
                maxLength={MAX_REVOKE_REASON}
                placeholder="Ví dụ: Khiếu nại đã được phân xử lại, bằng chứng bưu cục cho thấy người bán gửi hàng đúng hạn."
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-right text-[10px] text-outline">
                {revokeReason.length}/{MAX_REVOKE_REASON}
              </span>
            </label>

            {revokeError && (
              <p className="mt-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {revokeError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-outline hover:text-white"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => void submitRevoke()}
                disabled={revoking}
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
              >
                {revoking ? <LoaderCircle size={13} className="animate-spin" /> : <Undo2 size={13} />}
                {revoking ? 'Đang thu hồi…' : 'Xác nhận thu hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
