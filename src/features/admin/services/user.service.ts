import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { AdminUserDto, PagedResult } from '@/features/admin/types/admin.types';

interface GetUsersParams {
  page: number;
  size: number;
  keyword?: string;
  role?: string | null;
  status?: string | null;
}

export const adminUserService = {
  async getUsers(params: GetUsersParams): Promise<PagedResult<AdminUserDto>> {
    const response = await apiClient.get<ApiResponse<PagedResult<AdminUserDto>>>(
      '/admin/users',
      { params }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to fetch users.');
    }

    return response.data.data;
  },

  async getUserById(id: string): Promise<AdminUserDto> {
    const response = await apiClient.get<ApiResponse<AdminUserDto>>(`/admin/users/${id}`);

    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to fetch user.');
    }

    return response.data.data;
  },
};
