import { LockKeyhole } from 'lucide-react';
import { StateScreen } from './state-screen';

/**
 * Chặn "cần đăng nhập" cho các trang dữ liệu riêng tư (bộ sưu tập, hồ sơ, ví…).
 *
 * Trước đây những trang này vẫn mount component và gọi API bảo vệ → trình duyệt nhận
 * 401 và người dùng thấy khung trống. Chặn trước khi gọi API vừa sạch console vừa
 * cho người dùng một lối đi rõ ràng.
 */
export function SignInRequired({
  title = 'Đăng nhập để xem nội dung này',
  description = 'Dữ liệu này gắn với tài khoản của bạn nên cần đăng nhập trước khi xem.',
  fullPage = false,
}: {
  title?: string;
  description?: string;
  fullPage?: boolean;
}) {
  return (
    <StateScreen
      icon={LockKeyhole}
      code="Cần đăng nhập"
      fullPage={fullPage}
      showBrand={fullPage}
      title={title}
      description={description}
      actions={[
        { label: 'Đăng nhập', href: '/login', variant: 'primary' },
        { label: 'Khám phá sàn tranh', href: '/explore', variant: 'ghost' },
      ]}
      footnote="Chưa có tài khoản? Bạn có thể tạo tài khoản miễn phí ở trang đăng ký."
    />
  );
}

export default SignInRequired;
