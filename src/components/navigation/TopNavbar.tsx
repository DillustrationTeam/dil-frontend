'use client';

import React from 'react';
import Link from 'next/link';
import {
  Palette,
  Briefcase,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { NotificationBell } from '@/features/notification';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AccountMenu } from '@/components/navigation/account-menu';
import { useScrolled } from '@/components/motion';
import { Wordmark } from '@/components/brand/wordmark';

interface TopNavbarProps<T extends string = string> {
  currentRole?: 'client' | 'creator' | 'admin';
  onRoleChange?: (role: T) => void;
  onToggleSidebar?: () => void;
  showRoleSwitcher?: boolean;
  adminBadgeText?: string;
  className?: string;
}

/**
 * Header khu vực ứng dụng — bản "INK & VERMILION".
 *
 * Bỏ lớp kính navy: header là giấy, ở đỉnh trang hoà vào nền, khi cuộn mới hiện
 * một đường hairline (`.is-stuck`). Role switcher đổi từ pill phát sáng sang
 * segmented control nằm trên giấy.
 */
export default function TopNavbar<T extends string = string>({
  currentRole = 'client',
  onRoleChange,
  onToggleSidebar,
  showRoleSwitcher = true,
  adminBadgeText,
  className = '',
}: TopNavbarProps<T>) {
  const { user, roles } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();
  const scrolled = useScrolled(10);

  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isAdmin = roles.some((r) => r.toLowerCase() === 'admin') || currentRole === 'admin';

  const roleBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-[10px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
      active
        ? 'bg-[#FFFCF6] text-[#241F1A] shadow-[0_6px_14px_-10px_rgba(74,52,30,0.8)]'
        : 'text-[#6E6459] hover:text-[#241F1A]'
    }`;

  return (
    <header className={`header ${scrolled ? 'is-stuck' : ''} ${className}`}>
      <div className="flex h-[var(--header-h)] w-full items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-8">
        {/* Left: Brand Logo & Optional Mobile Sidebar Toggle */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-5">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="icon-btn lg:hidden"
              aria-label={t('Toggle navigation menu')}
              aria-controls="studio-drawer"
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
          )}
          <Wordmark size="md" />
        </div>

        {/* Right: Role Switcher, Quick Create, Notifications, Profile */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Role Switcher Pill */}
          {showRoleSwitcher && (isCreator || isAdmin) && (
            <div className="hidden items-center gap-1 rounded-[14px] border border-[#221E1A]/10 bg-[#F0E7D8] p-1 md:flex">
              <button
                onClick={() => (onRoleChange ? onRoleChange('client' as T) : router.push('/client/commissions'))}
                className={roleBtn(currentRole === 'client')}
              >
                <Briefcase className="h-3.5 w-3.5 text-[#B24A26]" />
                <span className="hidden lg:inline">{t('Client Mode')}</span>
              </button>
              {isCreator && (
                <button
                  onClick={() => (onRoleChange ? onRoleChange('creator' as T) : router.push('/creator/commissions'))}
                  className={roleBtn(currentRole === 'creator')}
                >
                  <Palette className="h-3.5 w-3.5 text-[#B24A26]" />
                  <span className="hidden lg:inline">{t('Creator Studio')}</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => (onRoleChange ? onRoleChange('admin' as T) : router.push('/admin'))}
                  className={roleBtn(currentRole === 'admin')}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#B24A26]" />
                  <span className="hidden lg:inline">{t('Admin Console')}</span>
                </button>
              )}
            </div>
          )}

          {/* Administrator Console Badge */}
          {adminBadgeText && (
            <span className="badge badge--live hidden uppercase tracking-[0.12em] sm:inline-flex">{adminBadgeText}</span>
          )}

          {/* Sáng / tối: dùng chung một nguồn theme với header công khai */}
          <ThemeToggle className="h-9 w-9 sm:h-11 sm:w-11" />

          {/* Notifications */}
          <NotificationBell
            userId={user?.id ?? null}
            triggerClassName="relative grid h-9 w-9 place-items-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] text-[#B24A26] transition-colors hover:border-[#B24A26] hover:text-[#8C3718] sm:h-11 sm:w-11"
          />

          <AccountMenu variant="app" />
        </div>
      </div>
    </header>
  );
}
