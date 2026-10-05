'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EventListItemDto } from '../types/event.types';

type TickListener = (nowMs: number) => void;
const listeners = new Set<TickListener>();
let globalInterval: ReturnType<typeof setInterval> | null = null;

function startGlobalTicker() {
  if (globalInterval !== null) return;
  globalInterval = setInterval(() => {
    const currentNow = Date.now();
    listeners.forEach((listener) => listener(currentNow));
  }, 1000);
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

export interface EventCountdownResult {
  phase: 'Upcoming' | 'Submission' | 'Judging' | 'Voting' | 'Ended';
  phaseLabel: string;
  targetDate: string | null;
  remainingMs: number;
  formatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
}

export function useEventCountdown(event?: EventListItemDto | null): EventCountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const onTick = (currentTime: number) => setNow(currentTime);
    const unsubscribe = subscribeSharedTick(onTick);
    return unsubscribe;
  }, []);

  return useMemo(() => {
    if (!event) {
      return {
        phase: 'Ended',
        phaseLabel: 'Ended',
        targetDate: null,
        remainingMs: 0,
        formatted: '00:00:00',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: true,
      };
    }

    const subStart = new Date(event.submissionStartAt).getTime();
    const subEnd = new Date(event.submissionEndAt).getTime();
    const votingEnd = new Date(event.votingEndAt || event.judgingEndAt).getTime();
    const resultAnnounce = new Date(event.resultAnnouncementAt || event.judgingEndAt).getTime();

    let phase: EventCountdownResult['phase'] = 'Ended';
    let phaseLabel = 'Ended';
    let targetTimeMs = 0;
    let targetDateStr: string | null = null;

    if (!isNaN(subStart) && now < subStart) {
      phase = 'Upcoming';
      phaseLabel = 'Submissions Open Soon';
      targetTimeMs = subStart;
      targetDateStr = event.submissionStartAt;
    } else if (!isNaN(subEnd) && now < subEnd) {
      phase = 'Submission';
      phaseLabel = 'Submission Deadline in';
      targetTimeMs = subEnd;
      targetDateStr = event.submissionEndAt;
    } else if (!isNaN(votingEnd) && now < votingEnd) {
      phase = 'Voting';
      phaseLabel = 'Voting Ends in';
      targetTimeMs = votingEnd;
      targetDateStr = event.votingEndAt || event.judgingEndAt;
    } else if (!isNaN(resultAnnounce) && now < resultAnnounce) {
      phase = 'Judging';
      phaseLabel = 'Results Announced in';
      targetTimeMs = resultAnnounce;
      targetDateStr = event.resultAnnouncementAt;
    } else {
      phase = 'Ended';
      phaseLabel = 'Contest Concluded';
      targetTimeMs = 0;
      targetDateStr = null;
    }

    const remainingMs = Math.max(0, targetTimeMs - now);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      phase,
      phaseLabel,
      targetDate: targetDateStr,
      remainingMs,
      formatted: remainingMs <= 0 ? 'Time Expired' : formatted,
      days,
      hours,
      minutes,
      seconds,
      isEnded: remainingMs <= 0 && phase === 'Ended',
    };
  }, [event, now]);
}
