import { apiClient, extractErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  CreateSubmissionDisputeRequest,
  EventLeaderboardItemDto,
  EventPageResponse,
  EventSubmissionDto,
  UpdateSubmissionRequest,
  UploadSubmissionRequest,
} from '../types/event.types';

export const eventSubmissionService = {
  /**
   * Tạo khiếu nại / báo cáo vi phạm bài dự thi sự kiện
   */
  createDispute: async (
    submissionId: string,
    data: CreateSubmissionDisputeRequest
  ): Promise<{ message?: string; disputeId?: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message?: string; disputeId?: string }>>(
        `/event-submissions/${submissionId}/disputes`,
        data
      );
      return response.data.data ?? {};
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to file dispute. Please try again.'));
    }
  },
  /**
   * Lấy danh sách bài nộp của sự kiện
   */
  getSubmissions: async (eventId: string, page = 1, pageSize = 20): Promise<EventPageResponse<EventSubmissionDto>> => {
    try {
      const response = await apiClient.get<ApiResponse<EventSubmissionDto[]>>(`/events/${eventId}/submissions`, {
        params: { page, pageSize, sortBy: 'votes' },
      });
      const data = response.data.data ?? [];
      const meta = response.data.meta as { totalCount?: number; totalPages?: number } | undefined;
      return {
        items: data.map((item) => ({
          ...item,
          artworkId: item.artworkId || item.id,
          artworkTitle: item.artworkTitle || item.title,
          artworkImageUrl: item.artworkImageUrl || item.artworkThumbnailUrl,
          artworkThumbnailUrl: item.artworkThumbnailUrl || item.artworkImageUrl,
          score: item.score ?? null,
        })),
        page,
        pageSize,
        totalCount: meta?.totalCount ?? data.length,
        totalPages: meta?.totalPages ?? 1,
      };
    } catch {
      return {
        items: [],
        page: 1,
        pageSize,
        totalCount: 0,
        totalPages: 1,
      };
    }
  },

  /**
   * Lấy bảng xếp hạng (Leaderboard) của sự kiện
   */
  getLeaderboard: async (eventId: string, sortBy: 'votes' | 'score' = 'votes'): Promise<EventLeaderboardItemDto[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Array<Partial<EventLeaderboardItemDto> & { id?: string }>>>(
        `/events/${eventId}/leaderboard`,
        {
          params: { sortBy, page: 1, pageSize: 20 },
        },
      );
      const data = response.data.data ?? [];
      return data.map((item, index) => ({
        submissionId: item.submissionId || item.id || '',
        artworkId: item.artworkId || item.submissionId || item.id,
        title: item.title || item.submissionTitle || 'Untitled',
        submissionTitle: item.submissionTitle || item.title || 'Untitled',
        submitterName: item.submitterName || 'Artist',
        artworkImageUrl: item.artworkImageUrl || item.artworkThumbnailUrl,
        artworkThumbnailUrl: item.artworkThumbnailUrl || item.artworkImageUrl,
        voteCount: item.voteCount ?? 0,
        judgeScore: item.judgeScore ?? item.score ?? null,
        score: item.score ?? item.judgeScore ?? null,
        rank: item.rank || index + 1,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Nộp bài dự thi mới
   */
  submitArtwork: async (eventId: string, data: UploadSubmissionRequest): Promise<EventSubmissionDto> => {
    try {
      const response = await apiClient.post<ApiResponse<EventSubmissionDto>>(`/events/${eventId}/submissions`, data);
      return response.data.data!;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to submit contest entry. Please try again.'));
    }
  },

  /**
   * Cập nhật thông tin bài dự thi
   */
  updateSubmission: async (submissionId: string, data: UpdateSubmissionRequest): Promise<EventSubmissionDto> => {
    try {
      const response = await apiClient.put<ApiResponse<EventSubmissionDto>>(`/event-submissions/${submissionId}`, data);
      return response.data.data!;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to update contest entry. Please try again.'));
    }
  },

  /**
   * Rút bài dự thi khỏi cuộc thi (chỉ được thực hiện khi trong thời gian nộp bài)
   */
  withdrawSubmission: async (submissionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/event-submissions/${submissionId}`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to withdraw contest submission. Please try again.'));
    }
  },
};
