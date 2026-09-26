import { apiClient } from '@/lib/api-client';

/**
 * URL hub SignalR của Workroom Chat (UC43).
 *
 * VÌ SAO suy ra từ `apiClient` thay vì đọc lại `NEXT_PUBLIC_API_URL`: chỉ có MỘT nơi
 * cấu hình backend trong toàn app (xem `src/lib/api-client.ts`). Đọc lại biến môi trường
 * ở đây sẽ tạo nguồn thứ hai, lệch nhau lúc chạy thật.
 *
 * Hub nằm ở gốc host chứ không dưới tiền tố API → bỏ hậu tố `/api/v1`.
 */
export function chatHubUrl(): string {
  const baseUrl = String(apiClient.defaults.baseURL ?? '');
  return `${baseUrl.replace(/\/api\/v1\/?$/, '')}/hubs/chat`;
}
