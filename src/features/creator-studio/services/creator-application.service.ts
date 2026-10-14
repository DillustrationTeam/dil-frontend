import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api-error';
import type { ApiResponse } from '@/types/api.types';
import type {
  MyCreatorApplicationDto,
  SubmitCreatorApplicationRequest,
  SubmitCreatorApplicationResponse,
} from '@/features/creator-studio/types/creator-application.types';

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (response.error || response.data == null) {
    throw new Error(response.error?.details?.join(', ') || response.error?.detail || fallback);
  }
  return response.data;
}

export const creatorApplicationService = {
  async submitApplication(data: SubmitCreatorApplicationRequest): Promise<SubmitCreatorApplicationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<SubmitCreatorApplicationResponse>>('/creator-applications', data);
      return unwrap(response.data, 'Không thể gửi đơn ứng tuyển Creator.');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Không thể gửi đơn ứng tuyển Creator.'));
    }
  },

  async getMyApplication(): Promise<MyCreatorApplicationDto | null> {
    try {
      const response = await apiClient.get<ApiResponse<MyCreatorApplicationDto | null>>('/creator-applications/me');
      if (response.data.error) {
        throw new Error(response.data.error.details?.join(', ') || response.data.error.detail || 'Không thể tải trạng thái đơn.');
      }
      return response.data.data ?? null;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Không thể tải trạng thái đơn.'));
    }
  },

  async updateApplication(data: SubmitCreatorApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>('/creator-applications/me', data);
      if (response.data.error) {
        throw new Error(response.data.error.details?.join(', ') || response.data.error.detail || 'Không thể cập nhật đơn.');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Không thể cập nhật đơn.'));
    }
  },

  async withdrawApplication(): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>('/creator-applications/me');
      if (response.data.error) {
        throw new Error(response.data.error.details?.join(', ') || response.data.error.detail || 'Không thể thu hồi đơn.');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Không thể thu hồi đơn.'));
    }
  },
};