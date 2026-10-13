'use client';

import { useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
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

  return <EventDetailScreen id={params.id} userId={userId} isAdmin={isAdmin} />;
}
