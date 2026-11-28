'use client';

import { riskLevelBadgeClass, riskLevelLabels } from '../types/auction-risk.types';

/**
 * Severity badge. Uses the `.badge` modifiers the design system already ships, so it sits next to
 * live/soon/done badges without introducing a fifth accent colour.
 *
 * The text is always rendered: colour alone must never be the only carrier of severity.
 */
export function RiskBadge({
  level,
  label,
  className = '',
}: {
  level: string;
  label?: string;
  className?: string;
}) {
  const modifier = riskLevelBadgeClass[level] ?? 'badge--done';
  const text = label ?? riskLevelLabels[level] ?? level;

  return <span className={`badge ${modifier} ${className}`.trim()}>{text}</span>;
}

/**
 * Score block: big number for scanning, "/100" muted, both tabular so rows align.
 * Colours are tokens so the sheet stays legible on paper and on ink.
 */
export function RiskScore({ score }: { score: number }) {
  const display = score % 1 === 0 ? score.toFixed(0) : score.toFixed(1);

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-h1 text-2xl font-extrabold tabular-nums text-[var(--ivory)]">{display}</span>
      <span className="text-[11px] text-[var(--ash-dim)]">/100</span>
    </span>
  );
}
