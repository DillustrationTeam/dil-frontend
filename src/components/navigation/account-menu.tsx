'use client';

import Image from 'next/image';
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
  const studioLabel = isAdmin ? t('Admin Center') : isCreator ? t('Creator Studio') : t('My Studio');

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
            ? 'flex cursor-pointer items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:border-[#A7ACD9] min-[1400px]:space-x-3 min-[1400px]:px-3.5'
            : 'flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl hover:border-[#A7ACD9] transition-colors'
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
          <div className={`flex ${avatarSizeClass} items-center justify-center rounded-lg bg-[#A7ACD9] text-xs font-bold text-[#1F2335]`}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        {variant === 'public' && (
          <div className="hidden text-left sm:block">
            <p className="max-w-[110px] truncate whitespace-nowrap text-xs font-bold leading-tight text-white min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
              {user?.fullName}
            </p>
            <p className="max-w-[110px] truncate text-[10px] uppercase tracking-wider text-[#A7ACD9] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
              {roles.join(', ') || 'CLIENT'}
            </p>
          </div>
        )}
        <span className="material-symbols-outlined text-sm text-[#919099]">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-[#1F2335] p-1.5 shadow-2xl">
          <div className="px-2.5 py-2 border-b border-white/10 mb-1">
            <p className="text-xs font-bold text-white">{user?.fullName || t('Guest')}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || t('No email')}</p>
            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
              isAdmin
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <span className="material-symbols-outlined text-xs text-[#A7ACD9]">verified_user</span>
              {isAdmin ? t('System Admin') : t('Escrow Verified')}
            </span>
          </div>

          <Link
            href="/wallet"
            onClick={close}
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm text-[#A7ACD9]">account_balance_wallet</span>
            {t('Ví của tôi')}
          </Link>

          <Link
            href={studioHref}
            onClick={close}
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm text-[#A7ACD9]">
              {isAdmin ? 'admin_panel_settings' : 'dashboard'}
            </span>
            {studioLabel}
          </Link>

          {variant === 'app' && isCreator && (
            <>
              <Link
                href="/art-trades"
                onClick={close}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-sm text-[#A7ACD9]">swap_horiz</span>
                {t('My Trades')}
              </Link>
              <Link
                href="/creator/commissions"
                onClick={close}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-sm text-[#A7ACD9]">palette</span>
                {t('Creator Dashboard')}
              </Link>
            </>
          )}

          {isCreator && (
            <Link
              href="/creator/profile/edit"
              onClick={close}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-sm text-[#A7ACD9]">brush</span>
              {t('Hồ sơ họa sĩ')}
            </Link>
          )}

          <Link
            href="/profile"
            onClick={close}
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm text-[#A7ACD9]">person</span>
            {t('Hồ sơ của tôi')}
          </Link>

          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm text-[#A7ACD9]">settings</span>
            {t('Cài đặt')}
          </Link>

          {!isCreator && !isAdmin && (
            <button
              type="button"
              onClick={() => {
                close();
                router.push('/become-creator');
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[#A7ACD9] transition-colors hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-sm">palette</span>
              {t('Trở thành Creator')}
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin/creator-verifications"
              onClick={close}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-sm">how_to_reg</span>
              {t('Duyệt đơn Creator')}
            </Link>
          )}

          <div className="border-t border-white/10 my-1" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs text-red-400 transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            {t('Sign Out')}
          </button>
        </div>
      )}
    </div>
  );
}
