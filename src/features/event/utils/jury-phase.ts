import type { EventDetailDto, EventListItemDto } from '../types/event.types';

type EventPhaseInput = Pick<
  EventDetailDto | EventListItemDto,
  'status' | 'judgingStartAt' | 'judgingEndAt' | 'submissionStartAt' | 'submissionEndAt'
> | null | undefined;

/**
 * Determine whether the event is currently within its active Judging window.
 * Prevents premature scoring during Draft/Submission phases even if the status label is stale,
 * and allows scoring once JudgingStartAt arrives even when EventStatus stays Open.
 */
export function computeIsJudgingPhase(event: EventPhaseInput, nowMs: number): boolean {
  if (!event) return false;

  const statusVal = String(event.status ?? '').trim().toLowerCase();
  if (statusVal === 'draft' || statusVal === '1' || statusVal === 'ended' || statusVal === '4') {
    return false;
  }

  if (event.judgingStartAt) {
    const startMs = new Date(event.judgingStartAt).getTime();
    if (!Number.isNaN(startMs)) {
      const endMs = event.judgingEndAt ? new Date(event.judgingEndAt).getTime() : Infinity;
      const validEndMs = Number.isNaN(endMs) ? Infinity : endMs;
      return nowMs >= startMs && nowMs <= validEndMs;
    }
  }

  return statusVal === 'judging' || statusVal === '3';
}

export function getJudgingLockMessage(event: EventPhaseInput, nowMs: number): string {
  if (!event) {
    return 'Evaluation is currently locked until event schedule loads.';
  }

  const statusVal = String(event.status ?? '').trim().toLowerCase();
  if (statusVal === 'draft' || statusVal === '1') {
    return 'Chấm điểm bị khóa vì sự kiện đang ở trạng thái Bản nháp (Draft).';
  }
  if (statusVal === 'ended' || statusVal === '4') {
    return 'Chấm điểm đã khóa vì sự kiện đã kết thúc (Ended).';
  }

  if (event.judgingStartAt) {
    const startMs = new Date(event.judgingStartAt).getTime();
    if (!Number.isNaN(startMs) && nowMs < startMs) {
      const startLabel = new Date(startMs).toLocaleString();
      return `Chưa tới thời gian chấm điểm. Vòng chấm điểm bắt đầu lúc ${startLabel}.`;
    }
  }

  if (event.judgingEndAt) {
    const endMs = new Date(event.judgingEndAt).getTime();
    if (!Number.isNaN(endMs) && nowMs > endMs) {
      return 'Thời gian chấm điểm của sự kiện đã kết thúc, điểm số đã được khóa.';
    }
  }

  return 'Chấm điểm tạm thời bị khóa cho tới khi sự kiện bước vào giai đoạn Chấm điểm (Judging).';
}

export function getRubricMaxTotal(criteria: ReadonlyArray<{ maxScore: number }>): number {
  const sum = criteria.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);
  return sum > 0 ? sum : 100;
}

