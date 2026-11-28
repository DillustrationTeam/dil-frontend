/**
 * AI Bid Fraud Detection — DTOs mirroring `AuctionRiskController`.
 *
 * The API also returns a Vietnamese label per level/signal; the FE renders that label and keeps the
 * enum only for styling and filtering. Enum names must never reach the screen.
 */

export type AuctionRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AuctionRiskAssessmentStatus = 'Open' | 'UnderReview' | 'Dismissed' | 'Confirmed';

export type RiskSignalCode =
  | 'SharedDevice'
  | 'SellerLinkedBidder'
  | 'BidVelocity'
  | 'PriceJump'
  | 'PriceLadder'
  | 'NonPaymentHistory'
  | 'WinNoPaymentRate'
  | 'SelfOutbidLoop'
  | 'AutoBidWall'
  | 'NewAccountBurst'
  | 'BidBurstCluster';

export interface RiskSignalDto {
  signalId: string;
  code: RiskSignalCode | string;
  label: string;
  weight: number;
  evidence: string;
  bidId?: string | null;
  userId?: string | null;
  detectedAt: string;
}

export interface AuctionRiskAssessmentDto {
  assessmentId: string;
  auctionId: string;
  auctionTitle: string;
  thumbnailUrl: string | null;
  currentPrice: number;
  score: number;
  riskLevel: AuctionRiskLevel | string;
  riskLevelLabel: string;
  status: AuctionRiskAssessmentStatus | string;
  signalCount: number;
  summary: string;
  detectedAt: string;
  lastRiskScanAt?: string | null;
  claimedByUserId?: string | null;
  claimedByName?: string | null;
  claimedAt?: string | null;
  reviewedByUserId?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  decisionNote?: string | null;
  /** Trạng thái hiện tại của phiên — xác nhận gian lận sẽ huỷ phiên, nên phiếu phải nói được điều đó. */
  auctionStatus?: string | null;
  signals: RiskSignalDto[];
}

export interface RiskAlertListItemDto {
  assessmentId: string;
  auctionId: string;
  auctionTitle: string;
  thumbnailUrl: string | null;
  currentPrice: number;
  bidCount: number;
  score: number;
  riskLevel: AuctionRiskLevel | string;
  riskLevelLabel: string;
  status: AuctionRiskAssessmentStatus | string;
  signalCount: number;
  summary: string;
  detectedAt: string;
  lastBidAt?: string | null;
}

export interface RiskAlertPage {
  items: RiskAlertListItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface RiskAlertFilters {
  level?: AuctionRiskLevel | 'All';
  status?: AuctionRiskAssessmentStatus | 'All';
  cursor?: string | null;
  limit?: number;
}

export interface MyAuctionRiskFlagDto {
  auctionId: string;
  auctionTitle: string;
  status: string;
  detectedAt: string;
}

export const riskLevelLabels: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Vừa',
  High: 'Cao',
  Critical: 'Nghiêm trọng',
};

export const riskStatusLabels: Record<string, string> = {
  Open: 'Chờ xem',
  UnderReview: 'Đang xem',
  Dismissed: 'Đã bỏ qua',
  Confirmed: 'Đã xác nhận',
};

/**
 * Severity mapped onto the badge modifiers the design system already ships:
 * Critical → badge--live, High → badge--info, Medium → badge--soon, Low → badge--done.
 * No new CSS variant is introduced, which is what keeps the queue visually identical to the rest
 * of the admin surface.
 */
export const riskLevelBadgeClass: Record<string, string> = {
  Critical: 'badge--live',
  High: 'badge--info',
  Medium: 'badge--soon',
  Low: 'badge--done',
};
