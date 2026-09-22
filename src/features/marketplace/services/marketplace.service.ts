import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';

export interface MarketplaceArtwork extends ArtworkDto {
  creatorName?: string;
  creatorHeadline?: string | null;
}

export const marketplaceService = {
  async getArtworks(): Promise<MarketplaceArtwork[]> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork[]>>('/artworks');
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load artworks.');
    }

    return response.data.data;
  },

  async getArtworkById(id: string): Promise<MarketplaceArtwork> {
    const response = await apiClient.get<ApiResponse<MarketplaceArtwork>>(`/artworks/${id}`);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load artwork detail.');
    }

    return response.data.data;
  },
};
