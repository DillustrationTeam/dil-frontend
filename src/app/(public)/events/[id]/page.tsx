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
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return <EventDetailScreen id={params.id} userId={userId} />;
}
