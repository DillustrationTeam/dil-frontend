import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export type RateCardMilestone = { sequence: number; title: string; price: number };
export type RateCardPackage = { id: string; name: string; description?: string | null; price: number; milestones: RateCardMilestone[] };

export const creatorRateCardService = {
  async get(creatorId: string): Promise<RateCardPackage[]> {
    const response = await apiClient.get<ApiResponse<RateCardPackage[]>>(`/creator/${creatorId}/rate-card`);
    if (response.data.error) throw new Error(response.data.error.details?.join(', ') || 'Không thể tải bảng giá.');
    return response.data.data ?? [];
  },
  async save(packages: RateCardPackage[]): Promise<RateCardPackage[]> {
    const response = await apiClient.put<ApiResponse<RateCardPackage[]>>('/creator/me/rate-card', { packages });
    if (response.data.error) throw new Error(response.data.error.details?.join(', ') || 'Không thể lưu bảng giá.');
    return response.data.data ?? [];
  },
};
