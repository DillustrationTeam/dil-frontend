import { z } from 'zod';

const optionalHttpUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Enter a valid HTTP or HTTPS URL.').default('');

export const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name is required').max(100),
  headline: z.string().max(200).default(''),
  bio: z.string().max(2000).default(''),
  specialties: z.string().max(500).default(''),
  location: z.string().max(200).default(''),
  websiteUrl: optionalHttpUrl,
  bannerUrl: optionalHttpUrl,
  availableSlots: z.number().int().min(0).max(100).optional(),
  isAcceptingOrders: z.boolean().default(true),
});
