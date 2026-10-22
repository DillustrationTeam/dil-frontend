import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { z } from 'zod';

import type { AddonStage, AddonPreset, CreatorAddon, CommissionAddon } from '@/types/addon.types';
export type { AddonStage, AddonPreset, CreatorAddon, CommissionAddon } from '@/types/addon.types';
export const addonSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tên phụ phí').max(200),
  price: z.number().int().positive('Giá phải lớn hơn 0').max(999999999999),
  allowedMilestone: z.enum(['Sketch', 'Lineart', 'Final', 'Any']),
  extendDays: z.number().int().min(0).max(365),
});
export type AddonValues = z.infer<typeof addonSchema>;
async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await request;
  if (data.error || data.data == null) throw new Error('Không tải được phụ phí.');
  return data.data;
}
export const addonService = {
  presets: () => unwrap(apiClient.get<ApiResponse<AddonPreset[]>>('/creators/addons/presets')),
  creator: (id: string) => unwrap(apiClient.get<ApiResponse<CreatorAddon[]>>(`/creators/${id}/addons`)),
  save: (values: AddonValues & { id?: string; packageId?: string | null; presetKey?: string | null; isActive?: boolean }) => unwrap(apiClient.post<ApiResponse<CreatorAddon>>('/creators/addons', values)),
  list: (id: string) => unwrap(apiClient.get<ApiResponse<CommissionAddon[]>>(`/commissions/${id}/addons`)),
  propose: (id: string, values: AddonValues & { creatorAddonId?: string }) => unwrap(apiClient.post<ApiResponse<CommissionAddon>>(`/commissions/${id}/addons/propose`, values)),
  respond: (id: string, addonId: string, action: 'Accept' | 'Reject') => unwrap(apiClient.post<ApiResponse<CommissionAddon>>(`/commissions/${id}/addons/${addonId}/respond`, { action })),
};
export const addonStage = (sequence: number, count: number): AddonStage => sequence === 1 ? 'Sketch' : sequence === count ? 'Final' : 'Lineart';
export const addonMoney = (price: number) => `${price.toLocaleString('vi-VN')} VND`;
