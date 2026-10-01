import { apiClient } from '@/lib/api-client';

/**
 * Trả về URL hub SignalR cho Auction Module (`/hubs/auctions`).
 * Suy ra từ `apiClient` để đồng bộ URL máy chủ backend.
 */
export function auctionHubUrl(): string {
  const baseUrl = String(apiClient.defaults.baseURL ?? '');
  return `${baseUrl.replace(/\/api\/v1\/?$/, '')}/hubs/auctions`;
}
