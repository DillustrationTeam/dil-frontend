import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { auctionError } from './auction.service';
import type {
  AuctionRiskAssessmentDto,
  AuctionRiskAssessmentStatus,
  MyAuctionRiskFlagDto,
  RiskAlertFilters,
  RiskAlertListItemDto,
  RiskAlertPage,
} from '../types/auction-risk.types';

/**
 * Thin wrapper over `AuctionRiskController` (moderation surface of AI Bid Fraud Detection).
 *
 * Every call goes through `apiClient` and unwraps the `{ data, meta, error }` envelope; errors are
 * converted to a Vietnamese message by `auctionError` so components never parse envelopes.
 */
async function call<T>(
  method: 'get' | 'post',
  url: string,
  data?: unknown,
  params?: object,
): Promise<{ data: T; meta: Record<string, unknown> | null }> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, timeout: 20000 });

    if (response.data.error) throw { response: { data: response.data } };
    if (response.data.data === null) throw new Error('Máy chủ chưa trả dữ liệu rủi ro.');

    return {
      data: response.data.data,
      meta: (response.data.meta as Record<string, unknown>) ?? null,
    };
  } catch (error) {
    throw new Error(auctionError(error));
  }
}

export const auctionRiskService = {
  /** Risk queue: highest score first, cursor paginated. */
  async list(filters: RiskAlertFilters = {}): Promise<RiskAlertPage> {
    const { data, meta } = await call<RiskAlertListItemDto[]>('get', '/auctions/risk-alerts', undefined, {
      level: filters.level && filters.level !== 'All' ? filters.level : undefined,
      // Gửi NGUYÊN giá trị, kể cả 'All': backend hiểu 'All' = không lọc. Trước đây FE bỏ 'All'
      // thành undefined nên tab Tất cả chỉ trả về phiếu đang mở.
      status: filters.status ?? undefined,
      cursor: filters.cursor ?? undefined,
      limit: filters.limit ?? 20,
    });

    const nextCursor = typeof meta?.nextCursor === 'string' ? meta.nextCursor : null;

    return {
      items: data ?? [],
      nextCursor,
      hasMore: Boolean(meta?.hasMore) && Boolean(nextCursor),
    };
  },

  /**
   * `assessmentId` pinpoints the exact sheet when one auction has several (dismissed, confirmed,
   * and a newer open one). Without it the API returns the newest sheet of that auction.
   */
  async get(auctionId: string, assessmentId?: string): Promise<AuctionRiskAssessmentDto> {
    const { data } = await call<AuctionRiskAssessmentDto>('get', `/auctions/${auctionId}/risk`, undefined, {
      assessmentId,
    });
    return data;
  },

  async rescan(auctionId: string): Promise<{ score: number; riskLevel: string; signalCount: number }> {
    const { data } = await call<{ score: number; riskLevel: string; signalCount: number }>(
      'post',
      `/auctions/${auctionId}/risk/rescan`,
    );
    return data;
  },

  async review(
    auctionId: string,
    // UnderReview = nhận phiếu, Open = nhả phiếu, Dismissed/Confirmed = quyết định.
    payload: { status: AuctionRiskAssessmentStatus; note?: string },
  ): Promise<AuctionRiskAssessmentDto> {
    const { data } = await call<AuctionRiskAssessmentDto>(
      'post',
      `/auctions/${auctionId}/risk/review`,
      payload,
    );
    return data;
  },

  /** Seller-facing list: neutral, no score, no evidence. */
  async myFlags(): Promise<MyAuctionRiskFlagDto[]> {
    const { data } = await call<MyAuctionRiskFlagDto[]>('get', '/auctions/me/risk-flags');
    return data ?? [];
  },
};
