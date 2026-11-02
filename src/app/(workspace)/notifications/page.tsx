'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { NotificationScreen } from '@/features/notification';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

export default function NotificationsPage() {
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-outline text-xs">Đang tải thông báo...</div>}>
      <NotificationScreen userId={userId} />
    </Suspense>
  );
}
