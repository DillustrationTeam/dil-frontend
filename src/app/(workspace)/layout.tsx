import type { Metadata } from 'next';
import { AiAssistantLauncher, SiteHeader } from '@/features/navigation';

export const metadata: Metadata = {
  title: 'Không gian tài khoản | Dillustration',
  description: 'Ví, nạp rút tiền, doanh thu, đấu giá, phòng làm việc và trợ lý AI.',
};

/**
 * Layout riêng cho nhóm màn hình của module An.
 *
 * VÌ SAO ĐẶT Ở ĐÂY MÀ KHÔNG PHẢI `src/app/layout.tsx`:
 * `src/app/layout.tsx` là file dùng chung — nhiều nhánh khác cũng sửa nó
 * (feature/de190291-admin, feature/de190123-commission). Đặt header ở layout
 * gốc sẽ khiến mọi lần merge đều xung đột. Route group `(workspace)` là không
 * gian riêng của nhóm này: không nhánh nào khác dùng, nên merge luôn sạch.
 *
 * Route group `(workspace)` KHÔNG xuất hiện trong URL:
 *   src/app/(workspace)/wallet/page.tsx  →  /wallet
 *
 * Cũng nhờ vậy, `src/app/(main)/layout.tsx` (do nhánh commission thêm vào, bọc
 * TopNavbar + CollapsibleSidebar cho mọi trang trong `(main)`) sẽ KHÔNG bọc
 * các trang ở đây — tránh cảnh hai thanh điều hướng chồng nhau.
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
