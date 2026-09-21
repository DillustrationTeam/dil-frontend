import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { NotificationDto, NotificationPage } from '../types/notification.types';

export const notificationService = {
  async list(isRead?: boolean, notificationType?: string, cursor?: string, limit = 20): Promise<NotificationPage> {
    const res = await apiClient.get<ApiResponse<NotificationDto[]>>('/notifications', {
      params: {
        isRead: isRead === undefined ? undefined : isRead,
        notificationType: notificationType || undefined,
        cursor: cursor || undefined,
        limit,
      },
    });

    if (res.data.error) {
      throw new Error(res.data.error.details?.join(' · ') || res.data.error.title || 'Không tải được thông báo.');
    }

    const raw = res.data.data as any;
    const items: NotificationDto[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
    const meta = res.data.meta as { unreadCount?: number; nextCursor?: string } | null;
    const nextCursor = typeof meta?.nextCursor === 'string'
      ? meta.nextCursor
      : (typeof raw?.nextCursor === 'string' ? raw.nextCursor : null);

    return {
      items,
      unreadCount: typeof meta?.unreadCount === 'number' ? meta.unreadCount : (typeof raw?.unreadCount === 'number' ? raw.unreadCount : 0),
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
