import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  artworkCount: number;
}

export interface SearchSuggestionCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface SearchSuggestionTagDto {
  id: string;
  name: string;
  artworkCount: number;
}

export interface SearchSuggestionsDto {
  categories: SearchSuggestionCategoryDto[];
  tags: SearchSuggestionTagDto[];
}

export const categoriesService = {
  async getCategories(): Promise<CategoryDto[]> {
    const response = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
    if (response.data.error || !response.data.data) {
      throw new Error(
        response.data.error?.details?.join(', ') || 'Không thể tải danh sách danh mục.'
      );
    }
    return response.data.data;
  },

  async getSearchSuggestions(q?: string): Promise<SearchSuggestionsDto> {
    const response = await apiClient.get<ApiResponse<SearchSuggestionsDto>>(
      '/marketplace/search-suggestions',
      {
        params: { q: q?.trim() || undefined },
      }
    );
    if (response.data.error || !response.data.data) {
      return { categories: [], tags: [] };
    }
    return response.data.data;
  },
};
