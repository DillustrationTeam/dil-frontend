'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SlidersHorizontal, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { walletTransactionLabels, type WalletTransactionFilters, type WalletTransactionType } from '../types/wallet.types';
import { useLanguage } from '@/context/language-context';

/** Nhãn loại giao dịch theo ngôn ngữ (giá trị gửi API vẫn là key tiếng Anh). */
const WALLET_TYPE_LABELS_EN: Record<WalletTransactionType, string> = {
  Deposit: 'Deposit',
  EscrowHold: 'Escrow hold',
  EscrowRelease: 'Escrow release',
  EscrowReceive: 'Escrow received',
  Refund: 'Refund',
  RefundFromHold: 'Refund from hold',
  Payout: 'Payout',
  PlatformFee: 'Platform fee',
  Adjustment: 'Adjustment',
};

const dateSchema = z.string().refine(
  (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))),
  'Ngày không hợp lệ.',
);
const filterSchema = z.object({
  walletTxType: z.string().refine((value) => !value || Object.hasOwn(walletTransactionLabels, value), 'Chọn loại giao dịch hợp lệ.'),
  direction: z.enum(['', 'In', 'Out']),
  from: dateSchema,
  to: dateSchema,
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
  path: ['to'],
});

const defaults = { walletTxType: '', direction: '' as const, from: '', to: '' };
const inputClass = 'mt-2 h-11 w-full rounded-xl border border-[#221E1A]/10 bg-brand-navy px-3 text-sm text-on-surface outline-none focus:border-brand-periwinkle focus:ring-2 focus:ring-brand-periwinkle/30 disabled:opacity-50 [color-scheme:dark]';

export function WalletFilters({ disabled, onApply }: {
  disabled: boolean;
  onApply: (filters: WalletTransactionFilters) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: defaults,
  });
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <form onSubmit={handleSubmit((values) => onApply({
      walletTxType: values.walletTxType ? values.walletTxType as WalletTransactionType : undefined,
      direction: values.direction || undefined,
      from: values.from ? `${values.from}T00:00:00+07:00` : undefined,
      to: values.to ? `${values.to}T23:59:59.999+07:00` : undefined,
    }))} className="border-y border-[#221E1A]/10 px-5 py-5 md:px-7" aria-label={isVie ? 'Lọc giao dịch' : 'Filter transactions'}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
        <label className="text-xs font-medium text-on-surface-variant" htmlFor="wallet-type"> {isVie ? 'Loại giao dịch' : 'Transaction type'} <select id="wallet-type" className={inputClass} {...register('walletTxType')} disabled={disabled}>
            <option value="">{isVie ? 'Tất cả giao dịch' : 'All transactions'}</option>
            {Object.entries(walletTransactionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {isVie ? label : WALLET_TYPE_LABELS_EN[value as WalletTransactionType]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-on-surface-variant" htmlFor="wallet-direction"> {isVie ? 'Chiều giao dịch' : 'Direction'} <select id="wallet-direction" className={inputClass} {...register('direction')} disabled={disabled}>
            <option value="">{isVie ? 'Tiền vào & tiền ra' : 'Money in & money out'}</option>
            <option value="In">{isVie ? 'Tiền vào' : 'Money in'}</option>
            <option value="Out">{isVie ? 'Tiền ra' : 'Money out'}</option>
          </select>
        </label>
        <label className="text-xs font-medium text-on-surface-variant" htmlFor="wallet-from"> {isVie ? 'Từ ngày' : 'From date'} <input id="wallet-from" type="date" className={inputClass} {...register('from')} disabled={disabled} aria-invalid={Boolean(errors.from)} aria-describedby={errors.from ? 'wallet-from-error' : undefined} />
        </label>
        <label className="text-xs font-medium text-on-surface-variant" htmlFor="wallet-to"> {isVie ? 'Đến ngày' : 'To date'} <input id="wallet-to" type="date" className={inputClass} {...register('to')} disabled={disabled} aria-invalid={Boolean(errors.to)} aria-describedby={errors.to ? 'wallet-to-error' : undefined} />
        </label>
        <button type="submit" disabled={disabled} className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-brand-periwinkle px-5 text-sm font-bold text-[#FFFCF6] hover:bg-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-periwinkle disabled:opacity-50">
          <SlidersHorizontal size={16} aria-hidden="true" /> {isVie ? 'Áp dụng' : 'Apply'} </button>
      </div>
      {errors.from && <p role="alert" id="wallet-from-error" className="mt-3 text-sm text-brand-periwinkle">{errors.from.message}</p>}
      {errors.to && <p role="alert" id="wallet-to-error" className="mt-3 text-sm text-brand-periwinkle">{errors.to.message}</p>}
      {errors.walletTxType && <p role="alert" className="mt-3 text-sm text-brand-periwinkle">{errors.walletTxType.message}</p>}
      <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs text-outline">
        <span>{isVie ? 'Ngày giao dịch theo giờ Việt Nam (GMT+7).' : 'Transaction dates in Vietnam Time (GMT+7).'}</span>
        {isDirty && <button type="button" disabled={disabled} onClick={() => { reset(defaults); onApply({}); }} className="flex items-center gap-1.5 rounded text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-brand-periwinkle">
          <X size={14} aria-hidden="true" /> {isVie ? 'Xóa bộ lọc' : 'Clear filters'} </button>}
      </div>
    </form>
  );
}
