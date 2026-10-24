import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AuctionBidConflictDto,
  AuctionCertificateDto,
  AuctionDetailDto,
  AuctionFilters,
  AuctionListItemDto,
  AuctionPage,
  AuctionRequest,
  AuctionSettlementDto,
  BidDto,
  CommercialRightsDeedDto,
  DeliverableDownloadDto,
  EligibleArtworkDto,
  MyActiveBidDto,
  MyActiveBidsMeta,
  MyCollectionItemDto,
  ArtworkProvenanceDto,
  SellerStatisticsDto,
  WalletOverviewDto,
} from '../types/auction.types';

export class AuctionConflictError extends Error {
  conflictData: AuctionBidConflictDto;

  constructor(message: string, conflictData: AuctionBidConflictDto) {
    super(message);
    this.name = 'AuctionConflictError';
    this.conflictData = conflictData;
  }
}

type ErrorBody = {
  detail?: string;
  title?: string;
  message?: string;
  details?: string[];
  code?: string;
  errors?: Record<string, string[]> | string[];
};

export function auctionError(error: unknown): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  const body = (responseData as { error?: ErrorBody } & ErrorBody) ?? null;
  const info = body?.error ?? body;

  if (info?.errors) {
    if (Array.isArray(info.errors) && info.errors.length > 0) {
      return info.errors.join(' · ');
    }
    if (typeof info.errors === 'object' && info.errors !== null) {
      const messages = Object.values(info.errors).flat();
      if (messages.length > 0) return messages.join(' · ');
    }
  }

  if (Array.isArray(info?.details) && info.details.length > 0) {
    return info.details.join(' · ');
  }

  return (
    info?.detail ||
    info?.message ||
    info?.title ||
    (error instanceof Error && error.message !== 'Network Error'
      ? error.message
      : 'Không kết nối được với máy chủ hoặc phiên đấu giá bị gián đoạn. Vui lòng thử lại.')
  );
}

export function extractAuctionFieldErrors(error: unknown): Record<string, string> {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  const body = (responseData as { error?: ErrorBody } & ErrorBody) ?? null;
  const info = body?.error ?? body;
  const result: Record<string, string> = {};

  if (info?.errors && typeof info.errors === 'object' && !Array.isArray(info.errors)) {
    for (const [key, msgs] of Object.entries(info.errors)) {
      if (Array.isArray(msgs) && msgs.length > 0) {
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        result[normalizedKey] = msgs[0];
      }
    }
  }
  return result;
}

async function call<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
  params?: object,
  signal?: AbortSignal,
): Promise<{ data: T; meta: Record<string, unknown> | null; serverTime?: string }> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, signal, timeout: 30000 });
    const dateHeader = response.headers?.date;
    const serverTime = dateHeader ? new Date(dateHeader).toISOString() : undefined;

    if (response.data.error) throw { response: { data: response.data } };
    if (response.data.data === null) throw new Error('Máy chủ chưa trả dữ liệu đấu giá.');

    return {
      data: response.data.data,
      meta: (response.data.meta as Record<string, unknown>) ?? null,
      serverTime,
    };
  } catch (error: unknown) {
    const errObj = error as { response?: { status?: number; data?: { data?: AuctionBidConflictDto; error?: ErrorBody } } };
    if (errObj?.response?.status === 409 && errObj?.response?.data?.data) {
      const conflictData = errObj.response.data.data;
      const msg = auctionError(error);
      throw new AuctionConflictError(msg, conflictData);
    }
    throw new Error(auctionError(error));
  }
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
  const nextCursor =
    typeof r.meta?.nextCursor === 'string'
      ? r.meta.nextCursor
      : isRecord(raw) && typeof raw.nextCursor === 'string'
        ? raw.nextCursor
        : null;
  const total =
    typeof r.meta?.total === 'number'
      ? r.meta.total
      : isRecord(raw) && typeof raw.total === 'number'
        ? raw.total
        : null;
  return { items, nextCursor, total };
}

