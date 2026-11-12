import type { Metadata } from 'next';
import { SiteHeader } from '@/features/navigation';

export const metadata: Metadata = {
  title: 'Không gian tài khoản | Dillustration',
  description: 'Trợ lý AI và các màn hình độc lập chưa có trong sidebar workspace.',
};

/**
 * Layout riêng cho các màn hình KHÔNG nằm trong sidebar workspace: `ai`,
 * `checkout`, `notifications`. Dùng chung `SiteHeader` (PublicHeader) và vỏ nền
 * `#1F2335` để đồng nhất hoàn toàn với trang chủ; `AiAssistantLauncher` đã được
 * gắn toàn cục ở `src/app/layout.tsx`.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1F2335] text-[#e4e1e5] font-body selection:bg-[#A7ACD9]/30 selection:text-white">
      <SiteHeader />
      {children}
    </div>
  );
}
