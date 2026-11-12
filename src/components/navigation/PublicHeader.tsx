'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth.service';
import { NotificationBell } from '@/features/notification';
import {
  categoriesService,
  type SearchSuggestionsDto,
} from '@/features/marketplace/services/categories.service';
import TradeAuthRequiredModal from '@/components/modals/TradeAuthRequiredModal';

/**
 * Thanh điều hướng dùng chung cho các trang công khai `(public)` và trang độc lập `(workspace)`
 * (ví dụ: `/notifications`, `/ai`, `/checkout`) để giao diện và các liên kết luôn đồng nhất.
 */
export function PublicHeader() {
  const { user, roles, refreshToken, isAuthenticated, clearAuth } = useAuthStore();
  const { t } = useLanguage();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsDto>({ categories: [], tags: [] });
  const [showTradeAuthModal, setShowTradeAuthModal] = useState(false);

  useEffect(() => {
    if (!isSearchOpen && !searchFocused) return;
    let active = true;
    const timer = window.setTimeout(() => {
      categoriesService
        .getSearchSuggestions(searchQuery)
        .then((res) => {
          if (active) setSuggestions(res);
        })
        .catch(() => undefined);
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, isSearchOpen, searchFocused]);

  const handleLogout = async () => {
    if (refreshToken) {
      await authService.revokeToken(refreshToken);
    }
    clearAuth();
    toast.success(t('Signed out successfully.'));
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearchOpen(false);
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isAdmin = roles.some((r) => ['Administrator', 'Admin', 'Moderator'].includes(r));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1F2335]/80 shadow-[0_0_20px_rgba(167,172,217,0.08)] backdrop-blur-xl">
      <nav className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Logo + Nav Links (căn trái gọn gàng, không co đè logo) */}
        <div className="flex shrink-0 items-center gap-4 min-[1400px]:gap-6">
          <Link href="/" className="group flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/weblogo.png"
              alt="dillustration"
              className="-my-1 h-12 w-auto object-contain transition-transform hover:scale-105 sm:h-14 md:h-[58px] min-[1400px]:h-[66px] 2xl:h-[72px]"
            />
          </Link>

          <div className="hidden shrink-0 items-center gap-3 text-[13px] font-medium lg:flex xl:gap-4 xl:text-sm 2xl:gap-6">
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/' ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-all`}
            >
              {t('Marketplace')}
            </Link>
            <Link
              href="/creators"
              aria-current={pathname === '/creators' || pathname.startsWith('/creators/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/creators' || pathname.startsWith('/creators/') ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
            >
              {t('Artists')}
            </Link>
            <Link href="/#bento" className="shrink-0 whitespace-nowrap text-[#c7c5cf] transition-colors hover:text-white">
              {t('Collections')}
            </Link>
            <Link
              href="/auctions"
              aria-current={pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
            >
              {t('Đấu giá')}
            </Link>
            <Link
              href="/events"
              aria-current={pathname === '/events' || pathname.startsWith('/events/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/events' || pathname.startsWith('/events/') ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
            >
              {t('Events')}
            </Link>
            {!isAuthenticated || !user ? (
              <button
                type="button"
                onClick={() => setShowTradeAuthModal(true)}
                className="shrink-0 cursor-pointer whitespace-nowrap text-[13px] font-medium text-[#c7c5cf] transition-colors hover:text-white xl:text-sm"
              >
                {t('Trade')}
              </button>
            ) : (roles.includes('Creator') || isAdmin) ? (
              <Link
                href="/art-trades/create"
                aria-current={pathname.startsWith('/art-trades') ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap ${pathname.startsWith('/art-trades') ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
              >
                {t('Trade')}
              </Link>
            ) : null}
            <Link
              href="/guide"
              aria-current={pathname === '/guide' || pathname.startsWith('/guide/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/guide' || pathname.startsWith('/guide/') ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
            >
              {t('Guide')}
            </Link>
          </div>
        </div>

        {/* Right: Search + Auth */}
        <div className="flex shrink-0 items-center gap-2 min-[1400px]:gap-3">
          {/* Ô tìm kiếm inline hiện ở màn hình rộng (>= 2xl / 1536px) để không chèn menu */}
          <form className="relative hidden shrink-0 2xl:block" onSubmit={handleSearchSubmit}>
            <input
              className="w-48 rounded-full border border-[#46464e]/30 bg-[#1b1b1e] py-2 pl-4 pr-9 text-sm text-[#e4e1e5] placeholder-white/40 transition-all duration-300 focus:border-[#c2c7f6] focus:outline-none focus:ring-1 focus:ring-[#c2c7f6] 2xl:w-56"
              placeholder={t('Tìm kiếm...')}
              type="text"
              aria-label={t('Tìm tác phẩm hoặc tác giả')}
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              type="submit"
              aria-label={t('Tìm kiếm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#919099] transition-colors hover:text-white"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
            {searchFocused && (suggestions.categories.length > 0 || suggestions.tags.length > 0) && (
              <div className="absolute right-0 z-50 mt-2 w-80 space-y-2.5 rounded-2xl border border-white/10 bg-[#1F2335] p-3 shadow-2xl">
                {suggestions.categories.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A7ACD9]">
                      {t('Danh mục lớn')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchFocused(false);
                            router.push(`/explore?category=${encodeURIComponent(cat.slug)}`);
                          }}
                          className="cursor-pointer rounded-full border border-[#A7ACD9]/35 bg-[#A7ACD9]/15 px-3 py-1 text-[11px] font-semibold text-[#e4e1e5] transition hover:bg-[#A7ACD9]/25"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.tags.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#919099]">
                      {t('Tag phổ biến')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchFocused(false);
                            router.push(`/explore?tag=${encodeURIComponent(tag.name)}`);
                          }}
                          className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#c7c5cf] transition hover:border-[#c2c7f6]/40 hover:text-[#c2c7f6]"
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Nút mở thanh tìm kiếm cho màn hình lg..xl (1024px..1535px) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-expanded={isSearchOpen}
            aria-label={isSearchOpen ? t('Đóng tìm kiếm') : t('Mở tìm kiếm')}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#c2c7f6] transition hover:border-[#A7ACD9] hover:bg-[#c2c7f6]/10 lg:flex 2xl:hidden"
          >
            {isSearchOpen ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>

          <div className="flex shrink-0 items-center gap-2 min-[1400px]:gap-3">
            {isAuthenticated && user ? (
              <>
                <NotificationBell
                  userId={user.id}
                  iconSet="material"
                  triggerClassName="rounded-full p-2 text-[#c2c7f6] transition-all hover:bg-[#c2c7f6]/10 active:scale-95"
                />

                <Link
                  href={isAdmin ? '/admin' : '/client/commissions'}
                  className="hidden items-center gap-1.5 rounded-full bg-[#A7ACD9] px-3 py-1.5 text-xs font-semibold text-[#1F2335] transition-all hover:opacity-90 active:scale-95 sm:flex min-[1400px]:gap-2 min-[1400px]:px-4 min-[1400px]:py-2"
                >
                  <span className="material-symbols-outlined text-base">
                    {isAdmin ? 'admin_panel_settings' : 'dashboard'}
                  </span>
                  {isAdmin ? t('Admin Center') : t('Studio')}
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex cursor-pointer items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:border-[#A7ACD9] min-[1400px]:space-x-3 min-[1400px]:px-3.5"
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.fullName}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-7 w-7 rounded-lg object-cover min-[1400px]:h-8 min-[1400px]:w-8"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A7ACD9] text-xs font-bold text-[#1F2335] min-[1400px]:h-8 min-[1400px]:w-8">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden text-left sm:block">
                      <p className="max-w-[110px] truncate whitespace-nowrap text-xs font-bold leading-tight text-white min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
                        {user.fullName}
                      </p>
                      <p className="max-w-[110px] truncate text-[10px] uppercase tracking-wider text-[#A7ACD9] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
                        {roles.join(', ') || 'CLIENT'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#919099]">expand_more</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-[#1F2335] p-2 shadow-2xl">
                      <div className="mb-1 border-b border-white/10 px-3 py-2 sm:hidden">
                        <p className="text-xs font-bold text-white">{user.fullName}</p>
                        <p className="text-[10px] text-[#A7ACD9]">{user.email}</p>
                      </div>
                      <Link
                        href={isAdmin ? '/admin' : roles.includes('Creator') ? '/creator/commissions' : '/client/commissions'}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-sm text-[#A7ACD9]">
                          {isAdmin ? 'admin_panel_settings' : 'dashboard'}
                        </span>
                        {isAdmin ? t('Admin Center') : roles.includes('Creator') ? t('Creator Studio') : t('My Studio')}
                      </Link>
                      {roles.includes('Creator') && (
                        <Link
                          href="/creator/profile/edit"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
                        >
                          <span className="material-symbols-outlined text-sm text-[#A7ACD9]">brush</span>
                          {t('Hồ sơ họa sĩ')}
                        </Link>
                      )}
                      <Link
                        href={`/clients/${user.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#e4e1e5] transition-colors hover:bg-white/10"
                      >
                        <span className="material-symbols-outlined text-sm text-[#A7ACD9]">person</span>
                        {t('Hồ sơ của tôi')}
                      </Link>
                      {!roles.includes('Creator') && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push('/become-creator');
                          }}
                          className="flex w-full cursor-pointer items-center space-x-2 rounded-xl px-3 py-2 text-xs text-[#A7ACD9] transition-colors hover:bg-white/10"
                        >
                          <span className="material-symbols-outlined text-sm">palette</span>
                          <span>{t('Trở thành Creator')}</span>
                        </button>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin/creator-verifications"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs text-red-300 transition-colors hover:bg-white/10"
                        >
                          <span className="material-symbols-outlined text-sm">how_to_reg</span>
                          <span>{t('Duyệt đơn Creator')}</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-white/10"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        {t('Sign Out')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-[#A7ACD9] transition-colors hover:text-white"
                >
                  {t('Sign In')}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#1F2335] transition-all hover:bg-[#A7ACD9]"
                >
                  {t('Join Collective')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Thanh tìm kiếm hàng dưới: luôn hiện trên mobile (< lg), hoặc xổ khi bấm icon kính lúp trên lg..xl */}
      <form
        className={`${isSearchOpen ? 'flex' : 'flex lg:hidden'} mx-auto max-w-[1440px] gap-2 px-4 pb-3 sm:px-6 2xl:hidden`}
        onSubmit={handleSearchSubmit}
      >
        <input
          aria-label={t('Tìm tác phẩm hoặc tác giả')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('Tìm tên tranh hoặc tác giả…')}
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#1b1b1e] px-4 py-2 text-sm text-white outline-none focus:border-[#A7ACD9]"
        />
        <button type="submit" className="rounded-full bg-[#A7ACD9] px-4 text-sm font-semibold text-[#1F2335]">
          {t('Tìm kiếm')}
        </button>
      </form>
      <TradeAuthRequiredModal isOpen={showTradeAuthModal} onClose={() => setShowTradeAuthModal(false)} />
    </header>
  );
}
