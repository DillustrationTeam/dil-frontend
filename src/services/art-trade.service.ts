import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ArtTradeDto,
  ArtTradeSummaryDto,
  CreatorSearchItemDto,
  CreateArtTradePayload,
  RespondTradeProposalPayload,
  CancelTradePayload,
  TradeSlotStatusDto,
  TradeDownloadUrlDto,
} from '@/types/art-trade.types';

export const artTradeService = {
  getById: async (id: string): Promise<ArtTradeDto> => {
    const res = await apiClient.get<ApiResponse<ArtTradeDto>>(`/art-trades/${id}`);
    if (!res.data.data) throw new Error('Trade not found');
    return res.data.data;
  },

  searchCreators: async (query?: string, limit = 10): Promise<CreatorSearchItemDto[]> => {
    const res = await apiClient.get<ApiResponse<CreatorSearchItemDto[]>>('/art-trades/creators/search', {
      params: { query: query || undefined, limit },
    });
    return res.data.data ?? [];
  },

  getMyTrades: async (status?: string, page = 1, pageSize = 10): Promise<{ items: ArtTradeSummaryDto[]; totalCount: number }> => {
    const res = await apiClient.get<ApiResponse<ArtTradeSummaryDto[]>>('/art-trades/my-trades', {
      params: { status, page, pageSize },
    });
    return {
      items: res.data.data ?? [],
      totalCount: Number(res.data.meta?.totalCount ?? 0),
    };
  },

  getMySlotStatus: async (): Promise<TradeSlotStatusDto> => {
    const res = await apiClient.get<ApiResponse<TradeSlotStatusDto>>('/art-trades/my-slots');
    if (!res.data.data) throw new Error('Unable to fetch slot status');
    return res.data.data;
  },

  propose: async (payload: CreateArtTradePayload): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>('/art-trades', payload);
    if (!res.data.data) throw new Error('Failed to propose trade');
    return res.data.data;
  },

  respond: async (id: string, payload: RespondTradeProposalPayload): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/respond`, payload);
    if (!res.data.data) throw new Error('Failed to respond to trade');
    return res.data.data;
  },

  confirmProposal: async (id: string): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/confirm-proposal`);
    if (!res.data.data) throw new Error('Failed to confirm proposal');
    return res.data.data;
  },

  submitArtwork: async (id: string, file: File, artworkTitle?: string): Promise<ArtTradeDto> => {
    const formData = new FormData();
    formData.append('file', file);
    if (artworkTitle) {
      formData.append('artworkTitle', artworkTitle);
    }

    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/artwork`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res.data.data) throw new Error('Failed to upload artwork');
    return res.data.data;
  },

  removeArtwork: async (id: string): Promise<ArtTradeDto> => {
    const res = await apiClient.delete<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/artwork`);
    if (!res.data.data) throw new Error('Failed to remove artwork');
    return res.data.data;
  },

  confirm: async (id: string, side?: 'initiator' | 'receiver'): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/confirm`, null, {
      params: side ? { side } : undefined,
    });
    if (!res.data.data) throw new Error('Failed to confirm satisfaction');
    return res.data.data;
  },

  cancel: async (id: string, payload: CancelTradePayload): Promise<ArtTradeDto> => {
    const res = await apiClient.post<ApiResponse<ArtTradeDto>>(`/art-trades/${id}/cancel`, payload);
    if (!res.data.data) throw new Error('Failed to cancel trade');
    return res.data.data;
  },

  getDownloadUrl: async (id: string): Promise<TradeDownloadUrlDto> => {
    const res = await apiClient.get<ApiResponse<TradeDownloadUrlDto>>(`/art-trades/${id}/download-url`);
    if (!res.data.data) throw new Error('Failed to obtain download URL');
    return res.data.data;
  },

  uploadAttachment: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/art-trades/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res.data.data?.url) throw new Error('Failed to upload attachment');
    return res.data.data.url;
  },

  createDispute: async (payload: {
    artTradeId: string;
    category?: string;
    reason: string;
    evidenceUrls?: string[];
  }): Promise<{ message: string; disputeId: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string; disputeId: string }>>(
      '/trade-disputes',
      payload
    );
    if (!res.data.data) throw new Error('Failed to submit dispute');
    return res.data.data;
  },
};

