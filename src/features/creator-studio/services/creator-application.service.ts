import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  MyCreatorApplicationDto,
  SubmitCreatorApplicationRequest,
  SubmitCreatorApplicationResponse,
} from '@/features/creator-studio/types/creator-application.types';

export const creatorApplicationService = {
  async submitApplication(
    data: SubmitCreatorApplicationRequest
  ): Promise<SubmitCreatorApplicationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<SubmitCreatorApplicationResponse>>(
        '/creator-applications',
        data
      );
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to submit creator application.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to submit creator application.'));
    }
  },

  async getMyApplication(): Promise<MyCreatorApplicationDto | null> {
    try {
      const response = await apiClient.get<ApiResponse<MyCreatorApplicationDto | null>>(
        '/creator-applications/me'
      );
      if (response.data.error) {
        throw new Error(response.data.error.detail || 'Failed to load your application status.');
      }
      return response.data.data ?? null;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to load your application status.'));
    }
  },

  async updateApplication(data: SubmitCreatorApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>('/creator-applications/me', data);
      if (response.data.error) {
        throw new Error(response.data.error.detail || 'Failed to update your application.');
      }
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to update your application.'));
    }
  },

  async withdrawApplication(): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>('/creator-applications/me');
      if (response.data.error) {
        throw new Error(response.data.error.detail || 'Failed to withdraw your application.');
      }
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to withdraw your application.'));
    }
  },
};
