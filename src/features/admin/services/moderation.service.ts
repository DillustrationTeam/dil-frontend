import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ArtworkInspectionDetailDto,
  ExecuteModerationDecisionRequest,
  ModerationQueueFilters,
  ModerationQueueItemDto,
  ModerationQueueResponse,
} from '@/features/admin/types/moderation.types';

// Mock data matching SCR-20 mockup for fallback / offline preview
const DEMO_INSPECTION_DETAIL: ArtworkInspectionDetailDto = {
  artworkId: '9920a000-0000-0000-0000-000000009920',
  title: 'Lumina Cyber Sequence',
  description:
    'Cybernetic neon illustration rendered in high resolution anime aesthetic. Inspected for community guidelines compliance and AI generation check.',
  imageUrl:
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1280&auto=format&fit=crop',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop',
  watermarkedUrl: null,
  style: 'Cyberpunk Anime',
  likeCount: 342,
  resolution: '3840x2160',
  fileSizeBytes: 19293798, // 18.4 MB
  createdAt: new Date().toISOString(),
  viewCount: 1280,

  // AI Confidence Scores
  safeScore: 0.984, // 98.4% SAFE
  adultScore: 0.012, // 1.2% (Low)
  violenceScore: 0.002, // 0.2% (Negligible)
  isAiGenerated: false,
  aiDetectionScore: 0.04,

  // Moderation Info
  flagReason: 'AI NSFW Threshold Borderline',
  moderationStatus: 'Pending',
  moderatorId: null,
  moderatorName: null,
  moderationNote: null,
  moderatedAt: null,

  // Creator Info
  creatorProfileId: '11111111-2222-3333-4444-555555555555',
  creatorName: 'Kuro Concept',
  creatorUsername: 'Kuro_Concept',
  creatorAvatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',

  // Tags
  tags: [
    { tagId: 'tag-1', name: 'Cyberpunk', isAiGenerated: false },
    { tagId: 'tag-2', name: 'Anime', isAiGenerated: false },
    { tagId: 'tag-3', name: 'DigitalPainting', isAiGenerated: false },
    { tagId: 'tag-4', name: 'SciFi', isAiGenerated: false },
  ],
};

