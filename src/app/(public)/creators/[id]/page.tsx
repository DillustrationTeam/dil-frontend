'use client';

import { useParams } from 'next/navigation';
import { CreatorProfileScreen } from '@/features/marketplace/components/creator-profile-screen';

export default function CreatorPublicProfilePage() {
  const params = useParams<{ id: string }>();
  return <CreatorProfileScreen id={params.id} />;
}
