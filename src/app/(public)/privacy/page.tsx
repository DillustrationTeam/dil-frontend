import type { Metadata } from 'next';
import { PrivacyPolicyContent } from '@/features/guide/components/privacy-policy-content';

export const metadata: Metadata = {
  title: 'Chính sách bảo vệ dữ liệu cá nhân | DILLUSTRATION',
  description:
    'Bản công bố minh bạch về thu thập, xử lý, lưu trữ dữ liệu cá nhân và quyền của người dùng trên DILLUSTRATION theo Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.',
};

/**
 * Trang Chính sách bảo vệ dữ liệu cá nhân (/privacy).
 */
export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
