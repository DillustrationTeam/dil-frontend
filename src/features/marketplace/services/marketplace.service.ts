import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';

export interface MarketplaceArtwork extends ArtworkDto {
  creatorName?: string;
  creatorHeadline?: string | null;
}

export interface BannerDto {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface ArtworkCommentDto {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface MarketplaceHomeFeedDto {
  featuredBanners: BannerDto[];
  recommendedArtworks: MarketplaceArtwork[];
  followingArtworks: MarketplaceArtwork[];
}

export interface ArtworkDetailResponse {
  artwork: MarketplaceArtwork;
  licenseType: string;
  startingPrice: number | null;
  isFavorited: boolean;
  favoriteCount: number;
}

export interface CreatorServiceDto {
  id: string;
  title: string;
  description?: string | null;
  startingPrice: number;
  deliveryDays: number;
  maxRevisions: number;
  isActive: boolean;
}

export interface CreatorReviewDto {
  id: string;
  reviewerUserId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CollectionDto {
  id: string;
  name: string;
  isPublic: boolean;
  artworkCount: number;
  createdAt: string;
}

const getData = <T>(response: { data: ApiResponse<T> }) => {
  if (response.data.error || !response.data.data) {
    throw new Error(response.data.error?.details?.join(', ') || 'Request failed.');
  }
  return response.data.data;
};

export const marketplaceService = {
  async getArtworks(): Promise<MarketplaceArtwork[]> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork[]>>('/artworks');
    return getData(response);
  },

  async getArtworkById(id: string): Promise<MarketplaceArtwork> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork>>(`/artworks/${id}`);
    return getData(response);
  },

  async getArtworkDetail(id: string): Promise<ArtworkDetailResponse> {
    const response = await apiClient.get<ApiResponse<ArtworkDetailResponse>>(`/marketplace/artworks/${id}/detail`);
    return getData(response);
  },

  async getCreatorById(id: string) {
    const response = await apiClient.get<ApiResponse<import('@/features/creator-studio/types/creator-profile.types').CreatorProfileDto>>(`/creator/${id}`);
    return getData(response);
  },

  async getMarketplaceHome(take = 12): Promise<MarketplaceHomeFeedDto> {
    const response = await apiClient.get<ApiResponse<MarketplaceHomeFeedDto>>('/marketplace/home', { params: { take } });
    return getData(response);
  },

  async getFeaturedBanners(): Promise<BannerDto[]> {
    const response = await apiClient.get<ApiResponse<BannerDto[]>>('/marketplace/banners');
    return getData(response);
  },

  async getFollowingFeed(take = 12): Promise<MarketplaceArtwork[]> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork[]>>('/marketplace/following', { params: { take } });
    return getData(response);
  },

  async visualSearch(payload: { referenceImageUrl?: string; tags?: string[]; style?: string; take?: number }): Promise<MarketplaceArtwork[]> {
    const response = await apiClient.post<ApiResponse<MarketplaceArtwork[]>>('/marketplace/visual-search', payload);
    return getData(response);
  },

  async getArtworkComments(id: string): Promise<ArtworkCommentDto[]> {
    const response = await apiClient.get<ApiResponse<ArtworkCommentDto[]>>(`/marketplace/artworks/${id}/comments`);
    return getData(response);
  },

  async createArtworkComment(id: string, body: string): Promise<ArtworkCommentDto> {
    const response = await apiClient.post<ApiResponse<ArtworkCommentDto>>(`/marketplace/artworks/${id}/comments`, { body });
    return getData(response);
  },

  async toggleFavorite(id: string): Promise<{ favorited: boolean }> {
    const response = await apiClient.put<ApiResponse<{ favorited: boolean }>>(`/marketplace/artworks/${id}/favorite`);
    return getData(response);
  },

  async unfavoriteArtwork(id: string): Promise<{ favorited: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ favorited: boolean }>>(`/marketplace/artworks/${id}/favorite`);
    return getData(response);
  },

  async getCreatorServices(id: string): Promise<CreatorServiceDto[]> {
    const response = await apiClient.get<ApiResponse<CreatorServiceDto[]>>(`/marketplace/creators/${id}/services`);
    return getData(response);
  },

  async getCreatorReviews(id: string): Promise<CreatorReviewDto[]> {
    const response = await apiClient.get<ApiResponse<CreatorReviewDto[]>>(`/marketplace/creators/${id}/reviews`);
    return getData(response);
  },

  async followCreator(id: string): Promise<{ following: boolean }> {
    const response = await apiClient.put<ApiResponse<{ following: boolean }>>(`/marketplace/creators/${id}/follow`);
    return getData(response);
  },

  async unfollowCreator(id: string): Promise<{ following: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ following: boolean }>>(`/marketplace/creators/${id}/follow`);
    return getData(response);
  },

  async createCreatorReview(id: string, payload: { rating: number; comment?: string | null }): Promise<CreatorReviewDto> {
    const response = await apiClient.post<ApiResponse<CreatorReviewDto>>(`/marketplace/creators/${id}/reviews`, payload);
    return getData(response);
  },

  async getMyFavorites(): Promise<MarketplaceArtwork[]> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork[]>>('/marketplace/me/favorites');
    return getData(response);
  },

  async getArtworkDetailFromApi(id: string): Promise<ArtworkDetailResponse> {
    const response = await apiClient.get<ApiResponse<ArtworkDetailResponse>>(`/marketplace/artworks/${id}/detail`);
    return getData(response);
  },

  async getMyCollections(): Promise<CollectionDto[]> {
    const response = await apiClient.get<ApiResponse<CollectionDto[]>>('/marketplace/me/collections');
    return getData(response);
  },

  async createCollection(payload: { name: string; isPublic: boolean }): Promise<CollectionDto> {
    const response = await apiClient.post<ApiResponse<CollectionDto>>('/marketplace/me/collections', payload);
    return getData(response);
  },

  async addArtworkToCollection(collectionId: string, artworkId: string): Promise<void> {
    const response = await apiClient.put<ApiResponse<null>>(`/marketplace/me/collections/${collectionId}/artworks/${artworkId}`);
    getData(response);
  },
};
