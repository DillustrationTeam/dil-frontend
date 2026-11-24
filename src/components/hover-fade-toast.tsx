'use client';

import { useEffect, useRef, useState } from 'react';
import { Toast, ToastBar, Toaster } from 'react-hot-toast';

/**
 * Mờ thông báo khi chuột đang ở trên nó để không che nút phía dưới, đồng thời cho phép
 * click xuyên qua. Theo dõi vị trí chuột bằng `window.mousemove` + `getBoundingClientRect`
 * thay vì CSS `:hover` kết hợp `pointer-events: none` trên CHÍNH phần tử đó — cách đó khiến
 * trình duyệt tự ngắt trạng thái hover ngay khi vừa ẩn pointer-events rồi lại bật lại ngay
 * lập tức, tạo vòng lặp giật liên tục.
 */
export function HoverFadeToast({ toast: t }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      setIsHovered(inside);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      // react-hot-toast tự đặt cứng pointer-events: auto trên div nội dung của ToastBar,
      // nên pointer-events: none ở đây (chỉ ảnh hưởng phần tử con KHÔNG tự set riêng) không đủ
      // để cho click xuyên qua — cần class .hover-fade-toast--faded (xem globals.css) ép
      // pointer-events: none !important xuống toàn bộ phần tử con.
      className={isHovered ? 'hover-fade-toast--faded' : undefined}
      style={{ opacity: isHovered ? 0.15 : 1, transition: 'opacity 150ms ease' }}
    >
      <ToastBar toast={t} />
    </div>
  );
}

/**
 * Bọc `<Toaster>` cùng render-prop `children` trong 1 Client Component — `layout.tsx` (Server
 * Component) không được phép truyền thẳng 1 hàm (closure) làm prop xuống Client Component.
 *
 * Giao diện toast thuộc hệ "INK & VERMILION": nền mực, chữ giấy, viền hairline ấm —
 * một khối mực nổi trên giấy thay vì một thẻ kính phát sáng.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'toast',
        style: {
          background: '#241F1A',
          color: '#FFFCF6',
          borderRadius: '14px',
          border: '1px solid rgba(34,30,26,0.12)',
          fontFamily: 'var(--font-body-grotesk), Inter, system-ui, sans-serif',
          fontSize: '0.875rem',
          padding: '0.7rem 0.9rem',
          boxShadow: '0 24px 44px -24px rgba(36,31,26,0.8)',
        },
        success: { iconTheme: { primary: '#4E8F82', secondary: '#FFFCF6' } },
        error: { iconTheme: { primary: '#C6603C', secondary: '#FFFCF6' } },
        loading: { iconTheme: { primary: '#8A6A1F', secondary: '#FFFCF6' } },
      }}
    >
      {(t) => <HoverFadeToast toast={t} />}
    </Toaster>
  );
}
