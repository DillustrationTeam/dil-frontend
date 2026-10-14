import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  DisputeArbitrationDetailDto,
  DisputeQueueFilters,
  DisputeQueueItemDto,
  DisputeQueueResponse,
  ResolveDisputeArbitrationRequest,
} from '@/features/admin/types/dispute-arbitration.types';

export const adminDisputeService = {
  /**
   * Lấy danh sách hàng đợi các vụ khiếu nại tranh chấp cần xử lý (SCR-22 / UC30)
   */
  async getDisputeQueue(
    filters?: Partial<DisputeQueueFilters>
  ): Promise<DisputeQueueResponse> {
    const status = filters?.status || 'All';
    const search = filters?.search?.trim() || undefined;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;

    const response = await apiClient.get<ApiResponse<DisputeQueueItemDto[]>>(
      '/admin/disputes/queue',
      {
        params: {
          status,
          search: search || undefined,
          page,
          pageSize,
        },
      }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch dispute queue.'
      );
    }

    const rawMeta = response.data.meta as Record<string, unknown> | null;
    const totalLockedEscrow = Number(rawMeta?.totalLockedEscrow ?? 0);
    const totalCount = Number(rawMeta?.totalCount ?? 0);
    const totalPages = Number(rawMeta?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));
    const pendingCount = Number(rawMeta?.pendingCount ?? 0);
    const underReviewCount = Number(rawMeta?.underReviewCount ?? 0);
    const resolvedCount = Math.max(0, totalCount - pendingCount - underReviewCount);

    return {
      items: response.data.data,
      meta: {
        page: Number(rawMeta?.page ?? page),
        pageSize: Number(rawMeta?.pageSize ?? pageSize),
        totalCount,
        totalPages,
        pendingCount,
        underReviewCount,
        resolvedCount,
        totalLockedEscrow,
      },
    };
  },

  /**
   * Xem chi tiết hồ sơ trọng tài tranh chấp (claims, escrow, milestones, chat snapshot) (SCR-22 / UC30)
   */
  async getDisputeDetail(id: string): Promise<DisputeArbitrationDetailDto> {
    const response = await apiClient.get<ApiResponse<DisputeArbitrationDetailDto>>(
      `/admin/disputes/${id}`
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch dispute arbitration details.'
      );
    }

    const data = response.data.data;
    if (data.clientRefundPercent == null && data.status === 'Resolved') {
      const split = /^Split_([\d.]+)_([\d.]+)$/.exec(data.resolution ?? '');
      if (split) {
        data.clientRefundPercent = Number(split[1]);
      } else if (data.resolution === 'ClientWin100') {
        data.clientRefundPercent = 100;
      } else if (data.resolution === 'ArtistWin100') {
        data.clientRefundPercent = 0;
      } else {
        const refund = data.clientRefundAmount ?? 0;
        const escrow = data.escrowHeldAmount ?? 0;
        data.clientRefundPercent = escrow > 0 ? Math.round((refund / escrow) * 100) : 50;
      }
    }

    return data;
  },

  /**
   * Thực thi phán quyết trọng tài & phân bổ tiền ký quỹ Escrow nguyên tử (SCR-22 / UC30)
   */
  async resolveDispute(
    id: string,
    payload: ResolveDisputeArbitrationRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/disputes/${id}/arbitrate`,
      payload
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to resolve dispute.'
      );
    }

    return response.data.data;
  },
};
