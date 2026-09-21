import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { ChatAttachmentDto, ChatMessagesPage, ChatRoomDto, TranslationResultDto } from '../types/chat.types';

export const chatService = {
  async getRoom(roomId: string): Promise<ChatRoomDto> {
    const res = await apiClient.get<ApiResponse<ChatRoomDto>>(`/chat/rooms/${roomId}`);
    if (res.data.error || !res.data.data) {
      throw new Error(res.data.error?.details?.join(' · ') || res.data.error?.title || 'Không tải được thông tin phòng chat.');
    }
    return res.data.data;
  },

  async getMessages(roomId: string, cursor?: string, limit = 40): Promise<ChatMessagesPage> {
    const res = await apiClient.get<ApiResponse<ChatMessagesPage['items']>>(`/chat/rooms/${roomId}/messages`, {
      params: { cursor: cursor || undefined, limit },
    });
    if (res.data.error) {
      throw new Error(res.data.error?.details?.join(' · ') || res.data.error?.title || 'Không tải được tin nhắn.');
    }
    const meta = res.data.meta as { nextCursor?: string } | null;
    return {
      items: res.data.data ?? [],
      nextCursor: typeof meta?.nextCursor === 'string' ? meta.nextCursor : null,
    };
  },

  async markRead(roomId: string): Promise<void> {
    await apiClient.post(`/chat/rooms/${roomId}/read`);
  },

  async uploadAttachment(roomId: string, file: File, messageId?: string): Promise<ChatAttachmentDto | null> {
    const formData = new FormData();
    formData.append('file', file);
    if (messageId) formData.append('messageId', messageId);

    const res = await apiClient.post<ApiResponse<ChatAttachmentDto>>(`/chat/rooms/${roomId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data.error) {
      throw new Error(res.data.error?.details?.join(' · ') || 'Không thể tải tệp đính kèm lên.');
    }
    return res.data.data ?? null;
  },

  /** Dịch một tin nhắn; trả về bản dịch để cập nhật tại chỗ, không tải lại cả phòng. */
  async translateMessage(messageId: string, targetLang = 'vi', force = false): Promise<TranslationResultDto> {
    const res = await apiClient.post<ApiResponse<TranslationResultDto>>(`/chat/messages/${messageId}/translate`, {
      targetLang,
      force,
    });
    if (res.data.error || !res.data.data) {
      throw new Error(res.data.error?.details?.join(' · ') || 'Dịch tin nhắn thất bại.');
    }
    return res.data.data;
  },
};
