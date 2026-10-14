import { apiClient, extractErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { JuryCriterion } from '../types/jury.types';

export const eventCriteriaService = {
  /**
   * Lấy danh sách tiêu chí chấm điểm của một sự kiện
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
   * Tạo mới tiêu chí chấm điểm cho sự kiện
   */
  createCriteria: async (eventId: string, data: Partial<JuryCriterion>): Promise<JuryCriterion> => {
    try {
      const response = await apiClient.post<ApiResponse<JuryCriterion>>(`/events/${eventId}/criteria`, data);
      return response.data.data!;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to create event criteria.'));
    }
  },

  /**
   * Cập nhật tiêu chí chấm điểm
   */
  updateCriteria: async (criteriaId: string, data: Partial<JuryCriterion>): Promise<JuryCriterion> => {
    try {
      const response = await apiClient.put<ApiResponse<JuryCriterion>>(`/event-criteria/${criteriaId}`, data);
      return response.data.data!;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to update event criteria.'));
    }
  },

  /**
   * Xóa tiêu chí chấm điểm
   */
  deleteCriteria: async (criteriaId: string): Promise<void> => {
    try {
      await apiClient.delete(`/event-criteria/${criteriaId}`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete event criteria.'));
    }
  },
};
