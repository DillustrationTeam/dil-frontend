import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { auctionError } from './auction.service';
import type {
  RecommendationImpressionPayload,
  RecommendedAuctionDto,
} from '../types/auction-recommendation.types';

/**
 * Wrapper over `AuctionRecommendationsController`. Reads are anonymous-friendly (no token ⇒
 * trending), so the rail works for visitors too.
 */
async function call<T>(method: 'get' | 'post', url: string, data?: unknown, params?: object): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, timeout: 20000 });

    if (response.data.error) throw { response: { data: response.data } };

    return response.data.data as T;
  } catch (error) {
    throw new Error(auctionError(error));
  }
}

export const auctionRecommendationService = {
  async recommended(take = 12): Promise<RecommendedAuctionDto[]> {
    const data = await call<RecommendedAuctionDto[]>('get', '/auctions/recommended', undefined, { take });
    return Array.isArray(data) ? data : [];
  },

  async similar(auctionId: string, take = 6): Promise<RecommendedAuctionDto[]> {
    const data = await call<RecommendedAuctionDto[]>('get', `/auctions/${auctionId}/similar`, undefined, { take });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Telemetry only; failures are swallowed by the caller. `items` carries the score/rank each card
   * was rendered with, so a later CTR query can ask "does position 1 actually win?".
   */
  async logImpressions(payload: RecommendationImpressionPayload): Promise<void> {
    if (payload.items.length === 0) return;
    await call<{ recorded: number }>('post', '/auctions/recommendations/impressions', payload);
  },

  async rebuildProfile(): Promise<void> {
    await call('post', '/auctions/recommendations/rebuild-profile');
  },
};
