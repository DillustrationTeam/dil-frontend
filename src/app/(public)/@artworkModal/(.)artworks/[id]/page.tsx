'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArtworkDetailModal } from '@/features/marketplace/components/artwork-detail';

export default function InterceptedArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return <ArtworkDetailModal key={id} id={id} onClose={() => router.back()} />;
}
