import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { getWalletErrorMessage } from './wallet.service';
import type { AdminPayoutFilters, BankAccountDto, BankAccountRequest, PaymentOrderDto, PayoutDto, RevenueBreakdownDto, RevenuePointDto, RevenueSnapshotDto, RevenueSummaryDto, UpdatePayoutStatusRequest, VoucherDetailDto, VoucherDto, VoucherRedeemedDto, VoucherRequest, VoucherValidationDto } from '../types/payment.types';

export interface PaymentPage<T> { items: T[]; nextCursor: string | null }

async function call<T>(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: unknown, params?: object, signal?: AbortSignal) {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, signal, timeout: 30000 });
    if (response.data.error) throw { response: { data: response.data } };
    if (response.data.data === null) throw new Error('Máy chủ chưa trả dữ liệu. Vui lòng thử lại.');
    return { data: response.data.data, meta: response.data.meta };
  } catch (error) { throw new Error(getWalletErrorMessage(error)); }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
async function list<T>(url: string, params: object, signal?: AbortSignal): Promise<PaymentPage<T>> {
  const response = await call<unknown>('get', url, undefined, params, signal);
  const raw = response.data;
  const items: T[] = Array.isArray(raw)
    ? (raw as T[])
    : isRecord(raw) && Array.isArray(raw.items)
      ? (raw.items as T[])
      : [];
  const nextCursor = typeof response.meta?.nextCursor === 'string'
    ? response.meta.nextCursor
    : (isRecord(raw) && typeof raw.nextCursor === 'string' ? raw.nextCursor : null);
  return { items, nextCursor };
}

export const paymentService = {
  createOrder: (amount: number, returnUrl: string, cancelUrl: string) => call<PaymentOrderDto>('post', '/payments/orders', { amount, gateway: 'PayOS', returnUrl, cancelUrl }).then(r => r.data),
  order: (id: string, signal?: AbortSignal) => call<PaymentOrderDto>('get', `/payments/orders/${id}`, undefined, undefined, signal).then(r => r.data),
  orders: (cursor?: string, signal?: AbortSignal) => list<PaymentOrderDto>('/payments/orders', { cursor, limit: 10 }, signal),
  banks: (signal?: AbortSignal) => call<BankAccountDto[]>('get', '/bank-accounts', undefined, undefined, signal).then(r => r.data),
  saveBank: (values: BankAccountRequest, id?: string) => call<BankAccountDto>(id ? 'put' : 'post', id ? `/bank-accounts/${id}` : '/bank-accounts', values).then(r => r.data),
  deleteBank: (id: string) => call<{ message: string }>('delete', `/bank-accounts/${id}`).then(r => r.data),
  payouts: (cursor?: string, signal?: AbortSignal) => list<PayoutDto>('/payout-requests', { cursor, limit: 10 }, signal),
  adminPayouts: (filters: AdminPayoutFilters, signal?: AbortSignal) => list<PayoutDto>('/payout-requests', filters, signal),
  updatePayoutStatus: (id: string, values: UpdatePayoutStatusRequest) => call<PayoutDto>('put', `/payout-requests/${id}/status`, values).then(r => r.data),
  payout: (amount: number, bankAccountId: string, payoutNote: string) => call<PayoutDto>('post', '/payout-requests', { amount, bankAccountId, payoutNote }).then(r => r.data),
  vouchers: (voucherStatus: string, cursor?: string, signal?: AbortSignal) => list<VoucherDto>('/vouchers', { voucherStatus: voucherStatus || undefined, cursor, limit: 10 }, signal),
  voucher: (id: string, signal?: AbortSignal) => call<VoucherDetailDto>('get', `/vouchers/${id}`, undefined, undefined, signal).then(r => r.data),
  saveVoucher: (values: VoucherRequest, id?: string) => call<VoucherDto>(id ? 'put' : 'post', id ? `/vouchers/${id}` : '/vouchers', values).then(r => r.data),
  deleteVoucher: (id: string) => call<{ message: string }>('delete', `/vouchers/${id}`).then(r => r.data),
  validateVoucher: (voucherCode: string, orderAmount: number, refType: string, refId?: string) => call<VoucherValidationDto>('post', '/vouchers/validate', { voucherCode, orderAmount, refType, refId }).then(r => r.data),
  /** Ghi nhận ĐÃ DÙNG voucher — idempotent theo (refType, refId), gọi lại không tiêu thêm lượt. */
  redeemVoucher: (voucherCode: string, refType: string, refId: string, orderAmount: number) => call<VoucherRedeemedDto>('post', '/vouchers/redeem', { voucherCode, refType, refId, orderAmount }).then(r => r.data),
  summary: (from: string, to: string, signal?: AbortSignal) => call<RevenueSummaryDto>('get', '/creator/revenue/summary', undefined, { from, to }, signal).then(r => r.data),
  timeseries: (from: string, to: string, granularity: string, signal?: AbortSignal) => call<RevenuePointDto[]>('get', '/creator/revenue/timeseries', undefined, { from, to, granularity }, signal).then(r => r.data),
  breakdown: (from: string, to: string, signal?: AbortSignal) => call<RevenueBreakdownDto[]>('get', '/creator/revenue/breakdown', undefined, { from, to, groupBy: 'source' }, signal).then(r => r.data),
  snapshots: (scope: string, from: string, to: string, cursor?: string, signal?: AbortSignal) => list<RevenueSnapshotDto>('/creator/revenue/snapshots', {
    /* Backend chỉ nhận Daily/Weekly/Monthly (bỏ trống = lấy tất cả).
       Gửi 'All' hay chuỗi lạ sẽ bị trả 400. */
    scope: scope && scope !== 'All' ? scope : undefined,
    from, to, cursor, limit: 10,
  }, signal),
};
