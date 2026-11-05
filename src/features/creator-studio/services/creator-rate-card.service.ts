import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export type RateCardMilestone = { sequence: number; title: string; price: number; maxRevisions?: number };
export type RateCardPackage = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  milestones: RateCardMilestone[];
  maxRevisions?: number;
  extraRevisionPrice?: number;
  sampleUrls?: string[];
  orderCount?: number;
};

export const creatorRateCardService = {
  async get(creatorId: string): Promise<RateCardPackage[]> {
    const response = await apiClient.get<ApiResponse<RateCardPackage[]>>(`/creator/${creatorId}/rate-card`);
    if (response.data.error) throw new Error(response.data.error.details?.join(', ') || 'Không thể tải bảng giá.');
    return (response.data.data ?? []).map((pkg) => ({
      ...pkg,
      sampleUrls: Array.isArray(pkg.sampleUrls) ? pkg.sampleUrls : [],
      milestones: Array.isArray(pkg.milestones) && pkg.milestones.length > 0
        ? pkg.milestones
        : [{ sequence: 1, title: 'Hoàn thiện (Final)', price: pkg.price ?? 0, maxRevisions: pkg.maxRevisions ?? 2 }],
    }));
  },
  async save(packages: RateCardPackage[]): Promise<RateCardPackage[]> {
    const response = await apiClient.put<ApiResponse<RateCardPackage[]>>('/creator/me/rate-card', { packages });
    if (response.data.error) throw new Error(response.data.error.details?.join(', ') || 'Không thể lưu bảng giá.');
    return response.data.data ?? [];
  },
};
