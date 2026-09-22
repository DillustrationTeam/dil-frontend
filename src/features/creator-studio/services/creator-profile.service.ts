import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ArtworkDto,
  CreateArtworkRequest,
  CreateCreatorProfileRequest,
  CreatorProfileDto,
} from '@/features/creator-studio/types/creator-profile.types';

export const creatorProfileService = {
  async getMyProfile(): Promise<CreatorProfileDto> {
    const response = await apiClient.get<ApiResponse<CreatorProfileDto>>('/creator-profiles/me');
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load creator profile.');
    }
    return response.data.data;
  },

  async createProfile(data: CreateCreatorProfileRequest): Promise<CreatorProfileDto> {
    const response = await apiClient.post<ApiResponse<CreatorProfileDto>>('/creator-profiles', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to create creator profile.');
    }
    return response.data.data;
  },

  async uploadArtwork(data: CreateArtworkRequest): Promise<ArtworkDto> {
    const response = await apiClient.post<ApiResponse<ArtworkDto>>('/creator-profiles/artworks', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to upload artwork.');
    }
    return response.data.data;
  },
};
