import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { Commission, CreateCommissionPayload } from '@/types/commission.types';

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
    const res = await apiClient.get<ApiResponse<Commission[]>>('/commissions/client');
    return res.data.data || [];
  },
    
  getByCreator: async () => {
    const res = await apiClient.get<ApiResponse<Commission[]>>('/commissions/creator');
    return res.data.data || [];
  },

  submitMilestone: async (id: string, milestoneId: string, url: string) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/commissions/${id}/milestones/${milestoneId}/submit`, { deliverableUrl: url });
    return res.data.data;
  }
};
