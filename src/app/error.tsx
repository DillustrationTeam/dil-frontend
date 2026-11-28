'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { StateScreen } from '@/components/feedback/state-screen';

/**
 * Error boundary cho toàn bộ cây route (Next dùng `error.tsx` gần nhất).
 *
 * Trước đây không có file này: một exception khi render đẩy người dùng ra trang lỗi
 * mặc định của Next (nền trắng, chữ tiếng Anh, không có đường về). Khung này giữ
 * ngôn ngữ thị giác của site, có nút thử lại và mã lỗi để báo hỗ trợ.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Giữ log cho dev/triển khai; người dùng chỉ thấy mã rút gọn bên dưới.
    console.error('[app-error]', error);
  }, [error]);

  return (
    <StateScreen
      icon={TriangleAlert}
      code="Lỗi 500 · Có lỗi xảy ra"
      showBrand
      title="Trang không tải được"
      description="Hệ thống gặp lỗi khi dựng trang này. Bạn thử lại lần nữa; nếu vẫn lỗi thì quay về trang chủ hoặc báo cho bộ phận hỗ trợ."
      actions={[
        { label: 'Thử lại', onClick: reset, variant: 'primary' },
        { label: 'Về trang chủ', href: '/', variant: 'ghost' },
      ]}
      footnote={
        error.digest ? `Mã lỗi để báo hỗ trợ: ${error.digest}` : 'Nếu lỗi lặp lại, hãy gửi ảnh chụp màn hình cho hỗ trợ.'
      }
    />
  );
}
