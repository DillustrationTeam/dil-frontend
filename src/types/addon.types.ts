export type AddonStage = 'Sketch' | 'Lineart' | 'Final' | 'Any';
export type AddonPreset = { key: string; title: string; allowedMilestone: string };
export type CreatorAddon = {
  id: string;
  creatorId: string;
  packageId?: string | null;
  title: string;
  description?: string | null;
  price: number;
  allowedMilestone: string;
  extendDays: number;
  presetKey?: string | null;
  isActive: boolean;
};
export type CommissionAddon = {
  id: string;
  commissionId: string;
  title: string;
  description?: string | null;
  price: number;
  allowedMilestone: string;
  milestoneSequence: number;
  extendDays: number;
  status: 'Proposed' | 'Accepted' | 'Rejected';
  createdAt: string;
};
