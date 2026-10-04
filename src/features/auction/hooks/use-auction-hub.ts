'use client';

import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '@/store/use-auth-store';
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
  const [hubState, setHubState] = useState<InternalHubState>({
    auctionId: auctionId ?? '',
    status: 'connecting',
  });

  const callbacksRef = useRef(callbacks);
  const processedBidIdsRef = useRef(new Set<string>());

  // Trạng thái suy ra (derived state) để tránh setState đồng bộ trong effect
  const status: AuctionHubStatus = !auctionId || !accessToken
    ? 'disconnected'
    : hubState.auctionId === auctionId
      ? hubState.status
      : 'connecting';

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!auctionId || !accessToken) {
      return;
    }

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(auctionHubUrl(), { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const updateStatus = (next: AuctionHubStatus) => {
      setHubState({ auctionId, status: next });
    };

    // 1. Lắng nghe BidPlaced với Deduplicate theo bidId
    connection.on('BidPlaced', (payload: BidPlacedPayload) => {
      if (payload?.bid?.bidId) {
        if (processedBidIdsRef.current.has(payload.bid.bidId)) {
          return; // Skip duplicate event
        }
        processedBidIdsRef.current.add(payload.bid.bidId);
      }
      callbacksRef.current.onBidPlaced?.(payload);
    });

    // 2. Lắng nghe AuctionExtended
    connection.on('AuctionExtended', (payload: AuctionExtendedPayload) => {
      callbacksRef.current.onAuctionExtended?.(payload);
    });

    // 3. Lắng nghe AuctionStatusChanged và Map sang 3 sub-event
    connection.on('AuctionStatusChanged', (payload: AuctionStatusChangedPayload) => {
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
    connection.onreconnecting(() => updateStatus('connecting'));
    connection.onreconnected(() => {
      updateStatus('connected');
      connection
        .invoke('JoinAuction', auctionId)
        .then(() => {
          callbacksRef.current.onReconnectedRefetch?.();
        })
        .catch(() => undefined);
    });
    connection.onclose(() => updateStatus('disconnected'));

    let active = true;
    const startPromise = connection
      .start()
      .then(() => connection.invoke('JoinAuction', auctionId))
      .then(() => {
        if (active) updateStatus('connected');
      })
      .catch(() => {
        if (active) updateStatus('disconnected');
      });

    return () => {
      active = false;
      // Đợi start() xong rồi mới leave/stop() — gọi stop() khi đang negotiate (StrictMode
      // double-invoke effect ở dev) làm SignalR log lỗi "stopped during negotiation".
      void startPromise.finally(async () => {
        if (connection.state === HubConnectionState.Connected) {
          await connection.invoke('LeaveAuction', auctionId).catch(() => undefined);
        }
        await connection.stop().catch(() => undefined);
      });
    };
  }, [auctionId, accessToken]);

  return { status };
}
