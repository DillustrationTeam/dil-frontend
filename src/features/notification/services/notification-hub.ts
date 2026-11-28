import { hubUrl } from '@/lib/realtime-url';

/**
 * URL hub SignalR của Notification Center (UC45).
 * WebSocket không proxy qua Next được → dùng `NEXT_PUBLIC_SIGNALR_URL`.
 * Trả chuỗi rỗng khi chưa cấu hình để hook bỏ qua kết nối.
 */
export function notificationHubUrl(): string {
  return hubUrl('/hubs/notifications');
}
