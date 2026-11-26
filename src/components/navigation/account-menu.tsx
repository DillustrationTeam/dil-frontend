'use client';

import Image from 'next/image';
import { ArrowLeftRight, Brush, ChevronDown, LayoutDashboard, LogOut, Palette, Settings, ShieldCheck, User, UserCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import { authService } from '@/services/auth.service';

/**
 * Nút avatar + dropdown tài khoản dùng chung cho mọi header (TopNavbar, PublicHeader)
 * để nội dung menu luôn đồng nhất — sửa một chỗ, áp dụng ở mọi nơi.
 *
 * variant 'app'    → trigger chỉ avatar + chevron (dùng trong sidebar workspace).
 * variant 'public' → trigger có thêm tên + vai trò (dùng ở các trang công khai).
 */
export function AccountMenu({ variant = 'app' }: { variant?: 'app' | 'public' }) {
  const { user, roles, refreshToken, clearAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isAdmin = roles.some((r) => ['administrator', 'admin', 'moderator'].includes(r.toLowerCase()));

  const studioHref = isAdmin ? '/admin' : isCreator ? '/creator/commissions' : '/client/commissions';
  const studioLabel = isAdmin ? t('Trung tâm quản trị') : isCreator ? t('Creator Studio') : t('My Studio');

  // Nhãn vai trò hiển thị tiếng Việt; vai trò lạ thì giữ nguyên giá trị gốc.
  const roleLabel =
    roles
      .map((role) => {
        const key = role.toLowerCase();
        if (key === 'creator') return t('Họa sĩ');
        if (key === 'client') return t('Khách hàng');
        if (['administrator', 'admin', 'moderator'].includes(key)) return t('Quản trị viên');
        return role;
      })
      .join(', ') || '';

  const close = () => setIsOpen(false);

  const handleSignOut = async () => {
    if (refreshToken) await authService.revokeToken(refreshToken);
    clearAuth();
    close();
    toast.success(t('Signed out successfully.'));
    router.push('/');
  };

  const avatarSizeClass = variant === 'public' ? 'h-7 w-7 min-[1400px]:h-8 min-[1400px]:w-8' : 'h-8 w-8';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          variant === 'public'
            ? 'flex cursor-pointer items-center space-x-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1.5 transition-all hover:border-[#B24A26] min-[1400px]:space-x-3 min-[1400px]:px-3.5'
            : 'flex items-center gap-2 p-1 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl hover:border-[#B24A26] transition-colors'
        }
      >
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.fullName}
            width={32}
            height={32}
            unoptimized
            className={`${avatarSizeClass} rounded-lg object-cover`}
          />
        ) : (
          <div className={`flex ${avatarSizeClass} items-center justify-center rounded-lg bg-[#B24A26] text-xs font-bold text-[#F7F2E9]`}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        {variant === 'public' && (
          <div className="hidden text-left sm:block">
            <p className="max-w-[110px] truncate whitespace-nowrap text-xs font-bold leading-tight text-[#241F1A] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
              {user?.fullName}
            </p>
            <p className="max-w-[110px] truncate text-[10px] uppercase tracking-wider text-[#B24A26] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
              {roleLabel || 'Khách hàng'}
            </p>
          </div>
        )}
        <ChevronDown size={14} className="text-[#746A5F]" aria-hidden />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9] p-2 shadow-[0_24px_48px_-24px_rgba(34,30,26,0.45)] backdrop-blur-xl">
          <div className="mb-1.5 border-b border-[#221E1A]/10 px-2.5 pb-2.5 pt-1.5">
            <p className="text-xs font-bold text-[#241F1A]">{user?.fullName || t('Guest')}</p>
            <p className="text-[10px] text-[#746A5F] truncate">{user?.email || t('No email')}</p>
          </div>

          <Link
            href="/wallet"
            onClick={close}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
          >
            <Wallet size={14} className="text-[#B24A26]" aria-hidden />
            {t('Ví của tôi')}
          </Link>

          <Link
            href={studioHref}
            onClick={close}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
          >
            {isAdmin ? (
              <ShieldCheck size={14} className="text-[#B24A26]" aria-hidden />
            ) : (
              <LayoutDashboard size={14} className="text-[#B24A26]" aria-hidden />
            )}
            {studioLabel}
          </Link>

          {variant === 'app' && isCreator && (
            <>
              <Link
                href="/art-trades"
                onClick={close}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
              >
                <ArrowLeftRight size={14} className="text-[#B24A26]" aria-hidden />
                {t('My Trades')}
              </Link>
              <Link
                href="/creator/commissions"
                onClick={close}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
              >
                <Palette size={14} className="text-[#B24A26]" aria-hidden />
                {t('Creator Dashboard')}
              </Link>
            </>
          )}

          {isCreator && (
            <Link
              href="/creator/profile/edit"
              onClick={close}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
            >
              <Brush size={14} className="text-[#B24A26]" aria-hidden />
              {t('Hồ sơ họa sĩ')}
            </Link>
          )}

          <Link
            href="/profile"
            onClick={close}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
          >
            <User size={14} className="text-[#B24A26]" aria-hidden />
            {t('Hồ sơ của tôi')}
          </Link>

          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#241F1A] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
          >
            <Settings size={14} className="text-[#B24A26]" aria-hidden />
            {t('Cài đặt')}
          </Link>

          {!isCreator && !isAdmin && (
            <button
              type="button"
              onClick={() => {
                close();
                router.push('/become-creator');
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-[#B24A26] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
            >
              <Palette size={14} aria-hidden />
              {t('Trở thành họa sĩ')}
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin/creator-verifications"
              onClick={close}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-[#A8321C] transition-colors hover:bg-[#F0E7D8] focus-visible:bg-[#F0E7D8] focus-visible:outline-none"
            >
              <UserCheck size={14} aria-hidden />
              {t('Duyệt đơn họa sĩ')}
            </Link>
          )}

          <div className="border-t border-[#221E1A]/10 my-1" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs text-[#A8321C] transition-colors hover:bg-[#F0E7D8]"
          >
            <LogOut size={14} aria-hidden />
            {t('Sign Out')}
          </button>
        </div>
      )}
    </div>
  );
}
