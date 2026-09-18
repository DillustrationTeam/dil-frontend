import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  DashboardOverviewDto,
  StatisticsPointDto,
  StatisticsQuery,
} from '@/features/admin/types/admin.types';

async function getStatistics(
  path: string,
  params: StatisticsQuery
): Promise<StatisticsPointDto[]> {
  const response = await apiClient.get<ApiResponse<StatisticsPointDto[]>>(path, { params });

  if (response.data.error || !response.data.data) {
    throw new Error(response.data.error?.details?.join(', ') || 'Failed to fetch statistics.');
  }

  return response.data.data;
}

export const adminDashboardService = {
  async getOverview(): Promise<DashboardOverviewDto> {
    const response = await apiClient.get<ApiResponse<DashboardOverviewDto>>(
      '/admin/dashboard/overview'
    );

    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to fetch overview.');
    }

    return response.data.data;
  },

  getUsersStatistics(params: StatisticsQuery) {
    return getStatistics('/admin/dashboard/statistics/users', params);
  },

  getArtworksStatistics(params: StatisticsQuery) {
    return getStatistics('/admin/dashboard/statistics/artworks', params);
  },

  getCommissionsStatistics(params: StatisticsQuery) {
    return getStatistics('/admin/dashboard/statistics/commissions', params);
  },

  getRevenueStatistics(params: StatisticsQuery) {
    return getStatistics('/admin/dashboard/statistics/revenue', params);
  },
};
