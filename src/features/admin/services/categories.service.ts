import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { CategoryDto } from '@/features/marketplace/services/categories.service';

export interface TrendingTagDto {
  tagId: string;
  name: string;
  artworkCount: number;
  isAiGenerated: boolean;
}

export interface AdminCategoriesOverviewDto {
  categories: CategoryDto[];
  trendingTags: TrendingTagDto[];
}

export interface UpsertCategoryRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PromoteTagRequest {
  categoryName?: string | null;
  description?: string | null;
  displayOrder?: number;
  assignOnlyUnassigned?: boolean;
  deleteTagAfterPromote?: boolean;
}

function unwrap<T>(response: { data: ApiResponse<T> }, fallbackMessage: string): T {
  if (response.data.error || response.data.data == null) {
    throw new Error(
      response.data.error?.details?.join(', ') ||
        response.data.error?.detail ||
        response.data.error?.title ||
        fallbackMessage
    );
  }
  return response.data.data;
}

export const adminCategoriesService = {
  async getOverview(trendingLimit = 30): Promise<AdminCategoriesOverviewDto> {
    const response = await apiClient.get<ApiResponse<AdminCategoriesOverviewDto>>(
      '/admin/categories',
      { params: { trendingLimit } }
    );
    return unwrap(response, 'Không tải được dữ liệu danh mục & tag.');
  },

  async createCategory(payload: UpsertCategoryRequest): Promise<CategoryDto> {
    const response = await apiClient.post<ApiResponse<CategoryDto>>('/admin/categories', payload);
    return unwrap(response, 'Không thể tạo danh mục.');
  },

  async updateCategory(id: string, payload: UpsertCategoryRequest): Promise<CategoryDto> {
    const response = await apiClient.put<ApiResponse<CategoryDto>>(
      `/admin/categories/${id}`,
      payload
    );
    return unwrap(response, 'Không thể cập nhật danh mục.');
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/admin/categories/${id}`
    );
    unwrap(response, 'Không thể xóa danh mục.');
  },

  async mergeTags(sourceTagIds: string[], targetTagId: string): Promise<{ affectedArtworks: number }> {
    const response = await apiClient.post<ApiResponse<{ merged: boolean; affectedArtworks: number }>>(
      '/admin/categories/tags/merge',
      { sourceTagIds, targetTagId }
    );
    return unwrap(response, 'Không thể gộp các tag.');
  },

  async promoteTag(
    tagId: string,
    payload: PromoteTagRequest
  ): Promise<{ category: CategoryDto; assignedArtworks: number }> {
    const response = await apiClient.post<
      ApiResponse<{ category: CategoryDto; assignedArtworks: number }>
    >(`/admin/categories/tags/${tagId}/promote`, payload);
    return unwrap(response, 'Không thể thăng hạng tag thành danh mục.');
  },
};