export const auctionService = {
  list: (filters: AuctionFilters, cursor?: string, signal?: AbortSignal) =>
    list<AuctionListItemDto>('/auctions', { ...filters, cursor, limit: 12 }, signal),

  detail: async (id: string, signal?: AbortSignal): Promise<{ auction: AuctionDetailDto; recentBids: BidDto[] }> => {
    const res = await call<{ auction: AuctionDetailDto; recentBids: BidDto[] }>('get', `/auctions/${id}`, undefined, { recentBids: 10 }, signal);
    return {
      ...res.data,
      auction: {
        ...res.data.auction,
        serverTime: res.serverTime,
      },
    };
  },

  bids: (id: string, cursor?: string, signal?: AbortSignal) => list<BidDto>(`/auctions/${id}/bids`, { cursor, limit: 10 }, signal),

  bid: (id: string, amount: number, isAuto: boolean, maxAutoBid?: number) =>
    call<{ bid: BidDto; wallet: { balance: number; lockedBalance: number } }>('post', `/auctions/${id}/bids`, { amount, isAuto, maxAutoBid }).then(
      (r) => r.data,
    ),

  watch: (id: string, watching: boolean) => call<{ isWatching: boolean }>(watching ? 'post' : 'delete', `/auctions/${id}/watch`).then((r) => r.data),

  buyNow: (id: string) =>
    call<{ auction: { auctionId: string; auctionStatus: string }; paymentOrderId: string | null; paymentDeadline: string | null }>(
      'post',
      `/auctions/${id}/buy-now`,
    ).then((r) => r.data),

  create: (values: AuctionRequest) => call<{ auctionId: string }>('post', '/auctions', values).then((r) => r.data),

  update: (id: string, values: Partial<AuctionRequest>) => call<{ auctionId: string }>('put', `/auctions/${id}`, values).then((r) => r.data),

  cancel: (id: string, reason: string) => call<{ message: string }>('delete', `/auctions/${id}`, undefined, { reason }).then((r) => r.data),

  settlement: (id: string, signal?: AbortSignal) => call<AuctionSettlementDto>('get', `/auctions/${id}/settlement`, undefined, undefined, signal).then((r) => r.data),

  settle: (id: string, force = false) => call<AuctionSettlementDto>('post', `/auctions/${id}/settle`, { force }).then((r) => r.data),

  download: (id: string) => call<DeliverableDownloadDto>('post', `/auctions/${id}/settlement/download-url`).then((r) => r.data),

  getCertificate: (id: string, signal?: AbortSignal) =>
    call<AuctionCertificateDto>('get', `/auctions/${id}/certificate`, undefined, undefined, signal).then((r) => r.data),

  getMyCollection: (signal?: AbortSignal): Promise<MyCollectionItemDto[]> =>
    call<MyCollectionItemDto[]>('get', '/auctions/my-collection', undefined, undefined, signal).then((r) => r.data),

  getProvenance: (artworkId: string, signal?: AbortSignal): Promise<ArtworkProvenanceDto> =>
    call<ArtworkProvenanceDto>('get', `/auctions/artworks/${artworkId}/provenance`, undefined, undefined, signal).then((r) => r.data),

  getCommercialRights: (auctionId: string, signal?: AbortSignal): Promise<CommercialRightsDeedDto> =>
    call<CommercialRightsDeedDto>('get', `/auctions/${auctionId}/commercial-rights`, undefined, undefined, signal).then((r) => r.data),

  getMyActiveBids: async (
    cursor?: string,
    limit = 12,
    signal?: AbortSignal,
  ): Promise<{ items: MyActiveBidDto[]; meta: MyActiveBidsMeta }> => {
    const res = await call<MyActiveBidDto[]>('get', '/auctions/my-active-bids', undefined, { cursor, limit }, signal);
    const meta: MyActiveBidsMeta = {
      nextCursor: typeof res.meta?.nextCursor === 'string' ? res.meta.nextCursor : null,
      count: typeof res.meta?.count === 'number' ? res.meta.count : 0,
      totalLockedAmount: typeof res.meta?.totalLockedAmount === 'number' ? res.meta.totalLockedAmount : 0,
    };
    return { items: res.data ?? [], meta };
  },

  getEligibleArtworks: async (
    cursor?: string,
    limit = 12,
    signal?: AbortSignal,
  ): Promise<{ items: EligibleArtworkDto[]; nextCursor: string | null }> => {
    const res = await call<EligibleArtworkDto[]>('get', '/auctions/eligible-artworks', undefined, { cursor, limit }, signal);
    const nextCursor = typeof res.meta?.nextCursor === 'string' ? res.meta.nextCursor : null;
    return { items: res.data ?? [], nextCursor };
  },

  getSellerStatistics: (creatorId: string, signal?: AbortSignal): Promise<SellerStatisticsDto> =>
    call<SellerStatisticsDto>('get', `/creator-profiles/${creatorId}/statistics`, undefined, undefined, signal).then((r) => r.data),

  getWallet: (signal?: AbortSignal): Promise<WalletOverviewDto> =>
    call<WalletOverviewDto>('get', '/wallets/me', undefined, undefined, signal).then((r) => r.data),

  uploadMasterPack: async (file: File): Promise<{ fileUrl: string; fileName: string; fileSizeBytes: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ fileUrl: string; fileName: string; fileSizeBytes: number }>>(
      '/auctions/upload-master-pack',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!res.data.data) {
      throw new Error(res.data.error?.detail || 'Không thể tải lên file gốc.');
    }
    return res.data.data;
  },
};

