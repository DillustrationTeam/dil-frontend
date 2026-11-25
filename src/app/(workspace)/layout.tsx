import type { Metadata } from 'next';
import { SiteHeader } from '@/features/navigation';

export const metadata: Metadata = {
  title: 'Không gian tài khoản | Dillustration',
  description: 'Trợ lý AI và các màn hình độc lập chưa có trong thanh điều hướng của không gian làm việc.',
};

/**
 * Layout riêng cho các màn hình KHÔNG nằm trong sidebar workspace: `ai`,
 * `checkout`, `notifications`. Dùng chung `SiteHeader` (PublicHeader) và vỏ nền
 * `#F7F2E9` để đồng nhất hoàn toàn với trang chủ; `AiAssistantLauncher` đã được
 * gắn toàn cục ở `src/app/layout.tsx`.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F2E9] text-[#241F1A] font-body selection:bg-[#B24A26]/30 selection:text-[#241F1A]">
      <SiteHeader />
      {children}
    </div>
  );
}
