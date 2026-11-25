'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Nút CTA hút theo con trỏ (magnetic) — chỉ trên thiết bị có chuột thật.
 *
 * Chỉ đổi `transform`, giới hạn vài px, và trả về 0 bằng transition ngắn khi rời
 * chuột. Trackpad / màn hình cảm ứng bỏ qua hoàn toàn.
 */
export function Magnetic({
  children,
  strength = 6,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      node.style.transform = `translate(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px)`;
    };
    const reset = () => {
      node.style.transform = '';
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', reset);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', reset);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`magnet inline-flex ${className}`.trim()}>
      {children}
    </span>
  );
}

export default Magnetic;