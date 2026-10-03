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
  milestones?: Milestone[];
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
  voucherCode?: string;
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
