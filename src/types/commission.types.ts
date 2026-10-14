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
  id: string;
  clientId: string;
  creatorId: string;
  title: string;
  description?: string;
  status: CommissionStatus;
  /** Legacy field retained while existing dashboard cards are migrated. */
  price?: number;
  totalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  escrowHeldAmount?: number;
  escrowStatus?: string;
  currentStage?: number;
  clientName?: string;
  creatorName?: string;
  disbursedAmount?: number;
  deadlineAt?: string | null;
  cancellationReason?: string | null;
  cancellationDetails?: string | null;
  milestones?: Milestone[];
  review?: Review | null;
  createdAt: string;
}

export interface RespondToCommissionPayload {
  action: 'Accept' | 'Reject' | 'Negotiate';
  negotiatePrice?: number;
  negotiateDeadlineAt?: string;
  negotiateNote?: string;
  rejectReason?: string;
}

export interface CreateCommissionPayload {
  creatorId: string;
  packageId: string;
  licenseType?: 'Personal' | 'Commercial';
  title: string;
  description: string;
  voucherCode?: string;
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

export interface CommissionDispute {
  id: string;
  commissionId: string;
  raisedById: string;
  raisedByName?: string | null;
  reason: string;
  evidenceUrls?: string | null;
  status: string;
  resolution?: string | null;
  clientRefundAmount?: number | null;
  artistPayAmount?: number | null;
  adminNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export type CancelRefundPolicy = 'Full' | 'Partial' | 'EscrowRemainder';
