'use client';

import { useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { AuctionDetailScreen } from '@/features/auction';
import { useAuthStore } from '@/store/use-auth-store';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return <AuctionDetailScreen auctionId={params.id} userId={userId} />;
}
