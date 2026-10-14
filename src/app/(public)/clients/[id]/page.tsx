'use client';

import { useParams } from 'next/navigation';
import { ClientProfile } from '@/features/marketplace';

export default function ClientPublicProfilePage() {
  const params = useParams<{ id: string }>();
  return <ClientProfile id={params.id} />;
}
