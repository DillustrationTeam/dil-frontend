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
  requestRevision: async (id: string, milestoneId: string, feedbackComment: string, revisionFeedbackImageUrl?: string, revisionAnnotationsJson?: string) =>
    apiClient.post(`/commissions/${id}/milestones/${milestoneId}/request-revision`, { feedbackComment, revisionFeedbackImageUrl, revisionAnnotationsJson }),

  deliverFinal: async (id: string, files: File | File[]) => {
    const list = Array.isArray(files) ? files : [files];
    const body = new FormData();
    for (const file of list) {
      body.append('files', file);
    }
    const res = await apiClient.post<ApiResponse<Commission>>(`/commissions/${id}/deliver`, body);
    return res.data.data;
  },
  getDeliverables: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{
      version: string;
      totalBytes: number;
      files: Array<{ id: string; name: string; sizeBytes: number; sha256: string; uploadedAt: string }>;
    }>>(`/commissions/${id}/deliverables`);
    return res.data.data;
  },
  deleteDeliverable: async (id: string, fileId: string) => {
    const res = await apiClient.delete<ApiResponse<{
      version: string;
      totalBytes: number;
      files: Array<{ id: string; name: string; sizeBytes: number; sha256: string; uploadedAt: string }>;
    }>>(`/commissions/${id}/deliverables/${encodeURIComponent(fileId)}`);
    return res.data.data;
  },
  complete: async (id: string, expectedManifestVersion?: string) =>
    apiClient.patch(`/commissions/${id}/complete`, undefined, {
      params: expectedManifestVersion ? { expectedManifestVersion } : undefined,
    }),
  getWipPreviewUrl: async (id: string, milestoneId: string) => {
    const res = await apiClient.get<ApiResponse<{ previewUrl: string }>>(`/commissions/${id}/milestones/${milestoneId}/preview`);
    return res.data.data?.previewUrl as string;
  },
  getFinalDownloadUrl: async (id: string, fileId?: string) => {
    const res = await apiClient.get<ApiResponse<{ downloadUrl: string; expiresAt: string }>>(`/commissions/${id}/final/download`, {
      params: fileId ? { fileId } : undefined,
    });
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
  rename: async (id: string, title: string) => {
    const res = await apiClient.patch<ApiResponse<{
      commissionId: string;
      newTitle: string;
      updatedBy: string;
      roomId?: string;
      messageId?: string;
      messageBody?: string;
      sentAt?: string;
    }>>(`/commissions/${id}/rename`, { title });
    return res.data.data;
  },
  sendTip: async (id: string, payload: { amount: number; message?: string }) => {
    const res = await apiClient.post<ApiResponse<{
      commissionId: string;
      amount: number;
      clientRemainingBalance: number;
      creatorName: string;
      createdAt: string;
      message?: string;
    }>>(`/commissions/${id}/tip`, payload);
    return res.data.data;
  },
  replyReview: async (id: string, replyComment: string) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/reviews/reply`, { replyComment });
    return res.data.data;
  },
  createDispute: async (id: string, payload: { reason: string; evidenceUrls?: string[] }) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/disputes`, payload);
    return res.data.data;
  },
  getDispute: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Dispute>>(`/commissions/${id}/disputes`);
    return res.data.data as Dispute;
  },
};
