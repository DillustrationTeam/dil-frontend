'use client';

import { useParams, usePathname } from 'next/navigation';
import { EventJuryScreen } from '@/features/event';

export default function PublicEventJuryPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const eventId = params?.id || '';
  // Xem ghi chú ở `events/[id]/page.tsx`: chặn render khi router đã sang route khác
  // để không bắn request sự kiện bằng id của route mới.
  const isThisRoute = Boolean(eventId) && pathname === `/events/${eventId}/jury`;
  if (!isThisRoute) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <EventJuryScreen eventId={eventId} />
    </div>
  );
}
