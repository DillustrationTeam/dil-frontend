'use client';

import React from 'react';
import { parsePrizeTiers } from '../../utils/prize';

interface PrizeListProps {
  prize?: string | null;
  /** sm = trong thẻ sự kiện · md = băng nổi bật / trang chi tiết · lg = khối nhấn mạnh */
  size?: 'sm' | 'md' | 'lg';
  /** Số dòng tối đa; phần dư gộp thành "+N giải khác" (để thẻ không cao lệch nhau) */
  maxRows?: number;
  className?: string;
}

export function PrizeList({ prize, size = 'md', maxRows, className = '' }: PrizeListProps) {
  const tiers = parsePrizeTiers(prize);
  if (tiers.length === 0) return null;

  const shown = typeof maxRows === 'number' ? tiers.slice(0, maxRows) : tiers;
  const hidden = tiers.length - shown.length;

  return (
    <ul className={`ev-prizes ev-prizes--${size} ${className}`.trim()}>
      {shown.map((tier, idx) => (
        <li key={`${tier.label}-${idx}`}>
          <span>{tier.label}</span>
          {tier.amount ? <b>{tier.amount}</b> : null}
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <span>
            <em>+{hidden}</em>
          </span>
        </li>
      )}
    </ul>
  );
}
