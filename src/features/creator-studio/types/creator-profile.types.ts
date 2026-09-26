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
  availableSlots: number;
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
  availableSlots?: number;
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

export interface CreatorTermsDto {
  commercialLicenseMultiplier: number;
  revisionPolicy?: string | null;
  cancellationPolicy?: string | null;
}

export interface UpdateCreatorTermsRequest {
  commercialLicenseMultiplier: number;
  revisionPolicy?: string | null;
  cancellationPolicy?: string | null;
}

export interface AutoReplySettingDto {
  isEnabled: boolean;
  briefTemplate: string;
}

export interface UpdateAutoReplySettingRequest {
  isEnabled: boolean;
  briefTemplate: string;
}

export interface CreatorFaqDto {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface UpsertCreatorFaqRequest {
  question: string;
  answer: string;
  displayOrder: number;
}

export interface CreatorWorkItemDto {
  id: string;
  clientName: string;
  title: string;
  stage: string;
  dueAt?: string | null;
  createdAt: string;
}

export interface CreateWorkItemRequest {
  clientName: string;
  title: string;
  stage: string;
  dueAt?: string | null;
}

export interface CreatorAssetDto {
  id: string;
  assetType: string;
  name: string;
  assetUrl?: string | null;
  metadataJson?: string | null;
  createdAt: string;
}

export interface CreateCreatorAssetRequest {
  assetType: string;
  name: string;
  assetUrl?: string | null;
  metadataJson?: string | null;
}

export interface CreatorWorkstationState {
  terms: CreatorTermsDto;
  autoReply: AutoReplySettingDto;
  faqs: CreatorFaqDto[];
  workItems: CreatorWorkItemDto[];
  assets: CreatorAssetDto[];
}
