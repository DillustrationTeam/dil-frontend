import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import { z } from 'zod';
export const metadataSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(2000), tags: z.array(z.string().trim().min(1).max(50)).max(10), style: z.string().max(100) });
export type MetadataSuggestion = z.infer<typeof metadataSchema>;
export type ScanStatus = { status: 'Queued' | 'Processing' | 'Succeeded' | 'Retrying' | 'Failed' | 'NotConfigured' | 'NotRequested'; score: number | null; provider: string | null; model: string | null; checkedAt: string | null; error: string | null };
export type Recommendation = { artwork: { id: string; title: string; imageUrl: string; thumbnailUrl?: string | null; creatorName?: string | null; tags: string[] }; reason: string };
async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const { data } = await promise;
  if (data.error || data.data == null) throw new Error(data.error?.details?.join(', ') || 'Không tải được dữ liệu AI.');
  return data.data;
}
export const artworkAiService = {
  suggest: async (file: File, signal?: AbortSignal) => {
    if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Chọn PNG, JPG hoặc WebP tối đa 5 MB để gợi ý AI.');
    const form = new FormData(); form.append('file', file);
    return metadataSchema.parse(await unwrap(apiClient.post<ApiResponse<MetadataSuggestion>>('/artworks/suggest-metadata', form, { signal, timeout: 75000 })));
  },
  recommendations: (signal?: AbortSignal) => unwrap(apiClient.get<ApiResponse<Recommendation[]>>('/me/artwork-recommendations', { signal })),
  scan: (id: string, signal?: AbortSignal) => unwrap(apiClient.get<ApiResponse<ScanStatus>>(`/artworks/${id}/ai-scan`, { signal })),
  retry: (id: string) => unwrap(apiClient.post<ApiResponse<ScanStatus>>(`/admin/moderation/${id}/ai-scan`)),
};
