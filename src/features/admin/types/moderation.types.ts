// ==========================================
// SCREEN 20 (SCR-20 / UC28): CONTENT & AI MODERATION QUEUE
// ==========================================

export type ModerationStatus =
  | 'Pending'
  | 'Flagged'
  | 'Approved'
  | 'Rejected'
  | 'Hidden'
  | 'All';

export type ModerationActionType = 'approve' | 'reject' | 'hide' | 'flag_ai';

export interface ArtworkTagItemDto {
  tagId: string;
  name: string;
  isAiGenerated: boolean;
}

export interface ModerationQueueItemDto {
  artworkId: string;
  title: string;
  creatorProfileId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  style?: string | null;
  /** Tỷ lệ an toàn được AI phát hiện (0.0 - 1.0, e.g. 0.984 = 98.4% SAFE) */
  safeScore?: number | null;
  /** Lý do đưa vào hàng đợi kiểm duyệt (e.g. "AI NSFW Threshold Borderline", "User Reported") */
  flagReason?: string | null;
  /** Trạng thái kiểm duyệt: "Pending", "Approved", "Rejected", "Hidden" */
  moderationStatus: string;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface ArtworkInspectionDetailDto {
  artworkId: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  watermarkedUrl?: string | null;
  style?: string | null;
  likeCount: number;
  resolution?: string | null;
  fileSizeBytes?: number | null;
  createdAt: string;
  viewCount: number;

  // AI Confidence Scores
  safeScore?: number | null;
  adultScore?: number | null;
  violenceScore?: number | null;
  isAiGenerated: boolean;
  aiDetectionScore?: number | null;

  // Moderation Info
  flagReason?: string | null;
  moderationStatus: string;
  moderatorId?: string | null;
  moderatorName?: string | null;
  moderationNote?: string | null;
  moderatedAt?: string | null;

  // Creator Info
  creatorProfileId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl?: string | null;

  // Tags
  tags: ArtworkTagItemDto[];
}

export interface ExecuteModerationDecisionRequest {
  action: ModerationActionType;
  moderationNote?: string;
}

export interface ModerationQueueMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  pendingCount: number;
}

export interface ModerationQueueFilters {
  status: ModerationStatus;
  search: string;
  page: number;
  pageSize: number;
}

export interface ModerationQueueResponse {
  items: ModerationQueueItemDto[];
  meta: ModerationQueueMeta;
}
