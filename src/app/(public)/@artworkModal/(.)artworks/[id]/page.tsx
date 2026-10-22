'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArtworkDetailModal } from '@/features/marketplace/components/artwork-detail';

export default function InterceptedArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  return <ArtworkDetailModal key={id} id={id} onClose={() => router.back()} />;
}
