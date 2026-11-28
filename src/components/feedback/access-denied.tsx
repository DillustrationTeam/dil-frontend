import { ShieldX } from 'lucide-react';
import { StateScreen } from './state-screen';

/**
 * Trang chặn quyền dùng chung cho khu vực quản trị / kiểm duyệt.
 *
 * Trước đây mỗi nơi tự viết một khối `<h1>` trần trụi (không logo, không lối thoát rõ ràng),
 * nên người dùng bị đẩy vào một trang trắng. Khung này giữ đúng ngôn ngữ thị giác của site
 * và luôn có 2 lối ra: về trang chủ, hoặc đăng nhập bằng tài khoản khác.
 */
export function AccessDenied({ authenticated }: { authenticated: boolean }) {
  return (
    <StateScreen
      icon={ShieldX}
      code="403 · Không đủ quyền"
      showBrand
      title={authenticated ? 'Bạn không có quyền truy cập trang này' : 'Đăng nhập để mở trang quản trị'}
      description={
        authenticated
          ? 'Khu vực này chỉ dành cho tài khoản có vai trò Quản trị viên hoặc Kiểm duyệt viên. Tài khoản đang đăng nhập không có vai trò đó.'
          : 'Bạn cần đăng nhập bằng tài khoản quản trị để xem bảng điều khiển, kiểm duyệt nội dung và xử lý khiếu nại.'
      }
      actions={
        authenticated
          ? [
              { label: 'Về trang chủ', href: '/', variant: 'primary' },
              { label: 'Đổi tài khoản', href: '/login', variant: 'ghost' },
            ]
          : [
              { label: 'Đăng nhập', href: '/login', variant: 'primary' },
              { label: 'Về trang chủ', href: '/', variant: 'ghost' },
            ]
      }
      footnote="Nếu bạn chắc chắn mình có quyền, hãy đăng xuất rồi đăng nhập lại để làm mới phiên."
    />
  );
}

export default AccessDenied;
