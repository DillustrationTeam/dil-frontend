import { z } from 'zod';

const optionalHttpUrl = z.string().trim().max(500).refine(value => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Nhập URL hợp lệ bắt đầu bằng http:// hoặc https://.').default('');

export const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name is required').max(100),
  headline: z.string().max(200).default(''),
  bio: z.string().max(2000).default(''),
  specialties: z.string().max(500).default(''),
  location: z.string().max(200).default(''),
  websiteUrl: optionalHttpUrl,
  bannerUrl: optionalHttpUrl,
  isAcceptingOrders: z.boolean().default(true),
  availableSlots: z.number().int().min(0).max(100).default(0),
});

export type CreatorProfileFormValues = z.infer<typeof creatorProfileSchema>;

