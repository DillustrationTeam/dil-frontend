import { apiClient } from '@/lib/api-client';

/**
 * URL hub SignalR của Notification Center (UC45).
 *
 * Suy ra từ `apiClient` để chỉ có MỘT nguồn cấu hình backend trong app
 * (xem `src/lib/api-client.ts`); hub nằm ở gốc host nên bỏ hậu tố `/api/v1`.
 */
export function notificationHubUrl(): string {
  const baseUrl = String(apiClient.defaults.baseURL ?? '');
  return `${baseUrl.replace(/\/api\/v1\/?$/, '')}/hubs/notifications`;
}
