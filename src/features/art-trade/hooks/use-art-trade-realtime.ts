'use client';

import { useCallback } from 'react';
import { useNotificationHub } from '@/features/notification/hooks/use-notification-hub';
import type { NotificationDto } from '@/features/notification/types/notification.types';

/**
 * Real-time cho một Art Trade: mọi bước chuyển trạng thái của đối tác (đề nghị, chấp nhận,
 * nộp tranh, xác nhận, hủy, khiếu nại) đều phát thông báo qua `/hubs/notifications`.
 * Hook này lọc thông báo thuộc trade đang mở rồi gọi `onChange` để tải lại dữ liệu.
 */
export function useArtTradeRealtime(
  tradeId: string | undefined,
  onChange: (notification: NotificationDto) => void,
): { connected: boolean } {
  const handler = useCallback(
    (n: NotificationDto) => {
      if (!tradeId) return;
      const sameTrade = n.refType === 'ArtTrade' && n.refId?.toLowerCase() === tradeId.toLowerCase();
      const dispute = n.refType === 'TradeDispute';
      if (sameTrade || dispute) onChange(n);
    },
    [tradeId, onChange],
  );

  return useNotificationHub(handler);
}

