'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, LayoutDashboard, Menu, Moon, Search, ShieldCheck, Sun, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';import { NotificationBell } from '@/features/notification';
import {
  categoriesService,
  type SearchSuggestionsDto,
} from '@/features/marketplace/services/categories.service';
import { AccountMenu } from '@/components/navigation/account-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useTheme } from '@/components/theme/use-theme';
import { useScrolled } from '@/components/motion';

/**
 * Thanh điều hướng dùng chung cho các trang công khai `(public)` và trang độc lập `(workspace)`
 * (ví dụ: `/notifications`, `/ai`, `/checkout`) để giao diện và các liên kết luôn đồng nhất.
 *
 * Nav giữ đúng 5 mục: thêm mục thứ sáu là 1280px bắt đầu tràn.
 */
const PUBLIC_NAV = [
  { href: '/explore', label: 'Bộ sưu tập', match: (p: string) => p === '/explore' },
  { href: '/creators', label: 'Họa sĩ', match: (p: string) => p === '/creators' || p.startsWith('/creators/') },
  { href: '/auctions', label: 'Đấu giá', match: (p: string) => p === '/auctions' || p.startsWith('/auctions/') },
  { href: '/events', label: 'Sự kiện', match: (p: string) => p === '/events' || p.startsWith('/events/') },
  { href: '/guide', label: 'Hướng dẫn', match: (p: string) => p === '/guide' || p.startsWith('/guide/') },
];

