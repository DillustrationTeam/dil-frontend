'use client';

import { useEffect, useMemo, useState } from 'react';

type TickListener = () => void;

const listeners = new Set<TickListener>();
let globalInterval: ReturnType<typeof setInterval> | null = null;

function startGlobalTicker() {
  if (globalInterval !== null) return;
  globalInterval = setInterval(() => {
    listeners.forEach((listener) => listener());
  }, 100);
}

function stopGlobalTicker() {
  if (listeners.size === 0 && globalInterval !== null) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
}

function subscribeSharedTick(listener: TickListener): () => void {
  listeners.add(listener);
  startGlobalTicker();
  return () => {
    listeners.delete(listener);
    stopGlobalTicker();
  };
}

export interface AuctionClockOptions {
  endAt: string | Date | null | undefined;
  serverTime?: string | Date | null;
  isDetail?: boolean;
}

export interface AuctionClockResult {
  remainingMs: number;
  formatted: string;
  isEnded: boolean;
}

/**
 * Tính thời gian còn lại (ms) có bù đắp server offset để tránh trôi giờ (drift).
 */
export function calculateRemainingMs(
  endAtInput: string | Date | null | undefined,
  serverTimeInput?: string | Date | null,
  capturedLocalTimeMs?: number,
): number {
  if (!endAtInput) return 0;
  const endAtMs = new Date(endAtInput).getTime();
  if (isNaN(endAtMs)) return 0;

  const localNow = Date.now();
  let currentServerMs: number;

  if (serverTimeInput) {
    const serverMs = new Date(serverTimeInput).getTime();
    if (!isNaN(serverMs)) {
      const elapsedSinceSync = localNow - (capturedLocalTimeMs ?? localNow);
      currentServerMs = serverMs + Math.max(0, elapsedSinceSync);
    } else {
      currentServerMs = localNow;
    }
  } else {
    currentServerMs = localNow;
  }

  return Math.max(0, endAtMs - currentServerMs);
}

/**
 * Định dạng đếm ngược cho danh sách: HH:MM:SS (hoặc DDd HH:MM:SS nếu > 24 giờ).
 */
export function formatCountdownList(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Định dạng đếm ngược cho trang chi tiết: HH:MM:SS:ms (ms 2 chữ số).
 */
export function formatCountdownDetail(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00:00';

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((remainingMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(ms)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(ms)}`;
}

/**
 * Hook đồng hồ đếm ngược dùng chung 1 ticker duy nhất cho toàn bộ danh sách card,
 * không làm trôi thời gian khi tab ở background và tự cập nhật khi endAt thay đổi (vd gia hạn phiên).
 */
export function useAuctionClock({ endAt, serverTime, isDetail = false }: AuctionClockOptions): AuctionClockResult {
  const [syncTime] = useState(() => ({
    serverTime,
    localTimeMs: Date.now(),
  }));

  const [remainingMs, setRemainingMs] = useState(() =>
    calculateRemainingMs(endAt, syncTime.serverTime, syncTime.localTimeMs),
  );

  useEffect(() => {
    const updateRemaining = () => {
      setRemainingMs(calculateRemainingMs(endAt, syncTime.serverTime, syncTime.localTimeMs));
    };

    updateRemaining();

    const unsubscribe = subscribeSharedTick(updateRemaining);
    return unsubscribe;
  }, [endAt, syncTime.serverTime, syncTime.localTimeMs]);

  const formatted = useMemo(
    () => (isDetail ? formatCountdownDetail(remainingMs) : formatCountdownList(remainingMs)),
    [remainingMs, isDetail],
  );

  return {
    remainingMs,
    formatted,
    isEnded: remainingMs <= 0,
  };
}
