export const auctionStatusLabels: Record<string, string> = {
  Scheduled: 'Sắp diễn ra',
  Active: 'Đang diễn ra',
  Ended: 'Đã kết thúc',
  Settled: 'Đã chốt',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn thanh toán',
};

export interface AuctionArtworkDto {
  artworkId: string;
  artworkTitle: string;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  style: string | null;
  createdAt?: string | null;
  resolution?: string | null;
  fileSizeBytes?: number | null;
  fileFormat?: string | null;
  deliverableCount?: number;
  hasMasterFilePack?: boolean;
}

export interface AuctionListItemDto {
  auctionId: string;
  artwork: AuctionArtworkDto | null;
  currentPrice: number;
  bidCount: number;
  startAt: string;
  endAt: string;
  auctionStatus: string;
  watchCount: number;
}

export interface AuctionDetailDto extends AuctionListItemDto {
  seller: {
    userId: string;
    fullName: string | null;
    creatorProfileId?: string | null;
  } | null;
  startPrice: number;
  reservePrice: number | null;
  bidStep: number;
  buyNowPrice: number | null;
  winnerId: string | null;
  leadingBidderId: string | null;
  startAt: string;
  paymentDeadline: string | null;
  isWatching: boolean;
  serverTime?: string;
  participants: AuctionParticipantDto[];
}

export interface AuctionParticipantDto {
  userId: string;
  fullName: string | null;
  role: 'Seller' | 'Bidder' | string;
  highestBid: number | null;
  bidCount: number;
}

export interface BidDto {
  bidId: string;
  bidderId: string;
  bidder: { userId: string; fullName: string | null } | null;
  amount: number;
  holdAmount: number;
  bidStatus: string;
  placedAt: string;
}

export interface AuctionRequest {
  artworkId: string;
  startPrice: number;
  reservePrice?: number | null;
  bidStep: number;
  buyNowPrice?: number | null;
  startAt: string;
  endAt: string;
  masterFileUrl?: string | null;
  masterFileName?: string | null;
  masterFileSizeBytes?: number | null;
}

export interface AuctionFilters {
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  sellerId?: string;
}

export interface AuctionSettlementDto {
  auctionId: string;
  winnerId: string | null;
  finalPrice: number;
  settledAt: string | null;
  paymentOrderStatus: string | null;
  artworkOwnershipId: string | null;
  paymentDeadline: string | null;
  escrowHeldAmount: number | null;
}

export interface AuctionPage<T> {
  items: T[];
  nextCursor: string | null;
  total: number | null;
}

/** Payload trả về khi API đặt giá / auto-bid gặp lỗi 409 Conflict */
export interface AuctionBidConflictDto {
  currentPrice: number;
  minimumNextBid: number;
  endAt: string;
}

export interface EligibleArtworkDto {
  artworkId: string;
  title: string;
  thumbnailUrl: string | null;
  imageUrl: string;
  style: string | null;
}

export interface MyActiveBidDto {
  auctionId: string;
  artworkId: string;
  artworkTitle: string;
  participationStatus: 'Leading' | 'Outbid' | string;
  currentPrice: number;
  minimumNextBid: number;
  endAt: string;
  lockedAmount: number;
  lastBidAt: string;
  lastBidId: string;
}

export interface MyActiveBidsMeta {
  nextCursor: string | null;
  count: number;
  totalLockedAmount: number;
}

export interface SellerStatisticsDto {
  commissionCompletionRate: number;
  successfulAuctionCount: number;
  averageRating: number;
  reviewCount: number;
}

export interface WalletDto {
  walletId: string;
  balance: number;
  lockedBalance: number;
  currency: string;
  walletStatus: string;
}

export interface WalletOverviewDto {
  wallet: WalletDto;
  summary: {
    escrowHeld: number;
    totalWithdrawn: number;
    pendingPayout: number;
  };
}

/** Realtime SignalR Event Payloads */
export interface BidPlacedPayload {
  auctionId: string;
  bid: BidDto;
  currentPrice: number;
  minimumNextBid: number;
  endAt: string;
  auctionStatus: string;
}

export interface AuctionExtendedPayload {
  auctionId: string;
  bidId: string;
  oldEndAt: string;
  endAt: string;
}

export interface AuctionStatusChangedPayload {
  auctionId: string;
  status: string;
  currentPrice: number;
  endAt: string;
}

export interface DeliverableDownloadDto {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  certificateNumber?: string | null;
  licenseType?: string | null;
  artworkImageUrl?: string | null;
  artworkImageDownloadUrl?: string | null;
  artworkTitle?: string | null;
  hasMasterPack?: boolean;
}

export interface AuctionCertificateDto {
  certificateNumber: string;
  auctionId: string;
  artworkId: string;
  artworkTitle: string;
  artworkImageUrl?: string | null;
  style?: string | null;
  creatorId: string;
  creatorName?: string | null;
  ownerId: string;
  ownerName?: string | null;
  finalPrice: number;
  issuedAt: string;
  verificationCode: string;
  digitalSignature: string;
  licenseType: string;
}

export interface MyCollectionItemDto {
  artworkId: string;
  title: string;
  thumbnailUrl: string | null;
  imageUrl: string;
  style: string | null;
  creatorId: string;
  creatorName: string;
  acquiredAt: string;
  auctionId: string | null;
  finalPrice: number | null;
  certificateNumber: string | null;
  hasMasterFile: boolean;
  exclusiveBadge: string;
}

export interface ArtworkProvenanceHistoryItemDto {
  ownerId: string;
  ownerName: string;
  acquiredAt: string;
  releasedAt: string | null;
  transferReason: string;
  auctionId: string | null;
  price: number | null;
  isCurrent: boolean;
}

export interface ArtworkProvenanceDto {
  artworkId: string;
  artworkTitle: string;
  imageUrl: string | null;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  currentOwnerId: string | null;
  currentOwnerName: string | null;
  isCurrentOwnerCollector: boolean;
  exclusiveBadge: string;
  history: ArtworkProvenanceHistoryItemDto[];
}

export interface CommercialRightsDeedDto {
  auctionId: string;
  artworkId: string;
  artworkTitle: string;
  artworkImageUrl?: string | null;
  certificateNumber: string;
  verificationCode: string;
  digitalSignature: string;
  creatorId: string;
  creatorName: string;
  ownerId: string;
  ownerName: string;
  finalPrice: number;
  settledAt: string;
  scopeOfRights: string;
  commercialExploitationAllowed: boolean;
  vtuberAndGameDevAllowed: boolean;
  resellAllowed: boolean;
  moralRightsRetainedByArtist: boolean;
  termsAndConditions: string;
}



