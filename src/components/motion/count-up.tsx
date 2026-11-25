'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  /** Giá trị đích. */
  value: number;
  /** Định dạng số sau khi đếm xong — mặc định là số nguyên vi-VN. */
  format?: (value: number) => string;
  /** Thời lượng đếm, ms. */
  duration?: number;
  className?: string;
};

const defaultFormat = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(value));

/**
 * Đếm số bằng requestAnimationFrame, bắt đầu khi phần tử vào khung nhìn.
 *
 * Con số phải là *số thật* đúng tới khung hình cuối, và phải đứng yên ngay khi
 * người dùng bật giảm chuyển động.
 */
export function CountUp({ value, format = defaultFormat, duration = 1400, className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setShown(value);
      return;
    }

    setShown(0);
    let raf = 0;
    let cancelled = false;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic: nhanh ở đầu, chậm dần đúng nhịp đếm của một con số
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(value * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setShown(value);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;
          run();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`.trim()}>
      {format(shown)}
    </span>
  );
}

export default CountUp;