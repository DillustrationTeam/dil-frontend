import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  PlatformFeePolicyDto,
  UpdatePlatformFeePolicyRequest,
} from '@/features/admin/types/platform-fee.types';

export const adminPlatformFeeService = {
  /**
   * Lấy thông số tỷ lệ phí sàn và các chính sách vận hành hiện tại (SCR-18 / UC33).
   */
  async getPlatformFeePolicy(): Promise<PlatformFeePolicyDto> {
    const response = await apiClient.get<ApiResponse<PlatformFeePolicyDto>>(
      '/admin/platform-config'
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
        response.data.error?.title ||
        'Failed to fetch platform fee and policy configuration.'
      );
    }

    return response.data.data;
  },

  /**
   * Cập nhật tỷ lệ phí hoa hồng sàn (5% - 15%) và các chính sách Escrow/Revision/URL (SCR-18).
   */
  async updatePlatformFeePolicy(
    payload: UpdatePlatformFeePolicyRequest
  ): Promise<PlatformFeePolicyDto> {
    const response = await apiClient.put<ApiResponse<PlatformFeePolicyDto>>(
      '/admin/platform-config',
      payload
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
        response.data.error?.title ||
        'Failed to update platform fee and policy configuration.'
      );
    }

    return response.data.data;
  },
};
