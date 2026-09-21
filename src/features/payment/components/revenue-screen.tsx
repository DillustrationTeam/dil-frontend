'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Calendar, CircleAlert, DollarSign, Download, Layers, PieChart, RefreshCw, TrendingUp } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { RevenueBreakdownDto, RevenuePointDto, RevenueSnapshotDto, RevenueSummaryDto } from '../types/payment.types';
import { AccountPageFooter, AccountPageHeading, AccountShell } from './account-shell';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function RevenueScreen({ userId }: { userId: string | null }) {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [summary, setSummary] = useState<RevenueSummaryDto | null>(null);
  const [timeseries, setTimeseries] = useState<RevenuePointDto[]>([]);
  const [breakdown, setBreakdown] = useState<RevenueBreakdownDto[]>([]);
  const [snapshots, setSnapshots] = useState<RevenueSnapshotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const toDate = new Date();
      const fromDate = new Date(Date.now() - rangeDays * 86400000);
      const fromStr = fromDate.toISOString().slice(0, 10);
      const toStr = toDate.toISOString().slice(0, 10);

      const [sRes, tRes, bRes, snRes] = await Promise.all([
        paymentService.summary(fromStr, toStr).catch(() => ({ grossAmount: 0, feeAmount: 0, netAmount: 0, completedOrderCount: 0, averageOrderValue: 0 })),
        paymentService.timeseries(fromStr, toStr, rangeDays > 60 ? 'month' : 'day').catch(() => []),
        paymentService.breakdown(fromStr, toStr).catch(() => []),
        paymentService.snapshots('All', fromStr, toStr).catch(() => ({ items: [], nextCursor: null })),
      ]);

      setSummary(sRes);
      setTimeseries(tRes);
      setBreakdown(bRes);
      setSnapshots(snRes.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [rangeDays, userId]);

  return (
    <AccountShell active="revenue">
      <AccountPageHeading
        breadcrumb="Doanh thu"
        title="Thống kê doanh thu"
        description="Theo dõi thu nhập từ nhận vẽ tranh kỹ thuật số và bán tranh qua các phiên đấu giá."
        actions={
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  rangeDays === d
                    ? 'bg-brand-periwinkle text-brand-navy'
                    : 'border border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10'
                }`}
              >
                {d} ngày qua
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-outline hover:text-white"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Thẻ chỉ số tổng quan */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-container rounded-3xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-brand-periwinkle">
            <span className="font-semibold">Thu nhập thực nhận</span>
            <DollarSign size={16} />
          </div>
          <p className="font-h1 text-2xl font-bold text-brand-periwinkle">
            {formatVnd(summary?.netAmount ?? 0)}
          </p>
          <span className="mt-1 block text-xs text-outline">Đã khấu trừ phí nền tảng</span>
        </div>

        <div className="glass-container rounded-3xl border border-white/10 p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tổng doanh thu gộp</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="font-h1 text-2xl font-bold text-on-surface">
            {formatVnd(summary?.grossAmount ?? 0)}
          </p>
          <span className="mt-1 block text-xs text-outline">Tổng giá trị đơn hàng</span>
        </div>

        <div className="glass-container rounded-3xl border border-white/10 p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Đơn hoàn tất</span>
            <BarChart3 size={16} className="text-sky-400" />
          </div>
          <p className="font-h1 text-2xl font-bold text-on-surface">
            {summary?.completedOrderCount ?? 0}
          </p>
          <span className="mt-1 block text-xs text-outline">Hợp đồng và phiên đấu giá</span>
        </div>

        <div className="glass-container rounded-3xl border border-white/10 p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Giá trị trung bình mỗi đơn</span>
            <Layers size={16} className="text-amber-400" />
          </div>
          <p className="font-h1 text-2xl font-bold text-on-surface">
            {formatVnd(summary?.averageOrderValue ?? 0)}
          </p>
          <span className="mt-1 block text-xs text-outline">Trung bình trên đơn hàng</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Biểu đồ chuỗi thời gian */}
        <section className="glass-container rounded-3xl border border-white/10 p-6 lg:col-span-2">
          <h2 className="mb-4 font-h1 text-base font-bold">Biến động doanh thu theo thời gian</h2>
          {timeseries.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-outline">
              Chưa có dữ liệu giao dịch trong khoảng thời gian này.
            </div>
          ) : (
            <div className="space-y-3">
              {timeseries.map((pt, i) => (
                <div key={i} className="flex items-center gap-4 text-xs">
                  <span className="w-24 shrink-0 font-mono text-outline">{pt.periodLabel}</span>
                  <div className="flex-1">
                    <div className="h-4 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-brand-periwinkle"
                        style={{
                          width: `${Math.min(100, Math.max(8, ((pt.netAmount || 0) / (summary?.netAmount || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-28 text-right font-mono font-bold text-brand-periwinkle">
                    {formatVnd(pt.netAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cơ cấu nguồn thu */}
        <section className="glass-container rounded-3xl border border-white/10 p-6">
          <h2 className="mb-4 font-h1 text-base font-bold">Cơ cấu nguồn thu</h2>
          {breakdown.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-outline">
              Chưa có phân loại nguồn thu.
            </div>
          ) : (
            <div className="space-y-4">
              {breakdown.map((b) => (
                <div key={b.key} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">
                      {b.label === 'Commission' ? 'Vẽ tranh theo yêu cầu' : b.label === 'Auction' ? 'Đấu giá tác phẩm' : b.label}
                    </span>
                    <span className="font-mono text-outline">{b.orderCount} đơn</span>
                  </div>
                  <p className="mt-2 font-h1 text-lg font-bold text-brand-periwinkle">
                    {formatVnd(b.netAmount)}
                  </p>
                  <p className="text-[11px] text-outline">Doanh thu gộp: {formatVnd(b.grossAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Danh sách bản chụp sao lưu doanh thu (Snapshots) */}
      <section className="glass-container mt-8 rounded-3xl border border-white/10 p-6">
        <h2 className="mb-4 font-h1 text-base font-bold">Lịch sử kết toán doanh thu định kỳ</h2>
        {snapshots.length === 0 ? (
          <p className="text-center text-sm text-outline">Chưa có bản ghi kết toán nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-outline">
                <tr>
                  <th className="pb-3">Ngày kết toán</th>
                  <th className="pb-3">Phạm vi</th>
                  <th className="pb-3 text-right">Doanh thu gộp</th>
                  <th className="pb-3 text-right">Phí sàn</th>
                  <th className="pb-3 text-right">Thực nhận</th>
                  <th className="pb-3 text-right">Số đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {snapshots.map((s) => (
                  <tr key={s.revenueSnapshotId} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-on-surface">{new Date(s.snapshotDate).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 text-on-surface-variant">{s.scope}</td>
                    <td className="py-3 text-right text-on-surface">{formatVnd(s.grossAmount)}</td>
                    <td className="py-3 text-right text-outline">{formatVnd(s.feeAmount)}</td>
                    <td className="py-3 text-right font-bold text-brand-periwinkle">{formatVnd(s.netAmount)}</td>
                    <td className="py-3 text-right text-on-surface">{s.completedOrderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountPageFooter right="Doanh thu tác giả" />
    </AccountShell>
  );
}
