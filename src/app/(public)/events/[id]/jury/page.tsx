'use client';

import { useParams } from 'next/navigation';
import { EventJuryScreen } from '@/features/event';

export default function PublicEventJuryPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <EventJuryScreen eventId={eventId} />
    </div>
  );
}
