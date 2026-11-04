import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export type BugReportStatus = 0 | 1 | 2; // 0: Open, 1: InProgress, 2: Resolved

export interface BugReportDto {
  id: string;
  reporterId?: string | null;
  reporterEmail: string;
  title: string;
  description: string;
  pageUrl?: string | null;
  status: BugReportStatus;
  adminNote?: string | null;
  createdAt: string;
}

export interface CreateBugReportPayload {
  title: string;
  description: string;
  pageUrl?: string;
  email?: string;
}

export const supportService = {
  async createBugReport(payload: CreateBugReportPayload): Promise<BugReportDto> {
    const res = await apiClient.post<ApiResponse<BugReportDto>>('/support/bugs', payload);
    return res.data.data!;
  },

  async getBugReports(status?: BugReportStatus): Promise<BugReportDto[]> {
    const params = status !== undefined ? { status } : {};
    const res = await apiClient.get<ApiResponse<BugReportDto[]>>('/support/bugs', { params });
    return res.data.data ?? [];
  },

  async updateBugStatus(id: string, status: BugReportStatus, adminNote?: string): Promise<BugReportDto> {
    const res = await apiClient.patch<ApiResponse<BugReportDto>>(`/support/bugs/${id}/status`, {
      status,
      adminNote,
    });
    return res.data.data!;
  },
};
