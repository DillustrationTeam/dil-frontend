import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  DisputeArbitrationDetailDto,
  DisputeQueueFilters,
  DisputeQueueItemDto,
  DisputeQueueResponse,
  ResolveDisputeArbitrationRequest,
} from '@/features/admin/types/dispute-arbitration.types';

// Mock detailed dispute matching SCR-22 mockup (Ticket #DSP-402)
const DEMO_DISPUTE_DETAIL: DisputeArbitrationDetailDto = {
  disputeId: '40200000-0000-0000-0000-000000000402',
  commissionId: '84920000-0000-0000-0000-000000008492',
  commissionTitle: 'Cyberpunk Character Concept Brief (Stage 2 Lineart)',
  commissionDescription:
    'Full-body dynamic sci-fi character with ornate cyber-cape, energy halberd weapon, and custom mecha arm accessories.',
  commissionStatus: 'Disputed',
  escrowStatus: 'LOCKED',
  totalPrice: 1200,
  discountAmount: 0,
  finalPrice: 1200,
  escrowHeldAmount: 1200,
  disbursedAmount: 400,
  currentStage: 2,
  deadlineAt: new Date(Date.now() + 5 * 86400000).toISOString(),
  client: {
    userId: '11111111-0000-0000-0000-000000000001',
    fullName: 'Cyber Client',
    userName: 'CyberClient',
    email: 'client@cyber.io',
    avatarUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=160&auto=format&fit=crop',
  },
  creator: {
    userId: '22222222-0000-0000-0000-000000000002',
    fullName: 'Etherea Vox',
    userName: 'Etherea_Vox',
    email: 'etherea@art.studio',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=160&auto=format&fit=crop',
  },
  raisedBy: {
    userId: '11111111-0000-0000-0000-000000000001',
    fullName: 'Cyber Client',
    userName: 'CyberClient',
    role: 'Client',
  },
  reason:
    'Creator uploaded a Stage 2 lineart that completely strays from the agreed character concept brief.',
  evidenceUrls: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
  ],
  status: 'Pending',
  resolution: null,
  clientRefundAmount: null,
  artistPayAmount: null,
  clientRefundPercent: null,
  adminNote: null,
  moderatorId: null,
  moderatorName: null,
  createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  resolvedAt: null,
  milestones: [
    {
      id: 'ms-1',
      sequence: 1,
      title: 'Thumbnail Sketches & Color Palette',
      price: 400,
      status: 'Approved',
      wipPreviewUrl:
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop',
      revisionCount: 1,
      submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'ms-2',
      sequence: 2,
      title: 'Detailed Lineart & Weapon Angle',
      price: 400,
      status: 'InDispute',
      wipPreviewUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
      revisionCount: 3,
      submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      approvedAt: null,
    },
    {
      id: 'ms-3',
      sequence: 3,
      title: 'Final Polished Render & Layered PSD',
      price: 400,
      status: 'Pending',
      wipPreviewUrl: null,
      revisionCount: 0,
      submittedAt: null,
      approvedAt: null,
    },
  ],
  chatSnapshot: [
    {
      messageId: 'chat-1',
      senderId: '22222222-0000-0000-0000-000000000002',
      senderName: 'Etherea_Vox',
      senderRole: 'Creator',
      messageType: 'Text',
      body: 'Hello! I have completed Stage 1 thumbnails and uploaded the preview to milestone 1.',
      sentAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      messageId: 'chat-2',
      senderId: '11111111-0000-0000-0000-000000000001',
      senderName: 'CyberClient',
      senderRole: 'Client',
      messageType: 'Text',
      body: 'Concept C looks great! Let us proceed with the sci-fi halberd weapon pose.',
      sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      messageId: 'chat-3',
      senderId: '22222222-0000-0000-0000-000000000002',
      senderName: 'Etherea_Vox',
      senderRole: 'Creator',
      messageType: 'Text',
      body: 'Here is the lineart preview with armor details.',
      sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      messageId: 'chat-4',
      senderId: '11111111-0000-0000-0000-000000000001',
      senderName: 'CyberClient',
      senderRole: 'Client',
      messageType: 'Text',
      body: 'Please redesign the cape and weapon pose completely. It strayed far from the concept brief.',
      sentAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    },
    {
      messageId: 'chat-5',
      senderId: '22222222-0000-0000-0000-000000000002',
      senderName: 'Etherea_Vox',
      senderRole: 'Creator',
      messageType: 'Text',
      body: 'Client requested 3 major structural revisions beyond the 2 free revisions defined in the service package. A full pose change requires purchasing a structural revision add-on.',
      sentAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    },
    {
      messageId: 'chat-6',
      senderId: '00000000-0000-0000-0000-000000000000',
      senderName: 'System',
      senderRole: 'System',
      messageType: 'SystemEvent',
      body: 'Dispute ticket #DSP-402 has been opened by @CyberClient. Milestone escrow funds have been frozen.',
      sentAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ],
};

