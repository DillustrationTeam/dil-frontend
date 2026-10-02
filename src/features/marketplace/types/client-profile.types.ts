export interface ClientProfileDto {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  isVerified: boolean;
  joinedAt: string;
  username?: string | null;
  interestTags: string[];
  country?: string | null;
  timezone?: string | null;
  preferredLanguages: string[];
  usernameChangedAt?: string | null;
}

export interface ClientStatisticsDto {
  completedCommissionCount: number;
  disputeCount: number;
}

export interface ClientReviewDto {
  id: string;
  creatorId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface FollowedCreatorDto {
  creatorProfileId: string;
  creatorUserId: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface UpdateClientProfileRequest {
  username?: string;
  interestTags?: string[];
  country?: string;
  timezone?: string;
  preferredLanguages?: string[];
}
