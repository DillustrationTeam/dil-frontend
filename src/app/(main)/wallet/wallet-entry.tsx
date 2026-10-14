'use client';

import { useSyncExternalStore } from 'react';
import { WalletScreen } from '@/features/payment';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

export function WalletEntry() {
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  return <WalletScreen key={user?.id ?? 'khach'} ready={ready} userId={ready && accessToken ? user?.id ?? null : null} />;
}
