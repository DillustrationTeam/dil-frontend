'use client';

import { useSyncExternalStore } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { EventDetailScreen } from '@/features/event';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;
  const isAdmin = ready && roles.some(
    (r) =>
      r.toLowerCase().includes('admin') ||
      r.toLowerCase() === 'administrator' ||
      r.toLowerCase() === 'moderator'
  );

  const id = params?.id ?? '';
  // `useParams()` đọc từ router nên khi điều hướng sang route khác (vd. /artworks/{id}),
  // đoạn trang này còn render một nhịp với id MỚI. Không chặn thì nó gọi
  // GET /events/{artworkId} → 404 "Không tìm thấy sự kiện…" ngay khi rời trang.
  const isThisRoute = Boolean(id) && pathname === `/events/${id}`;
  if (!isThisRoute) return null;

  return <EventDetailScreen id={id} userId={userId} isAdmin={isAdmin} />;
}
