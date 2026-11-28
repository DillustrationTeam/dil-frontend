import { SearchX } from 'lucide-react';
import { StateScreen } from '@/components/feedback/state-screen';

export const metadata = {
  title: 'Không tìm thấy trang | dilillustration',
};

/**
 * 404 toàn cục. Trước đây repo không có `not-found.tsx` nên Next dùng trang mặc định
 * (nền trắng, chữ tiếng Anh) — lạc hẳn khỏi ngôn ngữ thị giác của site.
 */
export default function NotFound() {
  return (
    <StateScreen
      icon={SearchX}
      code="404 · Không tìm thấy"
      showBrand
      title="Trang này không tồn tại"
      description="Đường dẫn có thể đã đổi tên, bị xoá, hoặc bạn gõ sai địa chỉ. Thử tìm tác phẩm theo tên ở sàn tranh."
      actions={[
        { label: 'Về trang chủ', href: '/', variant: 'primary' },
        { label: 'Khám phá sàn tranh', href: '/explore', variant: 'ghost' },
      ]}
      footnote="Nếu bạn đi tới đây từ một liên kết trong site, hãy báo lại để chúng tôi sửa liên kết đó."
    />
  );
}
