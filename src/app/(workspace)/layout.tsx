import type { Metadata } from 'next';
import { AiAssistantLauncher, SiteHeader } from '@/features/navigation';

export const metadata: Metadata = {
  title: 'Không gian tài khoản | Dillustration',
  description: 'Trợ lý AI và các màn hình độc lập chưa có trong sidebar workspace.',
};

/**
 * Layout riêng cho các màn hình KHÔNG nằm trong sidebar workspace: `ai`,
 * `checkout`, `notifications`.
 *
 * Trước đây nhóm này còn giữ cả wallet/deposit/payout/my-auctions/workroom/
 * creator/dashboard — nhưng các trang đó đều được `CollapsibleSidebar`
 * (`src/components/navigation/CollapsibleSidebar.tsx`) link tới, nên việc tách
 * riêng route group khiến mỗi lần bấm sidebar lại unmount toàn bộ
 * TopNavbar + CollapsibleSidebar của `(main)/layout.tsx` rồi mount `SiteHeader`
 * ở đây thay vào — trông như "load lại cả trang". Các trang đó đã được chuyển
 * sang `(main)/...` để dùng chung shell với `My Commissions`; route group
 * `(workspace)` giờ chỉ còn 3 trang không nằm trong sidebar.
 *
 * VÌ SAO VẪN TÁCH LAYOUT RIÊNG MÀ KHÔNG PHẢI `src/app/layout.tsx`:
 * `src/app/layout.tsx` là file dùng chung — nhiều nhánh khác cũng sửa nó
 * (feature/de190291-admin, feature/de190123-commission). Đặt header ở layout
 * gốc sẽ khiến mọi lần merge đều xung đột. Route group `(workspace)` là không
 * gian riêng cho các trang lẻ này: không nhánh nào khác dùng, nên merge luôn sạch.
 *
 * Route group `(workspace)` KHÔNG xuất hiện trong URL:
 *   src/app/(workspace)/notifications/page.tsx  →  /notifications
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <AiAssistantLauncher />
    </>
  );
}
