import type { Metadata } from 'next';
import { ContentModerationConsole } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Content & AI Moderation Queue (SCR-20) | dillustration Admin',
  description:
    'Evaluate Google Cloud Vision AI NSFW scan confidence score breakdowns, tag classifications, and execute moderator approval, rejection, and AI flagging decisions.',
};

export default function AdminContentModerationPage() {
  return <ContentModerationConsole />;
}
