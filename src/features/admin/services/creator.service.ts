import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  CreatorApplicationDetailDto,
  CreatorApplicationDto,
  PagedResult,
} from '@/features/admin/types/admin.types';

interface GetCreatorApplicationsParams {
  page: number;
  size: number;
}

export const adminCreatorService = {
  async getCreatorApplications(
    params: GetCreatorApplicationsParams
  ): Promise<PagedResult<CreatorApplicationDto>> {
    const response = await apiClient.get<ApiResponse<PagedResult<CreatorApplicationDto>>>(
      '/admin/creators',
      { params }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') || 'Failed to fetch creator applications.'
      );
    }

    return response.data.data;
  },

  async getCreatorApplicationById(id: string): Promise<CreatorApplicationDetailDto> {
    const response = await apiClient.get<ApiResponse<CreatorApplicationDetailDto>>(
      `/admin/creators/${id}`
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') || 'Failed to fetch creator application.'
      );
    }

    return response.data.data;
  },
};
