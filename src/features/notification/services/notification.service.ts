import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { NotificationDto, NotificationPage } from '../types/notification.types';

export interface NotificationListOptions {
  isRead?: boolean;
  /** Lọc theo một loại cụ thể (`NotificationType`). */
  notificationType?: string;
  /** Lọc theo nhóm tab của Notification Center (`NotificationCategory`, SCR-45). */
  category?: string;
  cursor?: string;
  limit?: number;
}

export const notificationService = {
  async list(options: NotificationListOptions = {}): Promise<NotificationPage> {
    const { isRead, notificationType, category, cursor, limit = 20 } = options;

    const res = await apiClient.get<ApiResponse<NotificationDto[]>>('/notifications', {
      params: {
        isRead,
        notificationType: notificationType || undefined,
        category: category || undefined,
        cursor: cursor || undefined,
        limit,
      },
    });

    if (res.data.error) {
      throw new Error(res.data.error.details?.join(' · ') || res.data.error.title || 'Không tải được thông báo.');
    }

    // Backend trả `data` là mảng; vẫn chấp nhận dạng bọc `{ items, nextCursor }` để không vỡ
    // nếu envelope đổi shape (giữ nguyên hành vi phòng thủ của bản cũ).
    const raw: unknown = res.data.data;
    const wrapped = raw as { items?: NotificationDto[]; nextCursor?: string; unreadCount?: number } | null;
    const items: NotificationDto[] = Array.isArray(raw)
      ? (raw as NotificationDto[])
      : (Array.isArray(wrapped?.items) ? wrapped.items : []);

    const meta = res.data.meta as { unreadCount?: number; nextCursor?: string } | null;
    const nextCursor = typeof meta?.nextCursor === 'string'
      ? meta.nextCursor
      : (typeof wrapped?.nextCursor === 'string' ? wrapped.nextCursor : null);

    return {
      items,
      unreadCount: typeof meta?.unreadCount === 'number'
        ? meta.unreadCount
        : (typeof wrapped?.unreadCount === 'number' ? wrapped.unreadCount : 0),
      nextCursor,
    };
  },

  async unreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    if (res.data.error) throw new Error('Không lấy được số thông báo chưa đọc.');
    return res.data.data?.unreadCount ?? 0;
  },

  async markRead(id: string): Promise<void> {
    const res = await apiClient.put<ApiResponse<unknown>>(`/notifications/${id}/read`);
    if (res.data.error) throw new Error('Không thể đánh dấu đã đọc.');
  },

  async markAllRead(): Promise<void> {
    const res = await apiClient.put<ApiResponse<unknown>>('/notifications/read-all');
    if (res.data.error) throw new Error('Không thể đánh dấu tất cả là đã đọc.');
  },
};
