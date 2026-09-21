'use client';

import { useState } from 'react';
import { BadgePercent, CheckCircle2, CircleAlert, RefreshCw, Ticket, X } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { VoucherRedeemedDto, VoucherValidationDto } from '../types/payment.types';

interface VoucherApplyPanelProps {
  /** Loại giao dịch áp mã — khớp `RefType` backend ghi vào VoucherRedemption. */
  refType?: string;
  /** Mã giao dịch (commission/đơn). Có mã mới bấm được "Áp dụng". */
  refId?: string;
  /** Số tiền đang thanh toán — dùng để kiểm tra điều kiện đơn tối thiểu. */
  orderAmount?: number;
  /** Cho phép nhập tay số tiền + mã giao dịch (dùng khi chưa có màn checkout ghép sẵn). */
  allowManualInput?: boolean;
  /** Gọi sau khi áp mã thành công để màn cha trừ tiền và chuyển bước. */
  onApplied?: (result: VoucherRedeemedDto) => void;
}

function formatVnd(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

/**
 * Ô nhập & áp mã giảm giá ở bước thanh toán (SCR-50).
 *
 * Hai bước tách biệt có chủ đích:
 *   1. "Kiểm tra mã" gọi `/vouchers/validate` — CHỈ ĐỌC, không tiêu lượt.
 *   2. "Áp dụng mã" gọi `/vouchers/redeem` — tiêu 1 lượt, idempotent theo (refType, refId).
 * Nhờ vậy người dùng thử vài mã cũng không làm cháy lượt của voucher.
 */
export function VoucherApplyPanel({
  refType = 'Commission',
  refId,
  orderAmount = 0,
  allowManualInput = false,
  onApplied,
}: VoucherApplyPanelProps) {
  const [code, setCode] = useState('');
  const [amountInput, setAmountInput] = useState(orderAmount > 0 ? String(orderAmount) : '');
  const [refIdInput, setRefIdInput] = useState(refId ?? '');
  const [validation, setValidation] = useState<VoucherValidationDto | null>(null);
  const [redeemed, setRedeemed] = useState<VoucherRedeemedDto | null>(null);
  const [busy, setBusy] = useState<'validate' | 'redeem' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveRefId = (refId || refIdInput).trim();
  const effectiveAmount = allowManualInput ? Number(amountInput) || 0 : orderAmount;

  function reset() {
    setValidation(null);
    setRedeemed(null);
    setError(null);
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setBusy('validate');
    setError(null);
    setRedeemed(null);
    try {
      setValidation(await paymentService.validateVoucher(code.trim(), effectiveAmount, refType, effectiveRefId || undefined));
    } catch (err: unknown) {
      setValidation(null);
      setError(err instanceof Error ? err.message : 'Không kiểm tra được mã giảm giá.');
    } finally {
      setBusy(null);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || !effectiveRefId) return;

    setBusy('redeem');
    setError(null);
    try {
      const result = await paymentService.redeemVoucher(code.trim(), refType, effectiveRefId, effectiveAmount);
      setRedeemed(result);
      onApplied?.(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không áp dụng được mã giảm giá.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="glass-container rounded-3xl border border-white/10 p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BadgePercent size={18} className="text-brand-periwinkle" aria-hidden="true" />
        <h2 className="font-h1 text-base font-bold">Mã giảm giá cho thanh toán</h2>
      </div>

      <form onSubmit={handleValidate} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="voucher-apply-code" className="mb-1.5 block text-xs text-on-surface-variant">
            Mã giảm giá
          </label>
          <input
            id="voucher-apply-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              reset();
            }}
            placeholder="VD: DILLU50"
            className="w-full rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-2.5 font-mono text-sm uppercase text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
          />
        </div>

        {allowManualInput && (
          <>
            <div className="w-40">
              <label htmlFor="voucher-apply-amount" className="mb-1.5 block text-xs text-on-surface-variant">
                Số tiền đơn
              </label>
              <input
                id="voucher-apply-amount"
                type="number"
                min={0}
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  reset();
                }}
                placeholder="0"
                className="w-full rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
              />
            </div>

            <div className="w-56">
              <label htmlFor="voucher-apply-ref" className="mb-1.5 block text-xs text-on-surface-variant">
                Mã giao dịch (commission)
              </label>
              <input
                id="voucher-apply-ref"
                type="text"
                value={refIdInput}
                onChange={(e) => {
                  // KHÔNG xoá kết quả kiểm tra khi đổi mã giao dịch: số tiền giảm không phụ thuộc
                  // mã giao dịch, mà xoá đi sẽ làm nút "Áp dụng mã" biến mất ngay sau khi kiểm tra.
                  // `/vouchers/redeem` tự kiểm tra lại mã trước khi tiêu lượt nên vẫn an toàn.
                  setRefIdInput(e.target.value);
                }}
                placeholder="GUID của đơn đặt vẽ"
                className="w-full rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-2.5 font-mono text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!code.trim() || busy !== null}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
        >
          {busy === 'validate' ? <RefreshCw size={15} className="animate-spin" /> : <Ticket size={15} />}
          Kiểm tra mã
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          <CircleAlert size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {validation && !redeemed && (
        <div
          className={`mt-4 rounded-2xl border p-4 text-xs ${
            validation.isValid
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          {validation.isValid ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                Giảm <strong>{formatVnd(validation.discountAmount)}</strong> · còn phải trả{' '}
                <strong>{formatVnd(validation.finalAmount)}</strong>
              </span>
              <button
                type="button"
                onClick={handleRedeem}
                disabled={!effectiveRefId || busy !== null}
                title={effectiveRefId ? 'Ghi nhận dùng mã cho giao dịch này' : 'Cần mã giao dịch để áp dụng'}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-periwinkle px-4 py-2 font-semibold text-brand-navy hover:brightness-110 disabled:opacity-50"
              >
                {busy === 'redeem' ? <RefreshCw size={13} className="animate-spin" /> : <BadgePercent size={13} />}
                Áp dụng mã
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <X size={15} /> {validation.reason || 'Mã giảm giá không dùng được cho giao dịch này.'}
            </span>
          )}
        </div>
      )}

      {redeemed && (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          <CheckCircle2 size={15} />
          Đã áp mã <strong className="font-mono">{redeemed.voucherCode}</strong> · giảm{' '}
          <strong>{formatVnd(redeemed.discountAmount)}</strong> · thanh toán{' '}
          <strong>{formatVnd(redeemed.finalAmount)}</strong>
        </div>
      )}

      {!effectiveRefId && (
        <p className="mt-3 text-[11px] text-outline">
          Mã chỉ được ghi nhận khi có mã giao dịch (commission) — màn thanh toán Brief sẽ truyền mã này vào.
        </p>
      )}
    </section>
  );
}
