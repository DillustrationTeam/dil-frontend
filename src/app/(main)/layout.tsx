'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TopNavbar from '@/components/navigation/TopNavbar';
import CollapsibleSidebar from '@/components/navigation/CollapsibleSidebar';
import { useAuthStore } from '@/store/use-auth-store';
import { SignInRequired } from '@/components/feedback/sign-in-required';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  /** Drawer điều hướng cho < lg: sidebar cố định chỉ tồn tại từ lg trở lên. */
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'creator'>('client');
  const pathname = usePathname();
  const router = useRouter();
  const isCreator = useAuthStore(state => state.roles.some(role => role.toLowerCase() === 'creator'));
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const activeRole = pathname?.startsWith('/creator/') ? 'creator' : currentRole;
  const isProfilePage = pathname === '/profile' || pathname?.startsWith('/creators/');

  const handleRoleChange = (role: 'client' | 'creator') => {
    setCurrentRole(role);
    setIsNavOpen(false);
    router.push(role === 'creator' ? '/creator/commissions' : '/client/commissions');
  };

  // Đổi route thì đóng drawer
  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  // Drawer: khoá cuộn nền + đóng bằng Escape
  useEffect(() => {
    if (!isNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isNavOpen]);

  // Khu vực này (client/creator/wallet/profile/workroom/collections…) đọc toàn API riêng tư.
  // Chặn ở layout để khách không thấy shell của thành viên và không bắn 401 vào console.
  // Trong lúc đọc lại phiên từ localStorage: hiện khung xương thay vì trang trắng,
  // để người dùng thấy phản hồi ngay chứ không tưởng app bị treo.
  if (!hasHydrated) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F2E9] p-4 sm:p-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang khôi phục phiên đăng nhập…</span>
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-40 rounded-full" />
          <div className="skeleton ml-auto h-9 w-9 rounded-full" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[16.5rem_1fr]">
          <div className="hidden space-y-3 lg:block">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="skeleton h-8 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-1/2 max-w-sm" />
            <div className="skeleton h-64 w-full" style={{ borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }
  if (!authenticated) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F2E9] text-[#241F1A]">
        <SignInRequired
          fullPage
          title="Đăng nhập để mở không gian làm việc"
          description="Đơn vẽ, bộ sưu tập, ví và phòng làm việc đều gắn với tài khoản của bạn — đăng nhập để tiếp tục."
        />
      </div>
    );
  }

  return (
    <div className="shell flex min-h-[100dvh] flex-col bg-[#F7F2E9] text-[#241F1A]">
      {/* Top Navbar — hamburger hiện dưới lg (khi sidebar chuyển thành drawer) */}
      <TopNavbar
        currentRole={activeRole}
        onRoleChange={handleRoleChange}
        onToggleSidebar={() => setIsNavOpen((open) => !open)}
      />

      {/* Drawer điều hướng (< lg) */}
      {isNavOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden" role="presentation">
          <div
            className="absolute inset-0 bg-[#14110E]/55 backdrop-blur-sm"
            onClick={() => setIsNavOpen(false)}
            aria-hidden="true"
          />
          <div
            id="studio-drawer"
            className="absolute left-0 top-0 flex h-[100dvh] w-[17rem] max-w-[85vw] flex-col border-r border-[#221E1A]/10 shadow-[0_24px_60px_-30px_rgba(20,17,14,0.85)]"
          >
            <CollapsibleSidebar
              key={`${activeRole}-drawer`}
              variant="drawer"
              isCollapsed={false}
              onToggleCollapse={() => undefined}
              role={activeRole}
              onNavigate={() => setIsNavOpen(false)}
              onClose={() => setIsNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Quick links trên mobile: chỉ giữ khi màn hình rất hẹp cho thao tác nhanh */}
      {!isProfilePage && (
        <nav
          aria-label="Mobile navigation"
          className="flex gap-2 overflow-x-auto border-b border-[#221E1A]/10 px-3 py-2 text-xs sm:hidden"
        >
          <button
            type="button"
            onClick={() => router.push('/client/commissions')}
            className="shrink-0 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2"
          >
            Đơn của tôi
          </button>
          {isCreator && (
            <button
              type="button"
              onClick={() => router.push('/creator/commissions')}
              className="shrink-0 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2"
            >
              Xưởng vẽ
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/wallet')}
            className="shrink-0 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2"
          >
            Ví
          </button>
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            className="shrink-0 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2 text-[#B24A26]"
          >
            Tất cả mục
          </button>
        </nav>
      )}

      {/* Main Body with Sidebar + Content */}
      <div className="relative flex w-full min-w-0 flex-1">
        {/* Sidebar cố định từ lg trở lên */}
        <CollapsibleSidebar
          key={activeRole}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          role={activeRole}
        />

        {/* Dynamic Page Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-5 sm:pb-16 lg:p-8 lg:pb-10">
          <div className="page page--flush">{children}</div>
        </main>
      </div>
    </div>
  );
}