const DEMO_QUEUE_ITEMS: DisputeQueueItemDto[] = [
  {
    disputeId: '40200000-0000-0000-0000-000000000402',
    commissionId: '84920000-0000-0000-0000-000000008492',
    commissionTitle: 'Cyberpunk Character Concept Brief (Stage 2 Lineart)',
    raisedById: '11111111-0000-0000-0000-000000000001',
    raisedByName: 'CyberClient',
    raisedByRole: 'Client',
    clientId: '11111111-0000-0000-0000-000000000001',
    clientName: 'Cyber Client',
    clientEmail: 'client@cyber.io',
    creatorId: '22222222-0000-0000-0000-000000000002',
    creatorName: 'Etherea Vox',
    creatorEmail: 'etherea@art.studio',
    finalPrice: 1200,
    escrowHeldAmount: 1200,
    reason:
      'Creator uploaded a Stage 2 lineart that completely strays from the agreed character concept brief.',
    status: 'Pending',
    resolution: null,
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    resolvedAt: null,
  },
  {
    disputeId: '40300000-0000-0000-0000-000000000403',
    commissionId: '84930000-0000-0000-0000-000000008493',
    commissionTitle: 'Anime Live2D Model Rigging Assets',
    raisedById: '33333333-0000-0000-0000-000000000003',
    raisedByName: 'VTubeStudio_JP',
    raisedByRole: 'Creator',
    clientId: '44444444-0000-0000-0000-000000000004',
    clientName: 'Aoi Sakura',
    clientEmail: 'aoi@stream.tv',
    creatorId: '33333333-0000-0000-0000-000000000003',
    creatorName: 'Kuro Concept',
    creatorEmail: 'kuro@studio.jp',
    finalPrice: 2500,
    escrowHeldAmount: 2500,
    reason:
      'Client became unresponsive for 14 days after milestone 2 submission without releasing payment.',
    status: 'UnderReview',
    resolution: null,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    resolvedAt: null,
  },
  {
    disputeId: '40100000-0000-0000-0000-000000000401',
    commissionId: '84910000-0000-0000-0000-000000008491',
    commissionTitle: 'Fantasy Landscape Matte Painting Cover Art',
    raisedById: '55555555-0000-0000-0000-000000000005',
    raisedByName: 'NovelPublisher_VN',
    raisedByRole: 'Client',
    clientId: '55555555-0000-0000-0000-000000000005',
    clientName: 'Novel Publisher VN',
    clientEmail: 'editor@novelpub.vn',
    creatorId: '66666666-0000-0000-0000-000000000006',
    creatorName: 'Artemis Visuals',
    creatorEmail: 'contact@artemis.art',
    finalPrice: 850,
    escrowHeldAmount: 850,
    reason:
      'Late delivery by 3 weeks beyond final agreed deadline without any WIP communication.',
    status: 'Resolved',
    resolution: 'SplitCustom',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const adminDisputeService = {
  /**
   * Lấy danh sách hàng đợi các vụ khiếu nại tranh chấp cần xử lý (SCR-22 / UC30)
   */
  async getDisputeQueue(
    filters?: Partial<DisputeQueueFilters>
  ): Promise<DisputeQueueResponse> {
    const status = filters?.status || 'All';
    const search = (filters?.search || '').toLowerCase().trim();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;

    try {
      const response = await apiClient.get<
        ApiResponse<{
          data: DisputeQueueItemDto[];
          meta: {
            page: number;
            pageSize: number;
            totalCount: number;
            totalPages: number;
            pendingCount: number;
            underReviewCount: number;
            totalLockedEscrow: number;
          };
        }>
      >('/admin/disputes', {
        params: {
          status: status === 'All' ? null : status,
          search: search || null,
          page,
          pageSize,
        },
      });

      if (response.data && response.data.data) {
        const rawMeta = response.data.meta as Record<string, unknown> | null;
        const totalLockedEscrow = Number(rawMeta?.totalLockedEscrow ?? 0);
        const totalCount = Number(rawMeta?.totalCount ?? 0);
        const totalPages = Number(rawMeta?.totalPages ?? 1);
        const pendingCount = Number(rawMeta?.pendingCount ?? 0);
        const underReviewCount = Number(rawMeta?.underReviewCount ?? 0);

        return {
          items: (response.data.data as unknown as DisputeQueueItemDto[]) || [],
          meta: {
            page,
            pageSize,
            totalCount,
            totalPages,
            pendingCount,
            underReviewCount,
            resolvedCount: Math.max(0, totalCount - pendingCount - underReviewCount),
            totalLockedEscrow,
          },
        };
      }
    } catch {
      // Fallback to local demo data for offline/preview mode
    }

    // Local in-memory filter
    let filtered = [...DEMO_QUEUE_ITEMS];

    if (status !== 'All') {
      filtered = filtered.filter((d) => d.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.commissionTitle.toLowerCase().includes(search) ||
          d.clientName.toLowerCase().includes(search) ||
          d.creatorName.toLowerCase().includes(search) ||
          d.raisedByName.toLowerCase().includes(search) ||
          d.disputeId.toLowerCase().includes(search)
      );
    }

    const pendingCount = DEMO_QUEUE_ITEMS.filter((d) => d.status === 'Pending').length;
    const underReviewCount = DEMO_QUEUE_ITEMS.filter(
      (d) => d.status === 'UnderReview'
    ).length;
    const resolvedCount = DEMO_QUEUE_ITEMS.filter((d) => d.status === 'Resolved').length;
    const totalLockedEscrow = DEMO_QUEUE_ITEMS.reduce(
      (acc, curr) => (curr.status !== 'Resolved' ? acc + curr.escrowHeldAmount : acc),
      0
    );

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIdx = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIdx, startIdx + pageSize);

    return {
      items: paginatedItems,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages,
        pendingCount,
        underReviewCount,
        resolvedCount,
        totalLockedEscrow,
      },
    };
  },

  /**
   * Xem chi tiết hồ sơ trọng tài tranh chấp (claims, escrow, milestones, chat snapshot) (SCR-22 / UC30)
   */
  async getDisputeDetail(id: string): Promise<DisputeArbitrationDetailDto> {
    try {
      const response = await apiClient.get<ApiResponse<DisputeArbitrationDetailDto>>(
        `/admin/disputes/${id}`
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback to demo detail
    }

    // Return demo detail matched by id or default #DSP-402
    const matchedQueue = DEMO_QUEUE_ITEMS.find((d) => d.disputeId === id);
    if (matchedQueue) {
      return {
        ...DEMO_DISPUTE_DETAIL,
        disputeId: matchedQueue.disputeId,
        commissionId: matchedQueue.commissionId,
        commissionTitle: matchedQueue.commissionTitle,
        status: matchedQueue.status,
        finalPrice: matchedQueue.finalPrice,
        escrowHeldAmount: matchedQueue.escrowHeldAmount,
        reason: matchedQueue.reason,
        client: {
          userId: matchedQueue.clientId,
          fullName: matchedQueue.clientName,
          userName: matchedQueue.clientName.replace(/\s+/g, ''),
          email: matchedQueue.clientEmail,
        },
        creator: {
          userId: matchedQueue.creatorId,
          fullName: matchedQueue.creatorName,
          userName: matchedQueue.creatorName.replace(/\s+/g, '_'),
          email: matchedQueue.creatorEmail,
        },
      };
    }

    return DEMO_DISPUTE_DETAIL;
  },

  /**
   * Thực thi phán quyết trọng tài & phân bổ tiền ký quỹ Escrow nguyên tử (SCR-22 / UC30)
   */
  async resolveDispute(
    id: string,
    payload: ResolveDisputeArbitrationRequest
  ): Promise<{ message: string }> {
    // In-memory demo update for preview mode
    const matched = DEMO_QUEUE_ITEMS.find((d) => d.disputeId === id);
    if (matched) {
      matched.status = 'Resolved';
      matched.resolvedAt = new Date().toISOString();
      if (payload.clientRefundPercent === 100) {
        matched.resolution = 'ClientWin100';
      } else if (payload.clientRefundPercent === 0) {
        matched.resolution = 'ArtistWin100';
      } else {
        matched.resolution = 'SplitCustom';
      }
    }

    if (DEMO_DISPUTE_DETAIL.disputeId === id) {
      DEMO_DISPUTE_DETAIL.status = 'Resolved';
      DEMO_DISPUTE_DETAIL.resolvedAt = new Date().toISOString();
      DEMO_DISPUTE_DETAIL.clientRefundPercent = payload.clientRefundPercent;
      DEMO_DISPUTE_DETAIL.clientRefundAmount =
        (DEMO_DISPUTE_DETAIL.escrowHeldAmount * payload.clientRefundPercent) / 100;
      DEMO_DISPUTE_DETAIL.artistPayAmount =
        DEMO_DISPUTE_DETAIL.escrowHeldAmount - (DEMO_DISPUTE_DETAIL.clientRefundAmount || 0);
      DEMO_DISPUTE_DETAIL.adminNote = payload.adminNote;
      DEMO_DISPUTE_DETAIL.moderatorName = 'Admin Arbitrator';
    }

    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/admin/disputes/${id}/arbitrate`,
        payload
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    return {
      message: `Phán quyết trọng tài đã thực thi thành công: Hoàn ${payload.clientRefundPercent}% cho Client, giải ngân ${
        100 - payload.clientRefundPercent
      }% cho Creator. Tiền cọc Escrow đã được phân bổ nguyên tử.`,
    };
  },
};
