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
  maxSlots?: number | null;
  activeOrderCount?: number;
  remainingSlots?: number | null;
};

export function getPackageSlotInfo(pkg: Pick<RateCardPackage, 'maxSlots' | 'activeOrderCount' | 'remainingSlots'>) {
  const isLimited = pkg.maxSlots !== null && pkg.maxSlots !== undefined;
  const maxSlots = isLimited ? Math.max(0, pkg.maxSlots as number) : null;
  const activeCount = pkg.activeOrderCount ?? 0;
  const remaining = maxSlots !== null ? Math.max(0, pkg.remainingSlots ?? maxSlots - activeCount) : null;
  const isFull = remaining !== null && remaining <= 0;
  const label = !isLimited
    ? 'Không giới hạn slot'
    : isFull
      ? `Hết slot (${activeCount}/${maxSlots})`
      : `Còn ${remaining}/${maxSlots} slot`;
  return { isLimited, maxSlots, activeCount, remaining, isFull, label };
}

export const creatorRateCardService = {
  async get(creatorId: string): Promise<RateCardPackage[]> {
    const response = await apiClient.get<ApiResponse<RateCardPackage[]>>(`/creator/${creatorId}/rate-card`);
    if (response.data.error) throw new Error(response.data.error.details?.join(', ') || 'Không thể tải bảng giá.');
    return (response.data.data ?? []).map((pkg) => ({
      ...pkg,
      maxSlots: pkg.maxSlots ?? null,
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
