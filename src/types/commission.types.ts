export type MilestoneType = 'Sketch' | 'Lineart' | 'Color' | 'Final';
export type MilestoneStatus = 'Pending' | 'Submitted' | 'RevisionRequested' | 'Approved';
export type CommissionStatus =
  | 'PendingAcceptance'
  | 'InProgress'
  | 'Negotiating'
  | 'SubmittedFinal'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export interface Milestone {
  id: string;
  commissionId: string;
  sequence: number;
  title: string;
  status: MilestoneStatus;
  originalWipUrl?: string | null;
  wipPreviewUrl?: string | null;
  watermarkedUrl?: string | null;
  finalDeliverableUrl?: string | null;
  hasWip?: boolean;
  hasFinal?: boolean;
  submittedAt?: string | null;
  approvedAt?: string | null;
  revisionCount?: number;
  maxRevisions?: number;
  creatorNote?: string | null;
  revisionFeedback?: string | null;
  price: number;
}

export interface Commission {
  discountAmount: number;
  packageId?: string | null;
  id: string;
  clientId: string;
  creatorId: string;
  licenseType: 'Personal' | 'Commercial';
  licenseMultiplierApplied: number;
  title: string;
  description?: string;
  status: CommissionStatus;
  /** Legacy field retained while existing dashboard cards are migrated. */
  price?: number;
  totalPrice?: number;
  finalPrice?: number;
  escrowHeldAmount?: number;
  disbursedAmount?: number;
  escrowStatus?: string;
  currentStage?: number;
  clientName?: string;
  creatorName?: string;
  deadlineAt?: string | null;
  cancellationReason?: string | null;
  cancellationDetails?: string | null;
  cancellationRequestedById?: string | null;
  cancellationRequestedByRole?: 'Client' | 'Creator' | null;
  cancellationRequestStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Expired' | null;
  cancellationRequestedAt?: string | null;
  cancellationRequestExpiresAt?: string | null;
  isOverdue?: boolean;
  overdueGraceEndsAt?: string | null;
  clientTermsAcceptedAt?: string | null;
  clientTermsVersion?: string | null;
  creatorTermsAcceptedAt?: string | null;
  creatorTermsVersion?: string | null;
  currentWorkroomTermsVersion?: string;
  milestones?: Milestone[];
  review?: Review | null;
  dispute?: Dispute | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  commissionId: string;
  raisedById: string;
  reason: string;
  evidenceUrls?: string | null;
  status: string;
  resolution?: string | null;
  clientRefundAmount?: number | null;
  artistPayAmount?: number | null;
  clientRefundPercent?: number | null;
  adminNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export type CommissionDispute = Dispute;

export interface RespondToCommissionPayload {
  action: 'Accept' | 'Reject' | 'Negotiate';
  negotiatePrice?: number;
  negotiateDeadlineAt?: string;
  negotiateNote?: string;
  rejectReason?: string;
}

export interface CreateCommissionPayload {
  voucherCode?: string;
  addonIds?: string[];
  creatorId: string;
  packageId: string;
  licenseType: 'Personal' | 'Commercial';
  title: string;
  description: string;
  deadlineAt?: string;
}

export interface Review {
  id: string;
  commissionId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  reviewerReply?: string;
  attachedImages?: string[];
  respondedAt?: string;
  createdAt: string;
}

export type CancelRefundPolicy = 'Full' | 'Partial' | 'EscrowRemainder';
