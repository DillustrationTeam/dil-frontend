import type { ReactNode } from 'react';

/**
 * Tách một dòng tiêu đề thành từng từ để mỗi từ nổi lên một nhịp.
 *
 * Server component: không JS, không đo layout. CSS trong `gallery.css`
 * (`.words span > i`) lo toàn bộ chuyển động, `prefers-reduced-motion` tắt sạch.
 */
export function Words({ children, className = '' }: { children: string; className?: string }) {
  const words = children.split(/\s+/).filter(Boolean);
  return (
    <span className={`words ${className}`.trim()}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <i>{word}</i>
          {index < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </span>
  );
}

/** Chỉ để TypeScript coi file này là module khi chỉ import type. */
export type WordsChild = ReactNode;