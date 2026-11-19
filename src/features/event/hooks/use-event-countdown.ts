'use client';

import { useEffect, useMemo, useState } from 'react';
import { normalizeEventStatus, type EventListItemDto } from '../types/event.types';

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
  phaseLabelVie: string;
  targetDate: string | null;
  remainingMs: number;
  formatted: string;
  formattedVie: string;
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
        phaseLabelVie: 'Đã kết thúc',
        targetDate: null,
        remainingMs: 0,
        formatted: '00:00:00',
        formattedVie: '00:00:00',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: true,
      };
    }

    const normalizedStatus = normalizeEventStatus(event.status);
    if (normalizedStatus === 'Draft') {
      return {
        phase: 'Upcoming',
        phaseLabel: 'Draft — Not Published',
        phaseLabelVie: 'Bản nháp — Chưa phát hành',
        targetDate: null,
        remainingMs: 0,
        formatted: 'Draft',
        formattedVie: 'Bản nháp',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: false,
      };
    }

    if (normalizedStatus === 'Ended') {
      return {
        phase: 'Ended',
        phaseLabel: 'Contest Concluded',
        phaseLabelVie: 'Cuộc thi đã kết thúc',
        targetDate: null,
        remainingMs: 0,
        formatted: 'Time Expired',
        formattedVie: 'Đã hết hạn',
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
    let phaseLabelVie = 'Đã kết thúc';
    let targetTimeMs = 0;
    let targetDateStr: string | null = null;

    if (!isNaN(subStart) && now < subStart) {
      phase = 'Upcoming';
      phaseLabel = 'Waiting to Open in';
      phaseLabelVie = 'Mở nộp bài sau';
      targetTimeMs = subStart;
      targetDateStr = event.submissionStartAt;
    } else if (!isNaN(subEnd) && now < subEnd) {
      phase = 'Submission';
      phaseLabel = 'Submission Deadline in';
      phaseLabelVie = 'Hạn chót nộp bài sau';
      targetTimeMs = subEnd;
      targetDateStr = event.submissionEndAt;
    } else if (!isNaN(votingEnd) && now < votingEnd) {
      phase = 'Voting';
      phaseLabel = 'Voting Ends in';
      phaseLabelVie = 'Bình chọn kết thúc sau';
      targetTimeMs = votingEnd;
      targetDateStr = event.votingEndAt || event.judgingEndAt;
    } else if (!isNaN(resultAnnounce) && now < resultAnnounce) {
      phase = 'Judging';
      phaseLabel = 'Results Announced in';
      phaseLabelVie = 'Công bố kết quả sau';
      targetTimeMs = resultAnnounce;
      targetDateStr = event.resultAnnouncementAt;
    } else {
      phase = 'Ended';
      phaseLabel = 'Contest Concluded';
      phaseLabelVie = 'Cuộc thi đã kết thúc';
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

    const formattedVie = days > 0
      ? `${days} ngày ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      phase,
      phaseLabel,
      phaseLabelVie,
      targetDate: targetDateStr,
      remainingMs,
      formatted: remainingMs <= 0 ? 'Time Expired' : formatted,
      formattedVie: remainingMs <= 0 ? 'Đã hết hạn' : formattedVie,
      days,
      hours,
      minutes,
      seconds,
      isEnded: remainingMs <= 0 && phase === 'Ended',
    };
  }, [event, now]);
}
