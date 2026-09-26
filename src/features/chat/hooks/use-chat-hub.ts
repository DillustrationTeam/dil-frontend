'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '@/store/use-auth-store';
import type { ChatMessageDto } from '../types/chat.types';
import { chatHubUrl } from '../services/chat-hub';

export type ChatHubStatus = 'connecting' | 'connected' | 'disconnected';

export interface ChatHubCallbacks {
  /** Server phát tin nhắn mới cho cả phòng (kể cả tin của chính mình). */
  onMessage: (message: ChatMessageDto) => void;
  /** Đối tác đã đọc tới mốc thời gian nào. */
  onRead?: (readerId: string, lastReadAt: string) => void;
  /** Đối tác đang gõ. */
  onTyping?: (typerId: string) => void;
  /** Server từ chối gửi tin (phòng khoá, mất quyền, dữ liệu sai). */
  onFailure?: (reason: string) => void;
}

export interface ChatHubApi {
  status: ChatHubStatus;
  /** Gửi tin nhắn văn bản qua hub. Ném lỗi khi hub chưa kết nối. */
  sendMessage: (body: string, messageType?: string) => Promise<void>;
  /** Phát một tin nhắn đã lưu (upload tệp qua REST) cho cả phòng. */
  publishStoredMessage: (messageId: string) => Promise<void>;
  /** Báo đã đọc tới hiện tại (lưu DB + phát "đã xem" cho đối tác). */
  markRead: () => Promise<void>;
  /** Báo "đang gõ" — tự chặn spam, tối đa 1 lần mỗi 2 giây. */
  notifyTyping: () => void;
}

/** Trạng thái kết nối gắn kèm roomId để đổi phòng là tự coi như đang nối lại. */
interface HubState {
  roomId: string;
  status: ChatHubStatus;
}

/**
 * Kết nối SignalR tới `/hubs/chat` cho một phòng (UC43).
 *
 * NGUYÊN TẮC:
 *   - Một kết nối cho một phòng, đóng khi unmount hoặc đổi phòng — không tạo thêm
 *     connection mỗi lần re-render.
 *   - Callback giữ trong ref nên đổi callback không làm đứt kết nối.
 *   - JWT truyền qua query-string lúc handshake (WebSocket không gửi được header).
 */
export function useChatHub(roomId: string, callbacks: ChatHubCallbacks): ChatHubApi {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [hubState, setHubState] = useState<HubState>({ roomId, status: 'connecting' });

  const connectionRef = useRef<HubConnection | null>(null);
  const callbacksRef = useRef(callbacks);
  const lastTypingRef = useRef(0);

  // Trạng thái SUY RA: thiếu phòng/token, hoặc state còn của phòng cũ ⇒ 'connecting'.
  // Nhờ vậy effect không phải setState đồng bộ khi mới chạy.
  const status: ChatHubStatus = !roomId || !accessToken
    ? 'disconnected'
    : hubState.roomId === roomId
      ? hubState.status
      : 'connecting';

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!roomId || !accessToken) {
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(chatHubUrl(), { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    const publishStatus = (next: ChatHubStatus) => setHubState({ roomId, status: next });

    connection.on('ReceiveMessage', (message: ChatMessageDto) => callbacksRef.current.onMessage(message));
    connection.on('MessageRead', (readerId: string, lastReadAt: string) =>
      callbacksRef.current.onRead?.(readerId, lastReadAt));
    connection.on('UserTyping', (typerId: string) => callbacksRef.current.onTyping?.(typerId));
    connection.on('MessageFailed', (reason: string) => callbacksRef.current.onFailure?.(reason));
    connection.on('RoomJoined', () => publishStatus('connected'));
    connection.on('RoomJoinFailed', (reason: string) => {
      publishStatus('disconnected');
      callbacksRef.current.onFailure?.(reason);
    });

    connection.onreconnecting(() => publishStatus('connecting'));
    connection.onreconnected(() => {
      publishStatus('connected');
      // Vào lại group sau khi nối lại: group gắn với connection id cũ đã mất.
      void connection.invoke('JoinRoom', roomId).catch(() => undefined);
    });
    connection.onclose(() => publishStatus('disconnected'));

    let active = true;
    connection
      .start()
      .then(() => connection.invoke('JoinRoom', roomId))
      .then(() => {
        if (active) publishStatus('connected');
      })
      .catch(() => {
        if (active) publishStatus('disconnected');
      });

    return () => {
      active = false;
      connectionRef.current = null;
      void connection.stop().catch(() => undefined);
    };
  }, [roomId, accessToken]);

  const sendMessage = useCallback(
    async (body: string, messageType?: string) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        throw new Error('Chưa kết nối được máy chủ thời gian thực. Vui lòng thử lại sau vài giây.');
      }
      await connection.invoke('SendMessage', roomId, body, messageType ?? null);
    },
    [roomId],
  );

  const publishStoredMessage = useCallback(
    async (messageId: string) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        return;
      }
      await connection.invoke('PublishStoredMessage', roomId, messageId);
    },
    [roomId],
  );

  const markRead = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      throw new Error('Chưa kết nối được máy chủ thời gian thực.');
    }
    await connection.invoke('MarkRead', roomId);
  }, [roomId]);

  const notifyTyping = useCallback(() => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) return;

    const now = Date.now();
    if (now - lastTypingRef.current < 1500) return;
    lastTypingRef.current = now;
    void connection.invoke('Typing', roomId).catch(() => undefined);
  }, [roomId]);

  return { status, sendMessage, publishStoredMessage, markRead, notifyTyping };
}
