'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';
import { NotificationBell } from '@/features/notification';

const navLinks = [
  { href: '/', label: 'Marketplace', match: ['/'], exact: true, requiresAuth: false },
  { href: '/#artists', label: 'Artists', match: [] as string[], exact: false, requiresAuth: false },
  { href: '/#bento', label: 'Collections', match: [] as string[], exact: false, requiresAuth: false },
  // Đấu giá và Phòng làm việc chỉ hiện khi đã đăng nhập.
  { href: '/auctions', label: 'Đấu giá', match: ['/auctions'], exact: false, requiresAuth: true },
  { href: '/workroom', label: 'Phòng làm việc', match: ['/workroom'], exact: false, requiresAuth: true },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c2c7f6]';

/**
 * Header dùng chung cho toàn bộ trang web.
 *
 * Gắn một lần ở `src/app/layout.tsx` nên mọi trang đều có: logo, điều hướng chính,
 * nút tìm kiếm (thu gọn, bấm mới xổ ô nhập), chuông thông báo và menu tài khoản.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { user, roles, refreshToken, isAuthenticated, clearAuth } = useAuthStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Đổi trang thì đóng hết lớp phủ: điều chỉnh state ngay trong render khi `pathname`
  // đổi, thay vì setState trong useEffect (react-hooks/set-state-in-effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Đóng ô tìm kiếm / menu tài khoản khi bấm ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Mở ô tìm kiếm thì đưa con trỏ vào luôn.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    if (refreshToken) {
      await authService.revokeToken(refreshToken);
    }
    clearAuth();
    toast.success('Đã đăng xuất.');
    router.push('/');
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const term = keyword.trim();
    setSearchOpen(false);
    router.push(term ? `/?q=${encodeURIComponent(term)}` : '/');
  }

  function isActive(match: string[], exact: boolean) {
    if (!match.length) return false;
    return match.some((base) => (exact ? pathname === base : pathname === base || pathname.startsWith(`${base}/`)));
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1F2335]/85 shadow-[0_0_20px_rgba(167,172,217,0.15)] backdrop-blur-xl">
      {/*
        Lưới 3 cột [1fr | auto | 1fr]: logo sát trái, nhóm liên kết căn giữa thật sự,
        cụm tìm kiếm/chuông/tài khoản sát phải. Dùng grid thay vì justify-between
        vì justify-between chỉ căn giữa khi hai bên rộng bằng nhau.
      */}
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto grid h-20 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6"
      >
        <Link
          href="/"
          aria-label="Dillustration — Trang chủ"
          className={`flex shrink-0 items-center justify-self-start ${focusRing}`}
        >
          <Image
            src="/weblogo.png"
            alt="dillustration"
            width={120}
            height={56}
            className="h-12 w-auto object-contain transition-transform hover:scale-105 md:h-14"
            priority
          />
        </Link>

        <div className="hidden items-center justify-center gap-5 text-sm font-medium lg:flex xl:gap-8">
          {navLinks
            .filter((link) => !link.requiresAuth || isAuthenticated)
            .map(({ href, label, match, exact }) => {
              const active = isActive(match ?? [], Boolean(exact));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap transition-colors ${focusRing} ${
                    active
                      ? 'border-b-2 border-[#c2c7f6] pb-1 text-[#c2c7f6]'
                      : 'text-[#c7c5cf] hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 justify-self-end sm:gap-5">
          {/* Tìm kiếm: chỉ còn một nút, bấm mới xổ ô nhập xuống dưới */}
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-expanded={searchOpen}
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
              className={`flex size-10 items-center justify-center rounded-full text-[#c2c7f6] transition-all hover:bg-[#c2c7f6]/10 active:scale-95 ${focusRing}`}
            >
              <span className="material-symbols-outlined text-xl">{searchOpen ? 'close' : 'search'}</span>
            </button>

            {searchOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-[#1F2335] p-4 shadow-2xl">
                <form onSubmit={handleSearchSubmit}>
                  <label htmlFor="site-search" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#919099]">
                    Tìm tác phẩm
                  </label>
                  <div className="relative">
                    <input
                      id="site-search"
                      ref={searchInputRef}
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Nhập tên tranh hoặc tác giả..."
                      className="w-full rounded-full border border-[#46464e]/40 bg-[#1b1b1e] py-2.5 pl-5 pr-12 text-sm text-[#e4e1e5] placeholder-white/30 transition-all focus:border-[#c2c7f6] focus:outline-none focus:ring-1 focus:ring-[#c2c7f6]"
                    />
                    <button
                      type="submit"
                      aria-label="Tìm kiếm"
                      className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#c2c7f6] transition hover:bg-[#c2c7f6]/10"
                    >
                      <span className="material-symbols-outlined text-lg">search</span>
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['Tranh kỹ thuật số', 'Concept art', 'Phong cảnh'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setKeyword(suggestion)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-[#c7c5cf] transition hover:border-[#c2c7f6]/40 hover:text-[#c2c7f6]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NotificationBell
            userId={isAuthenticated && user ? user.id : null}
            iconSet="material"
            triggerClassName={`relative flex size-10 items-center justify-center rounded-full text-[#c2c7f6] transition-all hover:bg-[#c2c7f6]/10 active:scale-95 ${focusRing}`}
          />

          {isAuthenticated && user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-label="Mở menu tài khoản"
                className={`flex cursor-pointer items-center gap-3 rounded-full border border-white/10 px-3.5 py-1.5 transition-all hover:border-[#A7ACD9] ${focusRing}`}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-[#A7ACD9] text-xs font-bold text-[#1F2335]">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left xl:block">
                  <span className="block text-xs font-bold leading-tight text-white">{user.fullName}</span>
                  <span className="block text-[10px] uppercase tracking-wider text-[#A7ACD9]">
                    {roles.join(', ') || 'CLIENT'}
                  </span>
                </span>
                <span className="material-symbols-outlined text-sm text-[#919099]">expand_more</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#1F2335] p-2 shadow-2xl">
                  <div className="mb-1 border-b border-white/10 px-3 py-2 sm:hidden">
                    <p className="text-xs font-bold text-white">{user.fullName}</p>
                    <p className="text-[10px] text-[#A7ACD9]">{user.email}</p>
                  </div>

                  {/* Lối vào ví — nằm ngay trên nút đăng xuất */}
                  <Link
                    href="/wallet"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#c7c5cf] transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm text-[#c2c7f6]">account_balance_wallet</span>
                    <span>Ví của tôi</span>
                  </Link>

                  {!roles.includes('Creator') && (
                    <Link
                      href="/become-creator"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs text-[#A7ACD9] transition-colors hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined text-sm">palette</span>
                      <span>Trở thành Creator</span>
                    </Link>
                  )}
                  {(roles.includes('Administrator') || roles.includes('Moderator')) && (
                    <Link
                      href="/admin/creator-verifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs text-red-300 transition-colors hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      <span>Duyệt đơn Creator</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className={`px-3 py-2 text-xs font-semibold text-[#A7ACD9] transition-colors hover:text-white ${focusRing}`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#1F2335] transition-all hover:bg-[#A7ACD9] ${focusRing}`}
              >
                Join Collective
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
