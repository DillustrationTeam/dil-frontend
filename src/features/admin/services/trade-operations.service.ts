import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { ArtTradeDto } from '@/types/art-trade.types';
import {
  AdminTradeListParams,
  AdminTradeListResponse,
  AdminDisputeListParams,
  AdminDisputeListResponse,
  TradeDisputeDto,
  ResolveTradeDisputePayload,
} from '../types/trade-operations.types';

export const tradeOperationsService = {
  getTrades: async (params?: AdminTradeListParams): Promise<AdminTradeListResponse> => {
    const res = await apiClient.get<ApiResponse<ArtTradeDto[]>>('/admin/trades', {
      params: {
        status: params?.status === 'ALL' ? undefined : params?.status,
        search: params?.search?.trim() || undefined,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    });

    const meta = res.data.meta as unknown as {
      page?: number;
      pageSize?: number;
      totalCount?: number;
      totalPages?: number;
      activeCount?: number;
      completedCount?: number;
      disputedCount?: number;
      cancelledCount?: number;
    };

    return {
      items: res.data.data ?? [],
      meta: {
        page: Number(meta?.page ?? 1),
        pageSize: Number(meta?.pageSize ?? 10),
        totalCount: Number(meta?.totalCount ?? 0),
        totalPages: Number(meta?.totalPages ?? 1),
        activeCount: Number(meta?.activeCount ?? 0),
        completedCount: Number(meta?.completedCount ?? 0),
        disputedCount: Number(meta?.disputedCount ?? 0),
        cancelledCount: Number(meta?.cancelledCount ?? 0),
      },
    };
  },

  getTradeById: async (id: string): Promise<ArtTradeDto> => {
    const res = await apiClient.get<ApiResponse<ArtTradeDto>>(`/art-trades/${id}`);
    if (!res.data.data) throw new Error('Không tìm thấy giao dịch trao đổi.');
    return res.data.data;
  },

  forceCancelTrade: async (
    id: string,
    payload: { reason: string; isViolation?: boolean; violatorUserId?: string }
  ): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/admin/trades/${id}/force-cancel`, payload);
    if (!res.data.data) throw new Error('Không thể cưỡng chế hủy giao dịch.');
    return res.data.data;
  },

  getDisputes: async (params?: AdminDisputeListParams): Promise<AdminDisputeListResponse> => {
    const res = await apiClient.get<ApiResponse<TradeDisputeDto[]>>('/admin/disputes/trades', {
      params: {
        status: params?.status === 'ALL' ? undefined : params?.status,
        category: params?.category === 'ALL' ? undefined : params?.category,
        artTradeId: params?.artTradeId || undefined,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    });

    const meta = res.data.meta as unknown as {
      page?: number;
      pageSize?: number;
      totalCount?: number;
      totalPages?: number;
    };

    return {
      items: res.data.data ?? [],
      meta: {
        page: Number(meta?.page ?? 1),
        pageSize: Number(meta?.pageSize ?? 10),
        totalCount: Number(meta?.totalCount ?? 0),
        totalPages: Number(meta?.totalPages ?? 1),
      },
    };
  },

  getDisputeById: async (id: string): Promise<TradeDisputeDto> => {
    const res = await apiClient.get<ApiResponse<TradeDisputeDto>>(`/admin/disputes/trades/${id}`);
    if (!res.data.data) throw new Error('Không tìm thấy khiếu nại tranh chấp.');
    return res.data.data;
  },

  resolveDispute: async (id: string, payload: ResolveTradeDisputePayload): Promise<void> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/disputes/trades/${id}/resolve`,
      payload
    );
    if (res.data.error) throw new Error(res.data.error.detail || res.data.error.title || 'Không thể phân xử khiếu nại.');
  },
};
