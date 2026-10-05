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

// Fallback sample events for development or when backend events table is empty
export const FALLBACK_EVENTS: EventListItemDto[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    title: 'Cyberpunk Neo-Saigon 2077: Sci-Fi Visuals',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    description: 'A futuristic digital art competition celebrating cybernetic aesthetics, speculative architecture, and contemporary cultural synthesis.',
    rules: 'Original 2D/3D digital artwork. Submission requires sketch progress files and speedpaint process video. Maximum 15% AI similarity allowed.',
    prize: '45,000,000 VND Prize Pool + Exclusive Creator Partner Contract',
    maxVote: 3,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 22 * 86400000).toISOString(),
    createdByAdminName: 'Pham Quoc Dung',
    submissionCount: 28,
    totalVoteCount: 1420,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: true,
  },
  {
    id: 'e2000000-0000-0000-0000-000000000002',
    title: 'Mythology & Folklore: Ancient Eastern Legends',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
    description: 'Reimagining mythical deities, celestial beasts, and ancient folklore through contemporary digital painting and visual storytelling.',
    rules: '100% digital hand-painted artwork. Minimum 300 DPI resolution, 16:9 or 4:5 aspect ratio.',
    prize: '30,000,000 VND + Dillustration 2026 Artbook Feature',
    maxVote: 5,
    status: 'Judging',
    submissionStartAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdByAdminName: 'Hoang Thi Em',
    submissionCount: 42,
    totalVoteCount: 3890,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    isOpenForSubmission: false,
    isFeatured: false,
  },
  {
    id: 'e3000000-0000-0000-0000-000000000003',
    title: 'Character Concept Design: Steampunk Arcana',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    description: 'Design distinctive characters bridging Victorian steam machinery and mystical arcane alchemy.',
    rules: 'Submit a character sheet including: Front view, Side view, Color palette, and Signature weapon/artifact.',
    prize: '20,000,000 VND + Limited Edition Art Toy Production Deal',
    maxVote: 3,
    status: 'Ended',
    submissionStartAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    createdByAdminName: 'Pham Quoc Dung',
    submissionCount: 35,
    totalVoteCount: 2650,
    createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
    isOpenForSubmission: false,
    isFeatured: false,
  },
  {
    id: 'e4000000-0000-0000-0000-000000000004',
    title: 'Celestial Kingdoms & Cosmic Odyssey',
    bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    description: 'Create surreal cosmic landscapes, celestial fortresses, and ethereal beings traversing interstellar realms.',
    rules: 'Digital painting or 3D concept render. Must feature celestial elements, glowing nebulae, and imaginative architectural structures.',
    prize: '50,000,000 VND + Tokyo Art Expo 2026 Showcase',
    maxVote: 5,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 21 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 22 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 22 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdByAdminName: 'Nguyen Van Art',
    submissionCount: 19,
    totalVoteCount: 840,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: true,
  },
  {
    id: 'e5000000-0000-0000-0000-000000000005',
    title: 'Mecha & Biopunk Wildlife: Post-Human Horizons',
    bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&auto=format&fit=crop',
    description: 'Explore the fusion of organic biology and cybernetic robotics. Reenvision fauna and flora in a synthetic future.',
    rules: 'Full illustration with environmental context. Original anatomy design required with functional robotic joints and biological details.',
    prize: '35,000,000 VND + Exclusive Dillustration 3D Collectible Figurine Deal',
    maxVote: 4,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 9 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    createdByAdminName: 'Tran Minh Tri',
    submissionCount: 51,
    totalVoteCount: 2210,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: true,
  },
  {
    id: 'e6000000-0000-0000-0000-000000000006',
    title: 'Dark Fantasy & Gothic Horrors: Shadowed Cathedrals',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    description: 'Immerse in haunting gothic atmosphere, fallen monarchs, and eldritch ruins shrouded in eternal twilight.',
    rules: 'Moody lighting, grim dark fantasy theme. Must include intricate architectural or costume details.',
    prize: '25,000,000 VND + Dark Arts Compilation Cover Feature',
    maxVote: 3,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 19 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 19 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 27 * 86400000).toISOString(),
    createdByAdminName: 'Pham Quoc Dung',
    submissionCount: 22,
    totalVoteCount: 960,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: false,
  },
  {
    id: 'e7000000-0000-0000-0000-000000000007',
    title: 'Pixel Art Revival: 16-Bit Nostalgia & Retro Arcade',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    description: 'A tribute to the golden era of arcade gaming and pixel mastery with modern lighting and animation techniques.',
    rules: 'Grid-aligned pixel art only. Maximum canvas size 320x180 scaled up integer times. No automatic anti-aliasing.',
    prize: '20,000,000 VND + Indie Game UI/Asset Royalty Share',
    maxVote: 3,
    status: 'Judging',
    submissionStartAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdByAdminName: 'Nguyen Van Art',
    submissionCount: 31,
    totalVoteCount: 1840,
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    isOpenForSubmission: false,
    isFeatured: false,
  },
  {
    id: 'e8000000-0000-0000-0000-000000000008',
    title: 'Neo-Tokyo Streetwear & Anime Haute Couture',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    description: 'Design cutting-edge apparel, techwear accessories, and fashion lookbooks modeled by anime character avatars.',
    rules: 'Full-body illustration showcasing garment layers, fabric textures, and branded graphic patches.',
    prize: '40,000,000 VND + Real-world Merch Capsule Production',
    maxVote: 4,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 16 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 17 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 22 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 17 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 22 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 24 * 86400000).toISOString(),
    createdByAdminName: 'Hoang Thi Em',
    submissionCount: 16,
    totalVoteCount: 620,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: false,
  },
  {
    id: 'e9000000-0000-0000-0000-000000000009',
    title: 'Voxel Worlds & Isometric Dioramas',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    description: 'Craft enchanting 3D isometric dioramas using blocks, cubes, and voxel sculpting software.',
    rules: 'Isometric angle render. Clean color separation and volumetric lighting.',
    prize: '18,000,000 VND + Metaverse Showcase Space',
    maxVote: 3,
    status: 'Ended',
    submissionStartAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    createdByAdminName: 'Tran Minh Tri',
    submissionCount: 27,
    totalVoteCount: 1980,
    createdAt: new Date(Date.now() - 55 * 86400000).toISOString(),
    isOpenForSubmission: false,
    isFeatured: false,
  },
  {
    id: 'e1000000-0000-0000-0000-000000000010',
    title: 'Underwater Metropolises: Abyssal Kingdoms',
    bannerUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
    description: 'Bioluminescent deep-sea habitats, submerged glass towers, and aquatic civilizations living beneath ocean trenches.',
    rules: 'Focus on underwater lighting, volumetric caustics, and marine flora/fauna architecture.',
    prize: '32,000,000 VND + Concept Art Masterclass Mentorship',
    maxVote: 4,
    status: 'Open',
    submissionStartAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    submissionEndAt: new Date(Date.now() + 12 * 86400000).toISOString(),
    judgingStartAt: new Date(Date.now() + 13 * 86400000).toISOString(),
    judgingEndAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    votingStartAt: new Date(Date.now() + 13 * 86400000).toISOString(),
    votingEndAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    resultAnnouncementAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    createdByAdminName: 'Pham Quoc Dung',
    submissionCount: 24,
    totalVoteCount: 1150,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    isOpenForSubmission: true,
    isFeatured: false,
  },
];

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

      // Real backend items
      if (Array.isArray(data) && data.length > 0) {
        return {
          items: sortEventItems(data, filters?.sortBy),
          page: meta?.page ?? page,
          pageSize: meta?.pageSize ?? pageSize,
          totalCount: meta?.totalCount ?? data.length,
          totalPages: meta?.totalPages ?? Math.max(1, Math.ceil((meta?.totalCount ?? data.length) / pageSize)),
        };
      }

      // Fallback items if backend is empty
      let items = [...FALLBACK_EVENTS];
      if (filters?.status) {
        items = items.filter((e) => String(e.status).toLowerCase() === filters.status?.toLowerCase());
      }
      if (filters?.isFeatured !== undefined) {
        items = items.filter((e) => Boolean(e.isFeatured) === filters.isFeatured);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        items = items.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
      }

      items = sortEventItems(items, filters?.sortBy);
      const totalCount = items.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

      return {
        items: pagedItems,
        page,
        pageSize,
        totalCount,
        totalPages,
      };
    } catch {
      // Fallback on network error or server down
      let items = [...FALLBACK_EVENTS];
      if (filters?.status) {
        items = items.filter((e) => String(e.status).toLowerCase() === filters.status?.toLowerCase());
      }
      if (filters?.isFeatured !== undefined) {
        items = items.filter((e) => Boolean(e.isFeatured) === filters.isFeatured);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        items = items.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
      }

      items = sortEventItems(items, filters?.sortBy);
      const totalCount = items.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

      return {
        items: pagedItems,
        page,
        pageSize,
        totalCount,
        totalPages,
      };
    }
  },

  /**
   * Lấy chi tiết sự kiện
   */
  detail: async (id: string): Promise<EventDetailDto> => {
    try {
      const response = await apiClient.get<ApiResponse<EventDetailDto>>(`/events/${id}`);
      if (response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const found = FALLBACK_EVENTS.find((e) => e.id === id) || FALLBACK_EVENTS[0];
    return {
      ...found,
      submissions: [],
      leaderboard: [],
    };
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
  submitArtwork: async (eventId: string, data: UploadSubmissionRequest): Promise<{ id: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ id: string }>>(`/events/${eventId}/submissions`, data);
      return response.data.data!;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to submit contest entry. Please try again.'));
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

    return calculateEventStats(FALLBACK_EVENTS);
  },
};

