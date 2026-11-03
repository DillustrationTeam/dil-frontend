'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { PageHeader } from '@/components/page-header';
import { ProfileSettingsForm } from '@/features/profile-settings/components/profile-settings-form';
import { SecuritySettingsForm } from '@/features/profile-settings/components/security-settings-form';
import { DangerZoneForm } from '@/features/profile-settings/components/danger-zone-form';

type SettingsTab = 'profile' | 'security' | 'danger';

const tabs: Array<{ value: SettingsTab; label: string }> = [
  { value: 'profile', label: 'Hồ sơ' },
  { value: 'security', label: 'Tài khoản & Bảo mật' },
  { value: 'danger', label: 'Vô hiệu hóa tài khoản' },
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
    <main className="min-h-screen bg-[#1F2335] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <PageHeader title="Cài đặt hồ sơ" />
          {user?.id && (
            <Link
              href="/profile"
              className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-[#C7C5CF] transition hover:border-[#A7ACD9] hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              Xem hồ sơ công khai
            </Link>
          )}
        </div>

        <div className="mb-8 flex gap-2 border-b border-white/10">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`border-b-2 px-4 py-3 text-sm transition ${
                tab === value ? 'border-[#A7ACD9] text-white' : 'border-transparent text-[#919099] hover:text-[#C7C5CF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileSettingsForm />}
        {tab === 'security' && <SecuritySettingsForm />}
        {tab === 'danger' && <DangerZoneForm />}
      </div>
    </main>
  );
}
