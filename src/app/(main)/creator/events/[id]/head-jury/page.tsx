'use client';

import { useParams } from 'next/navigation';
import { EventHeadJuryScreen } from '@/features/event';

export default function CreatorEventHeadJuryPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id || '';

  return <EventHeadJuryScreen eventId={eventId} />;
}
