import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ArtworkInspectionDetailDto,
  ExecuteModerationDecisionRequest,
  ModerationQueueFilters,
  ModerationQueueItemDto,
  ModerationQueueResponse,
} from '@/features/admin/types/moderation.types';

export const adminModerationService = {
  /**
   * Lấy danh sách hàng đợi kiểm duyệt tác phẩm (SCR-20 / UC28)
   */
  async getModerationQueue(
    filters: ModerationQueueFilters
  ): Promise<ModerationQueueResponse> {
    const response = await apiClient.get<ApiResponse<ModerationQueueItemDto[]>>(
      '/admin/moderation/queue',
      {
        params: {
          status: filters.status,
          search: filters.search?.trim() || undefined,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch content moderation queue.'
      );
    }

    const rawMeta = response.data.meta as Record<string, unknown> | null;
    const page = Number(rawMeta?.page ?? filters.page);
    const pageSize = Number(rawMeta?.pageSize ?? filters.pageSize);
    const totalCount = Number(rawMeta?.totalCount ?? response.data.data.length);
    const totalPages = Number(
      rawMeta?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize))
    );
    const pendingCount = Number(rawMeta?.pendingCount ?? 0);

    return {
      items: response.data.data,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages,
        pendingCount,
      },
    };
  },

  /**
   * Xem chi tiết thanh tra tác phẩm kèm kết quả scan AI và danh sách tag (SCR-20)
   */
  async getArtworkInspectionDetail(
    artworkId: string
  ): Promise<ArtworkInspectionDetailDto> {
    const response = await apiClient.get<ApiResponse<ArtworkInspectionDetailDto>>(
      `/admin/moderation/${artworkId}`
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch artwork inspection details.'
      );
    }

    return response.data.data;
  },

  /**
   * Thực thi quyết định kiểm duyệt: Duyệt, Từ chối xóa, Ẩn, hoặc Gắn cờ tranh AI (SCR-20)
   */
  async executeModerationDecision(
    artworkId: string,
    payload: ExecuteModerationDecisionRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/moderation/${artworkId}/decision`,
      payload
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to execute moderation decision.'
      );
    }

    return response.data.data;
  },
};
