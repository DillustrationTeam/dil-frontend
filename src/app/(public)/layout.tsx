'use client';

import React, { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { NotificationBell } from '@/features/notification';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={children}><PublicLayoutContent>{children}</PublicLayoutContent></Suspense>;
}

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, roles, refreshToken, isAuthenticated, clearAuth } = useAuthStore();
  const { t } = useLanguage();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    if (refreshToken) {
      await authService.revokeToken(refreshToken);
    }
    clearAuth();
    toast.success('Signed out successfully.');
  };

  const isAdmin = roles.some((r) => ['Administrator', 'Admin', 'Moderator'].includes(r));

  return (
    <div className="min-h-screen bg-[#1F2335] text-[#e4e1e5] font-body selection:bg-[#A7ACD9]/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#1F2335]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(167,172,217,0.08)]">
        <nav className="flex justify-between items-center w-full px-4 sm:px-6 max-w-7xl mx-auto h-20 gap-3 sm:gap-4">
          {/* Left: Logo + Nav Links */}
          <div className="flex min-w-0 items-center gap-4 xl:gap-7">
            <Link href="/" className="group flex shrink-0 items-center space-x-2">
              <Image
                src="/weblogo.png"
                alt="dillustration"
                width={160}
                height={48}
                priority
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
            <div className="hidden shrink-0 items-center gap-3.5 xl:gap-5 2xl:gap-6 text-sm font-medium lg:flex">
              <Link
                href="/"
                aria-current={pathname === '/' ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap ${pathname === '/' ? 'text-[#c2c7f6] border-b-2 border-[#c2c7f6] pb-1' : 'text-[#c7c5cf] hover:text-white'} transition-all`}
              >
                {t('Marketplace')}
              </Link>
              <Link href="/#artists" className="shrink-0 whitespace-nowrap text-[#c7c5cf] transition-colors hover:text-white">
                {t('Artists')}
              </Link>
              <Link href="/#bento" className="shrink-0 whitespace-nowrap text-[#c7c5cf] transition-colors hover:text-white">
                {t('Collections')}
              </Link>
              <Link
                href="/auctions"
                aria-current={pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap ${pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'text-[#c2c7f6] border-b-2 border-[#c2c7f6] pb-1' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
              >
                {t('Auctions')}
              </Link>
              <Link
                href="/events"
                aria-current={pathname === '/events' || pathname.startsWith('/events/') ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap ${pathname === '/events' || pathname.startsWith('/events/') ? 'text-[#c2c7f6] border-b-2 border-[#c2c7f6] pb-1' : 'text-[#c7c5cf] hover:text-white'} transition-colors`}
              >
                {t('Events')}
              </Link>
            </div>
          </div>

          {/* Right: Search + Auth + Mobile toggle */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative hidden shrink-0 xl:block">
              <input
                className="bg-[#1b1b1e] border border-[#46464e]/30 rounded-full pl-5 pr-9 py-2 w-36 xl:w-44 2xl:w-56 focus:w-52 2xl:focus:w-64 focus:outline-none focus:ring-1 focus:ring-[#c2c7f6] focus:border-[#c2c7f6] transition-all duration-300 text-sm text-[#e4e1e5] placeholder-white/30"
                placeholder={t('Search curated art...')}
                type="text"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#919099] text-lg pointer-events-none">
                search
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              {isAuthenticated && user ? (
                <>
                  {/* Notification bell */}
                  <NotificationBell
                    userId={user.id}
                    iconSet="material"
                    triggerClassName="p-2 rounded-full hover:bg-[#c2c7f6]/10 transition-all active:scale-95 text-[#c2c7f6]"
                  />

                  {/* Go to Studio / Admin Center */}
                  <Link
                    href={isAdmin ? '/admin' : '/client/commissions'}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#A7ACD9] text-[#1F2335] rounded-full font-semibold text-xs hover:opacity-90 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">{isAdmin ? 'admin_panel_settings' : 'dashboard'}</span>
                    {isAdmin ? 'Admin Center' : 'Studio'}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-3 px-3.5 py-1.5 rounded-full border border-white/10 hover:border-[#A7ACD9] bg-white/5 transition-all cursor-pointer"
                    >
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.fullName}
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#A7ACD9] text-[#1F2335] flex items-center justify-center font-bold text-xs">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left hidden sm:block">
                        <p className="whitespace-nowrap text-xs font-bold leading-tight text-white">{user.fullName}</p>
                        <p className="text-[10px] text-[#A7ACD9] uppercase tracking-wider">
                          {roles.join(', ') || 'CLIENT'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-sm text-[#919099]">expand_more</span>
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#1F2335] rounded-2xl p-2 shadow-2xl border border-white/10 z-50">
                        <div className="px-3 py-2 border-b border-white/10 mb-1 sm:hidden">
                          <p className="text-xs font-bold text-white">{user.fullName}</p>
                          <p className="text-[10px] text-[#A7ACD9]">{user.email}</p>
                        </div>
                        <Link
                          href={isAdmin ? '/admin' : '/client/commissions'}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[#e4e1e5] hover:bg-white/10 rounded-xl transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm text-[#A7ACD9]">{isAdmin ? 'admin_panel_settings' : 'dashboard'}</span>
                          {isAdmin ? 'Admin Center' : 'My Studio'}
                        </Link>
                        <Link
                          href={`/clients/${user.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[#e4e1e5] hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm text-[#A7ACD9]">person</span>
                          Hồ sơ của tôi
                        </Link>
                        {!roles.includes('Creator') && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push('/become-creator');
                            }}
                            className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs text-[#A7ACD9] transition-colors hover:bg-white/10 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">palette</span>
                            <span>Trở thành Creator</span>
                          </button>
                        )}
                        {isAdmin && (
                          <Link
                            href="/admin/creator-verifications"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs text-red-300 transition-colors hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-sm">how_to_reg</span>
                            <span>Duyệt đơn Creator</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">logout</span>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-xs font-semibold text-[#A7ACD9] hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 text-xs font-semibold bg-white text-[#1F2335] rounded-full hover:bg-[#A7ACD9] transition-all"
                  >
                    Join Collective
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/10 text-[#c7c5cf] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <span className="material-symbols-outlined text-2xl">
                  {isMobileNavOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#1F2335]/95 backdrop-blur-xl px-4 py-4 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileNavOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${pathname === '/' ? 'bg-[#c2c7f6]/10 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white hover:bg-white/5'} transition-all`}
            >
              {t('Marketplace')}
            </Link>
            <Link
              href="/#artists"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-[#c7c5cf] hover:text-white hover:bg-white/5 transition-all"
            >
              {t('Artists')}
            </Link>
            <Link
              href="/#bento"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-[#c7c5cf] hover:text-white hover:bg-white/5 transition-all"
            >
              {t('Collections')}
            </Link>
            <Link
              href="/auctions"
              onClick={() => setIsMobileNavOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${pathname === '/auctions' || pathname.startsWith('/auctions/') ? 'bg-[#c2c7f6]/10 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white hover:bg-white/5'} transition-all`}
            >
              {t('Auctions')}
            </Link>
            <Link
              href="/events"
              onClick={() => setIsMobileNavOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${pathname === '/events' || pathname.startsWith('/events/') ? 'bg-[#c2c7f6]/10 text-[#c2c7f6]' : 'text-[#c7c5cf] hover:text-white hover:bg-white/5'} transition-all`}
            >
              {t('Events')}
            </Link>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main>{children}</main>

    </div>
  );
}
