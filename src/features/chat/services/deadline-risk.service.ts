import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { DeadlineRiskDto } from '../types/deadline-risk.types';

/**
 * Hai endpoint UC46 dùng cho widget tiến độ trên Workroom (SCR-46).
 *
 * Route nằm ngoài tiền tố `/ai` (backend dùng route tuyệt đối
 * `~/api/v1/commissions/{id}/deadline-risks`) nên gọi thẳng như dưới đây.
 */
async function request<T>(method: 'get' | 'post', url: string, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.request<ApiResponse<T>>({ method, url, signal, timeout: 30000 });

  if (res.data.error || res.data.data === null) {
    throw new Error(
      res.data.error?.details?.join(' · ')
        || res.data.error?.title
        || 'Không tải được dữ liệu tiến độ của đơn hàng.',
    );
  }

  return res.data.data;
}

export const deadlineRiskService = {
  /** Đọc đánh giá rủi ro đã lưu (nhanh, không gọi AI). */
  get: (commissionId: string, signal?: AbortSignal) =>
    request<DeadlineRiskDto>('get', `/commissions/${commissionId}/deadline-risks`, signal),

  /** Yêu cầu AI chấm lại rủi ro theo lịch sử vẽ của Artist (chậm hơn). */
  predict: (commissionId: string) =>
    request<DeadlineRiskDto>('post', `/commissions/${commissionId}/deadline-risks/predict`),
};
