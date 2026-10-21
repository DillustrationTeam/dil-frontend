import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  Commission,
  CreateCommissionPayload,
  Dispute,
  RespondToCommissionPayload,
} from '@/types/commission.types';

async function getAll(role: 'Client' | 'Creator', status?: string): Promise<Commission[]> {
  const items: Commission[] = [];
  for (let page = 1; ; page++) {
    const response = await apiClient.get<ApiResponse<Commission[]>>('/commissions', {
      params: { role, status, page, pageSize: 100 },
    });
    items.push(...(response.data.data ?? []));
    const totalPages = Number(response.data.meta?.totalPages ?? page);
    if (page >= totalPages) return items;
  }
}

export const commissionService = {
  create: async (data: CreateCommissionPayload) => {
    const res = await apiClient.post<ApiResponse<Commission>>('/commissions', data);
    return res.data.data as Commission;
  },
  
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Commission>>(`/commissions/${id}`);
    return res.data.data as Commission;
  },
    
  getByClient: async () => getAll('Client'),
    
  getByCreator: async () => getAll('Creator'),

  getCreatorRequests: async () => getAll('Creator', 'PendingAcceptance'),

  respond: async (id: string, data: RespondToCommissionPayload) => {
    const res = await apiClient.patch<ApiResponse<Commission>>(`/commissions/${id}/respond`, data);
    return res.data.data as Commission;
  },

  respondToCounteroffer: async (id: string, accept: boolean) => {
    const res = await apiClient.patch<ApiResponse<Commission>>(`/commissions/${id}/counteroffer`, { accept });
    return res.data.data as Commission;
  },

  depositEscrow: async (id: string) => {
    const res = await apiClient.post<ApiResponse<Commission>>(`/commissions/${id}/escrow/deposit`, undefined, {
      params: { paymentMethod: 'Wallet' },
    });
    return res.data.data as Commission;
  },

  acceptWorkroomTerms: async (id: string) => {
    const res = await apiClient.post<ApiResponse<Commission>>(`/commissions/${id}/workroom-terms/accept`);
    return res.data.data as Commission;
  },

  submitMilestone: async (id: string, milestoneId: string, file: File, creatorNote?: string) => {
    const body = new FormData();
    body.append('file', file);
    if (creatorNote) body.append('creatorNote', creatorNote);
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/milestones/${milestoneId}/submit`, body);
    return res.data.data;
  },
  approveMilestone: async (id: string, milestoneId: string) => apiClient.patch(`/commissions/${id}/milestones/${milestoneId}/approve`),
  requestRevision: async (id: string, milestoneId: string, feedbackComment: string) =>
    apiClient.post(`/commissions/${id}/milestones/${milestoneId}/request-revision`, { feedbackComment }),
  deliverFinal: async (id: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post(`/commissions/${id}/deliver`, body);
  },
  complete: async (id: string) => apiClient.patch(`/commissions/${id}/complete`),
  getWipPreviewUrl: async (id: string, milestoneId: string) => {
    const res = await apiClient.get<ApiResponse<{ previewUrl: string }>>(`/commissions/${id}/milestones/${milestoneId}/preview`);
    return res.data.data?.previewUrl as string;
  },
  getFinalDownloadUrl: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ downloadUrl: string; expiresAt: string }>>(`/commissions/${id}/final/download`);
    return res.data.data as { downloadUrl: string; expiresAt: string };
  },
  cancelWithPolicy: async (id: string, payload: { cancellationReason: string; details?: string }) => {
    const res = await apiClient.post<ApiResponse<Commission>>(`/commissions/${id}/cancel`, payload);
    return res.data.data as Commission;
  },
  respondCancellationRequest: async (id: string, approve: boolean) => {
    const res = await apiClient.patch<ApiResponse<Commission>>(`/commissions/${id}/cancellation-request`, { approve });
    return res.data.data as Commission;
  },
  createReview: async (id: string, payload: { rating: number; comment?: string; attachedImageUrls?: string[] }) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/reviews`, payload);
    return res.data.data;
  },
  replyReview: async (id: string, replyComment: string) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/reviews/reply`, { replyComment });
    return res.data.data;
  },
  createDispute: async (id: string, payload: { reason: string; evidenceUrls?: string[]; claimantRefundPercent?: number }) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/disputes`, payload);
    return res.data.data;
  },
  respondDispute: async (id: string, payload: { action: 'Accept' | 'Counter'; counterRefundPercent?: number; response?: string; evidenceUrls?: string[] }) => {
    const res = await apiClient.post<ApiResponse<Dispute>>(`/commissions/${id}/disputes/respond`, payload);
    return res.data.data;
  },
  getDispute: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Dispute>>(`/commissions/${id}/disputes`);
    return res.data.data as Dispute;
  },
};
