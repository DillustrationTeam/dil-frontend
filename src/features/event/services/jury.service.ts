import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  JuryCriterion,
  JurySubmissionItem,
  JuryEvaluationDraft,
  JuryStats,
  JuryMemberInfo,
  SubmitScoreRequest,
  SubmissionScoreResponse,
  HeadJuryWorkspaceData,
} from '../types/jury.types';
import type { EventSubmissionDto } from '../types/event.types';

const DRAFT_STORAGE_PREFIX = 'dil_jury_draft_';

function generateShortCode(id: string, index: number, eventTitle?: string): string {
  const prefix = eventTitle
    ? eventTitle
        .split(' ')
        .map((w) => w[0]?.toUpperCase())
        .join('')
        .slice(0, 3) || 'AUR'
    : 'AUR';
  const numPart = id ? parseInt(id.replace(/\D/g, '').slice(-4) || `${index + 1}`, 10) : index + 1;
  return `#${prefix}-${String(numPart).padStart(4, '0')}`;
}

export const juryService = {
  /**
   * Fetch criteria / rubric for an event
   */
  getEventCriteria: async (eventId: string): Promise<JuryCriterion[]> => {
    try {
      const response = await apiClient.get<ApiResponse<JuryCriterion[]>>(`/events/${eventId}/criteria`);
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch {
      // Fallback empty criteria
    }
    return [];
  },

  /**
   * Fetch jury members for an event
   */
  getEventJuries: async (eventId: string): Promise<JuryMemberInfo[]> => {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>(`/juries/by-event/${eventId}`);
      const data = response.data?.data;
      if (Array.isArray(data)) {
        return data as JuryMemberInfo[];
      }
      if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown[] }).items)) {
        return (data as { items: JuryMemberInfo[] }).items;
      }
    } catch {
      // Return empty if endpoint fails or network error
    }
    return [];
  },

  /**
   * Fetch user's jury assignments across all events
   */
  getMyJuryAssignments: async (userId: string, creatorId?: string): Promise<JuryMemberInfo[]> => {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>('/juries', {
        params: { userId, creatorId, pageSize: 100 },
      });
      const data = response.data?.data;
      if (Array.isArray(data)) {
        return data as JuryMemberInfo[];
      }
      if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown[] }).items)) {
        return (data as { items: JuryMemberInfo[] }).items;
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Fetch submissions assigned to the jury for the event
   */
  getAssignedSubmissions: async (
    eventId: string,
    eventTitle?: string
  ): Promise<JurySubmissionItem[]> => {
    try {
      const response = await apiClient.get<ApiResponse<EventSubmissionDto[]>>(`/events/${eventId}/submissions`, {
        params: { pageSize: 50, sortBy: 'date' },
      });

      const rawItems = response.data?.data ?? [];
      const drafts = juryService.getAllDrafts(eventId);

      if (rawItems.length > 0) {
        return rawItems.map((sub, index) => {
          const draft = drafts[sub.id];
          const hasScore = typeof sub.score === 'number' && sub.score > 0;
          const isGraded = Boolean(draft?.isLocked || hasScore);
          const gradedScore = draft?.totalScore ?? (hasScore ? Number(sub.score) : null);

          // Infer a mock or real category for illustration contests
          const categories = ['Illustration', 'Concept Art', 'Digital Art', 'Mixed Media', 'Character Design'];
          const category = categories[index % categories.length];

          return {
            id: sub.id,
            code: generateShortCode(sub.id, index, eventTitle),
            title: sub.title || `Tác phẩm #${index + 1}`,
            description: sub.description || 'Tác phẩm tham gia vòng chung khảo sự kiện Dillustration.',
            category,
            artworkImageUrl:
              sub.artworkImageUrl ||
              sub.artworkThumbnailUrl ||
              '/seedimg/miyu.png',
            artworkThumbnailUrl: sub.artworkThumbnailUrl || sub.artworkImageUrl,
            submittedAt: sub.submittedAt || new Date().toISOString(),
            aiScanPassed: sub.aiScanPassed ?? true,
            voteCount: sub.voteCount ?? 0,
            score: sub.score,
            isGraded,
            gradedScore,
            notes: draft?.notes || sub.adminNote || '',
            criteriaScores: draft?.criteriaScores,
            noConflictOfInterest: draft?.noConflictOfInterest ?? true,
            nominateSpecialAward: draft?.nominateSpecialAward ?? false,
            specialAwardCategory: draft?.specialAwardCategory,
            isLocked: draft?.isLocked ?? false,
          };
        });
      }
    } catch {
      // Fallthrough to empty list
    }

    return [];
  },

  /**
   * Save draft score in localStorage
   */
  saveDraft: (eventId: string, submissionId: string, draft: JuryEvaluationDraft): void => {
    try {
      if (typeof window === 'undefined') return;
      const key = `${DRAFT_STORAGE_PREFIX}${eventId}_${submissionId}`;
      window.localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // Ignore localStorage errors
    }
  },

  /**
   * Get draft score from localStorage
   */
  getDraft: (eventId: string, submissionId: string): JuryEvaluationDraft | null => {
    try {
      if (typeof window === 'undefined') return null;
      const key = `${DRAFT_STORAGE_PREFIX}${eventId}_${submissionId}`;
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as JuryEvaluationDraft;
      }
    } catch {
      // Ignore error
    }
    return null;
  },

  /**
   * Get all drafts for an event
   */
  getAllDrafts: (eventId: string): Record<string, JuryEvaluationDraft> => {
    const drafts: Record<string, JuryEvaluationDraft> = {};
    try {
      if (typeof window === 'undefined') return drafts;
      const prefix = `${DRAFT_STORAGE_PREFIX}${eventId}_`;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const submissionId = key.replace(prefix, '');
          const val = window.localStorage.getItem(key);
          if (val) {
            drafts[submissionId] = JSON.parse(val) as JuryEvaluationDraft;
          }
        }
      }
    } catch {
      // Ignore
    }
    return drafts;
  },

  /**
   * Submit score to backend API with local draft persistence
   */
  submitScore: async (
    eventId: string,
    submissionId: string,
    data: SubmitScoreRequest
  ): Promise<SubmissionScoreResponse> => {
    const response = await apiClient.post<ApiResponse<SubmissionScoreResponse>>(
      `/event-submissions/${submissionId}/score`,
      data
    );

    // Save draft locally as locked only after successful submission
    const draft: JuryEvaluationDraft = {
      submissionId,
      totalScore: data.totalScore,
      criteriaScores: data.criteriaScores.reduce((acc, c) => {
        acc[c.criteriaId] = c.score;
        return acc;
      }, {} as Record<string, number>),
      notes: data.notes || '',
      noConflictOfInterest: data.noConflictOfInterest,
      nominateSpecialAward: data.nominateSpecialAward,
      specialAwardCategory: data.specialAwardCategory,
      updatedAt: new Date().toISOString(),
      isLocked: true,
    };
    juryService.saveDraft(eventId, submissionId, draft);

    if (response.data?.data) {
      return response.data.data;
    }

    return {
      submissionId,
      score: data.totalScore,
      totalAverageScore: data.totalScore,
      notes: data.notes,
      gradedAt: new Date().toISOString(),
      isLocked: true,
    };
  },

  /**
   * Calculate summary statistics for the Jury header
   */
  calculateStats: (items: JurySubmissionItem[]): JuryStats => {
    const totalAssigned = items.length;
    const gradedCount = items.filter((item) => item.isGraded).length;
    const remainingCount = Math.max(0, totalAssigned - gradedCount);
    const progressPercent = totalAssigned > 0 ? Math.round((gradedCount / totalAssigned) * 100) : 0;

    return {
      totalAssigned,
      gradedCount,
      remainingCount,
      progressPercent,
    };
  },

  /**
   * Fetch complete Head Jury Workspace data
   */
  getHeadJuryWorkspace: async (eventId: string): Promise<HeadJuryWorkspaceData> => {
    try {
      const response = await apiClient.get<ApiResponse<HeadJuryWorkspaceData>>(`/events/${eventId}/head-jury-workspace`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback empty data structure if endpoint fails
    }

    return {
      totalSubmissions: 0,
      gradedSubmissions: 0,
      completedJuryCount: 0,
      totalJuryCount: 0,
      anomalyFlagsCount: 0,
      overallProgressPercent: 0,
      juryProgressList: [],
      combinedScores: [],
      arbitrationCases: [],
      finalWinners: [],
      allJuryCompleted: false,
      disputesResolved: false,
      winnersConfirmed: false,
      isResultsApproved: false,
    };
  },

  /**
   * Resolve submission dispute by Head Jury
   */
  resolveJuryDispute: async (
    disputeId: string,
    payload: { resolution: 'Dismiss' | 'Disqualify' | 'RequestReEvaluation'; note?: string }
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/jury/disputes/${disputeId}/resolve`,
      payload
    );
    return response.data?.data ?? { message: 'Phân xử khiếu nại thành công.' };
  },

  /**
   * Save arbitration decision by Head Jury
   */
  saveArbitrationDecision: async (
    _eventId: string,
    caseId: string,
    decision: string,
    notes: string
  ): Promise<{ success: boolean; message: string }> => {
    const resolutionMap: Record<string, 'Dismiss' | 'Disqualify' | 'RequestReEvaluation'> = {
      'Dismiss': 'Dismiss',
      'Reject': 'Dismiss',
      'Disqualify': 'Disqualify',
      'RequestReEvaluation': 'RequestReEvaluation',
      'Re-evaluation': 'RequestReEvaluation',
    };
    const resolution = resolutionMap[decision] || 'RequestReEvaluation';
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId);
    if (isGuid) {
      await apiClient.post<ApiResponse<unknown>>(`/jury/disputes/${caseId}/resolve`, {
        resolution,
        note: notes,
      });
    }
    return { success: true, message: 'Xác nhận phân xử thành công.' };
  },

  /**
   * Approve final event results by Head Jury
   */
  approveFinalResults: async (eventId: string): Promise<{ success: boolean; message: string }> => {
    await apiClient.post<ApiResponse<unknown>>(`/events/${eventId}/approve-results`);
    return { success: true, message: 'Phê duyệt kết quả cuộc thi thành công!' };
  },

  /**
   * Send invitation to jury member by email
   */
  sendInvitation: async (eventId: string, email: string): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>('/invitations', {
      eventId,
      email,
    });
    return response.data?.data;
  },

  /**
   * Remove a jury member from an event
   */
  removeJury: async (juryId: string): Promise<void> => {
    await apiClient.delete(`/juries/${juryId}`);
  },

  /**
   * Cancel a pending invitation
   */
  cancelInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.put(`/invitations/${invitationId}/cancel`);
  },

  /**
   * Fetch invitations for an event
   */
  getInvitations: async (eventId: string): Promise<unknown[]> => {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>('/invitations', {
        params: { eventId, pageSize: 50 },
      });
      const data = response.data?.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown[] }).items)) {
        return (data as { items: unknown[] }).items;
      }
    } catch {
      // Fallback empty
    }
    return [];
  },

  /**
   * Update jury member role
   */
  updateJuryRole: async (eventId: string, juryId: string, role: 'Head Jury' | 'Jury'): Promise<void> => {
    try {
      await apiClient.put(`/juries/${juryId}/role`, {
        eventId,
        isHeadJury: role === 'Head Jury',
      });
    } catch {
      // Endpoint fallback
    }
  },

  /**
   * Complete Head Jury sign-off for an event
   */
  signOffHeadJury: async (eventId: string): Promise<{ success: boolean; signedOffAt?: string }> => {
    const response = await apiClient.post<ApiResponse<{ signedOffAt?: string }>>(`/events/${eventId}/head-jury/sign-off`);
    return {
      success: !response.data?.error,
      signedOffAt: response.data?.data?.signedOffAt,
    };
  },
};



