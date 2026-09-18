import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  Commission,
  CreateCommissionPayload,
  RespondToCommissionPayload,
} from '@/types/commission.types';

export const commissionService = {
  create: async (data: CreateCommissionPayload) => {
    const res = await apiClient.post<ApiResponse<Commission>>('/commissions', data);
    return res.data.data as Commission;
  },
  
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Commission>>(`/commissions/${id}`);
    return res.data.data as Commission;
  },
    
  getByClient: async () => {
    const res = await apiClient.get<ApiResponse<Commission[]>>('/commissions', {
      params: { role: 'Client', pageSize: 50 },
    });
    return res.data.data || [];
  },
    
  getByCreator: async () => {
    const res = await apiClient.get<ApiResponse<Commission[]>>('/commissions', {
      params: { role: 'Creator', pageSize: 50 },
    });
    return res.data.data || [];
  },

  getCreatorRequests: async () => {
    const res = await apiClient.get<ApiResponse<Commission[]>>('/commissions', {
      params: { role: 'Creator', status: 'PendingAcceptance', pageSize: 50 },
    });
    return res.data.data || [];
  },

  respond: async (id: string, data: RespondToCommissionPayload) => {
    const res = await apiClient.patch<ApiResponse<Commission>>(`/commissions/${id}/respond`, data);
    return res.data.data as Commission;
  },

  depositEscrow: async (id: string, paymentMethod: string) => {
    const res = await apiClient.post<ApiResponse<Commission>>(`/commissions/${id}/escrow/deposit`, undefined, {
      params: { paymentMethod },
    });
    return res.data.data as Commission;
  },

  submitMilestone: async (id: string, milestoneId: string, url: string) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/milestones/${milestoneId}/submit`, { deliverableUrl: url });
    return res.data.data;
  }
};
