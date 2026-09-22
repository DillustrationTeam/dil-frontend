export const auctionStatusLabels: Record<string, string> = { Scheduled: 'Sắp diễn ra', Active: 'Đang diễn ra', Ended: 'Đã kết thúc', Settled: 'Đã chốt', Cancelled: 'Đã hủy', Expired: 'Hết hạn thanh toán' };
export interface AuctionArtworkDto { artworkId: string; artworkTitle: string; thumbnailUrl: string | null; imageUrl: string | null; style: string | null }
export interface AuctionListItemDto { auctionId: string; artwork: AuctionArtworkDto | null; currentPrice: number; bidCount: number; endAt: string; auctionStatus: string; watchCount: number }
export interface AuctionDetailDto extends AuctionListItemDto {
  seller: { userId: string; fullName: string | null } | null;
  startPrice: number; reservePrice: number | null; bidStep: number; buyNowPrice: number | null;
  winnerId: string | null; leadingBidderId: string | null; startAt: string; paymentDeadline: string | null; isWatching: boolean;
}
export interface BidDto { bidId: string; bidderId: string; bidder: { userId: string; fullName: string | null } | null; amount: number; holdAmount: number; bidStatus: string; placedAt: string }
export interface AuctionRequest { artworkId: string; startPrice: number; reservePrice?: number | null; bidStep: number; buyNowPrice?: number | null; startAt: string; endAt: string }
export interface AuctionFilters { status?: string; minPrice?: number; maxPrice?: number; sort?: string; sellerId?: string }
export interface AuctionSettlementDto { auctionId: string; winnerId: string | null; finalPrice: number; settledAt: string | null; paymentOrderStatus: string | null; artworkOwnershipId: string | null; paymentDeadline: string | null; escrowHeldAmount: number | null }
export interface AuctionPage<T> { items: T[]; nextCursor: string | null; total: number | null }
