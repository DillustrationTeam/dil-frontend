import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { AuctionDetailDto, AuctionFilters, AuctionListItemDto, AuctionPage, AuctionRequest, AuctionSettlementDto, BidDto } from '../types/auction.types';

type ErrorBody = { detail?: string; title?: string; message?: string; details?: string[] };
export function auctionError(error: unknown) {
  const body = (error as { response?: { data?: { error?: ErrorBody } & ErrorBody } })?.response?.data;
  const info = body?.error ?? body;
  return info?.detail || info?.message || info?.details?.join(' · ') || info?.title || (error instanceof Error && error.message !== 'Network Error' ? error.message : 'Không kết nối được với máy chủ. Vui lòng thử lại.');
}
async function call<T>(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: unknown, params?: object, signal?: AbortSignal) {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, signal, timeout: 30000 });
    if (response.data.error) throw { response: { data: response.data } };
    if (response.data.data === null) throw new Error('Máy chủ chưa trả dữ liệu đấu giá.');
    return { data: response.data.data, meta: response.data.meta };
  } catch (error) { throw new Error(auctionError(error)); }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
async function list<T>(url: string, params: object, signal?: AbortSignal): Promise<AuctionPage<T>> {
  const r = await call<unknown>('get', url, undefined, params, signal);
  const raw = r.data;
  const items: T[] = Array.isArray(raw)
    ? (raw as T[])
    : isRecord(raw) && Array.isArray(raw.items)
      ? (raw.items as T[])
      : [];
  const nextCursor = typeof r.meta?.nextCursor === 'string'
    ? r.meta.nextCursor
    : (isRecord(raw) && typeof raw.nextCursor === 'string' ? raw.nextCursor : null);
  const total = typeof r.meta?.total === 'number'
    ? r.meta.total
    : (isRecord(raw) && typeof raw.total === 'number' ? raw.total : null);
  return { items, nextCursor, total };
}
export const auctionService = {
  list: (filters: AuctionFilters, cursor?: string, signal?: AbortSignal) => list<AuctionListItemDto>('/auctions', { ...filters, cursor, limit: 12 }, signal),
  detail: (id: string, signal?: AbortSignal) => call<{ auction: AuctionDetailDto; recentBids: BidDto[] }>('get', `/auctions/${id}`, undefined, { recentBids: 10 }, signal).then(r => r.data),
  bids: (id: string, cursor?: string, signal?: AbortSignal) => list<BidDto>(`/auctions/${id}/bids`, { cursor, limit: 10 }, signal),
  bid: (id: string, amount: number, isAuto: boolean, maxAutoBid?: number) => call<{ bid: BidDto; wallet: { balance: number; lockedBalance: number } }>('post', `/auctions/${id}/bids`, { amount, isAuto, maxAutoBid }).then(r => r.data),
  watch: (id: string, watching: boolean) => call<{ isWatching: boolean }>(watching ? 'post' : 'delete', `/auctions/${id}/watch`).then(r => r.data),
  buyNow: (id: string) => call<{ auction: { auctionId: string; auctionStatus: string }; paymentOrderId: string | null; paymentDeadline: string | null }>('post', `/auctions/${id}/buy-now`).then(r => r.data),
  create: (values: AuctionRequest) => call<{ auctionId: string }>('post', '/auctions', values).then(r => r.data),
  update: (id: string, values: Partial<AuctionRequest>) => call<{ auctionId: string }>('put', `/auctions/${id}`, values).then(r => r.data),
  cancel: (id: string, reason: string) => call<{ message: string }>('delete', `/auctions/${id}`, undefined, { reason }).then(r => r.data),
  settlement: (id: string, signal?: AbortSignal) => call<AuctionSettlementDto>('get', `/auctions/${id}/settlement`, undefined, undefined, signal).then(r => r.data),
  settle: (id: string) => call<AuctionSettlementDto>('post', `/auctions/${id}/settle`, { force: false }).then(r => r.data),
  download: (id: string) => call<{ downloadUrl: string; expiresAt: string; fileName: string }>('post', `/auctions/${id}/settlement/download-url`).then(r => r.data),
};