export function PublicHeader() {
  const { user, roles, isAuthenticated } = useAuthStore();
  const { t } = useLanguage();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsDto>({ categories: [], tags: [] });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Trang chủ mở bằng hero tràn viền: nav ẩn cho tới khi cuộn (PASS 19 của bản redesign).
  const isHome = pathname === '/';
  const headerRef = useRef<HTMLElement | null>(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  // trang chủ có runway 55vh: nav hiện khi tranh đã co khoảng một nửa
  const scrolled = useScrolled(isHome ? 320 : 90);

  /**
   * Header có thể cao hơn `--header-h` (font, zoom, hàng tìm kiếm thứ hai).
   * Đo chiều cao thật và ghi vào `--nav-h` để hero không bao giờ chui xuống dưới nav.
   */
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const apply = () => {
      const height = Math.round(node.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--nav-h', height + 'px');
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // đổi route thì đóng menu mobile
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearchOpen(false);
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isAdmin = roles.some((r) => ['administrator', 'admin', 'moderator'].includes(r.toLowerCase()));

  /**
   * Mục "Trao đổi": trao đổi tranh là đặc quyền của Creator (cần tải lên tác phẩm gốc
   * và giao nhận hai chiều). Vì vậy chỉ hiện mục này khi tài khoản đang đăng nhập có role
   * Creator — ẩn hoàn toàn với Client, Admin và khách, thay vì dẫn họ vào trang chặn quyền
   * hoặc modal "đăng nhập" không giải quyết được gì.
   */
  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const showTradeEntry = isAuthenticated && isCreator;

  return (
    <header ref={headerRef} className={`header ${isHome ? 'header--overlay' : ''} ${scrolled ? 'is-stuck' : ''}`}>
      <nav className="wrap header__bar">
        {/* Left: Logo + Nav Links (căn trái gọn gàng, không co đè logo) */}
        <div className="flex min-w-0 shrink-0 items-center gap-4 min-[1400px]:gap-6">
          {/* Wordmark chữ như bản redesign: serif + dấu chấm son. Logo bitmap vẽ cho nền
              navy nên trên giấy bị nhoè khi ép silhouette — chữ mới đúng tỷ lệ nav 60px. */}
          <Link href="/" className="wordmark group flex shrink-0 items-center" aria-label="dillustration — trang chủ">
            <span className="wordmark__text">dillustration</span>
            <span className="wordmark-dot" aria-hidden="true" />
          </Link>

          <div className="nav">
            {PUBLIC_NAV.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.match(pathname) ? 'page' : undefined}
              >
                {t(item.label)}
              </Link>
            ))}

            {/* Chỉ hiện với Creator đã đăng nhập (đứng trước Hướng dẫn). */}
            {showTradeEntry && (
              <Link
                href="/art-trades/create"
                aria-current={pathname.startsWith('/art-trades') ? 'page' : undefined}
              >
                {t('Trao đổi')}
              </Link>
            )}

            {PUBLIC_NAV.slice(4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.match(pathname) ? 'page' : undefined}
              >
                {t(item.label)}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Search + Auth */}
        <div className="header__tail min-w-0">
          <ThemeToggle className="hidden sm:grid" />
          {/* Ô tìm kiếm inline hiện ở màn hình rộng (>= 2xl / 1536px) để không chèn menu */}
          <form className="relative hidden shrink-0 2xl:block" onSubmit={handleSearchSubmit}>
            <div className="input-wrap">
              <Search aria-hidden />
              <input
                className="input min-h-10 w-44 rounded-full py-2 pl-9 text-sm 2xl:w-52"
                placeholder={t('Tìm kiếm...')}
                type="text"
                aria-label={t('Tìm tác phẩm hoặc tác giả')}
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            {searchFocused && (suggestions.categories.length > 0 || suggestions.tags.length > 0) && (
              <div className="absolute right-0 z-50 mt-2 w-80 space-y-2.5 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 shadow-[0_30px_60px_-40px_rgba(74,52,30,0.8)]">
                {suggestions.categories.length > 0 && (
                  <div>
                    <p className="mb-1.5 font-[family-name:var(--font-display)] text-[0.8125rem] italic text-[#B24A26]">
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
                          className="chip min-h-0 cursor-pointer !px-3 !py-1 !text-[11px]"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.tags.length > 0 && (
                  <div>
                    <p className="mb-1.5 font-[family-name:var(--font-display)] text-[0.8125rem] italic text-[#746A5F]">
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
                          className="cursor-pointer rounded-full border border-[#221E1A]/10 px-2.5 py-1 text-[11px] text-[#6E6459] transition hover:border-[#B24A26]/50 hover:text-[#8C3718]"
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
            className="icon-btn !hidden lg:!grid 2xl:!hidden"
          >
            {isSearchOpen ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>

          {/* Menu cho < lg: nav desktop bị ẩn nên cần một cửa vào khác */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="public-mobile-nav"
            aria-label={isMenuOpen ? t('Đóng menu') : t('Mở menu')}
            className="icon-btn burger mnav-trigger lg:!hidden"
          >
            {isMenuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>

          <div className="flex shrink-0 items-center gap-2 min-[1400px]:gap-3">
            {isAuthenticated && user ? (
              <>
                <NotificationBell
                  userId={user.id}
                  iconSet="material"
                  triggerClassName="icon-btn relative"
                />

                <Link
                  href={isAdmin ? '/admin' : '/client/commissions'}
                  className="btn btn--primary btn--sm hidden sm:inline-flex"
                >
                  {isAdmin ? <ShieldCheck size={16} aria-hidden /> : <LayoutDashboard size={16} aria-hidden />}
                  {isAdmin ? t('Admin Center') : t('Studio')}
                </Link>

                <AccountMenu variant="public" />
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Mobile: chỉ giữ 1 CTA gọn, "Đăng nhập" chuyển vào menu hamburger */}
                <Link href="/login" className="btn btn--ghost btn--sm hidden sm:inline-flex">
                  {t('Sign In')}
                </Link>
                {/* Mobile: cả hai CTA tài khoản nằm trong menu hamburger, header chỉ còn logo + menu */}
                <Link href="/register" className="btn btn--primary btn--sm hidden sm:inline-flex">
                  {t('Join Collective')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Menu mobile: cùng 5 mục với nav desktop + cửa vào Trao đổi */}
      {isMenuOpen && (
        <div className="mnav" id="public-mobile-nav">
          {PUBLIC_NAV.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match(pathname) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              {t(item.label)} <ChevronRight aria-hidden />
            </Link>
          ))}
          {showTradeEntry && (
            <Link href="/art-trades/create" onClick={() => setIsMenuOpen(false)}>
              {t('Trao đổi tác phẩm')} <ChevronRight aria-hidden />
            </Link>
          )}
          {PUBLIC_NAV.slice(4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match(pathname) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              {t(item.label)} <ChevronRight aria-hidden />
            </Link>
          ))}

          {/* Sáng / tối: trên mobile nút ở header bị ẩn nên đặt ở đây */}
          <button
            type="button"
            className="mnav__theme"
            aria-pressed={isDark}
            onClick={toggleTheme}
          >
            <span className="inline-flex items-center gap-2">
              {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
              {isDark ? t('Nền sáng') : t('Nền tối')}
            </span>
          </button>

          {/* Khách: hai CTA tài khoản nằm ở đây thay vì chiếm chỗ trên header mobile */}
          {!(isAuthenticated && user) && (
            <>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                {t('Sign In')} <ChevronRight aria-hidden />
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                {t('Join Collective')} <ChevronRight aria-hidden />
              </Link>
            </>
          )}
        </div>
      )}

      {/* Thanh tìm kiếm hàng dưới: luôn hiện trên mobile (< lg), hoặc xổ khi bấm icon kính lúp trên lg..xl */}
      <form
        className={`${isSearchOpen ? 'flex' : 'flex lg:hidden'} wrap gap-2 pb-3 2xl:hidden`}
        onSubmit={handleSearchSubmit}
      >
        <input
          aria-label={t('Tìm tác phẩm hoặc tác giả')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('Tìm tên tranh hoặc tác giả…')}
          className="input min-h-10 min-w-0 flex-1 rounded-full px-4 text-sm"
        />
        <button type="submit" className="btn btn--primary btn--sm">
          {t('Tìm kiếm')}
        </button>
      </form>
    </header>
  );
}