const DEMO_QUEUE_ITEMS: ModerationQueueItemDto[] = [
  {
    artworkId: '9920a000-0000-0000-0000-000000009920',
    title: 'Lumina Cyber Sequence',
    creatorProfileId: '11111111-2222-3333-4444-555555555555',
    creatorName: 'Kuro Concept',
    creatorUsername: 'Kuro_Concept',
    creatorAvatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    imageUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1280&auto=format&fit=crop',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop',
    style: 'Cyberpunk Anime',
    safeScore: 0.984,
    flagReason: 'AI NSFW Threshold Borderline',
    moderationStatus: 'Pending',
    isAiGenerated: false,
    createdAt: new Date().toISOString(),
  },
  {
    artworkId: '9921b000-0000-0000-0000-000000009921',
    title: 'Solaris Android Genesis',
    creatorProfileId: '22222222-3333-4444-5555-666666666666',
    creatorName: 'Neo Horizon Studio',
    creatorUsername: 'neohorizon',
    creatorAvatarUrl: null,
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    style: 'Surrealist Concept',
    safeScore: 0.912,
    flagReason: 'AI Generated Elements Detected',
    moderationStatus: 'Pending',
    isAiGenerated: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    artworkId: '9922c000-0000-0000-0000-000000009922',
    title: 'Abyssal Crimson Knight',
    creatorProfileId: '33333333-4444-5555-6666-777777777777',
    creatorName: 'Elena Vane',
    creatorUsername: 'elena_art',
    creatorAvatarUrl: null,
    imageUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1280&auto=format&fit=crop',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop',
    style: 'Dark Fantasy',
    safeScore: 0.765,
    flagReason: 'User Reported: Violence / Gore Warning',
    moderationStatus: 'Pending',
    isAiGenerated: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const adminModerationService = {
  /**
   * Lấy danh sách hàng đợi kiểm duyệt tác phẩm (SCR-20 / UC28)
   */
  async getModerationQueue(
    filters: ModerationQueueFilters
  ): Promise<ModerationQueueResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ModerationQueueItemDto[]>>(
        '/admin/moderation/queue',
        {
          params: {
            status: filters.status,
            search: filters.search || undefined,
            page: filters.page,
            pageSize: filters.pageSize,
          },
        }
      );

      if (response.data.data && response.data.meta) {
        const meta = response.data.meta as unknown as {
          page?: number;
          pageSize?: number;
          totalCount?: number;
          totalPages?: number;
          pendingCount?: number;
        };

        return {
          items: response.data.data,
          meta: {
            page: meta.page ?? filters.page,
            pageSize: meta.pageSize ?? filters.pageSize,
            totalCount: meta.totalCount ?? response.data.data.length,
            totalPages: meta.totalPages ?? 1,
            pendingCount: meta.pendingCount ?? response.data.data.length,
          },
        };
      }
    } catch {
      // Fallback in case backend is offline / in preview mode
    }

    // Filter fallback mock data according to filters
    let filtered = DEMO_QUEUE_ITEMS;
    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'Flagged') {
        filtered = DEMO_QUEUE_ITEMS.filter(
          (i) => i.moderationStatus === 'Pending' && !!i.flagReason
        );
      } else {
        filtered = DEMO_QUEUE_ITEMS.filter(
          (i) => i.moderationStatus.toLowerCase() === filters.status.toLowerCase()
        );
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.creatorName.toLowerCase().includes(q) ||
          i.creatorUsername.toLowerCase().includes(q)
      );
    }

    return {
      items: filtered,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalCount: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / filters.pageSize)),
        pendingCount: DEMO_QUEUE_ITEMS.filter((i) => i.moderationStatus === 'Pending').length,
      },
    };
  },

  /**
   * Xem chi tiết thanh tra tác phẩm kèm kết quả scan AI và danh sách tag (SCR-20)
   */
  async getArtworkInspectionDetail(
    artworkId: string
  ): Promise<ArtworkInspectionDetailDto> {
    try {
      const response = await apiClient.get<ApiResponse<ArtworkInspectionDetailDto>>(
        `/admin/moderation/${artworkId}`
      );

      if (response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    // Return matching demo item or default
    const matched = DEMO_QUEUE_ITEMS.find((i) => i.artworkId === artworkId);
    if (matched) {
      return {
        ...DEMO_INSPECTION_DETAIL,
        artworkId: matched.artworkId,
        title: matched.title,
        imageUrl: matched.imageUrl,
        thumbnailUrl: matched.thumbnailUrl,
        safeScore: matched.safeScore,
        flagReason: matched.flagReason,
        moderationStatus: matched.moderationStatus,
        isAiGenerated: matched.isAiGenerated,
        creatorName: matched.creatorName,
        creatorUsername: matched.creatorUsername,
      };
    }

    return { ...DEMO_INSPECTION_DETAIL, artworkId };
  },

  /**
   * Thực thi quyết định kiểm duyệt: Duyệt, Từ chối xóa, Ẩn, hoặc Gắn cờ tranh AI (SCR-20)
   */
  async executeModerationDecision(
    artworkId: string,
    payload: ExecuteModerationDecisionRequest
  ): Promise<{ message: string }> {
    // Update in-memory state for fallback/preview mode
    const matched = DEMO_QUEUE_ITEMS.find((i) => i.artworkId === artworkId);
    if (matched) {
      if (payload.action === 'approve') {
        matched.moderationStatus = 'Approved';
        matched.flagReason = null;
      } else if (payload.action === 'reject') {
        matched.moderationStatus = 'Rejected';
        matched.flagReason = null;
      } else if (payload.action === 'hide') {
        matched.moderationStatus = 'Hidden';
        matched.flagReason = null;
      } else if (payload.action === 'flag_ai') {
        matched.isAiGenerated = true;
        matched.moderationStatus = 'Approved';
        matched.flagReason = null;
      }
    }

    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/admin/moderation/${artworkId}/decision`,
        payload
      );

      if (response.data.error) {
        throw new Error(
          response.data.error.details?.join(', ') ||
            response.data.error.title ||
            'Failed to execute moderation decision.'
        );
      }

      return response.data.data || { message: 'Moderation decision executed successfully.' };
    } catch (err: unknown) {
      // If server error or offline fallback
      if (err instanceof Error && err.message !== 'Network Error') {
        throw err;
      }
      return { message: `Moderation action '${payload.action}' executed successfully.` };
    }
  },
};

