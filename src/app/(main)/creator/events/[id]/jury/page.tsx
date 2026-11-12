'use client';

import { useParams } from 'next/navigation';
import { EventJuryScreen } from '@/features/event';

export default function CreatorEventJuryPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id || '';

  return <EventJuryScreen eventId={eventId} />;
}
