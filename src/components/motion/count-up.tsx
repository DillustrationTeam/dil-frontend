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
 *
 * Không được kẹt ở 0:
 * - `value` đổi sau khi dữ liệu về (0 -> 12) thì effect chạy lại và đếm lại từ đầu;
 * - phần tử đã nằm trong khung nhìn lúc mount thì đếm ngay, không chờ observer;
 * - observer không bắn callback (layout đổi, HMR, phần tử ngoài khung nhìn) thì vẫn
 *   có lưới an toàn chạy sau 1s để con số ra đúng.
 */
export function CountUp({ value, format = defaultFormat, duration = 1400, className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

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

    let raf = 0;
    let cancelled = false;
    let kicked = false;

    const run = () => {
      if (kicked || cancelled) return;
      kicked = true;

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

    setShown(0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);

    // Đã nằm trong khung nhìn thì chạy ngay, không chờ callback của observer.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) run();

    const safety = window.setTimeout(run, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
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