'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { AiFloatingWidget } from './ai-floating-widget';

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useAuthStore.persist.onHydrate(listener);
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

/**
 * Lớp vỏ dùng chung cho các màn hình của module An:
 * thanh điều hướng nằm trong từng trang, còn nút trợ lý AI nổi được gắn ở đây
 * để tự đọc `userId` từ store, không phải truyền qua từng trang.
 */
export function AiAssistantLauncher() {
  const ready = useSyncExternalStore(subscribeHydration, () => useAuthStore.persist.hasHydrated(), () => false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = ready && accessToken ? user?.id ?? null : null;

  return <AiFloatingWidget userId={userId} />;
}
