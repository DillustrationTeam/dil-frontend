import type { Metadata } from 'next';
import { AdminPayoutScreen } from '@/features/payment';

export const metadata: Metadata = {
  title: 'Duyệt Rút Tiền (Payout Approvals) | dillustration Admin',
  description: 'Quản lý, xét duyệt và xử lý chuyển khoản các yêu cầu rút tiền của Creator (UC-49 / SCR-49).',
};

export default function AdminPayoutsPage() {
  return <AdminPayoutScreen />;
}
