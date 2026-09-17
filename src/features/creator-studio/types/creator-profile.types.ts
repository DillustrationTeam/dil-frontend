export interface CreatorProfileDto {
  id: string;
  userId: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  specialties?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  bannerUrl?: string | null;
  isAcceptingOrders: boolean;
  isApproved: boolean;
  ratingAverage: number;
  ratingCount: number;
  followerCount: number;
  createdAt: string;
}

export interface CreateCreatorProfileRequest {
  displayName: string;
  headline?: string;
  bio?: string;
  specialties?: string;
  location?: string;
  websiteUrl?: string;
  bannerUrl?: string;
  isAcceptingOrders?: boolean;
}

export interface ArtworkDto {
  id: string;
  creatorProfileId: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  isAiGenerated: boolean;
  aiDetectionScore?: number | null;
  moderationStatus: string;
  viewCount: number;
  createdAt: string;
  tags: string[];
}

export interface CreateArtworkRequest {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isAiGenerated?: boolean;
  aiDetectionScore?: number | null;
  tags?: string[];
}
