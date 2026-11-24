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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--hair)] bg-[var(--ink)]/90 shadow-sm backdrop-blur-md text-[var(--ivory)]">
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
              className={`shrink-0 whitespace-nowrap ${pathname === '/' ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-all`}
            >
              {t('Marketplace')}
            </Link>
            <Link
              href="/creators"
              aria-current={pathname === '/creators' || pathname.startsWith('/creators/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/creators' || pathname.startsWith('/creators/') ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-colors`}
            >
              {t('Artists')}
            </Link>
            <Link href="/#bento" className="shrink-0 whitespace-nowrap text-[var(--ash)] transition-colors hover:text-white">
              {t('Collections')}
            </Link>
            <Link
              href="/auctions"
              aria-current={pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-colors`}
            >
              {t('Đấu giá')}
            </Link>
            <Link
              href="/events"
              aria-current={pathname === '/events' || pathname.startsWith('/events/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/events' || pathname.startsWith('/events/') ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-colors`}
            >
              {t('Events')}
            </Link>
            {!isAuthenticated || !user ? (
              <button
                type="button"
                onClick={() => setShowTradeAuthModal(true)}
                className="shrink-0 cursor-pointer whitespace-nowrap text-[13px] font-medium text-[var(--ash)] transition-colors hover:text-white xl:text-sm"
              >
                {t('Trade')}
              </button>
            ) : (roles.includes('Creator') || isAdmin) ? (
              <Link
                href="/art-trades/create"
                aria-current={pathname.startsWith('/art-trades') ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap ${pathname.startsWith('/art-trades') ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-colors`}
              >
                {t('Trade')}
              </Link>
            ) : null}
            <Link
              href="/guide"
              aria-current={pathname === '/guide' || pathname.startsWith('/guide/') ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap ${pathname === '/guide' || pathname.startsWith('/guide/') ? 'border-b-2 border-[var(--lumen)] pb-1 text-[var(--ivory)] font-semibold' : 'text-[var(--ash)] hover:text-[var(--ivory)]'} transition-colors`}
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
              className="w-48 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] py-2 pl-4 pr-9 text-sm text-[var(--ivory)] placeholder-[var(--ash)] transition-all duration-300 focus:border-[var(--lumen)] focus:outline-none focus:ring-1 focus:ring-[var(--lumen)] 2xl:w-56"
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
              <div className="absolute right-0 z-50 mt-2 w-80 space-y-2.5 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] p-3 shadow-2xl">
                {suggestions.categories.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--lumen)]">
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
                          className="cursor-pointer rounded-full border border-[var(--hair)] bg-[var(--ink-3)] px-3 py-1 text-[11px] font-semibold text-[var(--ivory)] transition hover:border-[var(--lumen)]"
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
                          className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[var(--ash)] transition hover:border-[var(--lumen)] hover:text-[var(--ivory)]"
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
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] bg-[var(--ink-2)] text-[var(--ivory)] transition hover:border-[var(--lumen)] hover:bg-[var(--ink-3)] lg:flex 2xl:hidden"
          >
            {isSearchOpen ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>

          <div className="flex shrink-0 items-center gap-2 min-[1400px]:gap-3">
            {isAuthenticated && user ? (
              <>
                <NotificationBell
                  userId={user.id}
                  iconSet="material"
                  triggerClassName="rounded-full p-2 text-[var(--ivory)] transition-all hover:bg-[var(--ink-2)] active:scale-95"
                />

                <Link
                  href={isAdmin ? '/admin' : '/client/commissions'}
                  className="hidden items-center gap-1.5 rounded-full bg-[var(--lumen)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--lumen-hi)] active:scale-95 sm:flex min-[1400px]:gap-2 min-[1400px]:px-4 min-[1400px]:py-2"
                >
                  <span className="material-symbols-outlined text-base text-white">
                    {isAdmin ? 'admin_panel_settings' : 'dashboard'}
                  </span>
                  <span className="text-white">{isAdmin ? t('Admin Center') : t('Studio')}</span>
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex cursor-pointer items-center space-x-2 rounded-full border border-transparent bg-transparent px-2.5 py-1.5 transition-all hover:bg-[var(--ink-2)] min-[1400px]:space-x-3 min-[1400px]:px-3.5"
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
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ivory)] text-xs font-bold text-[var(--ink)] min-[1400px]:h-8 min-[1400px]:w-8">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden text-left sm:block">
                      <p className="max-w-[110px] truncate whitespace-nowrap text-xs font-bold leading-tight text-[var(--ivory)] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
                        {user.fullName}
                      </p>
                      <p className="max-w-[110px] truncate text-[10px] uppercase tracking-wider text-[var(--lumen)] min-[1400px]:max-w-[140px] 2xl:max-w-[170px]">
                        {roles.join(', ') || 'CLIENT'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#919099]">expand_more</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] p-2 shadow-2xl">
                      <div className="mb-1 border-b border-[var(--hair)] px-3 py-2 sm:hidden">
                        <p className="text-xs font-bold text-[var(--ivory)]">{user.fullName}</p>
                        <p className="text-[10px] text-[var(--lumen)]">{user.email}</p>
                      </div>
                      <Link
                        href={isAdmin ? '/admin' : roles.includes('Creator') ? '/creator/commissions' : '/client/commissions'}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">
                          {isAdmin ? 'admin_panel_settings' : 'dashboard'}
                        </span>
                        <span>{isAdmin ? t('Admin Center') : roles.includes('Creator') ? t('Creator Studio') : t('My Studio')}</span>
                      </Link>
                      {roles.includes('Creator') && (
                        <Link
                          href="/creator/profile/edit"
                          onClick={() => setIsMenuOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                        >
                          <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">brush</span>
                          <span>{t('Hồ sơ họa sĩ')}</span>
                        </Link>
                      )}
                      <Link
                        href={`/clients/${user.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                      >
                        <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">person</span>
                        <span>{t('Hồ sơ của tôi')}</span>
                      </Link>
                      {!roles.includes('Creator') && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push('/become-creator');
                          }}
                          className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                        >
                          <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">palette</span>
                          <span>{t('Trở thành Creator')}</span>
                        </button>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin/creator-verifications"
                          onClick={() => setIsMenuOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                        >
                          <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">how_to_reg</span>
                          <span>{t('Duyệt đơn Creator')}</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                      >
                        <span className="material-symbols-outlined text-base text-[var(--lumen)] transition-transform group-hover:scale-110">logout</span>
                        <span>{t('Sign Out')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="rounded-full bg-[var(--lumen)] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[var(--lumen-hi)] shadow-sm"
                >
                  <span className="text-white">{t('Sign In')}</span>
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-[var(--hair-2)] px-5 py-2 text-xs font-semibold text-[var(--ivory)] transition-all hover:border-[var(--lumen)] hover:text-[var(--lumen)]"
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
          className="min-w-0 flex-1 rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] px-4 py-2 text-sm text-[var(--ivory)] outline-none focus:border-[var(--lumen)]"
        />
        <button type="submit" className="rounded-full bg-[var(--ivory)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm">
          {t('Tìm kiếm')}
        </button>
      </form>
      <TradeAuthRequiredModal isOpen={showTradeAuthModal} onClose={() => setShowTradeAuthModal(false)} />
    </header>
  );
}
