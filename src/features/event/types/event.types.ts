import type { JuryCriterion } from './jury.types';

export type EventStatus = 'Draft' | 'Upcoming' | 'Open' | 'Judging' | 'Ended';

export const eventStatusLabels: Record<string, string> = {
  Draft: 'Draft',
  Upcoming: 'Waiting to Open',
  Open: 'Open for Submissions',
  Judging: 'Judging & Voting',
  Ended: 'Ended',
};

export const eventStatusBadgeStyles: Record<string, string> = {
  Upcoming: 'border-sky-400/30 bg-sky-950/70 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.15)]',
  Open: 'border-emerald-400/30 bg-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.15)]',
  Judging: 'border-amber-400/30 bg-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
  Ended: 'border-white/15 bg-white/5 text-on-surface-variant',
  Draft: 'border-white/10 bg-white/5 text-outline',
};

export function normalizeEventStatus(status?: EventStatus | string | number | null): EventStatus {
  if (typeof status === 'number') {
    if (status === 2) return 'Upcoming';
    if (status === 3) return 'Open';
    if (status === 4) return 'Judging';
    if (status === 5) return 'Ended';
    return 'Draft';
  }
  switch (String(status || '').trim().toLowerCase()) {
    case 'upcoming':
    case '2':
      return 'Upcoming';
    case 'open':
    case '3':
      return 'Open';
    case 'judging':
    case '4':
      return 'Judging';
    case 'ended':
    case '5':
      return 'Ended';
    case 'draft':
    case '1':
    default:
      return 'Draft';
  }
}

export function toEventStatusEnumValue(status?: EventStatus | string | number | null): number {
  switch (normalizeEventStatus(status)) {
    case 'Upcoming':
      return 2;
    case 'Open':
      return 3;
    case 'Judging':
      return 4;
    case 'Ended':
      return 5;
    case 'Draft':
    default:
      return 1;
  }
}

export interface EventListItemDto {
  id: string;
  title: string;
  bannerUrl: string | null;
  description: string;
  rules?: string | null;
  prize?: string | null;
  maxVote: number;
  status: EventStatus | string | number;
  submissionStartAt: string;
  submissionEndAt: string;
  judgingStartAt: string;
  judgingEndAt: string;
  votingStartAt: string;
  votingEndAt: string;
  resultAnnouncementAt: string;
  createdByAdminId?: string;
  createdByAdminName?: string | null;
  createdByAdminAvatarUrl?: string | null;
  submissionCount: number;
  totalVoteCount?: number;
  createdAt: string;
  updatedAt?: string | null;
  isActive?: boolean;
  isOpenForSubmission?: boolean;
  isFeatured?: boolean;
  isHeadJury?: boolean;
  isHeadJurySignedOff?: boolean;
  headJurySignedOffAt?: string | null;
  criteria?: JuryCriterion[];
  eventCriteria?: JuryCriterion[];
}

export interface EventDetailDto extends EventListItemDto {
  submissions?: EventSubmissionDto[];
  leaderboard?: EventLeaderboardItemDto[];
  criteria?: JuryCriterion[];
  eventCriteria?: JuryCriterion[];
}

export interface EventSubmissionDto {
  id: string;
  eventId: string;
  eventTitle?: string;
  submitterId: string;
  submitterName?: string;
  submitterUsername?: string;
  submitterAvatarUrl?: string;
  artworkId: string;
  title: string;
  description?: string;
  artworkTitle?: string;
  artworkImageUrl?: string;
  artworkThumbnailUrl?: string;
  aiScanPassed: boolean;
  voteCount: number;
  score?: number | null;
  adminNote?: string;
  submittedAt: string;
  hasVoted?: boolean;
  currentJuryHasGraded?: boolean | null;
  currentJuryScore?: number | null;
  currentJuryCriteriaScores?: Record<string, number> | null;
}

export interface EventLeaderboardItemDto {
  submissionId: string;
  artworkId?: string;
  title: string;
  submissionTitle?: string;
  submitterId?: string;
  submitterName: string;
  submitterUsername?: string;
  submitterAvatarUrl?: string;
  artworkTitle?: string;
  artworkImageUrl?: string;
  artworkThumbnailUrl?: string;
  voteCount: number;
  judgeScore?: number | null;
  score?: number | null;
  rank: number;
}

export type EventSortOption =
  | 'latest'
  | 'title_asc'
  | 'ending_soon'
  | 'most_submissions'
  | 'most_votes';

export interface EventFilters {
  title?: string;
  search?: string;
  status?: string;
  isFeatured?: boolean;
  excludeEnded?: boolean;
  includeDrafts?: boolean;
  minSubmissions?: number;
  maxSubmissions?: number;
  sortBy?: EventSortOption | string;
  page?: number;
  pageSize?: number;
}

export interface EventPageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UploadSubmissionRequest {
  eventId: string;
  artworkId?: string | null;
  title?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isAiGenerated?: boolean;
  aiDetectionScore?: number;
  tags?: string[];
}

export interface UpdateSubmissionRequest {
  title?: string;
  description?: string;
  artworkId?: string | null;
  imageUrl?: string;
  thumbnailUrl?: string;
  isAiGenerated?: boolean;
  aiDetectionScore?: number;
  tags?: string[];
}

export interface EventStatsDto {
  totalPrizePool: number;
  formattedTotalPrizePool: string;
  openEventsCount: number;
  totalSubmissionsCount: number;
  totalEventsCount: number;
}

export interface EventRequestPayload {
  title: string;
  description: string;
  bannerUrl?: string | null;
  rules?: string | null;
  prize?: string | null;
  maxVote: number;
  status: EventStatus | string;
  isFeatured: boolean;
  submissionStartAt: string;
  submissionEndAt: string;
  judgingStartAt: string;
  judgingEndAt: string;
  votingStartAt: string;
  votingEndAt: string;
  resultAnnouncementAt: string;
  criteria?: Array<Partial<JuryCriterion>>;
  eventCriteria?: Array<Partial<JuryCriterion>>;
}

export type SubmissionDisputeCategory =
  | 'AiArt'
  | 'Copyright'
  | 'VoteFraud'
  | 'RuleViolation'
  | 'ScoreAppeal'
  | 'Other';

export interface CreateSubmissionDisputeRequest {
  category?: SubmissionDisputeCategory | string;
  reason: string;
  description?: string;
  evidenceUrls?: string[];
  priority?: 'Low' | 'Medium' | 'High' | string;
}

