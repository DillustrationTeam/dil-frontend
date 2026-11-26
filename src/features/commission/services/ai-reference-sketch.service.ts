import { apiClient, extractErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { ReferenceSketchGenerationDto, ReferenceSketchQuotaDto, SuggestLayoutHintsResultDto } from '../types/ai-reference-sketch.types';

export const aiReferenceSketchService = {
  getQuota: async (creatorProfileId: string): Promise<ReferenceSketchQuotaDto> => {
    try {
      const res = await apiClient.get<ApiResponse<ReferenceSketchQuotaDto>>('/ai/reference-sketches/quota', {
        params: { creatorProfileId },
      });
      if (!res.data.data) throw new Error('Không tải được lượt AI phác thảo bố cục.');
      return res.data.data;
    } catch (cause) {
      throw new Error(extractErrorMessage(cause, 'Không tải được lượt AI phác thảo bố cục.'));
    }
  },

  startGeneration: async (data: { creatorProfileId: string; brief: string; layoutHint?: string }): Promise<{ generationId: string }> => {
    try {
      const res = await apiClient.post<ApiResponse<{ generationId: string }>>('/ai/reference-sketches', data);
      if (!res.data.data) throw new Error('Không khởi tạo được lượt sinh ảnh phác thảo.');
      return res.data.data;
    } catch (cause) {
      throw new Error(extractErrorMessage(cause, 'Không khởi tạo được lượt sinh ảnh phác thảo.'));
    }
  },

  getGeneration: async (generationId: string): Promise<ReferenceSketchGenerationDto> => {
    try {
      const res = await apiClient.get<ApiResponse<ReferenceSketchGenerationDto>>(`/ai/reference-sketches/${generationId}`);
      if (!res.data.data) throw new Error('Không tải được trạng thái sinh ảnh phác thảo.');
      return res.data.data;
    } catch (cause) {
      throw new Error(extractErrorMessage(cause, 'Không tải được trạng thái sinh ảnh phác thảo.'));
    }
  },

  suggestLayoutHints: async (data: { creatorProfileId: string; brief: string; currentHint?: string }): Promise<SuggestLayoutHintsResultDto> => {
    try {
      const res = await apiClient.post<ApiResponse<SuggestLayoutHintsResultDto>>('/ai/reference-sketches/layout-hints', data);
      if (!res.data.data) throw new Error('Không tạo được gợi ý bố cục.');
      return res.data.data;
    } catch (cause) {
      throw new Error(extractErrorMessage(cause, 'Không tạo được gợi ý bố cục.'));
    }
  },
};
