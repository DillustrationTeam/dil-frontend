import type { AuctionListItemDto } from './auction.types';

/**
 * Personalized Auction Recommendation DTOs.
 *
 * `reason` is produced by the backend in Vietnamese and rendered as-is: the FE never invents a
 * personalisation claim it cannot back with a signal.
 */
export interface RecommendedAuctionDto {
  auction: AuctionListItemDto;
  score: number;
  reason: string;
  signals: string[];
}

export type RecommendationSurface = 'auction-list' | 'detail-similar' | 'my-auctions';

/** What the client actually rendered, so CTR can be joined with the ranking position later. */
export interface RecommendationImpressionItem {
  auctionId: string;
  score?: number;
  rank?: number;
}

export interface RecommendationImpressionPayload {
  items: RecommendationImpressionItem[];
  surface?: RecommendationSurface;
  clicked?: boolean;
}
