import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';
import { CollectionDto } from '@/features/marketplace/services/marketplace.service';
import {
  ClientProfileDto,
  ClientReviewDto,
  ClientStatisticsDto,
  FollowedCreatorDto,
  UpdateClientProfileRequest,
} from '@/features/marketplace/types/client-profile.types';

const getData = <T>(response: { data: ApiResponse<T> }, fallback: string): T => {
  if (response.data.error || !response.data.data) {
    throw new Error(response.data.error?.detail || fallback);
  }
  return response.data.data;
};

export const clientProfileService = {
  async getClientById(id: string): Promise<ClientProfileDto> {
    try {
      const response = await apiClient.get<ApiResponse<ClientProfileDto>>(`/clients/${id}`);
      return getData(response, 'Không tìm thấy hồ sơ người dùng.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không tìm thấy hồ sơ người dùng.'));
    }
  },

  async getClientStatistics(id: string): Promise<ClientStatisticsDto> {
    try {
      const response = await apiClient.get<ApiResponse<ClientStatisticsDto>>(`/clients/${id}/statistics`);
      return getData(response, 'Không thể tải thống kê uy tín.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải thống kê uy tín.'));
    }
  },

  async getClientReviews(id: string): Promise<ClientReviewDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<ClientReviewDto[]>>(`/clients/${id}/reviews`);
      return getData(response, 'Không thể tải đánh giá.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải đánh giá.'));
    }
  },

  async getClientFollowing(id: string): Promise<FollowedCreatorDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<FollowedCreatorDto[]>>(`/clients/${id}/following`);
      return getData(response, 'Không thể tải danh sách đang theo dõi.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải danh sách đang theo dõi.'));
    }
  },

  async getClientFavorites(id: string): Promise<ArtworkDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<ArtworkDto[]>>(`/clients/${id}/favorites`);
      return getData(response, 'Không thể tải danh sách yêu thích.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải danh sách yêu thích.'));
    }
  },

  async getClientCollections(id: string): Promise<CollectionDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<CollectionDto[]>>(`/clients/${id}/collections`);
      return getData(response, 'Không thể tải bộ sưu tập.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải bộ sưu tập.'));
    }
  },

  async updateMyProfile(payload: UpdateClientProfileRequest): Promise<ClientProfileDto> {
    try {
      const response = await apiClient.put<ApiResponse<ClientProfileDto>>('/clients/me/profile', payload);
      return getData(response, 'Không thể lưu hồ sơ.');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'));
    }
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ available: boolean }>>('/clients/username-availability', {
        params: { username },
      });
      return response.data.data?.available ?? false;
    } catch {
      // Lỗi mạng tạm thời — không chặn người dùng gõ tiếp, lượt lưu thật sự sẽ kiểm tra lại.
      return true;
    }
  },
};
