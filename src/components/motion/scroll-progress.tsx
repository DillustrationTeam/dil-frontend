'use client';

import { useEffect } from 'react';

/**
 * Sợi chỉ tiến trình cuộn ở đỉnh viewport — chỉ đổi `width`, chạy trong rAF.
 *
 * Bản redesign dùng phần tử này thay cho scrollbar: người đọc luôn biết mình
 * đang ở đâu mà không phải nhìn một thanh xám bên phải.
 */
export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('dl-scroll-progress-i');
    if (!bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.setProperty('--p', `${p}%`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <i id="dl-scroll-progress-i" />
    </div>
  );
}

export default ScrollProgress;