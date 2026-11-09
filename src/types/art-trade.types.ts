export type TradeStatus =
  | 'Proposed'
  | 'Accepted'
  | 'BothSubmitted'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
  | 'Disputed';

export interface UserSummaryDto {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface ArtworkSummaryDto {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
}

export interface ArtTradeDto {
  id: string;
  title: string;
  description?: string | null;
  status: TradeStatus;
  initiator: UserSummaryDto;
  receiver: UserSummaryDto;
  initiatorRequestNote?: string | null;
  receiverRequestNote?: string | null;
  receiverResponseNote?: string | null;
  receiverAcceptedAt?: string | null;
  initiatorArtworkId?: string | null;
  receiverArtworkId?: string | null;
  initiatorArtwork?: ArtworkSummaryDto | null;
  receiverArtwork?: ArtworkSummaryDto | null;
  initiatorPreviewUrl?: string | null;
  receiverPreviewUrl?: string | null;
  initiatorSubmittedAt?: string | null;
  receiverSubmittedAt?: string | null;
  isInitiatorConfirmed: boolean;
  initiatorConfirmedAt?: string | null;
  isReceiverConfirmed: boolean;
  receiverConfirmedAt?: string | null;
  submissionDeadlineAt?: string | null;
  confirmationDeadlineAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ArtTradeSummaryDto {
  id: string;
  title: string;
  status: TradeStatus;
  partner: UserSummaryDto;
  role: 'Initiator' | 'Receiver';
  myPreviewUrl?: string | null;
  partnerPreviewUrl?: string | null;
  hasSubmitted: boolean;
  partnerHasSubmitted: boolean;
  hasConfirmed: boolean;
  partnerHasConfirmed: boolean;
  submissionDeadlineAt?: string | null;
  createdAt: string;
}

export interface FrozenSlotDetailDto {
  freezeId: string;
  artTradeId: string;
  frozenFrom: string;
  frozenUntil: string;
  reason?: string | null;
  daysRemaining: number;
}

export interface TradeSlotStatusDto {
  userId: string;
  totalSlots: number;
  activeTradesCount: number;
  frozenSlotsCount: number;
  availableSlots: number;
  canTrade: boolean;
  frozenDetails: FrozenSlotDetailDto[];
}

export interface TradeDownloadUrlDto {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
}

export interface CreatorSearchItemDto {
  creatorProfileId: string;
  userId: string;
  displayName: string;
  headline?: string | null;
  specialties?: string | null;
  avatarUrl?: string | null;
  availableSlots: number;
  isAcceptingOrders: boolean;
}

export interface CreateArtTradePayload {
  receiverId?: string;
  receiverDisplayName?: string;
  title: string;
  description?: string;
  requestNote?: string;
  initiatorRequestNote?: string;
  receiverRequestNote?: string;
  durationDays?: number;
}

export interface RespondTradeProposalPayload {
  accept: boolean;
  requestNote?: string;
  responseNote?: string;
  rejectionReason?: string;
}

export interface CancelTradePayload {
  reason: string;
  isViolation?: boolean;
  violatorUserId?: string;
}

