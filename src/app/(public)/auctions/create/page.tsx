'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { AuctionCreateScreen } from '@/features/auction';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

export default function AuctionCreatePage() {
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-outline">Đang tải trình tạo phiên đấu giá...</div>}>
      <AuctionCreateScreen userId={userId} />
    </Suspense>
  );
}
