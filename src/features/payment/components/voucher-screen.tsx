'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, Percent, Plus, RefreshCw, Tag, Trash2 } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { VoucherDto, VoucherRequest, VoucherValidationDto } from '../types/payment.types';
import { PageLoader } from '@/features/navigation';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function VoucherScreen({ userId }: { userId: string | null }) {
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab filter: all, active, expired
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Validate voucher
  const [checkCode, setCheckCode] = useState('');
  const [checkAmount, setCheckAmount] = useState('500000');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<VoucherValidationDto | null>(null);

  // Create voucher
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<VoucherRequest>({
    voucherCode: '',
    name: '',
    discountType: 'Percent',
    discountValue: 10,
    minOrderAmount: 100000,
    maxDiscountAmount: 50000,
    scope: ['Commission', 'Auction'],
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    usageLimit: 100,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadVouchers() {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.vouchers(statusFilter);
      setVouchers(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, [statusFilter]);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!checkCode.trim()) return;
    setValidating(true);
    setValidationResult(null);
    setError(null);
    try {
      const res = await paymentService.validateVoucher(checkCode.trim(), Number(checkAmount) || 0, 'Commission');
      setValidationResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không kiểm tra được mã giảm giá.');
    } finally {
      setValidating(false);
    }
  }

  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.voucherCode.trim()) {
      setError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await paymentService.saveVoucher({
        ...createForm,
        voucherCode: createForm.voucherCode.trim().toUpperCase(),
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
      });
      setSuccess('Tạo mã giảm giá thành công!');
      setShowCreate(false);
      setCreateForm({
        voucherCode: '',
        name: '',
        discountType: 'Percent',
        discountValue: 10,
        minOrderAmount: 100000,
        maxDiscountAmount: 50000,
        scope: ['Commission', 'Auction'],
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        usageLimit: 100,
        isActive: true,
      });
      await loadVouchers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tạo mã giảm giá.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      await paymentService.deleteVoucher(id);
      setSuccess('Đã xóa mã giảm giá.');
      await loadVouchers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa mã giảm giá.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-on-surface">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/wallet" className="inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại ví
        </Link>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-5 py-2 font-h1 text-xs font-bold text-brand-navy shadow hover:brightness-110"
        >
          <Plus size={16} /> Tạo mã giảm giá mới
        </button>
      </div>

      <h1 className="mb-2 font-h1 text-2xl font-bold">Trung tâm mã giảm giá</h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        Khám phá mã ưu đãi áp dụng cho đặt tranh hoa hồng nghệ thuật và các phiên đấu giá độc quyền.
      </p>

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form tạo mới voucher */}
      {showCreate && (
        <section className="glass-container mb-8 rounded-3xl border border-brand-periwinkle/30 bg-brand-navy/80 p-6 md:p-8">
          <h2 className="mb-4 font-h1 text-lg font-bold text-brand-periwinkle">Tạo mã ưu đãi mới</h2>
          <form onSubmit={handleCreateVoucher} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Mã giảm giá (viết hoa liền nhau)</label>
              <input
                type="text"
                required
                value={createForm.voucherCode}
                onChange={(e) => setCreateForm({ ...createForm, voucherCode: e.target.value })}
                placeholder="VD: DILCHAOHAY"
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 font-mono uppercase text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Tên chương trình ưu đãi</label>
              <input
                type="text"
                value={createForm.name || ''}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="VD: Chào bạn mới giảm 10%"
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Hình thức giảm</label>
              <select
                value={createForm.discountType}
                onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value as 'Percent' | 'Fixed' })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              >
                <option value="Percent">Theo phần trăm (%)</option>
                <option value="Fixed">Số tiền cố định (₫)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Mức giảm ({createForm.discountType === 'Percent' ? '%' : '₫'})</label>
              <input
                type="number"
                min="1"
                required
                value={createForm.discountValue}
                onChange={(e) => setCreateForm({ ...createForm, discountValue: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 font-bold text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Đơn hàng tối thiểu (₫)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={createForm.minOrderAmount}
                onChange={(e) => setCreateForm({ ...createForm, minOrderAmount: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Giảm tối đa (để trống nếu không giới hạn)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={createForm.maxDiscountAmount ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, maxDiscountAmount: e.target.value ? Number(e.target.value) : null })}
                placeholder="VD: 100000"
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Ngày bắt đầu</label>
              <input
                type="datetime-local"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Ngày kết thúc</label>
              <input
                type="datetime-local"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">Tổng lượt sử dụng</label>
              <input
                type="number"
                min="1"
                value={createForm.usageLimit ?? 100}
                onChange={(e) => setCreateForm({ ...createForm, usageLimit: Number(e.target.value) || null })}
                className="w-full rounded-xl border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
              />
            </div>
            <div className="flex items-end justify-end gap-3 sm:col-span-2 md:col-span-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full px-5 py-2 text-xs font-semibold text-outline hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-periwinkle px-6 py-2 font-h1 text-xs font-bold text-brand-navy shadow"
              >
                {submitting ? 'Đang lưu...' : 'Lưu mã giảm giá'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Khối kiểm tra mã */}
      <section className="glass-container mb-8 rounded-3xl border border-white/10 p-6">
        <h2 className="mb-3 font-h1 text-base font-bold">Thử nghiệm mã giảm giá</h2>
        <form onSubmit={handleValidate} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={checkCode}
            onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã cần kiểm tra (VD: DIL50K)"
            className="rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2 font-mono text-sm uppercase text-on-surface focus:border-brand-periwinkle focus:outline-none"
          />
          <input
            type="number"
            value={checkAmount}
            onChange={(e) => setCheckAmount(e.target.value)}
            placeholder="Giá trị đơn hàng (₫)"
            className="w-44 rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2 text-sm text-on-surface focus:border-brand-periwinkle focus:outline-none"
          />
          <button
            type="submit"
            disabled={validating || !checkCode}
            className="rounded-full bg-white/10 px-5 py-2 font-h1 text-xs font-bold text-on-surface hover:bg-white/15"
          >
            {validating ? 'Đang kiểm tra...' : 'Áp dụng thử'}
          </button>
        </form>

        {validationResult && (
          <div className={`mt-4 rounded-2xl border p-4 text-xs ${
            validationResult.isValid
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
          }`}>
            {validationResult.isValid ? (
              <p>
                Mã hợp lệ! Bạn được giảm <strong>{formatVnd(validationResult.discountAmount)}</strong>. Số tiền cần thanh toán còn <strong>{formatVnd(validationResult.finalAmount)}</strong>.
              </p>
            ) : (
              <p>Không thể áp dụng: {validationResult.reason || 'Mã không hợp lệ hoặc không đủ điều kiện đơn hàng.'}</p>
            )}
          </div>
        )}
      </section>

      {/* Bộ lọc trạng thái */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              statusFilter === '' ? 'bg-brand-periwinkle text-brand-navy' : 'border border-white/10 bg-white/5 text-on-surface-variant'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              statusFilter === 'Active' ? 'bg-brand-periwinkle text-brand-navy' : 'border border-white/10 bg-white/5 text-on-surface-variant'
            }`}
          >
            Đang hiệu lực
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Expired')}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              statusFilter === 'Expired' ? 'bg-brand-periwinkle text-brand-navy' : 'border border-white/10 bg-white/5 text-on-surface-variant'
            }`}
          >
            Hết hạn
          </button>
        </div>
        <button
          type="button"
          onClick={loadVouchers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-white"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Danh sách thẻ voucher */}
      {loading ? (
        <div className="glass-container rounded-3xl border border-white/10">
          <PageLoader label="Đang tải danh sách mã giảm giá…" />
        </div>
      ) : !Array.isArray(vouchers) || vouchers.length === 0 ? (
        <div className="glass-container rounded-3xl border border-white/10 p-12 text-center">
          <Tag size={40} className="mx-auto mb-3 text-outline" />
          <p className="text-on-surface-variant">Hiện chưa có mã giảm giá nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((v) => {
            const isPercent = v.discountType === 'Percent';
            const isExpired = new Date(v.endDate) < new Date();
            return (
              <div
                key={v.voucherId}
                className="glass-container relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-5 transition hover:border-brand-periwinkle/40"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-0.5 font-mono text-xs font-bold text-brand-periwinkle">
                      {v.voucherCode}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      isExpired
                        ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                    }`}>
                      {isExpired ? 'Hết hạn' : 'Đang hoạt động'}
                    </span>
                  </div>
                  <h3 className="font-h1 font-bold text-on-surface">{v.name || `Giảm ${v.discountValue}${isPercent ? '%' : ' ₫'}`}</h3>
                  <p className="mt-1 font-h1 text-xl font-bold text-brand-periwinkle">
                    {isPercent ? `Giảm ${v.discountValue}%` : `Giảm ${formatVnd(v.discountValue)}`}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-outline">
                    <p>Đơn tối thiểu: {formatVnd(v.minOrderAmount)}</p>
                    {v.maxDiscountAmount && <p>Giảm tối đa: {formatVnd(v.maxDiscountAmount)}</p>}
                    <p>Hạn dùng: {new Date(v.endDate).toLocaleDateString('vi-VN')}</p>
                    <p>Đã dùng: {v.usedCount}{v.usageLimit ? ` / ${v.usageLimit}` : ''} lượt</p>
                  </div>
                </div>

                {v.isMine && (
                  <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.voucherId)}
                      className="inline-flex items-center gap-1 text-xs text-outline hover:text-red-300"
                    >
                      <Trash2 size={14} /> Xóa mã
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
