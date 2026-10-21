export type DisputeStatus = 'All' | 'Negotiating' | 'Pending' | 'UnderReview' | 'MutualSettled' | 'Resolved';

export type DisputeResolutionType = 'ClientWin100' | 'ArtistWin100' | 'SplitCustom' | `Split_${number}_${number}`;

export interface DisputePartyDto {
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface DisputeRaiserDto {
  userId: string;
  fullName: string;
  userName?: string;
  role: 'Client' | 'Creator';
}

export interface DisputeMilestoneDto {
  id: string;
  sequence: number;
  title: string;
  price: number;
  status: string;
  wipPreviewUrl?: string | null;
  watermarkedUrl?: string | null;
  finalDeliverableUrl?: string | null;
  revisionCount: number;
  submittedAt?: string | null;
  approvedAt?: string | null;
}

export interface DisputeChatSnapshotMessageDto {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Client' | 'Creator' | 'System';
  messageType: 'Text' | 'Image' | 'File' | 'SystemEvent' | 'RevisionNotice';
  body: string;
  attachmentUrl?: string | null;
  sentAt: string;
}

export interface DisputeQueueItemDto {
  disputeId: string;
  commissionId: string;
  commissionTitle: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: 'Client' | 'Creator';
  clientId: string;
  clientName: string;
  clientEmail: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  finalPrice: number;
  escrowHeldAmount: number;
  reason: string;
  status: DisputeStatus;
  resolution?: DisputeResolutionType | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface DisputeArbitrationDetailDto {
  disputeId: string;
  commissionId: string;
  commissionTitle: string;
  commissionDescription?: string | null;
  commissionStatus: string;
  escrowStatus: string;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  escrowHeldAmount: number;
  disbursedAmount: number;
  currentStage: number;
  deadlineAt?: string | null;
  client: DisputePartyDto;
  creator: DisputePartyDto;
  raisedBy: DisputeRaiserDto;
  reason: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: DisputeResolutionType | null;
  clientRefundAmount?: number | null;
  artistPayAmount?: number | null;
  clientRefundPercent?: number | null;
  claimantRefundPercent?: number | null;
  respondentRefundPercent?: number | null;
  respondentResponse?: string | null;
  respondentEvidenceUrls?: string[];
  respondentRespondedAt?: string | null;
  adminNote?: string | null;
  moderatorId?: string | null;
  moderatorName?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  milestones: DisputeMilestoneDto[];
  chatSnapshot: DisputeChatSnapshotMessageDto[];
}

export interface ResolveDisputeArbitrationRequest {
  clientRefundPercent: number; // 0 to 100
  adminNote: string;
  resolution?: DisputeResolutionType;
}

export interface DisputeQueueFilters {
  status: DisputeStatus;
  search: string;
  page: number;
  pageSize: number;
}

export interface DisputeQueueMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  pendingCount: number;
  underReviewCount: number;
  resolvedCount: number;
  totalLockedEscrow: number;
}

export interface DisputeQueueResponse {
  items: DisputeQueueItemDto[];
  meta: DisputeQueueMeta;
}

// =========================================================================
// 2. SUBMISSION DISPUTE TYPES (KHIẾU NẠI BÀI THI SỰ KIỆN)
// =========================================================================
export type SubmissionDisputePriority = 'Low' | 'Medium' | 'High';

export type SubmissionDisputeResolution =
  | 'Dismiss'
  | 'Disqualify'
  | 'RequestReEvaluation'
  | 'Other';

export type SubmissionDisputeStatus =
  | 'All'
  | 'Pending'
  | 'UnderReview'
  | 'Resolved'
  | 'Rejected';

export interface SubmissionDisputeDto {
  id: string;
  eventId: string;
  eventTitle?: string | null;
  submissionId: string;
  submissionTitle?: string | null;
  artworkImageUrl?: string | null;
  raisedById: string;
  raisedByName?: string | null;
  priority: SubmissionDisputePriority;
  reason: string;
  evidenceUrls?: string | null;
  evidenceUrlList?: string[] | null;
  status: 'Pending' | 'UnderReview' | 'Resolved' | 'Rejected';
  resolution?: string | null;
  note?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface ResolveSubmissionDisputeRequest {
  resolution: string;
  note?: string;
}

export interface SubmissionDisputeQueueFilters {
  eventId?: string;
  submissionId?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface SubmissionDisputeQueueResponse {
  items: SubmissionDisputeDto[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    pendingCount?: number;
    underReviewCount?: number;
    resolvedCount?: number;
  };
}

