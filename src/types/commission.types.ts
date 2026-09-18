export type MilestoneType = 'Sketch' | 'Lineart' | 'Color' | 'Final';
export type MilestoneStatus = 'Pending' | 'Active' | 'UnderReview' | 'Approved' | 'Rejected';
export type CommissionStatus =
  | 'Pending'
  | 'PendingAcceptance'
  | 'Accepted'
  | 'AwaitingEscrowDeposit'
  | 'InProgress'
  | 'Negotiating'
  | 'SubmittedFinal'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export interface Milestone {
  id: string;
  commissionId: string;
  sequence: number;
  title: string;
  status: MilestoneStatus;
  wipPreviewUrl?: string | null;
  watermarkedUrl?: string | null;
  finalDeliverableUrl?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  revisionCount?: number;
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
  escrowHeldAmount?: number;
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
  rejectReason?: string;
}

export interface CreateCommissionPayload {
  creatorId: string;
  title: string;
  description: string;
  deadlineAt?: string;
  totalPrice: number;
  milestones: { sequence: number; title: string; price: number }[];
}
