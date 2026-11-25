'use client';

import { useEffect, useState } from 'react';

/**
 * Trả về `true` khi trang đã cuộn quá `threshold` px.
 *
 * Dùng cho header: ở đỉnh trang header hoà vào giấy, khi cuộn thì nổi lên bằng
 * một đường hairline thay vì một khối kính.
 */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrolled;
}

export default useScrolled;