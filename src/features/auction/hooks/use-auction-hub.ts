'use client';

import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '@/store/use-auth-store';
import { ensureFreshAccessToken as getSignalRAccessToken } from '@/lib/api-client';
import { auctionHubUrl } from '../services/auction-hub';
import type {
  AuctionExtendedPayload,
  AuctionStatusChangedPayload,
  BidPlacedPayload,
} from '../types/auction.types';

export type AuctionHubStatus = 'connecting' | 'connected' | 'disconnected';

export interface AuctionHubCallbacks {
  onBidPlaced?: (payload: BidPlacedPayload) => void;
  onAuctionExtended?: (payload: AuctionExtendedPayload) => void;
  onStatusChanged?: (payload: AuctionStatusChangedPayload) => void;
  onAuctionStarted?: (payload: AuctionStatusChangedPayload) => void;
  onAuctionEnded?: (payload: AuctionStatusChangedPayload) => void;
  onAuctionSettled?: (payload: AuctionStatusChangedPayload) => void;
  /** Gọi đúng 1 lần sau khi reconnect thành công để refetch dữ liệu mới nhất */
  onReconnectedRefetch?: () => void;
}

interface InternalHubState {
  auctionId: string;
  status: AuctionHubStatus;
}

export function useAuctionHub(
  auctionId: string | null | undefined,
  callbacks: AuctionHubCallbacks,
): { status: AuctionHubStatus } {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const hasSession = Boolean(userId && accessToken);
  const [hubState, setHubState] = useState<InternalHubState>({
    auctionId: auctionId ?? '',
    status: 'connecting',
  });

  const callbacksRef = useRef(callbacks);
  const processedBidIdsRef = useRef(new Set<string>());

  // Trạng thái suy ra (derived state) để tránh setState đồng bộ trong effect
  const status: AuctionHubStatus = !auctionId || !hasSession
    ? 'disconnected'
    : hubState.auctionId === auctionId
      ? hubState.status
      : 'connecting';

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!auctionId || !hasSession) {
      return;
    }

    let active = true;
    let connection: HubConnection | null = null;
    const updateStatus = (next: AuctionHubStatus) => {
      if (active) setHubState({ auctionId, status: next });
    };

    const startConnection = async () => {
      try {
        await getSignalRAccessToken();
        if (!active) return;

        const hubConnection: HubConnection = new HubConnectionBuilder()
          .withUrl(auctionHubUrl(), { accessTokenFactory: getSignalRAccessToken })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();
        connection = hubConnection;

        // 1. Lắng nghe BidPlaced với Deduplicate theo bidId
        hubConnection.on('BidPlaced', (payload: BidPlacedPayload) => {
          if (payload?.bid?.bidId) {
            if (processedBidIdsRef.current.has(payload.bid.bidId)) {
              return; // Skip duplicate event
            }
            processedBidIdsRef.current.add(payload.bid.bidId);
          }
          callbacksRef.current.onBidPlaced?.(payload);
        });

        // 2. Lắng nghe AuctionExtended
        hubConnection.on('AuctionExtended', (payload: AuctionExtendedPayload) => {
          callbacksRef.current.onAuctionExtended?.(payload);
        });

        // 3. Lắng nghe AuctionStatusChanged và Map sang 3 sub-event
        hubConnection.on('AuctionStatusChanged', (payload: AuctionStatusChangedPayload) => {
          callbacksRef.current.onStatusChanged?.(payload);

          if (payload?.status === 'Active') {
            callbacksRef.current.onAuctionStarted?.(payload);
          } else if (payload?.status === 'Ended') {
            callbacksRef.current.onAuctionEnded?.(payload);
          } else if (payload?.status === 'Settled') {
            callbacksRef.current.onAuctionSettled?.(payload);
          }
        });

        // Handle reconnect logic
        hubConnection.onreconnecting(() => updateStatus('connecting'));
        hubConnection.onreconnected(() => {
          updateStatus('connected');
          hubConnection
            .invoke('JoinAuction', auctionId)
            .then(() => callbacksRef.current.onReconnectedRefetch?.())
            .catch(() => undefined);
        });
        hubConnection.onclose(() => updateStatus('disconnected'));

        await hubConnection.start();
        if (!active) return;
        await hubConnection.invoke('JoinAuction', auctionId);
        updateStatus('connected');
      } catch {
        updateStatus('disconnected');
      }
    };

    const startPromise = startConnection();

    return () => {
      active = false;
      // Đợi kết nối khởi động xong trước khi đóng để giữ cách xử lý StrictMode của develop.
      void startPromise.finally(async () => {
        if (connection?.state === HubConnectionState.Connected) {
          await connection.invoke('LeaveAuction', auctionId).catch(() => undefined);
        }
        if (connection) await connection.stop().catch(() => undefined);
      });
    };
  }, [auctionId, userId, hasSession]);

  return { status };
}
