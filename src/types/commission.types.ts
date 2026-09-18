export type MilestoneType = 'Sketch' | 'Lineart' | 'Color' | 'Final';
export type MilestoneStatus = 'Pending' | 'Active' | 'UnderReview' | 'Approved' | 'Rejected';
export type CommissionStatus = 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Milestone {
  id: string;
  commissionId: string;
  type: MilestoneType;
  status: MilestoneStatus;
  deliverableUrl?: string;
  price: number;
}

export interface Commission {
  id: string;
  clientId: string;
  creatorId: string;
  title: string;
  description: string;
  status: CommissionStatus;
  price: number;
  milestones: Milestone[];
  createdAt: string;
}

export interface CreateCommissionPayload {
  creatorId: string;
  title: string;
  description: string;
  milestones: { type: MilestoneType; price: number }[];
}
