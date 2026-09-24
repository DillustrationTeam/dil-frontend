'use client';

import { useParams } from 'next/navigation';
import { ArtworkDetail } from '@/features/marketplace';

export default function ArtworkDetailPage() {
  const params = useParams<{ id: string }>();
  return <ArtworkDetail id={params.id} />;
}
