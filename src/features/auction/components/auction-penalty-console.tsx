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
  1: { label: 'L1 · Cảnh cáo', className: 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]' },
  2: { label: 'L2 · Cảnh cáo nặng', className: 'border-[#B24A26]/40 bg-[#B24A26]/10 text-[#B24A26]' },
  3: { label: 'L3 · Phụ phí 20%', className: 'border-[#A8321C]/40 bg-[#A8321C]/10 text-[#A8321C]' },
  4: { label: 'L4 · Phụ phí 30%', className: 'border-[#A8321C]/40 bg-[#A8321C]/15 text-[#A8321C]' },
  5: { label: 'L5 · Khoá bán 30 ngày', className: 'border-[#A8321C]/40 bg-[#A8321C]/20 text-[#A8321C]' },
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
          <p className="mt-1 text-xs text-on-surface-variant"> Thang phạt giao hàng L1–L5 theo Quy chế giao nhận. Thu hồi án phạt khi phán quyết sai — thao tác được lưu vết. </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2 text-xs font-semibold hover:bg-[#F0E7D8]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 p-4 text-sm text-[#2F6B63]">
          <CheckCircle2 size={16} /> {success}
          <button type="button" onClick={() => setSuccess(null)} className="ml-auto text-[#2F6B63] hover:text-[#241F1A]">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs">
        <label className="block">
          <span className="mb-1 block text-outline">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
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
            className="rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
          >
            <option value="">Tất cả</option>
            <option value="3">Từ L3 (có phụ phí)</option>
            <option value="5">L5 (khoá bán)</option>
          </select>
        </label>

        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-3 py-1.5 font-semibold text-[#8A6A1F]">
          <ShieldAlert size={13} /> {activeCount} đang hiệu lực
          {consumedCount > 0 && <span className="text-outline">· {consumedCount} đã chạy xong</span>}
        </span>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-outline">
          <LoaderCircle size={26} className="mx-auto mb-2 animate-spin" /> Đang tải sổ án phạt… </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-outline">
          <Gavel size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có án phạt nào khớp bộ lọc.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6]">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-[#221E1A]/10 text-[11px] uppercase tracking-wide text-outline">
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
                  <tr key={p.penaltyId} className="border-b border-[#221E1A]/10 last:border-0 hover:bg-[#FFFCF6]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{p.sellerName ?? 'Không rõ'}</p>
                      <p className="text-[11px] text-outline">{p.sellerEmail ?? p.sellerId.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      {p.escrowReleasedAtStrike && (
                        <p className="mt-1 text-[10px] text-[#A8321C]">Ký quỹ đã giải ngân khi phạt</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {p.sessionsUsed}/{p.sessionsTotal}
                      {p.surchargePercent != null && (
                        <span className="ml-1 text-[#8A6A1F]">· {p.surchargePercent}%</span>
                      )}
                      {p.banUntil && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#A8321C]">
                          <Ban size={10} /> tới {formatDate(p.banUntil)}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-on-surface-variant">
                      <p className="line-clamp-2">{p.reason ?? '—'}</p>
                      {p.revokedAt && (
                        <p className="mt-1 text-[10px] text-[#A8321C]">
                          Đã thu hồi: {p.revokeReason ?? '—'} ({p.revokedByAdminName ?? 'N/A'})
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 font-semibold ${
                          isActive
                            ? 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]'
                            : 'border-[#221E1A]/10 bg-[#FFFCF6] text-outline'
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
                          className="rounded-full border border-[#221E1A]/10 px-3 py-1.5 text-[11px] font-semibold text-outline hover:text-[#241F1A]"
                        > Phiên gốc </Link>
                        {p.status !== 'Revoked' && (
                          <button
                            type="button"
                            onClick={() => openRevoke(p)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#A8321C]/40 bg-[#A8321C]/15 px-3 py-1.5 text-[11px] font-bold text-[#A8321C] hover:bg-[#A8321C]/20"
                          >
                            <Undo2 size={12} /> Thu hồi </button>
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
            className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Tải thêm án phạt'}
          </button>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#221E1A]/10 bg-[#F7F2E9] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/15 text-[#A8321C]">
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
                className="text-outline hover:text-[#241F1A]"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-3 text-[11px] text-on-surface-variant">
              <p>
                <strong className="text-[#241F1A]">Lý do ghi nhận:</strong> {revokeTarget.reason ?? '—'}
              </p>
              <p className="mt-1">
                <strong className="text-[#241F1A]">Phụ phí:</strong> {revokeTarget.surchargePercent ?? 0}% trong{' '}
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
                className="w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 py-2 text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-right text-[10px] text-outline">
                {revokeReason.length}/{MAX_REVOKE_REASON}
              </span>
            </label>

            {revokeError && (
              <p className="mt-2 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-3 py-2 text-[11px] text-[#A8321C]">
                {revokeError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-[#221E1A]/10 pt-4">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-full border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-outline hover:text-[#241F1A]"
              > Huỷ </button>
              <button
                type="button"
                onClick={() => void submitRevoke()}
                disabled={revoking}
                className="inline-flex items-center gap-2 rounded-full bg-[#A8321C]/12 px-5 py-2 text-xs font-bold text-[#241F1A] hover:brightness-110 disabled:opacity-50"
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
