'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { ProfileSettingsForm } from '@/features/profile-settings/components/profile-settings-form';
import { SecuritySettingsForm } from '@/features/profile-settings/components/security-settings-form';
import { ProfileTabsSettingsForm } from '@/features/profile-settings/components/profile-tabs-settings-form';
import { DangerZoneForm } from '@/features/profile-settings/components/danger-zone-form';

type SettingsTab = 'profile' | 'security' | 'display' | 'danger';

// Tạm ẩn — chờ hoàn thiện migration DB (PublicVisibleTabs) và trang hồ sơ công khai
// trước khi bật lại cho user chỉnh sửa.
const SHOW_PROFILE_TABS_SETTINGS = false;

const tabs: Array<{ value: SettingsTab; label: string }> = [
  { value: 'profile', label: 'Hồ sơ' },
  { value: 'security', label: 'Tài khoản & Bảo mật' },
  ...(SHOW_PROFILE_TABS_SETTINGS ? [{ value: 'display' as const, label: 'Danh mục hồ sơ' }] : []),
  { value: 'danger', label: 'Xóa tài khoản' },
];

export default function SettingsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<SettingsTab>('profile');

  useEffect(() => {
    // Chờ Zustand persist đọc xong localStorage rồi mới quyết định — kiểm tra
    // isAuthenticated ngay khi mount sẽ luôn thấy false (giá trị mặc định) và
    // đá nhầm người dùng đã đăng nhập ra /login mỗi lần F5 hoặc mở link thẳng.
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F2E9] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-h1 text-2xl font-bold text-[#241F1A]">Cài đặt hồ sơ</h1>
          {user?.id && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 px-3.5 py-1.5 text-xs font-medium text-[#6E6459] transition hover:border-[#B24A26] hover:text-[#241F1A]"
            >
              <Eye size={14} aria-hidden /> Xem hồ sơ công khai </Link>
          )}
        </div>

        <div className="mb-8 flex gap-2 border-b border-[#221E1A]/10">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`border-b-2 px-4 py-3 text-sm transition ${
                tab === value ? 'border-[#B24A26] text-[#241F1A]' : 'border-transparent text-[#746A5F] hover:text-[#6E6459]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileSettingsForm />}
        {tab === 'security' && <SecuritySettingsForm />}
        {tab === 'display' && <ProfileTabsSettingsForm />}
        {tab === 'danger' && <DangerZoneForm />}
      </div>
    </main>
  );
}
