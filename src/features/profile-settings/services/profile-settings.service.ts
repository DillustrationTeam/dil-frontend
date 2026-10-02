import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import { UserDto } from '@/types/auth.types';
import { UpdateProfileRequest } from '@/features/profile-settings/types/profile-settings.types';

export const profileSettingsService = {
  async updateProfile(data: UpdateProfileRequest): Promise<UserDto> {
    try {
      const response = await apiClient.put<ApiResponse<UserDto>>('/auth/me/profile', data);
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to update profile.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to update profile.'));
    }
  },
};
