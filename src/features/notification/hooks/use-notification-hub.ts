'use client';

import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '@/store/use-auth-store';
import type { NotificationDto } from '../types/notification.types';
import { notificationHubUrl } from '../services/notification-hub';

/**
 * Nhận thông báo real-time qua `/hubs/notifications` (UC45).
 *
 * Trước đây badge chỉ làm mới mỗi 60 giây; hook này bổ sung đường đẩy tức thời.
 * Polling vẫn giữ làm lưới an toàn khi WebSocket bị chặn (proxy/mạng công ty).
 *
 * Server đẩy vào group `user-{userId}` nên client phải gọi `Subscribe` sau khi nối.
 */
export function useNotificationHub(
  onNotification: (notification: NotificationDto) => void,
): { connected: boolean } {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [hubConnected, setHubConnected] = useState(false);

  const handlerRef = useRef(onNotification);

  // Trạng thái suy ra: chưa đăng nhập thì chắc chắn không có kết nối hub.
  const connected = Boolean(userId && accessToken) && hubConnected;

  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId || !accessToken) {
      return;
    }

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(notificationHubUrl(), { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (notification: NotificationDto) => {
      handlerRef.current(notification);
    });

    connection.onreconnected(() => {
      setHubConnected(true);
      void connection.invoke('Subscribe').catch(() => undefined);
    });
    connection.onreconnecting(() => setHubConnected(false));
    connection.onclose(() => setHubConnected(false));

    let active = true;
    const startPromise = connection
      .start()
      .then(() => connection.invoke('Subscribe'))
      .then(() => {
        if (active) setHubConnected(true);
      })
      .catch(() => {
        // Không nối được hub thì badge vẫn chạy bằng polling — không làm phiền người dùng.
        if (active) setHubConnected(false);
      });

    return () => {
      active = false;
      // Đợi start() xong rồi mới stop() — gọi stop() khi đang negotiate (StrictMode
      // double-invoke effect ở dev) làm SignalR log lỗi "stopped during negotiation".
      void startPromise.finally(() => connection.stop().catch(() => undefined));
    };
  }, [userId, accessToken]);

  return { connected };
}
