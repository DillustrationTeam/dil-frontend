'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** Nhịp trễ trước khi vào khung, ms. Dùng để xếp lớp các khối cùng hàng. */
  delay?: number;
  /** Thêm một nhịp kéo nét (blur 6px → 0) đúng kiểu "blur fade" của bản redesign. */
  blur?: boolean;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll reveal bằng IntersectionObserver — không thư viện, không GSAP.
 *
 * Chỉ animate `opacity` / `transform` / `filter` (composite-friendly). Khi
 * `prefers-reduced-motion: reduce`, CSS đã tắt transition nên phần tử hiện ngay
 * ở trạng thái cuối; observer vẫn gắn class nhưng không còn gì để chuyển động.
 */
export function Reveal({ children, delay = 0, blur = false, as, className = '' }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('is-in');
          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={`reveal ${blur ? 'reveal--blur' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export default Reveal;