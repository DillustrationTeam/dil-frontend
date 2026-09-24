'use client';

import { useParams } from 'next/navigation';
import { CreatorProfile } from '@/features/marketplace';

export default function CreatorPublicProfilePage() {
  const params = useParams<{ id: string }>();
  return <CreatorProfile id={params.id} />;
}
