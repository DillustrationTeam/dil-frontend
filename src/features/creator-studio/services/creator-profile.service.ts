import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ArtworkDto,
  AutoReplySettingDto,
  CreateArtworkRequest,
  CreateCreatorAssetRequest,
  CreateCreatorProfileRequest,
  CreateWorkItemRequest,
  CreatorAssetDto,
  CreatorFaqDto,
  CreatorProfileDto,
  CreatorTermsDto,
  CreatorWorkItemDto,
  CreatorWorkstationState,
  UpdateAutoReplySettingRequest,
  UpdateCreatorTermsRequest,
  UpsertCreatorFaqRequest,
} from '@/features/creator-studio/types/creator-profile.types';

export const creatorProfileService = {
  async getMyProfile(): Promise<CreatorProfileDto> {
    const response = await apiClient.get<ApiResponse<CreatorProfileDto>>('/creator/me');
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load creator profile.');
    }
    return response.data.data;
  },

  async createProfile(data: CreateCreatorProfileRequest): Promise<CreatorProfileDto> {
    const response = await apiClient.post<ApiResponse<CreatorProfileDto>>('/profile/setup', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to create creator profile.');
    }
    return response.data.data;
  },

  async updateMyProfile(data: Partial<CreateCreatorProfileRequest>): Promise<CreatorProfileDto> {
    const response = await apiClient.put<ApiResponse<CreatorProfileDto>>('/creator/me', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to update creator profile.');
    }
    return response.data.data;
  },

  async uploadArtwork(data: CreateArtworkRequest): Promise<ArtworkDto> {
    const response = await apiClient.post<ApiResponse<ArtworkDto>>('/artworks', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to upload artwork.');
    }
    return response.data.data;
  },

  async getWorkstationState(): Promise<CreatorWorkstationState> {
    const response = await apiClient.get<ApiResponse<CreatorWorkstationState>>('/creator/workstation');
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load creator workstation.');
    }
    return response.data.data;
  },

  async saveTerms(data: UpdateCreatorTermsRequest): Promise<CreatorTermsDto> {
    const response = await apiClient.post<ApiResponse<CreatorTermsDto>>('/creator/workstation/terms', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to save terms.');
    }
    return response.data.data;
  },

  async saveAutoReply(data: UpdateAutoReplySettingRequest): Promise<AutoReplySettingDto> {
    const response = await apiClient.post<ApiResponse<AutoReplySettingDto>>('/creator/workstation/auto-reply', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to save auto-reply settings.');
    }
    return response.data.data;
  },

  async saveFaq(data: UpsertCreatorFaqRequest): Promise<CreatorFaqDto> {
    const response = await apiClient.post<ApiResponse<CreatorFaqDto>>('/creator/workstation/faqs', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to save FAQ.');
    }
    return response.data.data;
  },

  async saveWorkItem(data: CreateWorkItemRequest): Promise<CreatorWorkItemDto> {
    const response = await apiClient.post<ApiResponse<CreatorWorkItemDto>>('/creator/workstation/work-items', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to save work item.');
    }
    return response.data.data;
  },

  async updateWorkItemStage(id: string, stage: string): Promise<CreatorWorkItemDto> {
    const response = await apiClient.put<ApiResponse<CreatorWorkItemDto>>(`/creator/workstation/work-items/${id}/stage`, { stage });
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to update work item stage.');
    }
    return response.data.data;
  },

  async saveAsset(data: CreateCreatorAssetRequest): Promise<CreatorAssetDto> {
    const response = await apiClient.post<ApiResponse<CreatorAssetDto>>('/creator/workstation/assets', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to save asset.');
    }
    return response.data.data;
  },

  async deleteAsset(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/creator/workstation/assets/${id}`);
    if (response.data.error) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to delete asset.');
    }
  },
};
