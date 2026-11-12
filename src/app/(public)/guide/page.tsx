import type { Metadata } from 'next';
import { PlatformGuideScreen } from '@/features/guide/components/platform-guide-screen';

export const metadata: Metadata = {
  title: 'Guide — Hướng dẫn & Bảo hộ Escrow | DILLUSTRATION',
  description:
    'Hướng dẫn 6 luồng nghiệp vụ cốt lõi (Thư viện tranh, Quy trình đặt vẽ 30-30-40, Đấu giá, Sự kiện, Trao đổi tranh, Trở thành họa sĩ) và bảo hộ pháp lý Escrow qua payOS trên DILLUSTRATION.',
};

/**
 * Trang Guide công khai tách riêng trên thanh điều hướng trang chủ.
 */
export default function GuidePage() {
  return <PlatformGuideScreen />;
}
