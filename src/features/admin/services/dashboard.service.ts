import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  AdminDashboardOverviewDto,
  AdminFinancialKpiDto,
} from '@/features/admin/types/admin.types';

export const adminDashboardService = {

  async getOverview(days: number = 30): Promise<AdminDashboardOverviewDto> {
    const response = await apiClient.get<ApiResponse<AdminDashboardOverviewDto>>(
      '/admin/dashboard/overview',
      { params: { days } }
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
        response.data.error?.title ||
        'Failed to fetch dashboard overview.'
      );
    }

    return response.data.data;
  },

  async getFinancialKpis(): Promise<AdminFinancialKpiDto> {
    const response = await apiClient.get<ApiResponse<AdminFinancialKpiDto>>(
      '/admin/dashboard/kpis'
    );

    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') ||
        response.data.error?.title ||
        'Failed to fetch financial KPIs.'
      );
    }

    return response.data.data;
  },
};
