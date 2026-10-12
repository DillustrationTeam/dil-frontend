import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  DisputeArbitrationDetailDto,
  DisputeQueueFilters,
  DisputeQueueItemDto,
  DisputeQueueResponse,
  ResolveDisputeArbitrationRequest,
  ResolveSubmissionDisputeRequest,
  SubmissionDisputeDto,
  SubmissionDisputeQueueFilters,
  SubmissionDisputeQueueResponse,
} from '@/features/admin/types/dispute-arbitration.types';

export const adminDisputeService = {
  // =========================================================================
  // 1. COMMISSION DISPUTES (TRANH CHẤP ĐƠN ĐẶT VẼ & ESCROW)
  // =========================================================================

  /**
   * Lấy danh sách hàng đợi các vụ khiếu nại tranh chấp đơn hàng cần xử lý (SCR-22 / UC30)
   */
  async getDisputeQueue(
    filters?: Partial<DisputeQueueFilters>
  ): Promise<DisputeQueueResponse> {
    const status = filters?.status || 'All';
    const search = filters?.search?.trim() || undefined;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;

    const response = await apiClient.get<ApiResponse<DisputeQueueItemDto[]>>(
      '/admin/disputes/commissions',
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
   * Xem chi tiết hồ sơ trọng tài tranh chấp đơn vẽ (claims, escrow, milestones, chat snapshot) (SCR-22 / UC30)
   */
  async getDisputeDetail(id: string): Promise<DisputeArbitrationDetailDto> {
    const response = await apiClient.get<ApiResponse<DisputeArbitrationDetailDto>>(
      `/admin/disputes/commissions/${id}`
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
      const refund = data.clientRefundAmount ?? 0;
      const payout = data.artistPayAmount ?? 0;
      const total = refund + payout > 0 ? refund + payout : (data.escrowHeldAmount || data.finalPrice);
      if (total > 0) {
        data.clientRefundPercent = Math.round((refund / total) * 100);
      } else if (data.resolution === 'ClientWin100') {
        data.clientRefundPercent = 100;
      } else if (data.resolution === 'ArtistWin100') {
        data.clientRefundPercent = 0;
      } else {
        data.clientRefundPercent = 50;
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
      `/admin/disputes/commissions/${id}/resolve`,
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

  // =========================================================================
  // 2. SUBMISSION DISPUTES (KHIẾU NẠI BÀI THI SỰ KIỆN)
  // =========================================================================

  /**
   * Lấy danh sách hàng đợi các khiếu nại bài thi sự kiện
   */
  async getSubmissionDisputeQueue(
    filters?: Partial<SubmissionDisputeQueueFilters>
  ): Promise<SubmissionDisputeQueueResponse> {
    const status = filters?.status && filters.status !== 'All' ? filters.status : undefined;
    const category = filters?.category && filters.category !== 'All' ? filters.category : undefined;
    const eventId = filters?.eventId || undefined;
    const submissionId = filters?.submissionId || undefined;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;

    const response = await apiClient.get<ApiResponse<SubmissionDisputeDto[]>>(
      '/admin/disputes/submissions',
      {
        params: {
          eventId,
          submissionId,
          status,
          category,
          page,
          pageSize,
        },
      }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch submission dispute queue.'
      );
    }

    const rawMeta = response.data.meta as Record<string, unknown> | null;
    const totalCount = Number(rawMeta?.totalCount ?? 0);
    const totalPages = Number(rawMeta?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

    return {
      items: response.data.data,
      meta: {
        page: Number(rawMeta?.page ?? page),
        pageSize: Number(rawMeta?.pageSize ?? pageSize),
        totalCount,
        totalPages,
      },
    };
  },

  /**
   * Xem chi tiết một khiếu nại bài thi sự kiện
   */
  async getSubmissionDisputeDetail(id: string): Promise<SubmissionDisputeDto> {
    const response = await apiClient.get<ApiResponse<SubmissionDisputeDto>>(
      `/admin/disputes/submissions/${id}`
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to fetch submission dispute details.'
      );
    }

    return response.data.data;
  },

  /**
   * Phán quyết xử lý khiếu nại bài thi sự kiện (Dismiss, Disqualify, AdjustScore, DeductVotes)
   */
  async resolveSubmissionDispute(
    id: string,
    payload: ResolveSubmissionDisputeRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/disputes/submissions/${id}/resolve`,
      payload
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
          response.data.error?.title ||
          'Failed to resolve submission dispute.'
      );
    }

    return response.data.data;
  },
};
