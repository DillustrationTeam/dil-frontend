import { z } from 'zod';
import type { CreatorAssetDto } from '../types/creator-profile.types';

export const assetSchema = z.object({
  assetType: z.enum(['Pose', 'Palette', 'Preset']),
  name: z.string().trim().min(1, 'Nhập tên tài nguyên.').max(120, 'Tên tối đa 120 ký tự.'),
  assetUrl: z.string().trim().max(2048).refine(value => {
    if (!value) return true;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
  }, 'Nhập URL HTTP/HTTPS hợp lệ.'),
  notes: z.string().trim().max(3000, 'Nội dung tối đa 3000 ký tự.'),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu cần có dạng #RRGGBB.')).max(16),
}).superRefine((value, ctx) => {
  if (value.assetType === 'Palette' && value.colors.length < 2)
    ctx.addIssue({ code: 'custom', path: ['colors'], message: 'Chọn từ 2 đến 16 màu.' });
  if (value.assetType === 'Pose' && !value.assetUrl)
    ctx.addIssue({ code: 'custom', path: ['assetUrl'], message: 'Tải lên hoặc nhập URL ảnh pose mẫu.' });
  if (value.assetType === 'Preset' && !value.assetUrl && !value.notes)
    ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Nhập hướng dẫn preset hoặc thêm ảnh tham chiếu.' });
});

export type AssetDraft = z.infer<typeof assetSchema>;

export function assetDetails(asset: CreatorAssetDto): { colors: string[]; notes: string } {
  try {
    const value: unknown = JSON.parse(asset.metadataJson || '{}');
    if (!value || typeof value !== 'object') return { colors: [], notes: '' };
    const data = value as Record<string, unknown>;
    return {
      colors: Array.isArray(data.colors) ? data.colors.filter((x): x is string => typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x)).slice(0, 16) : [],
      notes: typeof data.notes === 'string' ? data.notes : typeof data.preset === 'string' ? data.preset : '',
    };
  } catch { return { colors: [], notes: '' }; }
}

export function assetMessage(asset: CreatorAssetDto): string {
  const { colors, notes } = assetDetails(asset);
  return [asset.assetType === 'Palette' ? `Bảng màu: ${asset.name}` : `Tài nguyên ${asset.assetType}: ${asset.name}`,
    colors.length ? colors.join(' · ') : '', notes, asset.assetUrl || ''].filter(Boolean).join('\n');
}
