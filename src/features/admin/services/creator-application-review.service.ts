import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  ApplicationStatusName,
  CreatorApplicationDto,
  ListApplicationsMeta,
  ListApplicationsResult,
  ReviewApplicationRequest,
} from '@/features/admin/types/creator-application-review.types';

export const creatorApplicationReviewService = {
  async listApplications(
    status: ApplicationStatusName | 'All',
    page = 1,
    pageSize = 10
  ): Promise<ListApplicationsResult> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorApplicationDto[]>>('/creator-applications', {
        params: {
          status: status === 'All' ? undefined : status,
          page,
          pageSize,
        },
      });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to load applications.');
      }
      return { items: response.data.data, meta: response.data.meta as unknown as ListApplicationsMeta };
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to load applications.'));
    }
  },

  async getApplicationById(id: string): Promise<CreatorApplicationDto> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorApplicationDto>>(`/creator-applications/${id}`);
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to load application detail.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to load application detail.'));
    }
  },

  async reviewApplication(id: string, request: ReviewApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        `/creator-applications/${id}/review`,
        request
      );
      if (response.data.error) {
        throw new Error(response.data.error.detail || 'Failed to review application.');
      }
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to review application.'));
    }
  },
};
