import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api-error';
import type { ApiResponse } from '@/types/api.types';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';
import type { CollectionDto } from './marketplace.service';
import type {
  ClientProfileDto,
  ClientReviewDto,
  ClientStatisticsDto,
  FollowedCreatorDto,
  UpdateClientProfileRequest,
} from '@/features/marketplace/types/client-profile.types';

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (response.error || response.data == null) {
    throw new Error(response.error?.details?.join(', ') || response.error?.detail || fallback);
  }
  return response.data;
}

async function get<T>(url: string, fallback: string): Promise<T> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url);
    return unwrap(response.data, fallback);
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export const clientProfileService = {
  getClientById: (id: string) => get<ClientProfileDto>(`/clients/${id}`, 'Không tìm thấy hồ sơ người dùng.'),
  getClientStatistics: (id: string) => get<ClientStatisticsDto>(`/clients/${id}/statistics`, 'Không thể tải thống kê.'),
  getClientReviews: (id: string) => get<ClientReviewDto[]>(`/clients/${id}/reviews`, 'Không thể tải đánh giá.'),
  getClientFollowing: (id: string) => get<FollowedCreatorDto[]>(`/clients/${id}/following`, 'Không thể tải danh sách theo dõi.'),
  getClientFavorites: (id: string) => get<ArtworkDto[]>(`/clients/${id}/favorites`, 'Không thể tải tác phẩm yêu thích.'),
  getClientCollections: (id: string) => get<CollectionDto[]>(`/clients/${id}/collections`, 'Không thể tải bộ sưu tập.'),

  async updateMyProfile(payload: UpdateClientProfileRequest): Promise<ClientProfileDto> {
    try {
      const response = await apiClient.put<ApiResponse<ClientProfileDto>>('/clients/me/profile', payload);
      return unwrap(response.data, 'Không thể lưu hồ sơ.');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Không thể lưu hồ sơ.'));
    }
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ available: boolean }>>('/clients/username-availability', { params: { username } });
      return response.data.data?.available ?? false;
    } catch {
      return true;
    }
  },
};