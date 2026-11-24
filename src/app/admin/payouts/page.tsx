import type { Metadata } from 'next';
import { AdminPayoutScreen } from '@/features/payment';

export const metadata: Metadata = {
  title: 'Duyệt Rút Tiền (chi trả Approvals) | dillustration quản trị viên',
  description: 'Quản lý, xét duyệt và xử lý chuyển khoản các yêu cầu rút tiền của họa sĩ (UC-49 / SCR-49).',
};

export default function AdminPayoutsPage() {
  return <AdminPayoutScreen />;
}
