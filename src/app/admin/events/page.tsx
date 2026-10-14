import type { Metadata } from 'next';
import { EventAdminScreen } from '@/features/event';

export const metadata: Metadata = {
  title: 'Admin Event Operations | dillustration Admin',
  description:
    'Quản lý điều hành sự kiện: Tạo sự kiện, phân quyền hội đồng Jury, giải quyết tranh chấp và công bố kết quả.',
};

export default function AdminEventsPage() {
  return <EventAdminScreen />;
}
