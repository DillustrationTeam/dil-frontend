import { apiClient, extractErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  EventDetailDto,
  EventFilters,
  EventLeaderboardItemDto,
  EventListItemDto,
  EventPageResponse,
  EventSortOption,
  EventStatsDto,
  EventSubmissionDto,
  UploadSubmissionRequest,
  UpdateSubmissionRequest,
} from '../types/event.types';

export function sortEventItems(items: EventListItemDto[], sortBy?: EventSortOption | string): EventListItemDto[] {
  const sorted = [...items];
  const now = Date.now();

  switch (sortBy) {
    case 'title_asc':
    case 'title':
    case 'a-z':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    case 'ending_soon': {
      return sorted.sort((a, b) => {
        const timeA = new Date(a.submissionEndAt).getTime();
        const timeB = new Date(b.submissionEndAt).getTime();
        const activeA = timeA > now;
        const activeB = timeB > now;
        if (activeA && !activeB) return -1;
        if (!activeA && activeB) return 1;
        return timeA - timeB;
      });
    }

    case 'most_submissions':
    case 'submissions':
      return sorted.sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0));

    case 'most_votes':
    case 'votes':
      return sorted.sort((a, b) => (b.totalVoteCount || 0) - (a.totalVoteCount || 0));

    case 'latest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export function isEventInSubmissionStage(event?: EventListItemDto | null): boolean {
  if (!event) return false;
  const statusStr = String(event.status).toLowerCase();
  const isStatusOpen = statusStr === 'open' || statusStr === '2';
  if (!isStatusOpen) return false;

  if (event.submissionEndAt) {
    const end = new Date(event.submissionEndAt).getTime();
    if (!isNaN(end) && Date.now() > end) {
      return false;
    }
  }
  return true;
}

export function parsePrizeAmount(prize?: string | null): number {
  if (!prize) return 0;
  // Match formatted numbers: e.g. 45,000,000 or 45.000.000
  const formattedMatch = prize.match(/(\d{1,3}(?:[.,]\d{3})+)/);
  if (formattedMatch) {
    const cleanNum = formattedMatch[1].replace(/[.,]/g, '');
    const val = parseInt(cleanNum, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  // Match "X triệu" or "X tr" or "X million"
  const trieuMatch = prize.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr|million|m\b)/i);
  if (trieuMatch) {
    const cleanNum = trieuMatch[1].replace(',', '.');
    const val = parseFloat(cleanNum);
    if (!isNaN(val) && val > 0) return Math.round(val * 1_000_000);
  }

  // Plain 6+ digits: e.g. 50000000
  const plainMatch = prize.match(/(\d{6,})/);
  if (plainMatch) {
    const val = parseInt(plainMatch[1], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

export function calculateEventStats(events: EventListItemDto[]): EventStatsDto {
  const totalPrizePool = events.reduce((sum, e) => sum + parsePrizeAmount(e.prize), 0);
  const openEventsCount = events.filter((e) => isEventInSubmissionStage(e) || String(e.status).toLowerCase() === 'open' || String(e.status) === '2').length;
  const totalSubmissionsCount = events.reduce((sum, e) => sum + (e.submissionCount || 0), 0);

  return {
    totalPrizePool,
    formattedTotalPrizePool: totalPrizePool > 0 ? `${totalPrizePool.toLocaleString('en-US')}+ đ` : '0 đ',
    openEventsCount,
    totalSubmissionsCount,
    totalEventsCount: events.length,
  };
}

export const eventService = {
  /**
   * Fetch event list from backend /api/v1/events
   */
  list: async (filters?: EventFilters): Promise<EventPageResponse<EventListItemDto>> => {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 9;

    try {
      const response = await apiClient.get<ApiResponse<EventListItemDto[]>>('/events', {
        params: {
          title: filters?.title || undefined,
          search: filters?.search || undefined,
          status: filters?.status || undefined,
          isFeatured: filters?.isFeatured !== undefined ? filters.isFeatured : undefined,
          sortBy: filters?.sortBy || 'latest',
          page,
          pageSize,
        },
      });

      const data = response.data.data;
      const meta = response.data.meta as { page?: number; pageSize?: number; totalCount?: number; totalPages?: number } | undefined;

      const items = Array.isArray(data) ? sortEventItems(data, filters?.sortBy) : [];
      const totalCount = meta?.totalCount ?? items.length;
      const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

      return {
        items,
        page: meta?.page ?? page,
        pageSize: meta?.pageSize ?? pageSize,
        totalCount,
        totalPages,
      };
    } catch {
      return {
        items: [],
        page,
        pageSize,
        totalCount: 0,
        totalPages: 1,
      };
    }
  },

  /**
   * Lấy chi tiết sự kiện
   */
  detail: async (id: string): Promise<EventDetailDto> => {
    const response = await apiClient.get<ApiResponse<EventDetailDto>>(`/events/${id}`);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.detail || response.data.error?.title || 'Không tìm thấy thông tin sự kiện.');
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
   * Submit contest entry
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
   * Update contest entry
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
   * Cast vote for submission
   */
  voteSubmission: async (submissionId: string): Promise<void> => {
    try {
      await apiClient.post(`/event-submissions/${submissionId}/vote`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to submit vote. Please try again.'));
    }
  },

  /**
   * Remove vote from submission
   */
  unvoteSubmission: async (submissionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/event-submissions/${submissionId}/vote`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to revoke vote. Please try again.'));
    }
  },

  /**
   * Fetch aggregate event statistics across the whole platform
   */
  getStats: async (): Promise<EventStatsDto> => {
    try {
      const response = await apiClient.get<ApiResponse<EventStatsDto>>('/events/stats');
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await apiClient.get<ApiResponse<EventListItemDto[]>>('/events', {
        params: { pageSize: 50 },
      });
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
        return calculateEventStats(res.data.data);
      }
    } catch {
      // Offline or network error
    }

    return {
      totalPrizePool: 0,
      formattedTotalPrizePool: '0 đ',
      openEventsCount: 0,
      totalSubmissionsCount: 0,
      totalEventsCount: 0,
    };
  },
};

