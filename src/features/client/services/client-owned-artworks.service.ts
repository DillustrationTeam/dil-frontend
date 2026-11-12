import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { OwnedArtworkDto } from '../types/owned-artwork.types';

export const clientOwnedArtworksService = {
  getOwnedArtworks: async (signal?: AbortSignal): Promise<OwnedArtworkDto[]> => {
    const response = await apiClient.get<ApiResponse<OwnedArtworkDto[]>>(
      '/client/owned-artworks',
      { signal }
    );
    if (response.data && response.data.data) {
      return response.data.data;
    }
    // Fallback if data is raw array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },
};

