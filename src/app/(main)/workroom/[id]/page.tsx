'use client';

import { useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { WorkroomScreen } from '@/features/chat';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

export default function WorkroomDetailPage() {
  const params = useParams<{ id: string }>();
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return <WorkroomScreen roomId={params.id} userId={userId} />;
}
